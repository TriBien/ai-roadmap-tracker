# AI Engineer Roadmap: 28 Weeks (Python-First, Go and Rust Where Production Demands)

# PHASE 1: Job-ready AI engineering (Weeks 1-10)

## Week 1: LLM gateway in Python (FastAPI)

**Fundamental**
- LLM API mechanics: tokens, context windows, sampling, streaming, cost model.
- Structured outputs and JSON-schema validation.
- Python async programming (asyncio, timeouts, cancellation, backpressure) and strict typing with Pydantic.
- Git workflow (trunk-based, PR checks) and Linux basics for running services (processes, ports, logs).
- Resilience patterns: timeouts, retries with jitter, circuit breaker.

**Targets**
- A provider-agnostic gateway that treats model output as untrusted input.
- Failure behaviour defined before features.

**Implement**
- FastAPI service with a provider interface (Protocol or ABC) and adapters (Anthropic, OpenAI, Gemini), fully typed and checked with mypy or pyright.
- Project tooling: uv or poetry, ruff, pre-commit, pytest.
- Schema-validated structured outputs with bounded retries and repair prompts.
- REST endpoints (plus one gRPC endpoint via grpcio), streaming over SSE, config-driven provider selection, rate limits.
- Dockerfile, GitHub Actions pipeline, unit tests with injected failures (timeouts, malformed JSON).
- Run the service on a Linux host or VM with systemd and log inspection, not only on your laptop.
- Create the eval package inside the same repo (pytest, dataset folder) so services and evals share types.

**Practical project**
- `ai-chassis` repo. First use case: extract fields from synthetic bank statements and loan documents into a typed schema.

**Production mapping**
- Python microservices (FastAPI) over REST and gRPC; model-agnostic abstraction; failure modes, retries and guardrails; async API design.

**Acceptance**
- Switching provider requires a config change only, no caller change.
- Malformed model output is rejected or repaired, never passed through.
- Failure-injection tests pass in CI.

**Deliverable**
- Repo with README, architecture diagram, passing CI.

## Week 2: Event-driven RAG on pgvector

**Fundamental**
- Embeddings, chunking strategies, HNSW indexes in pgvector.
- Kafka semantics: at-least-once delivery, idempotent consumers, consumer groups, replay.
- OpenTelemetry basics.

**Targets**
- A deployed end-to-end skeleton with citations and traces from day one.

**Implement**
- Ingest events on Kafka, chunk, embed and write to pgvector (Python consumers, for example confluent-kafka).
- Retrieval plus generation endpoint returning answers with chunk-level citations.
- OpenTelemetry tracing and a trace per request.
- Write 40 golden Q&A cases and a first eval script in Python.
- Deploy to your chosen cloud.

**Practical project**
- Policy Q&A over about 30 public regulatory and policy documents (KYC/AML guidance, lending rules).

**Production mapping**
- RAG over internal documents; Kafka/CDC pipelines; observability.

**Acceptance**
- Replaying the event stream creates no duplicate chunks.
- Every answer carries citations that resolve to stored chunks.
- Live URL, a trace per request, and a recorded baseline score.

**Deliverable**
- Deployed v0 and a baseline eval report (scores, failure examples).

## Week 3: Retrieval quality, caching, Postgres tuning

**Fundamental**
- Hybrid search (full-text plus vector), reranking, query rewriting.
- Metrics: recall@k, MRR; latency budgets.
- Postgres indexing, `EXPLAIN`, Redis caching and invalidation.

**Targets**
- Retrieval decisions justified with numbers, within a latency budget.

**Implement**
- Three or more retrieval configurations: vector only, hybrid, hybrid plus reranker.
- Chunking and metadata experiments.
- Redis cache with **permission-aware keys**.
- Query and index tuning pass using `EXPLAIN`.
- Replicate the core schema and three key queries on MySQL; compare indexing behaviour, `EXPLAIN` output and transactional differences with PostgreSQL.

**Practical project**
- Retrieval comparison report on the policy corpus.

**Production mapping**
- Hybrid retrieval, reranking, pgvector, PostgreSQL tuning, Redis, latency and cost control.

**Acceptance**
- Report compares at least three configurations with recall@k, MRR and p95 latency; the chosen one is justified.
- A test proves one user cannot receive another user's cached result.

