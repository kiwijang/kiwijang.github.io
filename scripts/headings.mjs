export function addHeadingAnchors(renderer) {
  const headings = [];
  const used = new Set();
  renderer.heading = function({ depth, tokens }) {
    const inline = this.parser.parseInline(tokens);
    const label = inline.replace(/<[^>]*>/g, '');
    const slugText = label.replace(/&(?:amp|lt|gt|quot|#39);/g, ' ')
      .normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
    const base = 'section-' + (slugText || 'heading');
    let id = base, suffix = 2;
    while (used.has(id)) id = base + '-' + suffix++;
    used.add(id);
    headings.push({ id, depth, label });
    return `<h${depth} id="${id}" tabindex="-1">${inline}<a class="heading-anchor" href="#${encodeURIComponent(id)}" aria-label="Link to this section">#</a></h${depth}>\n`;
  };
  return () => {
    if (!headings.length) return '';
    const minimum = Math.min(...headings.map(h => h.depth));
    return `<aside class="article-toc"><details open><summary>文章目錄</summary><nav aria-label="文章目錄"><ol>${headings.map(h => `<li style="--toc-depth:${h.depth-minimum}"><a data-toc-link href="#${encodeURIComponent(h.id)}">${h.label}</a></li>`).join('')}</ol></nav></details></aside>`;
  };
}
