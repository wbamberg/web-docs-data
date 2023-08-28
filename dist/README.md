# web-docs-data

Structured web documentation.

This package contains structured web documentation.

## Usage

```js
import webDocs from "web-docs-data-test" assert { type: "json" };
console.log(webDocs["css"]["properties"]["margin"]["summary"]);
```

```
The <strong><code>margin</code></strong> <a href="/en-US/docs/Web/CSS">CSS</a> shorthand property sets the <a href="/en-US/docs/Web/CSS/CSS_box_model/Introduction_to_the_CSS_box_model#margin_area">margin area</a> on all four sides of an element
```

## Details

This package exports a single JSON object that contains web documentation in a structured format, suitable for embedding content in developer tools.

Currently it contains only CSS properties, accessible under the `"properties"` key of the `"css"` object:

```
{
  "css": {
    "properties": {
      ...
      "margin": {}
      ...
    }
  }
}
```

Each property object may contain:

- `"mdn-page"`: a string containing the URL of the MDN page for the property
- `"browser-compatibility"`: a string containing the BCD query for the property
- `"status"`: an array of strings, each representing a status flag. The strings can be any of the following:
  - `"experimental"`
  - `"deprecated"`
  - `"non-standard"`
- `"summary"`: a string containing the one- or two-sentence summary for the property, in HTML.
- `"interactive-example"`: a string containing the URL of an interactive example for the property
- `"syntax-example"`: a string containing a series of examples demonstrating the property's syntax
- `"constituent-properties"`: present only if this is a shorthand property. An array of objects, one for each property for which this property is a shorthand. Each object has two properties:
  - `"text"`: the name of the property
  - `"target"`: link to the property's page
- `"see-also"`: an array of objects, each representing a link to a related page. Each object has two properties:
  - `"text"`: the link text
  - `"target"`: the URL of the linked page
- `"formal-syntax"`: syntax for the property and all the types that participate in its definition. An object with the following properties:
  - `propertySyntax`: a string containing the syntax for the property
  - `constituents`: an object with one item for each type that participates in the definition of the property's syntax. Each item's key is the name of the type, and the item's value is a string containing the syntax for that type.

All these properties should be treated as optional. (though it would be nice to make better guarantees than this).

(it would be nice to add `spec-url` but that requires a dependency on BCD. but we should do it anyway)