**Deliverable**
- Retrieval report, tuned schema and indexes. **CV v1 and first batch of low-stakes applications sent.**

## Week 4: Evals and error analysis (Python)

**Fundamental**
- Eval set design, error analysis, failure taxonomies.
- LLM-as-judge: calibration against human labels, bias, noise.
- Regression testing for non-deterministic systems.

**Targets**
- The eval harness becomes a release gate.

**Implement**
- Grow to 100+ cases across normal, edge and adversarial inputs.
- Label a subset yourself and measure judge agreement.
- Regression tracking across prompt, model and retrieval changes.
- CI gate and a dashboard for quality, latency and cost per run.

**Practical project**
- Eval-first pipeline for the policy Q&A service.

**Production mapping**
- Evaluation in every AI feature; monitoring quality, latency and cost; measure-first mindset.

**Acceptance**
- A deliberately degraded prompt fails CI.
- Judge-versus-human agreement is measured and reported (set a threshold, for example 80%, and document the actual figure).
- Failure taxonomy covers every observed failure in the set.

**Deliverable**
- Eval report, taxonomy document, CI gate.

## Week 5: Agents and tool calling

**Fundamental**
- Tool-calling contracts, ReAct, plan-and-execute.
- State, checkpoints, idempotency, human-in-the-loop approval.
- Agent failure modes: loops, wrong tool, runaway cost.

**Targets**
- An agent that is bounded, auditable and measurable.

**Implement**
- Python agent loop written from scratch (asyncio, typed tool contracts).
- Tools: customer lookup, transaction search, draft case note (mock banking API).
- Step and cost limits, per-tool permission scopes, idempotent actions.
- Approval gate for any write action.
- Trajectory evals (tool-call accuracy, task success).
- Side exercise (half a day): rebuild one flow in LangGraph and read LangChain's tool abstractions, so you can discuss the frameworks the JDs name.

**Practical project**
- KYC case assistant: investigate a flagged customer, cite policy, draft a case note for human approval.

**Production mapping**
- Agentic workflows with tool calling; at least one major framework; approval gates for high-risk actions.

**Acceptance**
- The agent halts at its step and cost limits.
- Write actions cannot execute without approval (tested).
- Tool-call accuracy and task success measured on 30+ scenarios.

**Deliverable**
- Agent module, trajectory eval results, short design note comparing hand-rolled and LangGraph versions.

## Week 6: MCP, multi-agent, memory

**Fundamental**
- Model Context Protocol: tools, resources, transport.
- Supervisor-worker patterns, context sharing.
- Short-term versus long-term memory: what to store, retrieve and expire.

**Targets**
- Your tools usable by any MCP client; evidence on whether multi-agent helps.

**Implement**
- MCP server exposing your tools (use the official Python MCP SDK; check its current version and transport support first).
- Supervisor plus worker agents built in LangGraph, then re-implemented in CrewAI with the same tools and eval set to compare orchestration styles (note AutoGen as a third option).
- Memory store in Postgres with TTL, summarization and retrieval.
- A/B comparison: single agent versus multi-agent.

**Practical project**
- Extend the KYC assistant with persisted case memory and a supervisor that delegates retrieval and drafting.

**Production mapping**
- MCP, multi-agent systems, context layer and memory (security JD, AI-backend JD).

**Acceptance**
- An external MCP client can discover and call your tools.
- Comparison report on success, cost and latency; report the result even if multi-agent loses.
- Memory expiry and retrieval covered by tests.
- The same scenarios run on both frameworks; differences in control, debuggability and cost documented.

**Deliverable**
- MCP server, comparison report, memory design note.

## Week 7: Safety, governance, audit

**Fundamental**
- LLM threat model: direct and indirect prompt injection, data leakage, tool abuse.
- Enforcing permissions at the retrieval and tool layer, not in the prompt.
- PII handling, audit logging, OWASP LLM Top 10, NIST AI RMF vocabulary.

**Targets**
- Provable controls, not claimed ones.

**Implement**
- Field allowlists so the model sees only permitted data.
- Row-level access filters in retrieval.
- Red-team suite of about 40 attacks (including injection through retrieved documents and tool outputs) in CI.
- PII detection and redaction.
- Audit log schema: user, query, retrieved chunks, tool calls, model and prompt version, output.
- Put the Python PII redactor and audit writer behind interfaces with contract tests and a benchmark harness; they become the reference implementations for later variants.

