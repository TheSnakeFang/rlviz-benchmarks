# Roadmap

## Implemented

- Immutable benchmark source records with explicit license and quality states
- Mobile and desktop provenance catalog
- Digest-pinned handoff to the local-first RLViz reader
- Evidence-grounded claim and repair schema
- GitHub-native submission, review, stewardship, and deterministic contributor credit

## Next

1. Publish a small licensed set of reviewed trajectories for the four initial
   benchmarks. Each entry must pin the task, environment, verifier, harness,
   model, agent, run, bundle, and source revisions.
2. Add task and trajectory detail pages without introducing a novel aggregate
   leaderboard.
3. Evaluate stable Harbor Hub job and trial URLs as reciprocal source links and
   an import boundary. Do not duplicate Harbor's runner or registry.
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
