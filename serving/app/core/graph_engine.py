"""
SentinelPay Serving - Graph Risk Engine
========================================
In-memory graph risk engine that loads synthetic entity linkage,
constructs the account-device-IP network, and provides real-time lookups
for detected fraud rings and account-level propagated risk.
"""

import logging
from pathlib import Path
from typing import Dict, List, Optional, Any
import pandas as pd
import numpy as np
import networkx as nx

from serving.app.core.engine import engine as model_engine
from serving.app.schemas.graph import (
    RingMember,
    FraudRing,
    RingsResponse,
    ConnectedAccount,
    AccountRiskResponse,
    GraphNode,
    GraphLink,
    NetworkGraphResponse,
)

logger = logging.getLogger("sentinelpay.serving.graph_engine")


class GraphEngine:
    """
    Singleton in-memory graph risk engine.
    """

    def __init__(self):
        self.G: nx.Graph = nx.Graph()
        self.rings: List[FraudRing] = []
        self.account_ring_map: Dict[str, str] = {}
        self.is_ready: bool = False
        self.nodes_payload: List[GraphNode] = []
        self.links_payload: List[GraphLink] = []

    def initialize(self):
        """Construct graph, run inference, detect rings, and compute propagated risk."""
        logger.info("Initializing SentinelPay GraphEngine...")
        try:
            # Locate synthetic linkage data
            current_dir = Path(__file__).resolve().parent
            project_root = current_dir.parent.parent.parent
            data_path = project_root / "ml" / "graph" / "graph_data" / "synthetic_linkage.csv"

            if not data_path.exists():
                logger.warning(f"Synthetic linkage data not found at {data_path}. Graph features will be unavailable.")
                return

            df = pd.read_csv(data_path, comment="#", low_memory=False)
            logger.info(f"Loaded {len(df):,} transactions for graph analysis.")

            # Separate metadata vs feature matrix
            metadata_cols = ["account_id", "device_id", "ip_subnet", "simulated_ring_label", "Class"]
            feature_cols = [c for c in df.columns if c not in metadata_cols]
            X = df[feature_cols]

            # Model inference
            if model_engine.model is not None:
                y_prob = model_engine.model.predict_proba(X)[:, 1]
            else:
                logger.warning("Model engine not initialized yet; running fallback predictions.")
                y_prob = np.zeros(len(df))

            df["xgb_risk_score"] = y_prob
            df["is_xgb_flagged"] = (y_prob >= 0.10).astype(int)

            # Build Graph
            G = nx.Graph()
            for _, row in df.iterrows():
                acc = row["account_id"]
                G.add_node(
                    acc,
                    account_id=acc,
                    device_id=row["device_id"],
                    ip_subnet=row["ip_subnet"],
                    xgb_score=float(row["xgb_risk_score"]),
                    is_xgb_flagged=int(row["is_xgb_flagged"]),
                    true_class=int(row["Class"]),
                    ring_label=str(row.get("simulated_ring_label", "None")),
                    amount=float(row.get("Amount", 0.0)),
                )

            # Add device edges
            device_groups = df.groupby("device_id")["account_id"].apply(list)
            for dev, accs in device_groups.items():
                if len(accs) > 1:
                    for i in range(len(accs)):
                        for j in range(i + 1, len(accs)):
                            u, v = accs[i], accs[j]
                            if G.has_edge(u, v):
                                G[u][v]["link_types"].add("shared_device")
                                G[u][v]["weight"] += 2.0
                            else:
                                G.add_edge(u, v, link_types={"shared_device"}, weight=2.0, shared_device=dev)

            # Add IP edges
            ip_groups = df.groupby("ip_subnet")["account_id"].apply(list)
            for ip, accs in ip_groups.items():
                if len(accs) > 1:
                    for i in range(len(accs)):
                        for j in range(i + 1, len(accs)):
                            u, v = accs[i], accs[j]
                            if G.has_edge(u, v):
                                G[u][v]["link_types"].add("shared_ip")
                                G[u][v]["weight"] += 1.0
                            else:
                                G.add_edge(u, v, link_types={"shared_ip"}, weight=1.0, shared_ip=ip)

            # Risk propagation
            for node in G.nodes():
                neighbors = list(G.neighbors(node))
                xgb_self = G.nodes[node]["xgb_score"]
                if neighbors:
                    neighbor_xgb = [G.nodes[nbr]["xgb_score"] for nbr in neighbors]
                    max_neighbor_xgb = max(neighbor_xgb)
                    avg_neighbor_xgb = sum(neighbor_xgb) / len(neighbor_xgb)
                    neighbor_impact = (0.7 * max_neighbor_xgb) + (0.3 * avg_neighbor_xgb)
                    blended = (0.50 * xgb_self) + (0.50 * neighbor_impact)
                else:
                    blended = xgb_self

                G.nodes[node]["ring_risk_score"] = float(np.clip(blended, 0.0, 1.0))

            # Detect rings
            components = list(nx.connected_components(G))
            detected_rings: List[FraudRing] = []
            account_ring_map: Dict[str, str] = {}
            ring_id_counter = 1

            for comp in components:
                if len(comp) < 3:
                    continue

                comp_nodes = [G.nodes[n] for n in comp]
                flagged_count = sum(1 for n in comp_nodes if n["is_xgb_flagged"] == 1)
                true_fraud_count = sum(1 for n in comp_nodes if n["true_class"] == 1)

                if flagged_count >= 1 or true_fraud_count >= 1:
                    subgraph = G.subgraph(comp)
                    all_link_types = set()
                    for u, v, data in subgraph.edges(data=True):
                        all_link_types.update(data.get("link_types", set()))

                    members = []
                    current_ring_id = f"RING-{ring_id_counter:03d}"
                    for n in comp:
                        d = G.nodes[n]
                        account_ring_map[n] = current_ring_id
                        members.append(
                            RingMember(
                                account_id=n,
                                device_id=d["device_id"],
                                ip_subnet=d["ip_subnet"],
                                xgb_score=round(d["xgb_score"], 4),
                                is_xgb_flagged=bool(d["is_xgb_flagged"]),
                                ring_risk_score=round(d["ring_risk_score"], 4),
                                true_class=d["true_class"],
                            )
                        )

                    members.sort(key=lambda x: x.ring_risk_score, reverse=True)
                    ring_obj = FraudRing(
                        ring_id=current_ring_id,
                        cluster_size=len(comp),
                        fraud_count=true_fraud_count,
                        flagged_count=flagged_count,
                        linkage_mechanisms=list(all_link_types),
                        average_ring_risk=round(float(np.mean([m.ring_risk_score for m in members])), 4),
                        members=members,
                    )
                    detected_rings.append(ring_obj)
                    ring_id_counter += 1

            self.G = G
            self.rings = detected_rings
            self.account_ring_map = account_ring_map

            # Build UI graph payload
            ring_node_ids = set(account_ring_map.keys())
            benign_components = [c for c in components if 2 <= len(c) < 3]
            sample_benign_nodes = set()
            for c in benign_components[:3]:
                sample_benign_nodes.update(c)

            viz_nodes = ring_node_ids.union(sample_benign_nodes)
            subgraph = G.subgraph(viz_nodes)

            nodes_payload = []
            for n in subgraph.nodes():
                d = G.nodes[n]
                xgb = d["xgb_score"]
                ring_risk = d["ring_risk_score"]
                is_flagged = d["is_xgb_flagged"] == 1
                true_fraud = d["true_class"] == 1
                ring_id = account_ring_map.get(n)

                if true_fraud or is_flagged:
                    color = "#F2B8C6"  # Soft Rose
                    role = "Flagged Fraud Attack"
                    val = 14
                elif n in ring_node_ids:
                    color = "#A8B5E0"  # Soft Periwinkle
                    role = "Graph-Elevated Accomplice"
                    val = 10
                else:
                    color = "#6E6E80"  # Neutral Slate
                    role = "Connected Account (Normal)"
                    val = 7

                nodes_payload.append(
                    GraphNode(
                        id=n,
                        label=n,
                        role=role,
                        xgb_score=round(xgb, 4),
                        ring_risk=round(ring_risk, 4),
                        device_id=d["device_id"],
                        ip_subnet=d["ip_subnet"],
                        is_flagged=is_flagged,
                        true_class=true_fraud,
                        ring_id=ring_id,
                        color=color,
                        val=val,
                    )
                )

            links_payload = []
            for u, v, data in subgraph.edges(data=True):
                link_types = list(data.get("link_types", set()))
                if "shared_device" in link_types and "shared_ip" in link_types:
                    color = "#F2B8C6"
                    link_type = "Shared Device & IP Subnet"
                    width = 3.0
                elif "shared_device" in link_types:
                    color = "#F2B8C6"
                    link_type = "Shared Device Fingerprint"
                    width = 2.2
                else:
                    color = "#A8B5E0"
                    link_type = "Shared IP Subnet"
                    width = 1.8

                links_payload.append(
                    GraphLink(
                        source=u,
                        target=v,
                        link_type=link_type,
                        color=color,
                        width=width,
                    )
                )

            self.nodes_payload = nodes_payload
            self.links_payload = links_payload
            self.is_ready = True
            logger.info(f"GraphEngine initialized successfully: {len(detected_rings)} rings detected.")

        except Exception as e:
            logger.error(f"Failed to initialize GraphEngine: {e}", exc_info=True)
            self.is_ready = False

    def get_rings_response(self) -> RingsResponse:
        total_accounts = sum(r.cluster_size for r in self.rings)
        return RingsResponse(
            total_rings=len(self.rings),
            total_accounts_implicated=total_accounts,
            rings=self.rings,
        )

    def get_account_risk(self, account_id: str) -> Optional[AccountRiskResponse]:
        if not self.is_ready or account_id not in self.G:
            return None

        d = self.G.nodes[account_id]
        neighbors = list(self.G.neighbors(account_id))
        connected_accounts = []

        for nbr in neighbors:
            nbr_data = self.G.nodes[nbr]
            edge_data = self.G[account_id][nbr]
            link_types = list(edge_data.get("link_types", set()))
            connected_accounts.append(
                ConnectedAccount(
                    account_id=nbr,
                    link_types=link_types,
                    xgb_score=round(nbr_data["xgb_score"], 4),
                    ring_risk_score=round(nbr_data["ring_risk_score"], 4),
                    is_xgb_flagged=bool(nbr_data["is_xgb_flagged"]),
                )
            )

        connected_accounts.sort(key=lambda x: x.ring_risk_score, reverse=True)
        ring_id = self.account_ring_map.get(account_id)
        is_flagged = bool(d["is_xgb_flagged"]) or (d["ring_risk_score"] >= 0.10)

        return AccountRiskResponse(
            account_id=account_id,
            device_id=d["device_id"],
            ip_subnet=d["ip_subnet"],
            individual_xgb_score=round(d["xgb_score"], 4),
            propagated_ring_risk_score=round(d["ring_risk_score"], 4),
            is_flagged=is_flagged,
            ring_id=ring_id,
            connected_accounts_count=len(connected_accounts),
            connected_accounts=connected_accounts,
        )

    def get_network_graph(self) -> NetworkGraphResponse:
        return NetworkGraphResponse(
            nodes=self.nodes_payload,
            links=self.links_payload,
        )


graph_engine = GraphEngine()