**Practical project**
- Security hardening of the KYC assistant with an attack report.

**Production mapping**
- Prompt injection, data leakage, access control, guardrails, auditability (finance JD); data governance (AI-backend JD); adversarial inputs (security JDs).

**Acceptance**
- Cross-user and cross-tenant access tests all fail to leak data.
- Red-team results documented, with residual risks listed honestly.
- Any answer can be reconstructed from the audit log.

**Deliverable**
- Red-team suite, audit schema, security design note.

## Week 8: Data pipeline, backtesting, first ML component

**Fundamental**
- CDC concepts (Debezium), event-driven feature pipelines.
- Time-based splits, leakage, backtesting, shadow mode.
- Baseline ML with scikit-learn; explaining results to business readers.

**Targets**
- Prove a model change with data before go-live; first step of the ML track.

**Implement**
- Postgres CDC to Kafka to a feature table.
- Python anomaly or recommendation scorer (for example isolation forest) built with NumPy and pandas, with a time-split backtest.
- Leakage tests; shadow deployment comparing the model against current behaviour.
- Serve the scorer through a FastAPI REST service next to the gateway (Pydantic schemas, health checks) and expose it as a tool the agent can call.
- Polyglot variant (about 5 hours): re-implement the Kafka consumer in Go (consumer groups, idempotent handler, retries, dead-letter queue) behind the same contract as the Python reference; benchmark both on the same replayed topic.

**Practical project**
- Transaction anomaly scoring for the KYC assistant, with a plain-language results memo.

**Production mapping**
- Event-stream pipelines; backtests before go-live; classification and anomaly detection; explaining model results (AI-backend JD, security JD B); Go for high-throughput event consumers.

**Acceptance**
- A leakage test exists and passes.
- Backtest compared against a naive baseline on a stated metric; if the model doesn't win, say so.
- Memo is readable by a non-engineer.
- The FastAPI endpoint has contract tests and a load-test baseline.
- Go and Python consumers pass the same replay and poison-message tests; throughput, p99, memory and operational notes recorded; the Go variant is kept only if it clears the declared threshold.

**Deliverable**
- Pipeline code, backtest notebook or script, one-page memo.

## Week 9: AI-assisted engineering, decision records, standards

**Fundamental**
- Spec-driven development with coding agents; review discipline; when not to trust generated code.
- Architecture decision records (ADRs).

**Targets**
- Evidence of senior judgment and team-raising practices.

**Implement**
- Repo instruction file, test gates for agent-written code, a small internal tool or script that speeds your workflow (for example an eval-run command).
- Five ADRs: model selection, retrieval design, agent workflow, cost and latency, permissions model.
- "AI engineering standards" document: patterns, review checklist, eval requirements.
- Choose one domain pack: finance KYC, payroll/HR, or security triage.
- Polyglot variant (about 5 hours): Go edge gateway in front of the Python gateway (JWT or API-key auth, per-tenant rate limits and token budgets, SSE streaming proxy, audit events), compared with the same features in the Python gateway; write the ADR "Python vs Go at the edge".

**Practical project**
- Portfolio polish: README per repo, architecture diagrams, demo flow.

**Production mapping**
- Daily use of AI coding tools with judgment (AI-backend JD); mentoring and reusable standards (finance JD).

**Acceptance**
- Each ADR lists alternatives and measured evidence.
- Standards checklist applied to your own repo.
- A written note of real cases where generated code was wrong or rejected (only real ones).
- The edge ADR contains benchmark numbers (p95, throughput, memory) and a keep-or-retire decision; unauthorized and over-budget requests are rejected identically by both implementations.

**Deliverable**
- ADRs, standards document, polished repos, edge-gateway benchmark.

## Week 10: Interview drills and application sprint

**Fundamental**
- AI system design; Python concurrency (asyncio, threads versus processes, the GIL); Kafka delivery and ordering; Postgres tuning; incident troubleshooting.

**Targets**
- Articulate trade-offs fluently; convert interviews into offers.

