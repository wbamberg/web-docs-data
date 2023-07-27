import { JSDOM } from "jsdom";

import { m2hSync } from "mdn-markdown";
import { render } from "mdn-kumascript";

const inScope = ["css-property", "css-shorthand-property"];

const MDN_ROOT = "https://developer.mozilla.org/en-US/docs/";

export async function processFile(data, content, json) {
	const item = {};
	if (!inScope.includes(data["page-type"])) {
		return;
	}
	try {
		// data directly from front matter
		item["mdn-page"] = `${MDN_ROOT}${data["slug"]}`;
		item["browser-compatibility"] = data["browser-compat"];

		// data from content
		const htmlKS = m2hSync(content, { locale: "en-US" });
		const rendered = await render(htmlKS, { frontMatter: data });
		const dom = new JSDOM(rendered[0]);
		const sections = splitBySection(dom);

		item["interactive-example"] = data["interactive-example"];

		const preambleSection = sections["Preamble"];
		const summaryNode = preambleSection.querySelector("p");
		if (summaryNode) {
			item["summary"] = summaryNode.innerHTML;
		}

		const syntaxSection = sections["Syntax"];
		if (syntaxSection) {
			const syntaxExample = syntaxSection.querySelector("pre");
			if (syntaxExample) {
				item["syntax-example"] = syntaxExample.textContent;
			}
		}

		const accessibilitySection = sections["Accessibility concerns"];
		if (accessibilitySection) {
		}

		const constituentSection = sections["Constituent properties"];
		if (constituentSection) {
			item["constituent-properties"] = [];
			const constituents = constituentSection.querySelectorAll("li");
			for (const constituent of constituents) {
				item["constituent-properties"].push(constituent.textContent);
			}
		}
		json["css"]["properties"][data["title"]] = item;
	} catch (e) {
		console.error(e);
	}
}

function splitBySection(dom) {
	const headings = Array.from(dom.window.document.querySelectorAll("h2"));

	// make a fake H2 for the preamble
	const preamble = dom.window.document.createElement("H2");
	preamble.textContent = "Preamble";
	headings.unshift(preamble);

	const sections = {};
	let node = dom.window.document.body.firstChild;

	for (const heading of headings) {
		let sectionContents = dom.window.document.createElement("div");
		while (node && node.tagName !== "H2") {
			if (node.tagName) {
				sectionContents.appendChild(node.cloneNode(true));
			}
			node = node.nextSibling;
		}
		if (node) {
			node = node.nextSibling;
		}
		sections[heading.textContent] = sectionContents;
	}
	return sections;
}
