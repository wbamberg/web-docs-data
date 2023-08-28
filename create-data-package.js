import fs from "node:fs";
import matter from "gray-matter";

import { resolveDirectory } from "./resolve-directory.js";
import { buildJSONForPage } from "./build-json-for-page.js";

const json = {
  css: {
    properties: {},
    selectors: {},
    types: {},
  },
};

export async function createDataPackage(root) {
  const allFiles = await resolveDirectory(root);

  for (const file of allFiles) {
    const raw = fs.readFileSync(file, "utf-8");
    const { data, content } = matter(raw);
    await buildJSONForPage(data, content, json);
  }
  return json;
}