**Implement**
- Practise five design prompts aloud: KYC Q&A with audit; dispute-handling agent; halving cost and latency; injection defence for a tool-using agent; regression strategy when models change quarterly.
- Three mock interviews; one timed coding exercise; one take-home simulation.
- Story bank mapping every JD bullet to a concrete example with numbers.
- Prepare two stories from the polyglot variants: one where Go or Rust won and one where Python was enough, each with numbers.
- CV v2 tailored per JD; 10-15 applications plus referrals.

**Practical project**
- Five-minute capstone demo video and a one-page case study.

**Production mapping**
- All four JDs: decision-making, stakeholder communication, mentoring, incident handling.

**Acceptance**
- Each design answer covers failure modes, evals, cost and security within 10 minutes.
- Mock feedback captured and the top three gaps addressed.

**Deliverable**
- Demo video, case study, story bank, application tracker.

---

# PHASE 2: ML and LLM-engineer depth (Weeks 11-28)

Continue applying and interviewing. Each week produces an artifact that plugs back into the chassis. Document AI comes first because it extends Phase 1 directly; model-building follows.

## Week 11: Document AI I, OCR and layout analysis

**Fundamental**
- OCR pipeline: image preprocessing, text detection and recognition, digital-PDF text versus scanned pages.
- Layout analysis: blocks, tables, reading order; layout-aware model families (LayoutLM-style) at concept level.
- Metrics: character and word error rate, table-structure accuracy.

**Targets**
- Reliable text and structure from messy documents, with measured error.

**Implement**
- Pipeline with one open OCR engine (Tesseract, PaddleOCR or docTR; pick one) plus layout and table detection.
- Router that sends digital PDFs and scanned pages down different paths.
- Command-line tooling on Linux (poppler, ImageMagick) for batch processing.
- Hand-label 50 pages to measure error rates.

**Practical project**
- Ingestion upgrade for the KYC assistant: scanned bank statements and invoices (synthetic or public datasets).

**Production mapping**
- Document AI: OCR, layout analysis; document pipelines feeding RAG.

**Acceptance**
- Character and word error rates reported on 50 labelled pages.
- Tables recovered with a measured structure score; failures catalogued.
- Routing between digital and scanned paths tested.

**Deliverable**
- Pipeline repo and an error-analysis report with failure examples.

## Week 12: Document AI II, information extraction

**Fundamental**
- Key-value and table extraction; LLM or VLM extraction versus layout-model extraction.
- Confidence scoring, human-review routing, field-level evaluation, schema versioning.

**Targets**
- Extraction you can trust field by field, with a safe fallback.

**Implement**
- Schema-driven extraction (Pydantic) with an LLM or vision-language model, compared against a layout-based baseline.
- FastAPI `/extract` service with typed request and response models, health checks and OpenAPI docs.
- Confidence thresholds, review queue, PostgreSQL storage.
- Field-level eval harness (exact and fuzzy match per field).
- Polyglot variant (about 5 hours): Rust crate for document-text normalization and PII redaction, exposed to Python through PyO3 and benchmarked against the W7 Python reference on real OCR output; fuzz the parsing paths with `cargo-fuzz`.

**Practical project**
- Document intake service feeding the KYC assistant (statements, invoices).

**Production mapping**
- Information extraction; FastAPI and RESTful APIs; PostgreSQL; Rust for safe, fast handling of untrusted document text.

**Acceptance**
- Per-field precision and recall reported; weakest fields identified.
- Low-confidence results routed to review in tests.
- Latency and cost per page recorded.
- Rust and Python redactors produce identical detections on the labelled set; throughput and memory compared; fuzzing finds no crashes in a fixed budget (or each crash has a regression test).

**Deliverable**
- Deployed service and evaluation report.

## Week 13: Data and Python for ML (NumPy, Pandas)

**Fundamental**
- NumPy vectorization, pandas pipelines, exploratory analysis, statistics basics, leakage, metric selection.

**Targets**
- Fluent data wrangling; metrics tied to business cost.

**Implement**
- Cleaning and feature scripts; time-based train/validation/test splits.
- Load the same dataset into PostgreSQL and MySQL; compare query plans, indexing and transaction behaviour.

**Practical project**
- Credit default or fraud dataset (public): full EDA with documented pitfalls.

**Production mapping**
- NumPy and pandas proficiency; PostgreSQL and MySQL; data skills for backtests.

