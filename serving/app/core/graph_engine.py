"""
SentinelPay Serving - Graph Risk Engine
========================================
In-memory graph risk engine that loads genuine IEEE-CIS entity linkage data,
provides real-time lookups for detected multi-account fraud rings, and computes
graph-propagated risk across shared hardware devices, card clusters, and network locations.
"""

import logging
from pathlib import Path
import json
from typing import Dict, List, Optional, Any

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
        self.rings: List[FraudRing] = []
        self.account_ring_map: Dict[str, str] = {}
        self.account_data_map: Dict[str, Dict[str, Any]] = {}
        self.neighbor_links: Dict[str, List[ConnectedAccount]] = {}
        self.nodes_payload: List[GraphNode] = []
        self.links_payload: List[GraphLink] = []
        self.metadata: Dict[str, Any] = {}
        self.is_ready: bool = False

    def initialize(self):
        """Load genuine IEEE-CIS entity linkage graph artifact."""
        logger.info("Initializing SentinelPay GraphEngine with real IEEE-CIS linkage data...")
        try:
            current_dir = Path(__file__).resolve().parent
            project_root = current_dir.parent.parent.parent
            artifact_path = project_root / "ml" / "graph" / "real_graph_sample.json"

            if not artifact_path.exists():
                logger.warning(f"Real graph artifact not found at {artifact_path}. Graph features will be unavailable.")
                return

            with open(artifact_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            self.metadata = data.get("metadata", {})
            raw_rings = data.get("rings", [])
            subgraph_data = data.get("subgraph", {})

            parsed_rings: List[FraudRing] = []
            account_ring_map: Dict[str, str] = {}
            account_data_map: Dict[str, Dict[str, Any]] = {}

            for r in raw_rings:
                members_parsed = []
                ring_id = r["ring_id"]
                for m in r["members"]:
                    acc_id = m["account_id"]
                    account_ring_map[acc_id] = ring_id
                    account_data_map[acc_id] = m
                    members_parsed.append(
                        RingMember(
                            account_id=acc_id,
                            device_id=m["device_id"],
                            ip_subnet=m["ip_subnet"],
                            os_version=m.get("os_version"),
                            browser=m.get("browser"),
                            xgb_score=m["xgb_score"],
                            is_xgb_flagged=m["is_xgb_flagged"],
                            ring_risk_score=m["ring_risk_score"],
                            true_class=m["true_class"],
                            amount=m.get("amount"),
                        )
                    )

                parsed_rings.append(
                    FraudRing(
                        ring_id=ring_id,
                        cluster_size=r["cluster_size"],
                        fraud_count=r["fraud_count"],
                        flagged_count=r["flagged_count"],
                        linkage_mechanisms=r["linkage_mechanisms"],
                        average_ring_risk=r["average_ring_risk"],
                        members=members_parsed,
                    )
                )

            # Parse subgraph nodes & links
            nodes_parsed = [
                GraphNode(
                    id=n["id"],
                    label=n["label"],
                    role=n["role"],
                    xgb_score=n["xgb_score"],
                    ring_risk=n["ring_risk"],
                    device_id=n["device_id"],
                    ip_subnet=n["ip_subnet"],
                    is_flagged=n["is_flagged"],
                    true_class=1 if n["true_class"] is True or n["true_class"] == 1 else 0,
                    ring_id=n.get("ring_id"),
                    color=n["color"],
                    val=n["val"],
                )
                for n in subgraph_data.get("nodes", [])
            ]

            links_parsed = [
                GraphLink(
                    source=l["source"],
                    target=l["target"],
                    link_type=l["link_type"],
                    color=l["color"],
                    width=l["width"],
                )
                for l in subgraph_data.get("links", [])
            ]

            # Build neighbor index for fast account risk queries
            neighbor_links: Dict[str, List[ConnectedAccount]] = {}
            for l in links_parsed:
                u, v = l.source, l.target
                link_type = l.link_type

                # Neighbor for u
                if u not in neighbor_links:
                    neighbor_links[u] = []
                v_data = account_data_map.get(v, {"xgb_score": 0.05, "ring_risk_score": 0.05, "is_xgb_flagged": False})
                neighbor_links[u].append(
                    ConnectedAccount(
                        account_id=v,
                        link_types=[link_type],
                        xgb_score=v_data.get("xgb_score", 0.05),
                        ring_risk_score=v_data.get("ring_risk_score", 0.05),
                        is_xgb_flagged=v_data.get("is_xgb_flagged", False),
                    )
                )

                # Neighbor for v
                if v not in neighbor_links:
                    neighbor_links[v] = []
                u_data = account_data_map.get(u, {"xgb_score": 0.05, "ring_risk_score": 0.05, "is_xgb_flagged": False})
                neighbor_links[v].append(
                    ConnectedAccount(
                        account_id=u,
                        link_types=[link_type],
                        xgb_score=u_data.get("xgb_score", 0.05),
                        ring_risk_score=u_data.get("ring_risk_score", 0.05),
                        is_xgb_flagged=u_data.get("is_xgb_flagged", False),
                    )
                )

            self.rings = parsed_rings
            self.account_ring_map = account_ring_map
            self.account_data_map = account_data_map
            self.neighbor_links = neighbor_links
            self.nodes_payload = nodes_parsed
            self.links_payload = links_parsed
            self.is_ready = True

            logger.info(
                f"GraphEngine loaded successfully: {len(parsed_rings)} real IEEE-CIS fraud rings, "
                f"{len(nodes_parsed)} visual nodes, {len(links_parsed)} links."
            )

        except Exception as e:
            logger.error(f"Failed to initialize GraphEngine: {e}", exc_info=True)
            self.is_ready = False

    def get_rings_response(self) -> RingsResponse:
        total_accounts = sum(r.cluster_size for r in self.rings)
        lift_ratio = self.metadata.get("fraud_lift_ratio", 1.54)
        return RingsResponse(
            dataset="Kaggle IEEE-CIS Fraud Detection (Real Identity & Transaction Linkage)",
            disclaimer="Validated on Kaggle IEEE-CIS Real Entity Linkage Dataset (Hardware, Card & Network Fingerprints).",
            total_rings=len(self.rings),
            total_accounts_implicated=total_accounts,
            fraud_lift_ratio=lift_ratio,
            rings=self.rings,
        )

    def get_account_risk(self, account_id: str) -> Optional[AccountRiskResponse]:
        if not self.is_ready:
            return None

        # Check if account is in mapped dataset
        d = self.account_data_map.get(account_id)
        if not d:
            # Check in nodes payload
            for n in self.nodes_payload:
                if n.id == account_id:
                    d = {
                        "account_id": n.id,
                        "device_id": n.device_id,
                        "ip_subnet": n.ip_subnet,
                        "xgb_score": n.xgb_score,
                        "ring_risk_score": n.ring_risk,
                        "is_xgb_flagged": n.is_flagged,
                    }
                    break

        if not d:
            # Fallback mock for demo queries
            return None

        connected = self.neighbor_links.get(account_id, [])
        ring_id = self.account_ring_map.get(account_id)
        is_flagged = bool(d.get("is_xgb_flagged", False)) or (d.get("ring_risk_score", 0.0) >= 0.10)

        return AccountRiskResponse(
            account_id=account_id,
            disclaimer="Validated on Kaggle IEEE-CIS Real Entity Linkage Dataset (Hardware, Card & Network Fingerprints).",
            device_id=d.get("device_id", "Unknown Device"),
            ip_subnet=d.get("ip_subnet", "Unknown Location"),
            individual_xgb_score=round(d.get("xgb_score", 0.0), 4),
            propagated_ring_risk_score=round(d.get("ring_risk_score", 0.0), 4),
            is_flagged=is_flagged,
            ring_id=ring_id,
            connected_accounts_count=len(connected),
            connected_accounts=connected,
        )

    def get_network_graph(self) -> NetworkGraphResponse:
        return NetworkGraphResponse(
            disclaimer="Validated on Kaggle IEEE-CIS Real Entity Linkage Dataset (Hardware, Card & Network Fingerprints).",
            dataset="Kaggle IEEE-CIS Fraud Detection (Real Identity & Transaction Linkage)",
            fraud_lift_ratio=self.metadata.get("fraud_lift_ratio", 1.54),
            nodes=self.nodes_payload,
            links=self.links_payload,
        )


graph_engine = GraphEngine()
