import fs from "node:fs/promises";
import stringify from "fast-json-stable-stringify";
import { createDataPackage } from "./create-data-package.js";

const packagedir = new URL(".", import.meta.url);
const targetdir = new URL("./build/", packagedir);
const verbatimdir = new URL("./dist/", packagedir);

const verbatimFiles = ["LICENSE", "README.md"];

async function createManifest() {
  const parentManifest = JSON.parse(
    await fs.readFile(new URL("./package.json", packagedir), "utf-8")
  );

  const manifest = {
    main: "data.json",
    name: parentManifest["name"],
    version: parentManifest["version"],
  };

  return manifest;
}

async function writeManifest() {
  const dest = new URL("package.json", targetdir);
  const manifest = await createManifest();
  await fs.writeFile(dest, JSON.stringify(manifest));
}

async function writeData() {
  const dest = new URL("data.json", targetdir);
  const data = await createDataPackage(process.argv[2]);
  await fs.writeFile(dest, stringify(data));
}

async function copyVerbatimFiles() {
  for (const file of verbatimFiles) {
    const src = new URL(file, verbatimdir);
    const dest = new URL(file, targetdir);
    await fs.copyFile(src, dest);
  }
}

/**
 * Perform a build for publishing
 */
async function build() {
  // Remove existing files, if there are any
  try {
    await fs.rm(targetdir, {
      force: true,
      recursive: true,
    });
  } catch (e) {
    // Missing folder is not an issue since we wanted to delete it anyway
    if (e.code !== "ENOENT") {
      throw e;
    }
  }
  await fs.mkdir(targetdir);
  await writeManifest();
  await writeData();
  await copyVerbatimFiles();

  console.log("Data bundle is ready");
}

await build();