**Acceptance**
- Split strategy justified in writing; metric choice tied to cost; MySQL versus PostgreSQL differences documented with evidence.

**Deliverable**
- EDA report, reusable data-prep module, database comparison note.

## Week 14: Supervised learning, ensembles, hyperparameter tuning

**Fundamental**
- Linear and logistic models, trees, regularization, cross-validation, calibration, class imbalance.
- Random forest, gradient boosting (XGBoost/LightGBM), search strategies for hyperparameters.

**Targets**
- Understand the models behind your scorers; know when tabular models beat LLMs.

**Implement**
- scikit-learn baselines; boosted models; Optuna search with proper validation; calibration curves; cost-based thresholds.

**Practical project**
- Fraud and credit-risk scorers integrated as agent tools; compare with the W8 baseline.

**Production mapping**
- ML fundamentals; hyperparameter tuning; model evaluation; classification and scoring.

**Acceptance**
- Time-based backtest shows improvement over W8 or an honest tie; tuning budget and results logged; latency and cost per prediction recorded.

**Deliverable**
- Models, backtest report, "LLM versus classical ML" decision note.

## Week 15: Anomaly detection and time series

**Fundamental**
- Isolation forest, one-class methods, seasonal baselines, forecasting basics, drift.

**Targets**
- Behavioural analytics usable by finance and security agents.

**Implement**
- Streaming-friendly detector, forecast baseline, drift checks, FastAPI endpoint.

**Practical project**
- Behaviour-baseline service: per-entity normal activity and deviation scores consumed by the agent.

**Production mapping**
- Anomaly detection and behavioural pattern recognition.

**Acceptance**
- False-positive rate and detection delay measured on labelled or injected anomalies.

**Deliverable**
- Service and evaluation report.

## Week 16: Deep learning with PyTorch

**Fundamental**
- Tensors, autograd, training loops, optimizers, regularization, overfitting, learning-rate schedules, mixed precision.

**Targets**
- Write and debug a training loop without framework crutches.

**Implement**
- MLP for tabular data; CNN or sequence model on a small task; training scripts with seeds, configs and logged curves; GPU training run.

**Practical project**
- Alert or ticket classifier compared against the gradient-boosting baseline.

**Production mapping**
- PyTorch; deep learning understanding; model evaluation.

**Acceptance**
- Reproducible training run; written comparison with the classical baseline, including cost and training time.

**Deliverable**
- Training repo with seeds, configs and results.

## Week 17: NLP, embeddings and TensorFlow

**Fundamental**
- Tokenization, embeddings, text classification, sequence labelling (NER), similarity search, reranker models.
- TensorFlow/Keras model-building idioms versus PyTorch.

**Targets**
- Competent in both frameworks; evidence-based embedding choices.

**Implement**
- NER or classification model in PyTorch, ported to TensorFlow/Keras; compare effort, speed and results.
- Embedding and cross-encoder reranker bake-off on your retrieval set.

**Practical project**
- Embedding and reranker bake-off for the policy corpus, feeding the winner back into the chassis.

**Production mapping**
- NLP; TensorFlow and PyTorch; semantic search and vector databases.

**Acceptance**
- Report on recall, MRR, latency and cost per model; the chassis updated with the chosen model; TensorFlow port reproduces PyTorch metrics within a stated tolerance.

**Deliverable**
- Bake-off report, updated retrieval module, both framework implementations.

## Week 18: Transformer internals

**Fundamental**
- Attention, positional encoding, KV cache, context-length cost, decoding strategies, training objectives.

**Targets**
- Reason about latency, memory and failure modes from first principles.

**Implement**
- Small GPT-style model on a toy corpus; measure memory and speed versus context length.
- Read two foundational papers and summarise them in your own words.

**Practical project**
- "Why is this prompt slow and expensive?" analysis applied to your own agent traces.

**Production mapping**
- Transformer architecture understanding; latency and token cost.

**Acceptance**
- Written explanation links KV cache and context length to measured latency in your traces.

**Deliverable**
- Mini-model repo and analysis note.

## Week 19: Fine-tuning I, SFT with LoRA/PEFT

**Fundamental**
- When to fine-tune versus prompt versus retrieve; dataset curation and formatting; supervised fine-tuning (SFT); LoRA and PEFT mechanics; overfitting and forgetting.

