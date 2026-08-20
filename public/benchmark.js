const status = document.querySelector("#detail-status");
const detail = document.querySelector("#detail");
const slug = new URLSearchParams(location.search).get("slug");

if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  status.textContent = "Choose a benchmark from the catalog.";
} else {
  loadDetail();
}

async function loadDetail() {
  try {
    const response = await fetch("/catalog.json", { credentials: "omit" });
    if (!response.ok) throw new Error(`Catalog returned HTTP ${response.status}`);
    const catalog = await response.json();
    const record = catalog.benchmarks?.find((candidate) => candidate.slug === slug);
    if (!record) throw new Error("Benchmark record not found");
    render(record, (catalog.claims ?? []).filter((claim) => claim.subject.benchmark_slug === slug));
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Could not load benchmark";
  }
}

function render(record, claims) {
  document.title = `${record.name} · RLViz Benchmarks`;
  document.querySelector("#detail-eyebrow").textContent = `exact revision · ${record.upstream.version}`;
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
  if (!runs.children.length) runs.append(element("p", "empty-detail", "No reviewed trajectories or external runs are cataloged for this revision."));

  const claimList = document.querySelector("#claim-list");
  for (const claim of claims) claimList.append(claimItem(claim));
  if (!claims.length) claimList.append(element("p", "empty-detail", "No evidence claims are recorded for this revision. Absence of a claim is not a quality endorsement."));
  status.remove();
  detail.hidden = false;
}

function trajectoryItem(trajectory) {
  const item = element("article", "detail-item");
  item.append(element("h3", "", trajectory.task_id));
  item.append(element("p", "", `${trajectory.provenance.agent} · ${trajectory.provenance.model} · ${trajectory.provenance.harness}`));
  item.append(element("p", "revision", `bundle sha256 ${trajectory.sha256}`));
  const href = `https://rlviz.dev/?${new URLSearchParams({ bundle: trajectory.bundle_url, sha256: trajectory.sha256 })}`;
  item.append(actions([["inspect trajectory", href], ["bundle source", trajectory.bundle_url]]));
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

function actions(links) {
  const container = element("div", "detail-actions");
  for (const [label, href] of links) { const link = element("a", "", label); link.href = href; link.rel = "noreferrer"; container.append(link); }
  return container;
}

function fact(list, label, value, className = "") { list.append(element("dt", "", label), element("dd", className, value)); }
function factLink(list, label, href, text, className = "") { const link = element("a", className, text); link.href = href; link.rel = "noreferrer"; const dd = element("dd"); dd.append(link); list.append(element("dt", "", label), dd); }
function element(tag, className = "", text = "") { const node = document.createElement(tag); if (className) node.className = className; if (text) node.textContent = text; return node; }
