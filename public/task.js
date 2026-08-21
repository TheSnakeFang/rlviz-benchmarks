import { actions, element, fact, factLink, loadIndex, rlvizURL, validSlug, validTaskID } from "./page-utils.js";

const params = new URLSearchParams(location.search);
const benchmarkSlug = params.get("benchmark");
const taskID = params.get("task");
const status = document.querySelector("#detail-status");

if (!validSlug(benchmarkSlug) || !validTaskID(taskID)) status.textContent = "Choose a task from an exact benchmark record.";
else loadTask();

async function loadTask() {
  try {
    const catalog = await loadIndex();
    const benchmark = catalog.benchmarks?.find((candidate) => candidate.slug === benchmarkSlug);
    if (!benchmark) throw new Error("Benchmark record not found");
    const trajectories = benchmark.trajectories.filter((trajectory) => trajectory.task_id === taskID);
    if (!trajectories.length) throw new Error("Task has no published trajectories in this benchmark revision");
    render(benchmark, trajectories);
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Could not load task";
  }
}

function render(benchmark, trajectories) {
  document.title = `${taskID} · ${benchmark.name} · RLViz Benchmarks`;
  const benchmarkURL = `/benchmark.html?${new URLSearchParams({ slug: benchmark.slug })}`;
  const back = document.querySelector("#benchmark-back");
  back.href = benchmarkURL;
  back.textContent = `← ${benchmark.name}`;
  document.querySelector("#detail-eyebrow").textContent = `${benchmark.name} · ${benchmark.upstream.version}`;
  document.querySelector("#detail-title").textContent = taskID;
  document.querySelector("#detail-summary").textContent = `${trajectories.length} reviewed public ${trajectories.length === 1 ? "trajectory" : "trajectories"} at the cataloged benchmark revision.`;

  const facts = document.querySelector("#source-facts");
  factLink(facts, "benchmark", benchmarkURL, benchmark.name);
  factLink(facts, "upstream", benchmark.upstream.url, benchmark.upstream.url);
  fact(facts, "revision", benchmark.upstream.revision, "revision");
  fact(facts, "task", taskID, "revision");
  fact(facts, "benchmark review", benchmark.quality.review_state);

  const list = document.querySelector("#trajectory-list");
  for (const trajectory of trajectories) {
    const item = element("article", "detail-item");
    item.append(element("h3", "", trajectory.provenance.agent));
    item.append(element("p", "", trajectory.provenance.model));
    item.append(element("p", "", `source-reported reward ${trajectory.outcome?.reward ?? "unavailable in source"}`));
    item.append(element("p", "revision", `bundle sha256 ${trajectory.sha256}`));
    const detailURL = `/trajectory.html?${new URLSearchParams({ benchmark: benchmark.slug, id: trajectory.id })}`;
    item.append(actions([["trajectory details", detailURL], ["inspect in RLViz", rlvizURL(trajectory)]]));
    list.append(item);
  }
  status.remove();
  document.querySelector("#detail").hidden = false;
}