**Targets**
- A first reproducible fine-tune evaluated on your own eval set.

**Implement**
- Curate 1,000+ examples for one narrow task (for example field extraction or case-note drafting).
- SFT with LoRA on a small Qwen model using Hugging Face tooling; experiment tracking.
- Evaluate against the prompted baseline on the same eval harness.

**Practical project**
- Fine-tuned extractor or drafter compared to the prompted baseline.

**Production mapping**
- LLM fine-tuning with LoRA, PEFT and SFT; model evaluation.

**Acceptance**
- Training reproducible from config; quality, cost and latency compared with the prompted baseline; data-leakage check between train and eval sets.

**Deliverable**
- Adapter, training config, comparison report.

## Week 20: Fine-tuning II, QLoRA and multi-model comparison

**Fundamental**
- QLoRA and 4-bit training; rank, alpha, learning-rate and batch-size effects; catastrophic forgetting; model selection across families.

**Targets**
- Hands-on evidence across Qwen, Llama and Mistral.

**Implement**
- QLoRA runs on Llama and Mistral models (plus the Qwen run from W19) with a hyperparameter search.
- Evaluate quality, memory, speed and regression on general ability.

**Practical project**
- Three-model comparison on one task with a recommendation.

**Production mapping**
- QLoRA; Qwen, Llama and Mistral; hyperparameter tuning; model evaluation.

**Acceptance**
- Table of quality, VRAM, training time and inference cost per model; recommendation justified; failures and instabilities documented.

**Deliverable**
- Comparison report and reusable training templates.

## Week 21: GPU, CUDA fundamentals, quantization

**Fundamental**
- GPU architecture and memory hierarchy; CUDA execution model (kernels, threads, streams) at working level; profiling; mixed precision.
- Quantization: GPTQ, AWQ, GGUF, bitsandbytes; accuracy versus speed trade-offs.

**Targets**
- Diagnose GPU bottlenecks and quantify quantization trade-offs. Scope: working literacy and profiling, not production kernel authoring.

**Implement**
- Profile training and inference with PyTorch profiler and Nsight basics.
- Write one simple CUDA-level exercise (for example via Numba or Triton) to understand kernels.
- Quantize one fine-tuned model with two methods; run evals on each.

**Practical project**
- Quantization study on the W19-20 model with quality, latency and memory results.

**Production mapping**
- GPU/CUDA, quantization, model optimization.

**Acceptance**
- Bottleneck identified from a profile trace; quality loss per quantization method measured on your eval set.

**Deliverable**
- Profiling notes and quantization report.

## Week 22: Serving and deployment, vLLM with FastAPI

**Fundamental**
- Serving engines, continuous batching, KV-cache memory, throughput versus latency, GPU containers, Linux operations, air-gapped packaging.

**Targets**
- Self-hosted models behind your existing gateway.

**Implement**
- Serve a model with vLLM (or an equivalent engine) and wrap domain endpoints in FastAPI.
- Add an adapter to the gateway; run load tests; Dockerize with GPU support; operate the host with Linux tooling (systemd, logs, `nvidia-smi`, `perf`-style checks).
- Offline packaging test for an air-gapped scenario.

**Practical project**
- Hosted versus self-hosted comparison on your eval set with a cost model.

**Production mapping**
- vLLM, FastAPI and REST deployment; Docker and Linux; on-premise deployments.

**Acceptance**
- The gateway switches to the local model by config; throughput, p95 latency and cost-per-request table produced; service restarts cleanly under failure tests.

**Deliverable**
- Serving stack, load-test report, runbook.

## Week 23: Advanced retrieval, Text-to-Query, knowledge graphs

**Fundamental**
- Query rewriting, multi-hop retrieval, semantic layers, graph modelling (Neo4j basics), safe Text-to-SQL.

**Targets**
- Structured knowledge alongside documents.

**Implement**
- Read-only Text-to-SQL with schema allowlists and execution-accuracy evals.
- Small entity graph for customers, accounts and cases.

**Practical project**
- "Ask your data" tool for the KYC assistant with query validation.

**Production mapping**
- Text-to-Query, knowledge graphs, semantic layers.

**Acceptance**
- Execution accuracy measured; destructive queries blocked by tests.

**Deliverable**
- Text-to-Query module, graph prototype, evaluation report.

