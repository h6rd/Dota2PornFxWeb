import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import * as esbuild from "esbuild";
import { minify as minifyHtml } from "html-minifier-terser";

const DIST_DIR = process.argv[2] || "dist";
const CONCURRENCY = Math.max(2, os.cpus().length);

const SKIP_PATTERNS = [
  (file) => file.includes("assets/m3e"),
  (file) => file.endsWith("assets/lz-string.min.js"),
  (file) => file.endsWith("assets/zip.min.js"),
];

const HTML_MINIFIER_OPTIONS = {
  collapseWhitespace: true,
  removeComments: true,
  minifyCSS: true,
  minifyJS: true,
};

async function collectFiles(dir) {
  const results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectFiles(full)));
    } else if (/\.(js|css|html)$/.test(entry.name)) {
      results.push(full);
    }
  }

  return results;
}

async function minifyFile(file) {
  const posixPath = file.split(path.sep).join("/");

  if (SKIP_PATTERNS.some((matches) => matches(posixPath))) {
    console.log(`skip: ${file}`);
    return;
  }

  console.log(`Minification: ${file}`);
  const source = await fs.readFile(file, "utf8");

  if (file.endsWith(".html")) {
    const result = await minifyHtml(source, HTML_MINIFIER_OPTIONS);
    await fs.writeFile(file, result);
    return;
  }

  const loader = file.endsWith(".css") ? "css" : "js";
  const { code } = await esbuild.transform(source, { minify: true, loader });
  await fs.writeFile(file, code);
}

async function runWithConcurrency(items, worker, limit) {
  const results = [];
  let index = 0;

  async function next() {
    while (index < items.length) {
      const i = index++;
      try {
        await worker(items[i]);
        results[i] = { status: "fulfilled" };
      } catch (err) {
        results[i] = { status: "rejected", reason: err, item: items[i] };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, next));
  return results;
}

async function main() {
  const files = await collectFiles(DIST_DIR);
  console.log(`Found ${files.length} candidate file(s) under ${DIST_DIR}/`);

  const results = await runWithConcurrency(files, minifyFile, CONCURRENCY);
  const failures = results.filter((r) => r.status === "rejected");

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`::error::Failed to minify ${failure.item}: ${failure.reason?.message || failure.reason}`);
    }
    console.error(`::error::${failures.length} file(s) failed to minify`);
    process.exitCode = 1;
    return;
  }

  console.log("Minification complete.");
}

main().catch((err) => {
  console.error("::error::Unexpected error in minify-dist.mjs:", err);
  process.exitCode = 1;
});
