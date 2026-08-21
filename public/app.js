import { element, fact, factLink, loadIndex } from "./page-utils.js";

const list = document.querySelector("#benchmark-list");
const status = document.querySelector("#catalog-status");
const filter = document.querySelector("#filter");
let benchmarks = [];

try {
  const catalog = await loadIndex();
  benchmarks = catalog.benchmarks;
  renderClaims(catalog.claims ?? [], catalog.contributors ?? []);
  render();
} catch (error) {
  status.textContent = error instanceof Error ? error.message : "Could not load catalog";
}

function renderClaims(claims, contributors) {
  document.querySelector("#claim-count").textContent = String(claims.length);
  document.querySelector("#resolved-count").textContent = String(claims.filter((claim) => claim.status === "resolved").length);
  document.querySelector("#contributor-count").textContent = String(contributors.length);
}

filter.addEventListener("input", render);

function render() {
  const query = filter.value.trim().toLowerCase();
  const visible = benchmarks
    .filter((record) => JSON.stringify([record.name, record.slug, record.catalog_state, record.upstream.revision]).toLowerCase().includes(query))
    .sort((left, right) => Number(Boolean(right.trajectories.length)) - Number(Boolean(left.trajectories.length)) || left.name.localeCompare(right.name));
  const trajectories = visible.reduce((sum, record) => sum + record.trajectories.length, 0);
  const externalRuns = visible.reduce((sum, record) => sum + (record.external_runs?.length ?? 0), 0);
  status.textContent = `${visible.length} of ${benchmarks.length} pinned benchmark records · ${trajectories} published ${trajectories === 1 ? "trajectory" : "trajectories"} · ${externalRuns} external ${externalRuns === 1 ? "run" : "runs"}`;
  list.replaceChildren(...visible.map(benchmarkCard));
}

function benchmarkCard(record) {
  const article = element("article", "benchmark");
  const identity = element("div");
  const heading = element("h3");
  const detailLink = element("a", "benchmark-link", record.name); detailLink.href = `/benchmark.html?slug=${encodeURIComponent(record.slug)}`;
  heading.append(detailLink);
  identity.append(heading, element("span", `badge ${record.catalog_state}`, record.catalog_state.replaceAll("-", " ")));
  const narrative = element("div");
  narrative.append(element("p", "benchmark-summary", record.summary), element("p", "quality-note", record.quality.note));
  const details = element("dl", "facts");
  fact(details, "version", record.upstream.version);
  fact(details, "revision", record.upstream.revision.slice(0, 12), "revision");
  factLink(details, "source", record.upstream.url, "upstream");
  factLink(details, "license", record.license.evidence_url, record.license.spdx ?? "unverified", record.license.redistribution);
  fact(details, "content", record.license.redistribution === "allowed" ? "redistribution allowed" : "redistribution blocked", record.license.redistribution);
  for (const trajectory of record.trajectories) {
    const dt = element("dt", "", "run"); const dd = element("dd");
    const choice = element("span", "trajectory-choice");
    const detailURL = `/trajectory.html?${new URLSearchParams({ benchmark: record.slug, id: trajectory.id })}`;
    const link = element("a", "trajectory-link", `${trajectory.task_id} · reward ${trajectory.outcome?.reward ?? "?"}`); link.href = detailURL;
    const meta = element("span", "trajectory-meta", `${trajectory.provenance.agent.split(";")[0]} · review provenance, then open in RLViz`);
    choice.append(link, meta); dd.append(choice); details.append(dt, dd);
  }
  for (const externalRun of record.external_runs ?? []) {
    const dt = element("dt", "", "run"); const dd = element("dd", "external-run");
    const link = element("a", "trajectory-link", externalRun.job_url ? "inspect in Harbor Hub" : "view pinned submission"); link.href = externalRun.job_url ?? externalRun.source_record_url; link.rel = "noreferrer";
    const provenance = element("span", "run-provenance", `${externalRun.model.name} · ${externalRun.agent.name} ${externalRun.agent.version} · ${externalRun.trials.toLocaleString()} trials · job ${externalRun.job_id.slice(0, 8)}`);
    const metrics = element("span", "run-metrics", `${externalRun.metrics.accuracy_percent}% ± ${externalRun.metrics.accuracy_stderr_percent}% accuracy · ${externalRun.metrics.total_tokens.toLocaleString()} tokens · $${externalRun.metrics.total_cost_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
    const boundary = element("span", "run-boundary", `source-reported · ${externalRun.availability.state.replaceAll("-", " ")}`);
    dd.append(link, provenance, metrics, boundary); details.append(dt, dd);
  }
  if (!record.trajectories.length && !(record.external_runs?.length)) fact(details, "runs", "none published", "trajectory-empty");
  article.append(identity, narrative, details);
  return article;
}
