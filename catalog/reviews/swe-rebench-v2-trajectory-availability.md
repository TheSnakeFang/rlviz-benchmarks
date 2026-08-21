# SWE-rebench V2 trajectory availability

Reviewed on 2026-08-20 against these immutable revisions:

- benchmark: `nebius/SWE-rebench-V2@475dd5e8703bb5fb22dd3c60b5d038b019eba1e0`
- candidate trajectories: `nebius/SWE-rebench-openhands-trajectories@35455389ab51bf5e2306bfd436ef72d0f98bf882`

The candidate trajectory dataset declares CC-BY-4.0 and includes OpenHands
trajectories, patches, and source-reported outcomes. Its 67,074 rows have zero
`instance_id` overlap with the 32,079 tasks in the pinned SWE-rebench V2
dataset. The comparison joined the two pinned Parquet files directly on
`instance_id` and returned `0`.

This prevents an exact task, environment, and verifier lineage claim. For
example, the candidate row `PlasmaFAIR__sdf-xarray-24` is not present in the
pinned V2 benchmark. RLViz therefore does not publish that row as SWE-rebench
V2 evidence, even though the trajectory dataset itself declares a permissive
license.

This is a publication provenance gap, not a defect claim against SWE-rebench
V2 and not a judgment about the trajectory dataset. A future showcase must
match an exact task revision and preserve its environment, verifier, harness,
agent, model, run, source, and bundle revisions.

Sources:

- [Pinned benchmark data](https://huggingface.co/datasets/nebius/SWE-rebench-V2/blob/475dd5e8703bb5fb22dd3c60b5d038b019eba1e0/data/train-00000-of-00001.parquet)
- [Pinned trajectory data](https://huggingface.co/datasets/nebius/SWE-rebench-openhands-trajectories/blob/35455389ab51bf5e2306bfd436ef72d0f98bf882/trajectories.parquet)
- [Pinned trajectory license](https://huggingface.co/datasets/nebius/SWE-rebench-openhands-trajectories/blob/35455389ab51bf5e2306bfd436ef72d0f98bf882/LICENSE)
