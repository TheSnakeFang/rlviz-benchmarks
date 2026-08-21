import { actions, fact, factLink, loadIndex, rlvizURL, validID, validSlug } from "./page-utils.js";

const params = new URLSearchParams(location.search);
const benchmarkSlug = params.get("benchmark");
const trajectoryID = params.get("id");
const status = document.querySelector("#detail-status");

if (!validSlug(benchmarkSlug) || !validID(trajectoryID)) status.textContent = "Choose a trajectory from an exact benchmark record.";
else loadTrajectory();

async function loadTrajectory() {
  try {
    const catalog = await loadIndex();
    const benchmark = catalog.benchmarks?.find((candidate) => candidate.slug === benchmarkSlug);
    if (!benchmark) throw new Error("Benchmark record not found");
    const trajectory = benchmark.trajectories.find((candidate) => candidate.id === trajectoryID);
    if (!trajectory) throw new Error("Trajectory record not found");
    render(benchmark, trajectory);
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Could not load trajectory";
  }
}

function render(benchmark, trajectory) {
  document.title = `${trajectory.task_id} · ${benchmark.name} · RLViz Benchmarks`;
  const taskURL = `/task.html?${new URLSearchParams({ benchmark: benchmark.slug, task: trajectory.task_id })}`;
  const back = document.querySelector("#task-back");
  back.href = taskURL;
  back.textContent = `← ${trajectory.task_id}`;
  const reward = trajectory.outcome?.reward ?? "unavailable in source";
  document.querySelector("#detail-title").textContent = trajectory.task_id;
  document.querySelector("#detail-summary").textContent = `${benchmark.name} · reward ${reward} · ${trajectory.provenance.agent} · ${trajectory.provenance.model}`;

  const evidence = document.querySelector("#evidence-facts");
  fact(evidence, "reward", reward);
  fact(evidence, "license", trajectory.license);
  fact(evidence, "reviewed", trajectory.reviewed ? "confirmed" : "not confirmed");
  fact(evidence, "redaction", trajectory.redaction_confirmed ? "confirmed" : "not confirmed");
  fact(evidence, "bundle sha256", trajectory.sha256, "revision");
  factLink(evidence, "benchmark", `/benchmark.html?${new URLSearchParams({ slug: benchmark.slug })}`, `${benchmark.name} · exact record`);
  document.querySelector("#trajectory-actions").replaceWith(actions([["Open in RLViz", rlvizURL(trajectory)], ["Download .rlviz", trajectory.bundle_url]]));

  const execution = document.querySelector("#execution-facts");
  for (const [label, value] of Object.entries(trajectory.provenance)) fact(execution, label, value, ["environment", "verifier", "run"].includes(label) ? "revision" : "");
  status.remove();
  document.querySelector("#detail").hidden = false;
}
