import { JSDOM } from "jsdom";

import { m2hSync } from "mdn-flavored-markdown";
import { render } from "mdn-kumascript";

import { getPropertySyntax } from "query-css-syntax";

const inScope = ["css-property", "css-shorthand-property"];

const MDN_ROOT = "https://developer.mozilla.org";

const escapeHTML = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// URLs from mdn/content may be written as relative URLs.
// Make them absolute.
function normalizeURL(url) {
  if (url.startsWith("/")) {
    return `${MDN_ROOT}${url}`;
  }
  return url;
}

function normalizeURLs(element) {
  const links = element.querySelectorAll("a");
  for (const link of links) {
    link.href = normalizeURL(link.href);
  }
  return element;
}

/*
 * This function takes a DOM tree and returns a map in which the keys
 * are the names of H2 headings in the input, and the values are `<div>`
 * elements containing all the nodes between that H2 and the next one.
 *
 * Special case is for content that appears before the first H2, which
 * gets stuffed in a section called "Preamble".
 */
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

export async function buildJSONForPage(data, content, json) {
  const item = {};
  if (!inScope.includes(data["page-type"])) {
    return;
  }
  try {
    // data directly from front matter
    item["mdn-url"] = `${MDN_ROOT}/en-US/docs/${data["slug"]}`;
    item["browser-compatibility"] = data["browser-compat"];
    item["status"] = data["status"] || [];

    // data from content
    const htmlKS = m2hSync(content, { locale: "en-US" });
    const rendered = await render(htmlKS, { frontMatter: data });
    const dom = new JSDOM(rendered.markup);
    const sections = splitBySection(dom);

    // summary
    const preambleSection = sections["Preamble"];
    const preambleChildren = preambleSection.children;
    for (const child of preambleChildren) {
      if (child.tagName === "P") {
        item["summary"] = normalizeURLs(child).innerHTML;
        break;
      }
    }

    // interactive example
    if (rendered.frontMatter["interactive-example"]) {
      item["interactive-example"] = rendered.frontMatter["interactive-example"];
    }

    // syntax example
    const syntaxSection = sections["Syntax"];
    if (syntaxSection) {
      const syntaxExample = syntaxSection.querySelector("pre");
      if (syntaxExample) {
        item["syntax-example"] = escapeHTML(syntaxExample.textContent);
      }
    }

    // constituent properties
    const constituentSection = sections["Constituent properties"];
    if (constituentSection) {
      item["constituent-properties"] = [];
      const constituents = constituentSection.querySelectorAll("li");
      for (const constituent of constituents) {
        const link = constituent.querySelector("a");
        if (link) {
          item["constituent-properties"].push({
            target: normalizeURL(link.getAttribute("href")),
            text: escapeHTML(link.textContent),
          });
        }
      }
    }

    // see also
    const seeAlsoSection = sections["See also"];
    if (seeAlsoSection) {
      item["see-also"] = [];
      const seeAlsoItems = seeAlsoSection.querySelectorAll("li");
      for (const seeAlsoItem of seeAlsoItems) {
        const link = seeAlsoItem.querySelector("a");
        if (link) {
          item["see-also"].push({
            target: normalizeURL(link.getAttribute("href")),
            text: escapeHTML(link.textContent),
          });
        }
      }
    }

    // formal syntax
    try {
      // we ask not to expand `<color>` and `<gradient>`, because
      // the expansions are huge and the rendered output is too much
      // for users.
      // It would be better to suppress this in the rendering step, but
      // it's really hard for an application to figure out which syntax
      // elements belong to these two types. It's much easier to ask the
      // querier to just omit them for everyone.
      const typesToSkip = ["<color>", "<gradient>"];
      const syntax = getPropertySyntax(data["title"], typesToSkip);
      item["formal-syntax"] = syntax;
    } catch (e) {
      // non-standard items just don't get formal syntax
      if (e.message !== `Could not find ${data["title"]} in specifications`) {
        throw e;
      }
    }

    json["css"]["properties"][data["title"]] = item;
  } catch (e) {
    console.error(e);
  }
}
