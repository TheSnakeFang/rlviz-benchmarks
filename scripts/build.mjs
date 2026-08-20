import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog } from "./catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
const benchmarks = await loadCatalog(root);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, "public"), output, { recursive: true });
await writeFile(path.join(output, "catalog.json"), `${JSON.stringify({ schema_version: "rlviz.dev/benchmark-catalog-index/v1", generated_at: new Date().toISOString(), benchmarks }, null, 2)}\n`);
console.log(`Built ${benchmarks.length} immutable benchmark records.`);

