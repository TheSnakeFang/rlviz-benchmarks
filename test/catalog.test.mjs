import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { contributorReputation, loadCatalog, loadClaims, validateBenchmark, validateClaim } from "../scripts/catalog.mjs";
import { convertTerminalBenchRow, source as terminalBenchSource, sources as terminalBenchSources } from "../scripts/import-terminalbench-showcase.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("all catalog records have immutable, publication-safe provenance", async () => {
  const records = await loadCatalog(root);
  assert.deepEqual(records.map((record) => record.slug), ["harbor-index-1-4", "swe-bench-verified", "swe-rebench-v2", "terminal-bench-2"]);
  assert.equal(records.flatMap((record) => record.trajectories).length, 4);
  assert.equal(records.flatMap((record) => record.external_runs).length, 1);
  assert.equal(records.find((record) => record.slug === "harbor-index-1-4").external_runs[0].availability.state, "source-record-only");
  assert.equal(records.filter((record) => record.license.redistribution === "blocked").length, 2);
  const claims = await loadClaims(root, records);
  assert.equal(claims.length, 1);
  assert.equal(claims[0].claim_type, "reward-hack");
  const evidence = claims[0].evidence.find((item) => item.kind === "trajectory");
  const trajectory = records.find((record) => record.slug === claims[0].subject.benchmark_slug).trajectories.find((item) => item.task_id === claims[0].subject.task_id && item.bundle_url === evidence.url);
  assert.equal(evidence.sha256, trajectory.sha256);
});

test("published bundle bytes match every catalog digest", async () => {
  const records = await loadCatalog(root);
  for (const trajectory of records.flatMap((record) => record.trajectories)) {
    const bundle = await readFile(path.join(root, "public", "bundles", path.basename(new URL(trajectory.bundle_url).pathname)));
    assert.equal(bundle.subarray(0, 2).toString(), "PK");
    assert.equal(createHash("sha256").update(bundle).digest("hex"), trajectory.sha256);
    assert.ok(bundle.length < 32 * 1024 * 1024);
  }
});

test("claims bind to an exact catalog revision and require review decisions", async () => {
  const benchmarks = await loadCatalog(root);
  const proposed = claimFixture(benchmarks[0]);
  assert.equal(validateClaim(proposed, benchmarks).status, "proposed");
  assert.throws(() => validateClaim({ ...proposed, subject: { ...proposed.subject, benchmark_revision: "f".repeat(40) } }, benchmarks), /does not match/);
  assert.throws(() => validateClaim({ ...proposed, status: "confirmed" }, benchmarks), /review provenance/);
  assert.throws(() => validateClaim({ ...proposed, repair: repairFixture() }, benchmarks), /only when resolved/);
});

test("resolved claims produce deterministic contributor credit", async () => {
  const benchmarks = await loadCatalog(root);
  const resolved = {
    ...claimFixture(benchmarks[0]),
    status: "resolved",
    review: { decision: "resolved", reviewers: ["reviewer"], decided_at: "2026-08-20T12:00:00Z", rationale: "The reproduction establishes the defect and the pinned repair fixes it." },
    repair: repairFixture()
  };
  validateClaim(resolved, benchmarks);
  assert.deepEqual(contributorReputation([resolved]), [
    { github: "repairer", points: 5, contributions: 0, confirmed_claims: 0, repairs: 1 },
    { github: "reporter", points: 5, contributions: 1, confirmed_claims: 1, repairs: 0 }
  ]);
});

test("unverified benchmark content cannot publish a trajectory", () => {
  const record = fixture();
  record.license = { status: "unverified", redistribution: "blocked", evidence_url: "https://example.com/license" };
  record.trajectories = [trajectory()];
  assert.throws(() => validateBenchmark(record), /cannot publish trajectories/);
});

test("trajectory handoffs require queryless HTTPS and a complete digest", () => {
  const record = fixture();
  record.trajectories = [{ ...trajectory(), bundle_url: "https://bundles.example/run.rlviz?token=secret" }];
  assert.throws(() => validateBenchmark(record), /queryless/);
  record.trajectories = [{ ...trajectory(), sha256: "abc" }];
  assert.throws(() => validateBenchmark(record), /full bundle SHA-256/);
  record.trajectories = [{ ...trajectory(), outcome: { reward: Number.NaN } }];
  assert.throws(() => validateBenchmark(record), /finite source-reported reward/);
  const withoutOutcome = trajectory();
  delete withoutOutcome.outcome;
  record.trajectories = [withoutOutcome];
  assert.doesNotThrow(() => validateBenchmark(record));
});

test("external Harbor runs stay pinned, direct, and separate from trajectories", () => {
  const record = fixture();
  record.external_runs = [externalRun(record.upstream.revision)];
  assert.equal(validateBenchmark(record).external_runs[0].provider, "harbor");
  record.external_runs[0].job_url = "https://hub.harborframework.com/jobs/5fab3f7b-0e44-4924-bbed-026e8387ef84?download=1";
  record.external_runs[0].availability.state = "public-job";
  assert.throws(() => validateBenchmark(record), /direct, queryless Harbor Hub job URL/);
  record.external_runs = [externalRun("f".repeat(40))];
  assert.throws(() => validateBenchmark(record), /cataloged revision/);
});

