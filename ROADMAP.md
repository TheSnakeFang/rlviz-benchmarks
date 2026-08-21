# Roadmap

## Implemented

- Immutable benchmark source records with explicit license and quality states
- Mobile and desktop provenance catalog
- Digest-pinned handoff to the local-first RLViz reader
- Evidence-grounded claim and repair schema
- GitHub-native submission, review, stewardship, and deterministic contributor credit
- Revision-pinned Harbor submission records, optional public job links, and explicit availability states
- Benchmark detail pages for source provenance, runs, and evidence claims
- First licensed, manually reviewed Terminal-Bench reward-0/reward-1 pair with a reproducible importer and digest-pinned RLViz bundles
- First evidence-grounded proposed verifier claim, kept distinct from a confirmed defect decision
- Task and trajectory detail pages that preserve exact provenance and a direct RLViz handoff on mobile
- Documented Harbor job/trial link contract: source-provided live pointers remain distinct from durable bundle evidence
- Pinned SWE-rebench V2 trajectory availability review; the evaluated licensed corpus has zero exact task overlap and remains unpublished
- Second licensed, manually reviewed Terminal-Bench reward pair showing a concrete QEMU terminal-control outcome difference

## Scaling gates

Further benchmark imports remain ongoing curation, not an architecture gate.
Each entry must pin the task, environment, verifier, harness, model, agent, run,
bundle, and source revisions; unavailable runtime facts stay explicit.

1. Move immutable records to a database only when catalog volume or concurrent
   review makes repository-backed records inadequate.
2. Add account-backed claims and stewardship at that boundary. Prefer GitHub
   for maintainer identity; evaluate Google for recovery and broad access. Add
   X only if it serves a demonstrated community workflow rather than vanity
   identity.
3. Add private or expiring bundle storage only with explicit upload, deletion,
   access-control, and abuse-handling contracts.

Deployment, a custom domain, paid infrastructure, and authentication are
separate approval gates.
