# Roadmap

## Implemented

- Immutable benchmark source records with explicit license and quality states
- Mobile and desktop provenance catalog
- Digest-pinned handoff to the local-first RLViz reader
- Evidence-grounded claim and repair schema
- GitHub-native submission, review, stewardship, and deterministic contributor credit
- Revision-pinned Harbor submission records, optional public job links, and explicit availability states
- Benchmark detail pages for source provenance, runs, and evidence claims

## Next

1. Publish a small licensed set of reviewed trajectories for the four initial
   benchmarks. Each entry must pin the task, environment, verifier, harness,
   model, agent, run, bundle, and source revisions.
2. Add task and trajectory detail pages once the first publishable trajectory
   passes the publication boundary.
3. Evaluate stable Harbor Hub trial URLs as a task-level import boundary. Job
   links are supported; do not duplicate Harbor's runner, registry, or files.
4. Move immutable records to a database only when catalog volume or concurrent
   review makes repository-backed records inadequate.
5. Add account-backed claims and stewardship at that boundary. Prefer GitHub
   for maintainer identity; evaluate Google for recovery and broad access. Add
   X only if it serves a demonstrated community workflow rather than vanity
   identity.
6. Add private or expiring bundle storage only with explicit upload, deletion,
   access-control, and abuse-handling contracts.

Deployment, a custom domain, paid infrastructure, and authentication are
separate approval gates.
