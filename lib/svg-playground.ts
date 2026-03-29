/**
 * Server-side processing for SVG playground code blocks.
 * Transforms ```html svg-playground code blocks into
 * editable code + live SVG preview containers.
 */

function decodeEntities(text: string): string {
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  text = text.replace(/&#(\d+);/g, (_, dec) =>
    String.fromCharCode(parseInt(dec, 10))
  );
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function processSvgPlayground(html: string): string {
  const regex =
    /<pre><code\s+([^>]*)>([\s\S]*?)<\/code><\/pre>/g;

  return html.replace(regex, (match, attrs, content) => {
    if (!attrs.includes("svg-playground")) {
      return match;
    }

    const classMatch = attrs.match(/class="([^"]*)"/);
    const classes = classMatch ? classMatch[1] : "";

    // Extract raw code (strip hljs spans, decode entities)
    const rawCode = decodeEntities(content.replace(/<[^>]*>/g, ""));

    return `<div class="svg-playground-container" data-svg-playground>
  <div class="svg-playground-toolbar">
    <span class="svg-playground-label">SVG Playground</span>
    <button class="svg-playground-reset" data-playground-reset type="button">Reset</button>
  </div>
  <div class="svg-playground-body">
    <div class="svg-playground-editor">
      <div class="svg-playground-highlight" data-playground-highlight aria-hidden="true">${content}</div>
      <textarea class="svg-playground-textarea" data-playground-editor spellcheck="false">${escapeHtml(rawCode)}</textarea>
    </div>
    <div class="svg-playground-preview" data-playground-preview>
      ${rawCode}
    </div>
  </div>
  <template data-playground-original>${escapeHtml(rawCode)}</template>
</div>`;
  });
}
