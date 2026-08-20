# RLViz Benchmarks

A provenance-first catalog of agent benchmark releases and public trajectories.
The catalog complements [RLViz](https://github.com/TheSnakeFang/rlviz): it
tracks immutable source revisions and hands reviewed public `.rlviz` bundles to
the local-first reader through an explicit, SHA-256-pinned link.

The catalog does not mirror whole task sets, claim that a benchmark is sound,
or publish a new aggregate ranking. It includes one deliberately small,
reviewed Terminal-Bench failure showcase; trajectories whose redistribution
rights or provenance have not been verified remain unpublished. Harbor-backed
runs remain external records: this catalog pins the source submission and
reports whether its Harbor Hub job is still publicly reachable without
republishing either one's contents.

## Develop

```bash
npm test
npm run build
python3 -m http.server 4175 -d dist
```

Catalog records live in `catalog/benchmarks`. Every record pins a primary
source revision and declares whether its license evidence permits
redistribution. `npm test` rejects mutable refs, incomplete provenance, unsafe
bundle URLs, and invalid digests.

`external_runs` is a separate boundary for source-hosted evidence. A Harbor run
must use an immutable source record at the same revision as its benchmark
entry. A live `job_url` is optional, but when present it must be a direct Harbor
Hub job URL and the availability state must be `public-job`. Availability is
date-stamped; missing or removed jobs stay visibly `source-record-only`.
Metrics are labeled source-reported;
external runs never count as published RLViz trajectories.

Defect claims live in `catalog/claims`. Claims bind one exact task and component
to the benchmark revision already in the catalog. Non-proposed claims require a
recorded review decision; resolved claims additionally require an immutable
upstream repair and validation evidence. Contributor credit is derived from
those merged records and cannot be edited directly. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Publication boundary

A trajectory can appear only when its record includes:

- an immutable benchmark revision and task identity
- agent, model, harness, environment, verifier, and run provenance, with
  unavailable facts explicitly absent rather than inferred
- a reviewed and redaction-confirmed `.rlviz` bundle
- the complete bundle SHA-256 and a public HTTPS URL without credentials,
  query parameters, redirects, or expiring tokens
- verified redistribution rights for both benchmark material and trajectory
  content

Authentication, claims, repairs, reputation, and maintainer tools are later
write surfaces. Reading the catalog and opening RLViz never requires an
account.

## Reproduce the first Terminal-Bench import

The showcase importer refuses to run if the public trajectory dataset has
moved from its cataloged Hugging Face revision. It then requests one exact row
and emits canonical RLViz NDJSON without filling missing source facts:

```bash
node scripts/import-terminalbench-showcase.mjs /tmp/terminalbench.ndjson
rlviz bundle create /tmp/terminalbench.ndjson --out reviewed.rlviz \
  --title "Terminal-Bench 2.0 · adaptive-rejection-sampler" \
  --license Apache-2.0 --reviewed --redaction-confirmed
```

The affirmative review flags belong only after inspecting the complete emitted
trace. The importer does not make those judgments.
