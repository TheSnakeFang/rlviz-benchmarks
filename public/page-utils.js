export async function loadIndex() {
  const response = await fetch("/catalog.json", { credentials: "omit" });
  if (!response.ok) throw new Error(`Catalog returned HTTP ${response.status}`);
  const catalog = await response.json();
  if (catalog.schema_version !== "rlviz.dev/benchmark-catalog-index/v1" || !Array.isArray(catalog.benchmarks)) throw new Error("Catalog response is invalid");
  return catalog;
}

export function element(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function actions(links) {
  const container = element("div", "detail-actions");
  for (const [label, href] of links) {
    const link = element("a", "", label);
    link.href = href;
    link.rel = "noreferrer";
    container.append(link);
  }
  return container;
}

export function fact(list, label, value, className = "") {
  list.append(element("dt", "", label), element("dd", className, String(value)));
}

export function factLink(list, label, href, text, className = "") {
  const link = element("a", className, text);
  link.href = href;
  link.rel = "noreferrer";
  const value = element("dd");
  value.append(link);
  list.append(element("dt", "", label), value);
}

export function rlvizURL(trajectory) {
  return `https://rlviz.dev/?${new URLSearchParams({ bundle: trajectory.bundle_url, sha256: trajectory.sha256 })}`;
}

export function validSlug(value) {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function validID(value) {
  return typeof value === "string" && /^[a-zA-Z0-9._-]+$/.test(value);
}

export function validTaskID(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 300 && !/[\u0000-\u001f\u007f]/.test(value);
}
