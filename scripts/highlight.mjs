import hljs from 'highlight.js';

const escape = text => String(text).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

export function addCodeHighlighting(renderer) {
  renderer.code = function({ text, lang }) {
    const language = (lang || '').trim().split(/\s+/)[0].toLowerCase();
    if (language === 'mermaid' || (!language && /^\s*(?:flowchart|graph)\s+(?:TD|TB|BT|LR|RL)\b/.test(text))) {
      return `<div class="diagram"><pre class="mermaid">${escape(text)}</pre></div>\n`;
    }
    let html, detected;
    if (language && hljs.getLanguage(language)) {
      html = hljs.highlight(text, { language, ignoreIllegals: true }).value;
      detected = language;
    } else if (!language) {
      const result = hljs.highlightAuto(text, ['c', 'cpp', 'javascript', 'typescript', 'python', 'bash', 'json', 'css', 'xml', 'sql', 'yaml']);
      html = result.value;
      detected = result.language;
    } else {
      // Unknown languages and explicit plaintext remain readable and escaped.
      html = escape(text);
    }
    return `<pre><code class="hljs${detected ? ' language-' + escape(detected) : ''}">${html}</code></pre>\n`;
  };
}
