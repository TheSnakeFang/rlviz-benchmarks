import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const source = Object.freeze({
  dataset: "yoonholee/terminalbench-trajectories",
  revision: "04e8940f5b6736a7ce8d22224fe2f2af74163ed2",
  row: 242,
  trial_id: "882393f2-4c26-43c1-8865-b45508c948db",
  task_name: "adaptive-rejection-sampler"
});

export function convertTerminalBenchRow(row, pin = source) {
  if (!row || row.trial_id !== pin.trial_id || row.task_name !== pin.task_name) throw new Error("source row does not match the pinned trial");
  const steps = typeof row.steps === "string" ? JSON.parse(row.steps) : row.steps;
  if (!Array.isArray(steps) || !steps.length) throw new Error("pinned trial has no trajectory steps");
  const runID = `hf-${pin.revision}`;
  const caseID = `case-${safeID(row.task_name)}`;
  const groupID = `group-${safeID(row.agent)}-${safeID(row.model)}`;
  const trajectoryID = `trial-${row.trial_id}`;
  const sourcePath = `huggingface/${pin.dataset}@${pin.revision}/row-${pin.row}`;
  const records = [
    { record_type: "run", id: runID, name: "Terminal-Bench 2.0 public trajectory sample", started_at: normalizeDate(row.started_at), metadata: { source_dataset: pin.dataset, source_revision: pin.revision, source_row: pin.row, source_license: "Apache-2.0" } },
    { record_type: "case", id: caseID, run_id: runID, name: row.task_name, metadata: { benchmark: "Terminal-Bench 2.0", benchmark_revision: "2fd12b88aafdd04a52c298e3940bcb189f9766d6" } },
    { record_type: "group", id: groupID, case_id: caseID, name: `${row.agent} · ${row.model}`, metadata: { source_reported: true } },
    { record_type: "trajectory", id: trajectoryID, group_id: groupID, status: "completed", termination: "evaluated", metadata: { agent: row.agent, agent_version: "unavailable in source", model: row.model, trial_name: row.trial_name, trial_id: row.trial_id, reward: row.reward, duration_seconds: row.duration_seconds } }
  ];
  let sequence = 0;
  let parentID;
  const addEvent = (kind, payload, raw, title) => {
    const id = `event-${String(sequence).padStart(4, "0")}`;
    const event = { record_type: "event", id, trajectory_id: trajectoryID, sequence, kind, ...payload, source: { path: sourcePath }, raw, metadata: { title, provenance: "adapter_derived", source_content: "source_native" } };
    if (parentID) event.parent_id = parentID;
    records.push(event); parentID = id; sequence += 1;
  };
  for (const [stepIndex, step] of steps.entries()) {
    if (!step || typeof step !== "object" || typeof step.src !== "string") throw new Error(`step ${stepIndex} is invalid`);
    if (step.src === "agent") addEvent("generation", { output: { role: "assistant", content: String(step.msg ?? "") } }, { src: step.src, msg: step.msg }, `Assistant step ${stepIndex + 1}`);
    else addEvent("message", { input: { role: step.src, content: String(step.msg ?? "") } }, { src: step.src, msg: step.msg }, `${step.src} message`);
    for (const tool of arrayValue(step.tools)) addEvent("tool", { input: { name: String(tool.fn ?? "tool"), arguments: tool.cmd === undefined ? tool : { command: tool.cmd } } }, tool, String(tool.fn ?? "Tool call"));
    for (const observation of arrayValue(step.obs)) addEvent("observation", { data: { content: typeof observation === "string" ? observation : observation } }, observation, "Tool observation");
  }
  const signal = (name, value, unit) => records.push({ record_type: "signal", id: `signal-${name}`, trajectory_id: trajectoryID, name, value, ...(unit ? { unit } : {}), metadata: { provenance: "source_native" } });
  signal("reward", Number(row.reward));
  signal("pass", Number(row.reward) === 1);
  for (const [field, name] of [["duration_seconds", "duration"], ["input_tokens", "input_tokens"], ["output_tokens", "output_tokens"], ["cache_tokens", "cached_input_tokens"], ["cost_cents", "cost"]]) if (Number.isFinite(row[field])) signal(name, Number(row[field]), field === "duration_seconds" ? "seconds" : field === "cost_cents" ? "cents_usd" : "tokens");
  records.push({ record_type: "complete", records: records.length, warnings: 0 });
  return `${records.map((record) => JSON.stringify(record)).join("\n")}\n`;
}

async function importPinnedRow(output) {
  const metadata = await fetchJSON(`https://huggingface.co/api/datasets/${source.dataset}`);
  if (metadata.sha !== source.revision) throw new Error(`dataset moved from pinned revision ${source.revision} to ${metadata.sha}`);
  const response = await fetchJSON(`https://datasets-server.huggingface.co/rows?dataset=${encodeURIComponent(source.dataset)}&config=default&split=train&offset=${source.row}&length=1`);
  const row = response.rows?.[0];
  if (row?.row_idx !== source.row) throw new Error("dataset server returned the wrong row");
  await writeFile(output, convertTerminalBenchRow(row.row), { flag: "wx" });
  process.stdout.write(`${output}\n`);
}

async function fetchJSON(url) {
  const response = await fetch(url, { headers: { accept: "application/json" }, redirect: "error" });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.json();
}

function arrayValue(value) { return value === null || value === undefined ? [] : Array.isArray(value) ? value : [value]; }
function safeID(value) { return String(value).toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-|-$/g, "").slice(0, 180); }
function normalizeDate(value) { return new Date(value).toISOString(); }

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = process.argv[2];
  if (!output) throw new Error("usage: node scripts/import-terminalbench-showcase.mjs OUTPUT.ndjson");
  await importPinnedRow(path.resolve(output));
}