test("v1 records without external runs remain valid", () => {
  const record = fixture();
  delete record.external_runs;
  assert.equal(validateBenchmark(record).slug, "fixture");
});

test("Terminal-Bench showcase conversion preserves exact source facts", () => {
  const row = {
    task_name: terminalBenchSource.task_name, trial_id: terminalBenchSource.trial_id, trial_name: "adaptive-rejection-sampler__fixture",
    agent: "mini-swe-agent", model: "model@provider", reward: 0, duration_seconds: 2, input_tokens: 10, output_tokens: 3, cache_tokens: 0, cost_cents: 0.5,
    started_at: "2025-11-03T14:21:38Z",
    steps: JSON.stringify([
      { src: "user", msg: "Solve the task", tools: null, obs: null },
      { src: "agent", msg: "Inspect first", tools: [{ fn: "bash_command", cmd: "ls" }], obs: "file.txt" }
    ])
  };
  const records = convertTerminalBenchRow(row).trim().split("\n").map(JSON.parse);
  assert.equal(records[0].metadata.source_revision, terminalBenchSource.revision);
  assert.equal(records.find((record) => record.record_type === "trajectory").metadata.agent_version, "unavailable in source");
  assert.deepEqual(records.filter((record) => record.record_type === "event").map((record) => record.kind), ["message", "generation", "tool", "observation"]);
  assert.equal(records.find((record) => record.name === "pass").value, false);
  assert.equal(records.at(-1).records, records.length - 1);
  assert.equal(terminalBenchSources.rewarded.row, 244);
  assert.notEqual(terminalBenchSources.rewarded.trial_id, terminalBenchSource.trial_id);
  const rewarded = convertTerminalBenchRow({ ...row, trial_id: terminalBenchSources.rewarded.trial_id, reward: 1 }, terminalBenchSources.rewarded).trim().split("\n").map(JSON.parse);
  assert.equal(rewarded.find((record) => record.name === "pass").value, true);
  assert.equal(terminalBenchSources.qemuFailure.row, 40384);
  assert.equal(terminalBenchSources.qemuRewarded.task_name, "qemu-startup");
  assert.throws(() => convertTerminalBenchRow({ ...row, task_name: "qemu-startup" }, terminalBenchSources.qemuRewarded), /pinned trial/);
});

function fixture() {
  return {
    schema_version: "rlviz.dev/benchmark-catalog/v1",
    slug: "fixture",
    name: "Fixture",
    catalog_state: "showcased",
    summary: "Fixture record.",
    upstream: { kind: "github", url: "https://example.com/source", revision: "a".repeat(40), version: "v1", retrieved_at: "2026-08-20" },
    license: { status: "verified", spdx: "MIT", redistribution: "allowed", evidence_url: "https://example.com/license" },
    quality: { review_state: "reviewed", note: "Reviewed fixture." },
    external_runs: [],
    trajectories: []
  };
}

function externalRun(revision) {
  return {
    id: "external-run-1",
    provider: "harbor",
    job_id: "5fab3f7b-0e44-4924-bbed-026e8387ef84",
    job_url: "https://hub.harborframework.com/jobs/5fab3f7b-0e44-4924-bbed-026e8387ef84",
    source_record_url: `https://example.com/source/blob/${revision}/submission.json`,
    source_record_revision: revision,
    date: "2026-08-20",
    agent: { name: "agent", version: "1.0.0" },
    model: { name: "model", reasoning_effort: "high" },
    trials: 10,
    metrics: { accuracy_percent: 50, accuracy_stderr_percent: 2, total_tokens: 1000, total_cost_usd: 1.25 },
    availability: { state: "public-job", checked_at: "2026-08-20", reason: "The source host controls access and redistribution rights." }
  };
}

function trajectory() {
  return {
    id: "run-1",
    task_id: "task-1",
    bundle_url: "https://bundles.example/run.rlviz",
    sha256: "b".repeat(64),
    license: "CC-BY-4.0",
    reviewed: true,
    redaction_confirmed: true,
    outcome: { reward: 0 },
    provenance: { agent: "agent@1", model: "model@1", harness: "harness@1", environment: "env@sha256:a", verifier: "verifier@sha256:b", run: "run@sha256:c" }
  };
}

function claimFixture(benchmark) {
  return {
    schema_version: "rlviz.dev/benchmark-claim/v1",
    id: "claim-fixture",
    subject: { benchmark_slug: benchmark.slug, benchmark_revision: benchmark.upstream.revision, task_id: "task-1", component: "verifier" },
    claim_type: "broken",
    statement: "The verifier rejects the documented success state under the pinned environment.",
    severity: "high",
    status: "proposed",
    evidence: [{ kind: "reproduction", url: "https://example.com/reproduction", sha256: "c".repeat(64) }],
    reporter: { github: "reporter" },
    created_at: "2026-08-20T10:00:00Z"
  };
}

function repairFixture() {
  return {
    contributor: { github: "repairer" },
    upstream_url: "https://example.com/upstream/commit/fix",
    revision: "d".repeat(40),
    validation: [{ kind: "reproduction", url: "https://example.com/repair-validation", sha256: "e".repeat(64), note: "The pinned reproduction passes and its negative control still fails." }]
  };
}
