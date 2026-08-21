# Publication review: qemu-startup pair

Reviewed on 2026-08-20.

- Benchmark revision: `2fd12b88aafdd04a52c298e3940bcb189f9766d6`
- Trajectory dataset revision: `04e8940f5b6736a7ce8d22224fe2f2af74163ed2`
- Failure: row 40384, trial `5ae92adc-ef10-409e-babd-d15abe9a59ab`
- Rewarded: row 40385, trial `0f174334-04c3-4881-8ca5-fb8a79a70b19`
- Agent and model: `terminus-2`, `openai/gpt-oss-120b@together_ai`

The complete source trajectories and their canonical conversions were
inspected. The reward-0 trial starts QEMU with `-nographic`; its terminal output
shows the background process stopped before submission. The source-reward-1
trial uses `-display none`, observes the port accepting connections, restarts
the process once, and leaves the final process running. These are useful paired
examples of a small terminal-control choice changing the evaluated outcome.

The pinned verifier opens the telnet console, logs in as root, runs `uname -r`,
and requires Alpine kernel `6.6.4-1-lts`. The environment source, task
instruction, verifier, and reference solution were inspected at the benchmark
revision. The task configuration names Docker image
`alexgshaw/qemu-startup:20251031`, but the public trajectory does not provide
the executed image digest. That missing runtime fact is preserved rather than
inferred.

Both benchmark and trajectory sources declare Apache-2.0. No credentials,
private paths, or user data were found. The source-reported rewards are
outcomes, not an independent reproduction or a benchmark-quality judgment.

Sources:

- [Task instruction](https://github.com/harbor-framework/terminal-bench-2/blob/2fd12b88aafdd04a52c298e3940bcb189f9766d6/qemu-startup/instruction.md)
- [Environment](https://github.com/harbor-framework/terminal-bench-2/blob/2fd12b88aafdd04a52c298e3940bcb189f9766d6/qemu-startup/environment/Dockerfile)
- [Verifier](https://github.com/harbor-framework/terminal-bench-2/blob/2fd12b88aafdd04a52c298e3940bcb189f9766d6/qemu-startup/tests/test_outputs.py)
- [Task configuration](https://github.com/harbor-framework/terminal-bench-2/blob/2fd12b88aafdd04a52c298e3940bcb189f9766d6/qemu-startup/task.toml)
- [Pinned trajectory dataset](https://huggingface.co/datasets/yoonholee/terminalbench-trajectories/tree/04e8940f5b6736a7ce8d22224fe2f2af74163ed2)
