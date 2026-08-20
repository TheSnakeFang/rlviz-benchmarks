import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { contributorReputation, loadCatalog, loadClaims, validateBenchmark, validateClaim } from "../scripts/catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("all catalog records have immutable, publication-safe provenance", async () => {
  const records = await loadCatalog(root);
  assert.deepEqual(records.map((record) => record.slug), ["harbor-index-1-4", "swe-bench-verified", "swe-rebench-v2", "terminal-bench-2"]);
  assert.equal(records.flatMap((record) => record.trajectories).length, 0);
  assert.equal(records.filter((record) => record.license.redistribution === "blocked").length, 2);
  assert.deepEqual(await loadClaims(root, records), []);
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
    trajectories: []
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
