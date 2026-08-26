# What Broke, and How We Got Out

Honest engineering log of the real decisions and failures behind SentinelPay — not a highlight reel.

---

### 1. SMOTE looked good on paper, made the model worse in practice

Our first instinct for the 0.17% class imbalance was SMOTE oversampling — the textbook answer. It raised recall, but PR-AUC only reached 0.7947 (barely above the 0.7904 balanced baseline, and far below 0.8424 for native cost-weighting), while false positives remained high at 172 (vs. 16 with cost-sensitive weighting). Synthetic interpolation between rare fraud points was inventing patterns that don't exist in real transaction geometry.

We rejected it and moved to `scale_pos_weight=578.55` on the raw distribution instead — training directly on the real decision boundary rather than a synthetic one. PR-AUC recovered to 0.8424. Lesson: the popular fix for imbalance isn't always the right fix for *this* imbalance.

### 2. Kafka + stateful consumer instead of Flink

We considered a full Apache Flink cluster for the streaming velocity engine. Rejected it — a JobManager/TaskManager cluster is heavy to deploy and a real risk of breaking mid-demo for marginal benefit at this scale. We shipped Kafka + a Python async consumer holding a per-`card_id` sliding window in memory instead — the same pattern many real fraud systems actually use for velocity features, and far lower-risk to keep alive during a live pitch.

For the recorded demo specifically, we didn't trust a live Kafka process to survive an uninterrupted take, so the frontend can also replay a pre-recorded burst of transactions against the same WebSocket — same code path, zero live-infra risk during recording.

### 3. GraphSAGE didn't beat the simple graph algorithm — we reported that honestly

We built the classical approach first (NetworkX connected components + PageRank-style risk propagation) since it's explainable and demo-safe. We then trained a GraphSAGE GNN on top, expecting it to win. It didn't — the classical method's ring detection outperformed the GNN on our validated data. Rather than force a better-looking GNN number, we kept the classical approach as the production method and reported the comparison as-is. A negative result honestly reported is worth more to a technical reviewer than an inflated one.

### 4. Render free-tier cold starts were killing first impressions

Backend on Render's free tier sleeps after inactivity — first request after idle can take 40-60s. Early versions just showed a spinner or, worse, a broken UI while the request hung. We built a dedicated cold-start HUD that polls the actual `/health` endpoint (not a fake timer) and shows real status — "waking," "cache warming," etc. — so a judge who hits a cold backend sees engineering intent instead of a broken demo.

### 5. Ring risk scores converge to the same number within a fully-confirmed ring — by design, not a bug

Early on this looked like a bug: multiple different rings all showing identical "Avg Ring Risk." It isn't — when every member of a ring is already a confirmed-fraud account, their mutual neighbor scores converge under the propagation formula (`Risk = 0.50·P_XGB + 0.50·(0.7·Max_Nbr + 0.3·Avg_Nbr)`), so a fully-fraud cluster legitimately produces a uniform cluster-level score. Worth stating explicitly so a reviewer doesn't mistake correct math for a hardcoded value.
