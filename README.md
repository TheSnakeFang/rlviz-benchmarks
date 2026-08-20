# RLViz Benchmarks

A provenance-first catalog of agent benchmark releases and public trajectories.
The catalog complements [RLViz](https://github.com/TheSnakeFang/rlviz): it
tracks immutable source revisions and hands reviewed public `.rlviz` bundles to
the local-first reader through an explicit, SHA-256-pinned link.

The current catalog is intentionally metadata-only. It does not mirror tasks,
claim that a benchmark is sound, publish a new aggregate ranking, or copy
trajectories whose redistribution rights have not been verified.

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

