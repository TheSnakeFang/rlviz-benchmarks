# Contributing

RLViz Benchmarks accepts evidence, not free-floating ratings. A benchmark name,
leaderboard screenshot, or failed run is not enough to label a task broken.

## Report a possible defect

Open the **Benchmark defect claim** issue form. Include the exact benchmark
revision, task ID, affected component, a falsifiable statement, and durable
evidence. Public RLViz bundles are preferred when their content license,
redaction review, and full SHA-256 are available. Never upload secrets or
private trajectories.

A report begins as `proposed`. A merged catalog claim still does not become
`confirmed` until a reviewer records a decision and rationale. Rejection means
the submitted evidence did not establish the statement; it is not a judgment
about the reporter.

## Repair a defect

A repair must reference a confirmed claim, an immutable upstream commit, and
validation that directly tests the claim. Repairs stay `resolved` only at the
benchmark revision containing the fix; older pinned releases retain the claim.

## Contributor credit

Credit is computed from merged records, never edited by hand:

- 1 point for a proposed claim that passes repository review
- 4 additional points when that claim is confirmed
- 5 points to the repair contributor when a confirmed claim is resolved with
  an immutable upstream fix and validation evidence

Rejected and superseded claims keep the base contribution point so honest
negative results are not erased. Points indicate reviewed catalog work, not
benchmark expertise or upstream maintainer status.

## Review boundaries

- Catalog reviewers are not automatically upstream benchmark maintainers.
- Upstream claims are linked, not silently rewritten here.
- A benchmark license must permit redistribution before tasks or trajectories
  are mirrored.
- Scores remain source-reported unless a fully pinned reproduction establishes
  otherwise.