## Week 24: MLOps, LLMOps and CI/CD

**Fundamental**
- Experiment tracking (MLflow), model and prompt registries, canary and shadow releases, drift monitoring, rollback.
- CI/CD on both GitHub Actions and GitLab CI.

**Targets**
- Operate models and prompts like any production artifact, on either CI system.

**Implement**
- Track experiments and eval runs; register models, adapters and prompt versions; drift dashboards; canary release for a model change.
- Mirror the pipeline in GitLab CI and note the differences (runners, caching, includes).

**Practical project**
- End-to-end release pipeline for the extractor, classifier and prompt set.

**Production mapping**
- MLOps/LLMOps; Git, Docker, CI/CD with GitHub Actions and GitLab CI.

**Acceptance**
- A deliberately bad model candidate is blocked by the gate; rollback tested; the same pipeline passes on both CI systems.

**Deliverable**
- Pipeline definitions and runbook.

## Week 25: Cost and latency at scale

**Fundamental**
- Model routing, caching layers, batching, streaming, budgets, distillation concepts.

**Targets**
- Reduce cost and latency without losing measured quality.

**Implement**
- Router sending easy requests to a cheaper or self-hosted model; permission-aware semantic and exact caches; per-tenant budget enforcement.
- Polyglot variant (about 5 hours, optional): move exact-cache lookups and budget counters into the Go edge; compare end-to-end cost and p95 latency against the Python reference.

**Practical project**
- Cost-reduction exercise on the KYC assistant with before/after numbers.

**Production mapping**
- Latency, cost and token efficiency.

**Acceptance**
- Documented cost and latency reduction with no regression on the eval gate.
- Variant results recorded; if the edge version does not clear the threshold, retire it and note why.

**Deliverable**
- Router, budget controls, results table.

## Week 26: Model risk, explainability, fairness

**Fundamental**
- Explainability methods, bias and fairness tests, model documentation, audit trails, regulatory vocabulary.

**Targets**
- Defend models to risk and compliance stakeholders.

**Implement**
- Explanations for the credit and fraud models; fairness slices; model cards; audit log extended to model decisions.
- Polyglot variant (about 5 hours): Rust append-only audit store (idempotent writes, tamper-evident hashing, query endpoints) behind the same contract as the Python audit writer; load-test both.

**Practical project**
- Governance pack for the capstone: model cards, risk register, audit walkthrough.

**Production mapping**
- AI governance, model risk, explainability, KYC/AML.

**Acceptance**
- A non-technical reviewer can follow the audit walkthrough and find the evidence for a sample decision.
- Rust and Python audit stores pass the same idempotency and reconstruction tests; write throughput, tail latency and memory compared.

**Deliverable**
- Governance pack.

## Week 27: Shared AI platform

**Fundamental**
- Platform design: reusable modules, versioned APIs, multi-product support, developer experience.

**Targets**
- Turn the capstone into reusable capabilities.

**Implement**
- Package gateway, retrieval, agent runtime, Document AI, eval harness, guardrails, serving and observability as documented modules.
- Add a second domain pack to prove reuse.
- Make every variant swappable by configuration against its Python reference; run one CI matrix across Python, Go and Rust with the same contract and eval tests.
- Write a keep-or-retire ADR per variant using the benchmark results.

**Practical project**
- Second product built on the platform in a few days, with timing recorded.

**Production mapping**
- Shared AI platforms; reusable standards.

**Acceptance**
- The second domain pack reuses at least 70% of the platform code (record the actual ratio) and passes the same eval and security gates.
- Switching any variant back to its Python reference is a configuration change with no test failures.

**Deliverable**
- Platform repo and onboarding guide.

## Week 28: Review and next 90 days

**Fundamental**
- Retrospective methods; portfolio storytelling.

**Targets**
- Consolidate evidence and choose the next specialization.

**Implement**
- Metrics review: applications, interview conversion, recurring gaps.
- Publish one technical write-up or open-source contribution; refresh CV and case studies.

**Practical project**
- Portfolio index linking all repos, reports and demos.

**Production mapping**
- Positioning for the roles that responded best.

**Acceptance**
- Gap list ranked by observed interview feedback, with a plan for each.

**Deliverable**
- Portfolio index, write-up, 90-day plan.

