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

## Next

1. Expand the licensed reviewed trajectory set beyond the first Terminal-Bench
   task pair. Each entry must pin the task, environment, verifier, harness, model,
   agent, run, bundle, and source revisions.
2. Evaluate stable Harbor Hub trial URLs as a task-level import boundary. Job
   links are supported; do not duplicate Harbor's runner, registry, or files.
3. Move immutable records to a database only when catalog volume or concurrent
   review makes repository-backed records inadequate.
4. Add account-backed claims and stewardship at that boundary. Prefer GitHub
   for maintainer identity; evaluate Google for recovery and broad access. Add
   X only if it serves a demonstrated community workflow rather than vanity
   identity.
5. Add private or expiring bundle storage only with explicit upload, deletion,
   access-control, and abuse-handling contracts.

Deployment, a custom domain, paid infrastructure, and authentication are
separate approval gates.
