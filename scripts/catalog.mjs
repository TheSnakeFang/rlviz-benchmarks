import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const sha40 = /^[0-9a-f]{40}$/;
const sha64 = /^[0-9a-f]{64}$/;
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const allowedStates = new Set(["source-pinned", "audit-priority", "showcased", "deprecated"]);
const reviewStates = new Set(["not-reviewed", "audit-priority", "reviewed"]);

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

