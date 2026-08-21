import { actions, element, fact, factLink, loadIndex, rlvizURL, validSlug } from "./page-utils.js";

const status = document.querySelector("#detail-status");
const detail = document.querySelector("#detail");
const slug = new URLSearchParams(location.search).get("slug");

if (!validSlug(slug)) {
  status.textContent = "Choose a benchmark from the catalog.";
} else {
  loadDetail();
}

async function loadDetail() {
  try {
    const catalog = await loadIndex();
    const record = catalog.benchmarks?.find((candidate) => candidate.slug === slug);
    if (!record) throw new Error("Benchmark record not found");
    render(record, (catalog.claims ?? []).filter((claim) => claim.subject.benchmark_slug === slug));
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Could not load benchmark";
  }
}

function render(record, claims) {
  document.title = `${record.name} · RLViz Benchmarks`;
  document.querySelector("#detail-title").textContent = record.name;
  document.querySelector("#detail-summary").textContent = record.summary;
  const badge = document.querySelector("#detail-badge");
  badge.className = `badge ${record.catalog_state}`;
  badge.textContent = record.catalog_state.replaceAll("-", " ");
  document.querySelector("#detail-quality").textContent = record.quality.note;

  const facts = document.querySelector("#source-facts");
  fact(facts, "kind", record.upstream.kind);
  factLink(facts, "source", record.upstream.url, record.upstream.url);
  fact(facts, "revision", record.upstream.revision, "revision");
  fact(facts, "retrieved", record.upstream.retrieved_at);
  factLink(facts, "license", record.license.evidence_url, record.license.spdx ?? "unverified", record.license.redistribution);
  fact(facts, "redistribution", record.license.redistribution, record.license.redistribution);
  for (const reference of record.references ?? []) factLink(facts, reference.label, reference.url, reference.url);

  const runs = document.querySelector("#run-list");
  for (const trajectory of record.trajectories) runs.append(trajectoryItem(trajectory));
  for (const externalRun of record.external_runs ?? []) runs.append(externalRunItem(externalRun));
  if (!runs.children.length) runs.append(element("p", "empty-detail", "No runs are published for this revision."));

  const claimList = document.querySelector("#claim-list");
  for (const claim of claims) claimList.append(claimItem(claim));
  if (!claims.length) claimList.append(element("p", "empty-detail", "No claims recorded. This is not a quality review."));
  status.remove();
  detail.hidden = false;
}

function trajectoryItem(trajectory) {
  const item = element("article", "detail-item");
  const task = element("a", "", trajectory.task_id);
  task.href = `/task.html?${new URLSearchParams({ benchmark: slug, task: trajectory.task_id })}`;
  const heading = element("h3");
  heading.append(task);
  item.append(heading);
  item.append(element("p", "", `${trajectory.provenance.agent} · ${trajectory.provenance.model} · ${trajectory.provenance.harness}`));
  item.append(element("p", "revision", `bundle sha256 ${trajectory.sha256}`));
  const detailURL = `/trajectory.html?${new URLSearchParams({ benchmark: slug, id: trajectory.id })}`;
  item.append(actions([["Open in RLViz", rlvizURL(trajectory)], ["Trajectory details", detailURL], ["Download .rlviz", trajectory.bundle_url]]));
  return item;
}

function externalRunItem(run) {
  const item = element("article", "detail-item");
  item.append(element("h3", "", `${run.model.name} · ${run.agent.name}`));
  item.append(element("p", "", `${run.trials.toLocaleString()} trials · ${run.metrics.accuracy_percent}% ± ${run.metrics.accuracy_stderr_percent}% accuracy · ${run.metrics.total_tokens.toLocaleString()} tokens · $${run.metrics.total_cost_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}`));
  item.append(element("p", "revision", `Harbor job ${run.job_id} · ${run.availability.state.replaceAll("-", " ")} as of ${run.availability.checked_at}`));
  item.append(element("p", "", run.availability.reason));
  const links = [["pinned submission", run.source_record_url]];
  if (run.job_url) links.unshift(["inspect in Harbor Hub", run.job_url]);
  item.append(actions(links));
  return item;
}

function claimItem(claim) {
  const item = element("article", "detail-item");
  item.append(element("h3", "", `${claim.status.replaceAll("-", " ")} · ${claim.claim_type.replaceAll("-", " ")}`));
  item.append(element("p", "", claim.statement));
  item.append(element("p", "revision", `${claim.subject.task_id} · ${claim.subject.component} · ${claim.severity}`));
  item.append(actions(claim.evidence.map((evidence) => [evidence.kind, evidence.url])));
  return item;
}
