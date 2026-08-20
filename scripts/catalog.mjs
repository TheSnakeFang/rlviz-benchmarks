import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const sha40 = /^[0-9a-f]{40}$/;
const sha64 = /^[0-9a-f]{64}$/;
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const allowedStates = new Set(["source-pinned", "audit-priority", "showcased", "deprecated"]);
const reviewStates = new Set(["not-reviewed", "audit-priority", "reviewed"]);
const claimTypes = new Set(["broken", "ambiguous", "unsolvable", "optional-field-mismatch", "nondeterministic", "leakage", "reward-hack", "provenance-gap", "license-gap", "other"]);
const claimStatuses = new Set(["proposed", "confirmed", "rejected", "resolved", "superseded"]);
const claimComponents = new Set(["prompt", "environment", "verifier", "seed", "metadata", "solvability", "licensing", "trajectory"]);
const evidenceKinds = new Set(["trajectory", "source", "reproduction", "upstream", "discussion"]);

function publicHTTPS(raw, label, { bundle = false } = {}) {
  let url;
  try { url = new URL(raw); } catch { throw new Error(`${label} must be an absolute URL`); }
  if (url.protocol !== "https:" || url.username || url.password) throw new Error(`${label} must be credential-free HTTPS`);
  if (bundle && (url.search || url.hash || !url.pathname.endsWith(".rlviz"))) throw new Error(`${label} must be a queryless, fragment-free .rlviz URL`);
}

function exactKeys(value, keys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  const unexpected = Object.keys(value).filter((key) => !keys.includes(key));
  if (unexpected.length) throw new Error(`${label} has unknown field ${unexpected[0]}`);
}

export function validateBenchmark(record) {
  exactKeys(record, ["schema_version", "slug", "name", "catalog_state", "summary", "upstream", "license", "quality", "references", "trajectories"], "record");
  if (record.schema_version !== "rlviz.dev/benchmark-catalog/v1") throw new Error("unsupported schema_version");
  if (!slug.test(record.slug)) throw new Error("slug is invalid");
  if (!record.name || !record.summary) throw new Error(`${record.slug} requires name and summary`);
  if (!allowedStates.has(record.catalog_state)) throw new Error(`${record.slug} has invalid catalog_state`);

  exactKeys(record.upstream, ["kind", "url", "revision", "version", "retrieved_at"], `${record.slug}.upstream`);
  if (!new Set(["github", "huggingface", "harbor"]).has(record.upstream.kind)) throw new Error(`${record.slug} has invalid upstream kind`);
  publicHTTPS(record.upstream.url, `${record.slug} upstream URL`);
  if (!sha40.test(record.upstream.revision)) throw new Error(`${record.slug} must pin a 40-character upstream revision`);
  if (!record.upstream.version || !/^\d{4}-\d{2}-\d{2}$/.test(record.upstream.retrieved_at)) throw new Error(`${record.slug} has incomplete upstream provenance`);

  exactKeys(record.license, ["status", "spdx", "redistribution", "evidence_url"], `${record.slug}.license`);
  if (!new Set(["verified", "unverified"]).has(record.license.status)) throw new Error(`${record.slug} has invalid license status`);
  if (!new Set(["allowed", "blocked"]).has(record.license.redistribution)) throw new Error(`${record.slug} has invalid redistribution state`);
  if (record.license.status === "verified" && !record.license.spdx) throw new Error(`${record.slug} verified license requires SPDX`);
  if (record.license.status === "unverified" && record.license.redistribution !== "blocked") throw new Error(`${record.slug} cannot redistribute under an unverified license`);
  publicHTTPS(record.license.evidence_url, `${record.slug} license evidence`);

  exactKeys(record.quality, ["review_state", "note"], `${record.slug}.quality`);
  if (!reviewStates.has(record.quality.review_state) || !record.quality.note) throw new Error(`${record.slug} has incomplete quality status`);
  for (const reference of record.references ?? []) {
    exactKeys(reference, ["label", "url"], `${record.slug}.reference`);
    if (!reference.label) throw new Error(`${record.slug} reference needs a label`);
    publicHTTPS(reference.url, `${record.slug} reference URL`);
  }

  if (!Array.isArray(record.trajectories)) throw new Error(`${record.slug}.trajectories must be an array`);
  if (record.trajectories.length && record.license.redistribution !== "allowed") throw new Error(`${record.slug} cannot publish trajectories while benchmark redistribution is blocked`);
  const ids = new Set();
  for (const trajectory of record.trajectories) {
    exactKeys(trajectory, ["id", "task_id", "bundle_url", "sha256", "license", "reviewed", "redaction_confirmed", "provenance"], `${record.slug}.trajectory`);
    if (!/^[a-zA-Z0-9._-]+$/.test(trajectory.id) || ids.has(trajectory.id)) throw new Error(`${record.slug} has an invalid or duplicate trajectory id`);
    ids.add(trajectory.id);
    if (!trajectory.task_id || !trajectory.license || trajectory.reviewed !== true || trajectory.redaction_confirmed !== true) throw new Error(`${record.slug}/${trajectory.id} lacks publication confirmations`);
    publicHTTPS(trajectory.bundle_url, `${record.slug}/${trajectory.id} bundle URL`, { bundle: true });
    if (!sha64.test(trajectory.sha256)) throw new Error(`${record.slug}/${trajectory.id} must pin a full bundle SHA-256`);
    exactKeys(trajectory.provenance, ["agent", "model", "harness", "environment", "verifier", "run"], `${record.slug}/${trajectory.id}.provenance`);
    for (const field of ["agent", "model", "harness", "environment", "verifier", "run"]) if (!trajectory.provenance[field]) throw new Error(`${record.slug}/${trajectory.id} lacks ${field} provenance`);
  }
  return record;
}

