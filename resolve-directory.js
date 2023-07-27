import fsp from "node:fs/promises";
import fdir_pkg from "fdir";

const { fdir, PathsOutput } = fdir_pkg;

export async function resolveDirectory(file) {
	const stats = await fsp.lstat(file);
	if (stats.isDirectory()) {
		const api = new fdir()
			.withErrors()
			.withFullPaths()
			.filter((filePath) => filePath.endsWith("index.md"))
			.crawl(file);
		return api.withPromise();
	} else if (stats.isFile() && file.endsWith("index.md")) {
		return [file];
	} else {
		return [];
	}
}
