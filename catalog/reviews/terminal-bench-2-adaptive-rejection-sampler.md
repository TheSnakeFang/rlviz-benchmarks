# Publication review: adaptive-rejection-sampler

- Reviewed: 2026-08-20
- Benchmark: Terminal-Bench 2.0 at `2fd12b88aafdd04a52c298e3940bcb189f9766d6`
- Trajectory dataset: `yoonholee/terminalbench-trajectories` at `04e8940f5b6736a7ce8d22224fe2f2af74163ed2`
- Source row: 242
- Trial: `882393f2-4c26-43c1-8865-b45508c948db`
- Task: `adaptive-rejection-sampler`
- Result: reward 0

The complete 13-step source trajectory and its canonical 45-record conversion
were inspected. The trace contains the public task prompt, agent generations,
bash commands, Ubuntu package-manager output, verifier-facing completion flow,
and source-reported usage signals. It contains no account credentials, API
tokens, private keys, email addresses, user home paths, private hostnames, or
path-backed artifacts. The only network hosts in the trace are public Ubuntu
package repositories.

Both the benchmark source and the trajectory dataset declare Apache-2.0. The
bundle preserves the reward-0 outcome and explicitly records that the source
does not report the mini-swe-agent version. Publication is evidence that this
specific trajectory is inspectable, not an endorsement of the task, verifier,
agent, or benchmark score.

Validation receipts:

- canonical source SHA-256: `274ab52f9029173c8a220f41ed9435343520f788dfe462afe642a35c7605f54a`
- bundle SHA-256: `3fc8dc4ab29664c629777fcdbb46de42c8eee4944ec4d1d1790417aab1eacaa1`
- RLViz recognized 45 canonical records with no warnings
- RLViz recognized the resulting portable bundle with no warnings
- bundle contains zero path-backed artifacts
