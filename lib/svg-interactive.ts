/**
 * Server-side processing for interactive SVG code blocks.
 * Transforms ```html svg-interactive code blocks into
 * side-by-side code + SVG preview with hover highlighting support.
 */

function decodeEntities(text: string): string {
  // Hex entities (&#x3C; → <, &#x3E; → >, etc.)
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  // Decimal entities (&#60; → <, etc.)
  text = text.replace(/&#(\d+);/g, (_, dec) =>
    String.fromCharCode(parseInt(dec, 10))
  );
  // Named entities
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Split rehype-highlight output into self-contained line fragments.
 * Properly closes/reopens hljs spans at line boundaries.
 */
function splitHighlightedHtml(html: string): string[] {
  const lines: string[] = [];
  let currentLine = "";
  const openTags: string[] = [];

  let i = 0;
  while (i < html.length) {
    if (html[i] === "\n") {
      for (let j = openTags.length - 1; j >= 0; j--) {
        currentLine += "</span>";
      }
      lines.push(currentLine);
      currentLine = openTags.join("");
      i++;
    } else if (html.startsWith("</span>", i)) {
      openTags.pop();
      currentLine += "</span>";
      i += 7;
    } else if (html.startsWith("<span", i)) {
      const closeIdx = html.indexOf(">", i);
      if (closeIdx === -1) {
        currentLine += html[i];
        i++;
        continue;
      }
      const tag = html.substring(i, closeIdx + 1);
      openTags.push(tag);
      currentLine += tag;
      i = closeIdx + 1;
    } else {
      currentLine += html[i];
      i++;
    }
  }

  if (currentLine) {
    for (let j = openTags.length - 1; j >= 0; j--) {
      currentLine += "</span>";
    }
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Map each SVG source line to an element ID.
 * <g> groups and their children share the same ID.
 */
function mapLinesToElements(lines: string[]): Map<number, string> {
  const mapping = new Map<number, string>();
  let elementId = 0;
  let groupId: string | null = null;
  let groupDepth = 0;
  let currentId: string | null = null;
  let inComment = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!trimmed) continue;

    // Multi-line comments
    if (!inComment && trimmed.includes("<!--")) {
      inComment = true;
      if (trimmed.includes("-->")) inComment = false;
      continue;
    }
    if (inComment) {
      if (trimmed.includes("-->")) inComment = false;
      continue;
    }

    // Skip <svg> root
    if (trimmed.startsWith("<svg") || trimmed.startsWith("</svg")) continue;

    // <g> group opening
    if (trimmed.startsWith("<g")) {
      if (groupDepth === 0) {
        groupId = `el-${elementId}`;
        elementId++;
      }
      groupDepth++;
      mapping.set(i, groupId!);
      continue;
    }

    // </g> group closing
    if (trimmed === "</g>" || trimmed.startsWith("</g>")) {
      if (groupId) mapping.set(i, groupId);
      groupDepth--;
      if (groupDepth === 0) groupId = null;
      continue;
    }

    // Inside a group — share group ID
    if (groupDepth > 0 && groupId) {
      mapping.set(i, groupId);
      continue;
    }

    // Standalone element opening tag
    if (trimmed.match(/^<[a-zA-Z]/)) {
      currentId = `el-${elementId}`;
      mapping.set(i, currentId);

      if (trimmed.includes("/>") || trimmed.match(/<\/[a-zA-Z]+>\s*$/)) {
        elementId++;
        currentId = null;
      }
    } else if (currentId) {
      // Continuation of multi-line element
      mapping.set(i, currentId);
      if (
        trimmed.includes("/>") ||
        trimmed.match(/<\/[a-zA-Z]+>\s*$/) ||
        trimmed === ">"
      ) {
        elementId++;
        currentId = null;
      }
    }
  }

  return mapping;
}

/**
 * Add data-element-id attributes to SVG elements for the preview panel.
 */
function addElementIdsToSvg(
  svgText: string,
  lineMapping: Map<number, string>
): string {
  const lines = svgText.split("\n");
  const result: string[] = [];
  const addedIds = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const elementId = lineMapping.get(i);

    if (elementId && !addedIds.has(elementId)) {
      const trimmed = line.trim();
      if (trimmed.match(/^<[a-zA-Z]/) && !trimmed.startsWith("</")) {
        line = line.replace(
          /(<[a-zA-Z][a-zA-Z0-9]*)/,
          `$1 data-element-id="${elementId}"`
        );
        addedIds.add(elementId);
      }
    }

    result.push(line);
  }

  return result.join("\n");
}

/**
 * Main entry point. Finds svg-interactive code blocks and transforms them
 * into interactive containers with code + SVG preview.
 */
export function processSvgInteractive(html: string): string {
  const regex =
    /<pre><code\s+([^>]*)>([\s\S]*?)<\/code><\/pre>/g;

  return html.replace(regex, (match, attrs, content) => {
    if (!attrs.includes("svg-interactive")) {
      return match;
    }

    const classMatch = attrs.match(/class="([^"]*)"/);
    const classes = classMatch ? classMatch[1] : "";

    // 1. Extract raw SVG text (strip hljs spans, decode entities)
    const rawText = decodeEntities(content.replace(/<[^>]*>/g, ""));
    const rawLines = rawText.split("\n");

    // 2. Map lines to SVG elements
    const lineMapping = mapLinesToElements(rawLines);

    // 3. Split highlighted code into per-line fragments
    const highlightedLines = splitHighlightedHtml(content);

    // 4. Wrap each line with data attributes
    const wrappedLines = highlightedLines.map((lineHtml, i) => {
      const elementId = lineMapping.get(i);
      const elementAttr = elementId
        ? ` data-element-id="${elementId}"`
        : "";
      return `<span class="code-line" data-line="${i}"${elementAttr}>${lineHtml}</span>`;
    });

    // 5. Create SVG preview with element IDs
    const previewSvg = addElementIdsToSvg(rawText, lineMapping);

    // 6. Build interactive container
    return `<div class="svg-interactive-container" data-svg-interactive>
  <div class="svg-interactive-code">
    <pre><code class="${classes}">${wrappedLines.join("\n")}</code></pre>
  </div>
  <div class="svg-interactive-preview">
    ${previewSvg}
  </div>
</div>`;
  });
}