export async function loadCatalog(root) {
  const directory = path.join(root, "catalog", "benchmarks");
  const files = (await readdir(directory)).filter((name) => name.endsWith(".json")).sort();
  const records = [];
  for (const file of files) records.push(validateBenchmark(JSON.parse(await readFile(path.join(directory, file), "utf8"))));
  const slugs = records.map((record) => record.slug);
  if (new Set(slugs).size !== slugs.length) throw new Error("benchmark slugs must be unique");
  return records;
}

export function validateClaim(claim, benchmarks) {
  exactKeys(claim, ["schema_version", "id", "subject", "claim_type", "statement", "severity", "status", "evidence", "reporter", "created_at", "review", "repair"], "claim");
  if (claim.schema_version !== "rlviz.dev/benchmark-claim/v1" || !/^claim-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(claim.id)) throw new Error("claim has invalid identity");
  exactKeys(claim.subject, ["benchmark_slug", "benchmark_revision", "task_id", "component"], `${claim.id}.subject`);
  const benchmark = benchmarks.find((record) => record.slug === claim.subject.benchmark_slug);
  if (!benchmark) throw new Error(`${claim.id} references an unknown benchmark`);
  if (benchmark.upstream.revision !== claim.subject.benchmark_revision) throw new Error(`${claim.id} does not match the cataloged benchmark revision`);
  if (!claim.subject.task_id || !claimComponents.has(claim.subject.component)) throw new Error(`${claim.id} has an incomplete subject`);
  if (!claimTypes.has(claim.claim_type) || !claimStatuses.has(claim.status)) throw new Error(`${claim.id} has an invalid type or status`);
  if (!new Set(["low", "medium", "high", "critical"]).has(claim.severity) || typeof claim.statement !== "string" || claim.statement.length < 20) throw new Error(`${claim.id} has an incomplete statement`);
  if (!Array.isArray(claim.evidence) || !claim.evidence.length) throw new Error(`${claim.id} requires evidence`);
  for (const evidence of claim.evidence) {
    exactKeys(evidence, ["kind", "url", "sha256", "note"], `${claim.id}.evidence`);
    if (!evidenceKinds.has(evidence.kind)) throw new Error(`${claim.id} has an invalid evidence kind`);
    publicHTTPS(evidence.url, `${claim.id} evidence URL`);
    if (evidence.sha256 !== undefined && !sha64.test(evidence.sha256)) throw new Error(`${claim.id} evidence digest is invalid`);
    if (["trajectory", "reproduction"].includes(evidence.kind) && !sha64.test(evidence.sha256 ?? "")) throw new Error(`${claim.id} ${evidence.kind} evidence requires a SHA-256`);
  }
  exactKeys(claim.reporter, ["github"], `${claim.id}.reporter`);
  if (!githubHandle(claim.reporter.github) || !validDateTime(claim.created_at)) throw new Error(`${claim.id} has invalid reporter provenance`);
  if (claim.status === "proposed" && claim.review !== undefined) throw new Error(`${claim.id} cannot have a review while proposed`);
  if (claim.status !== "proposed") {
    if (claim.review === undefined) throw new Error(`${claim.id} requires review provenance`);
    exactKeys(claim.review, ["decision", "reviewers", "decided_at", "rationale"], `${claim.id}.review`);
    if (claim.review.decision !== claim.status || !Array.isArray(claim.review.reviewers) || !claim.review.reviewers.length || !claim.review.reviewers.every(githubHandle) || !validDateTime(claim.review.decided_at) || typeof claim.review.rationale !== "string" || claim.review.rationale.length < 20) throw new Error(`${claim.id} has invalid review provenance`);
  }
  if (claim.status === "resolved" && claim.repair === undefined) throw new Error(`${claim.id} resolved claims require a repair`);
  if (claim.status !== "resolved" && claim.repair !== undefined) throw new Error(`${claim.id} can attach a repair only when resolved`);
  if (claim.repair !== undefined) {
    exactKeys(claim.repair, ["contributor", "upstream_url", "revision", "validation"], `${claim.id}.repair`);
    exactKeys(claim.repair.contributor, ["github"], `${claim.id}.repair.contributor`);
    if (!githubHandle(claim.repair.contributor.github) || !sha40.test(claim.repair.revision) || !Array.isArray(claim.repair.validation) || !claim.repair.validation.length) throw new Error(`${claim.id} has incomplete repair provenance`);
    publicHTTPS(claim.repair.upstream_url, `${claim.id} repair URL`);
    for (const validation of claim.repair.validation) {
      exactKeys(validation, ["kind", "url", "sha256", "note"], `${claim.id}.repair.validation`);
      if (!new Set(["reproduction", "source"]).has(validation.kind) || !sha64.test(validation.sha256 ?? "")) throw new Error(`${claim.id} repair validation requires a source or reproduction digest`);
      publicHTTPS(validation.url, `${claim.id} repair validation URL`);
    }
  }
  return claim;
}

