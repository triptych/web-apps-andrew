import { bus } from '../events/bus.js';
import { parseMarkdown } from '../markdown.js';

/**
 * HTML source view with syntax-highlighted output and copy button.
 * Listens to `markdown:change` on the event bus.
 */
export class AppSource extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: flex; flex-direction: column; height: 100%; }
        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: .5rem 1rem;
          background: var(--color-surface, #fff);
          border-bottom: 1px solid var(--color-border, #dee2e6);
          flex-shrink: 0;
        }
        .toolbar-label {
          font-size: .75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: .05em;
          color: var(--color-text-muted, #6c757d);
        }
        .toolbar-actions { display: flex; gap: .4rem; }
        button {
          padding: .3rem .7rem;
          border: 1px solid var(--color-border, #dee2e6);
          border-radius: var(--radius, 6px);
          background: var(--color-accent, #4f46e5);
          color: #fff;
          font-size: .8rem;
          font-weight: 500;
          cursor: pointer;
          transition: background var(--transition, 150ms ease);
        }
        button:hover { background: var(--color-accent-hover, #4338ca); }
        .source-area {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem;
          background: var(--color-bg, #f8f9fa);
        }
        pre {
          margin: 0;
          font-family: var(--font-mono, monospace);
          font-size: .85rem;
          line-height: 1.65;
          white-space: pre-wrap;
          word-break: break-all;
          color: var(--color-text, #212529);
        }
        .hl-tag    { color: #0550ae; }
        .hl-attr   { color: #0a3069; }
        .hl-value  { color: #0a3069; }
        .hl-string { color: #0a3069; }
        .hl-text   { color: var(--color-text, #212529); }
        :host-context([data-theme="dark"]) .hl-tag    { color: #79c0ff; }
        :host-context([data-theme="dark"]) .hl-attr   { color: #ffa657; }
        :host-context([data-theme="dark"]) .hl-value  { color: #a5d6ff; }
        :host-context([data-theme="dark"]) .hl-text   { color: #e6edf3; }
        .char-count {
          font-size: .75rem;
          color: var(--color-text-muted, #6c757d);
          padding: .4rem 1rem;
          background: var(--color-surface, #fff);
          border-top: 1px solid var(--color-border, #dee2e6);
          flex-shrink: 0;
        }
      </style>
      <div class="toolbar">
        <span class="toolbar-label">HTML Source</span>
        <div class="toolbar-actions">
          <button id="copy-btn">Copy HTML</button>
        </div>
      </div>
      <div class="source-area">
        <pre id="source"></pre>
      </div>
      <div class="char-count" id="char-count">0 characters</div>
    `;

    this._source = this.shadowRoot.getElementById('source');
    this._charCount = this.shadowRoot.getElementById('char-count');
    this._html = '';

    this._unsub = bus.on('markdown:change', ({ detail }) => {
      this._html = parseMarkdown(detail.value);
      this._source.innerHTML = this._highlight(this._formatHtml(this._html));
      const len = this._html.length;
      this._charCount.textContent = `${len.toLocaleString()} character${len !== 1 ? 's' : ''}`;
    });

    bus.emit('markdown:request');

    this.shadowRoot.getElementById('copy-btn').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(this._html);
        bus.emit('modal:request-open', { id: 'copy-modal' });
        setTimeout(() => bus.emit('modal:request-close', { id: 'copy-modal' }), 1800);
      } catch {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = this._html;
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
    });
  }

  disconnectedCallback() {
    this._unsub?.();
  }

  /** Tokenise formatted HTML and wrap tokens in color spans */
  _highlight(code) {
    // Regex that captures: full tags (with attrs) | text between tags
    const re = /(<\/?[a-zA-Z][^>]*\/?>|<!--[\s\S]*?-->|<!DOCTYPE[^>]*>)|([^<]+)/g;
    let out = '';
    let m;
    while ((m = re.exec(code)) !== null) {
      if (m[1]) {
        // It's a tag / comment / doctype — further tokenise internals
        const raw = m[1];
        if (raw.startsWith('<!--')) {
          out += `<span class="hl-text" style="opacity:.55">${_esc(raw)}</span>`;
        } else {
          // Split into: '<', '/', tagName, attributes, '>'
          const inner = raw.replace(/^<\/?|\/?>$/g, '');
          const tagMatch = inner.match(/^([a-zA-Z][^\s/]*)(\s[\s\S]*)?$/);
          if (tagMatch) {
            const isClose = raw.startsWith('</');
            const slash = isClose ? '/' : '';
            const tagName = tagMatch[1];
            const rest = tagMatch[2] || '';
            const attrsHl = rest.replace(
              /(\s+)([\w:-]+)(=)("([^"]*)")/g,
              (_, sp, name, eq, quot, val) =>
                `${_esc(sp)}<span class="hl-attr">${_esc(name)}</span>` +
                `<span class="hl-text">${eq}</span>` +
                `<span class="hl-value">"${_esc(val)}"</span>`
            ).replace(
              /(\s+)([\w:-]+)/g,
              (_, sp, name) => `${_esc(sp)}<span class="hl-attr">${_esc(name)}</span>`
            );
            const trailSlash = raw.endsWith('/>') ? '/' : '';
            out += `<span class="hl-text">&lt;${slash}</span>` +
                   `<span class="hl-tag">${_esc(tagName)}</span>` +
                   attrsHl +
                   `<span class="hl-text">${trailSlash}&gt;</span>`;
          } else {
            out += `<span class="hl-text">${_esc(raw)}</span>`;
          }
        }
      } else if (m[2]) {
        out += `<span class="hl-text">${_esc(m[2])}</span>`;
      }
    }
    return out;

    function _esc(s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
  }

  /** Basic HTML pretty-printer for readability */
  _formatHtml(html) {
    let indent = 0;
    const INDENT = '  ';
    return html
      .replace(/></g, '>\n<')
      .split('\n')
      .map(line => {
        line = line.trim();
        if (!line) return '';
        if (line.match(/^<\/[^>]+>/)) indent = Math.max(0, indent - 1);
        const out = INDENT.repeat(indent) + line;
        if (line.match(/^<[^/!][^>]*[^/]>$/) && !line.match(/<\/.*>$/)) indent++;
        return out;
      })
      .filter(Boolean)
      .join('\n');
  }
}

customElements.define('app-source', AppSource);