export async function loadClaims(root, benchmarks) {
  const directory = path.join(root, "catalog", "claims");
  const files = (await readdir(directory)).filter((name) => name.endsWith(".json")).sort();
  const claims = [];
  for (const file of files) claims.push(validateClaim(JSON.parse(await readFile(path.join(directory, file), "utf8")), benchmarks));
  const ids = claims.map((claim) => claim.id);
  if (new Set(ids).size !== ids.length) throw new Error("claim IDs must be unique");
  return claims;
}

export function contributorReputation(claims) {
  const contributors = new Map();
  const add = (github, points, contribution) => {
    const current = contributors.get(github) ?? { github, points: 0, contributions: 0, confirmed_claims: 0, repairs: 0 };
    current.points += points; current.contributions += contribution === "claim" ? 1 : 0;
    current.confirmed_claims += contribution === "confirmed" ? 1 : 0;
    current.repairs += contribution === "repair" ? 1 : 0;
    contributors.set(github, current);
  };
  for (const claim of claims) {
    add(claim.reporter.github, 1, "claim");
    if (["confirmed", "resolved"].includes(claim.status)) add(claim.reporter.github, 4, "confirmed");
    if (claim.status === "resolved" && claim.repair) add(claim.repair.contributor.github, 5, "repair");
  }
  return [...contributors.values()].sort((left, right) => right.points - left.points || left.github.localeCompare(right.github));
}

function githubHandle(value) {
  return typeof value === "string" && /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(value);
}

function validDateTime(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value) && !Number.isNaN(Date.parse(value));
}
