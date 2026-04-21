import { bus } from '../events/bus.js';

const GITHUB_API = 'https://api.github.com/repos/triptych/triptych/contents/';
const RAW_BASE = 'https://raw.githubusercontent.com/triptych/triptych/master/';
const FILE_PATTERN = /^jrpg-news-(\d{4}-\d{2}-\d{2})\.md$/;

const TEMPLATE = `
<style>
  :host { display: block; }

  .controls {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
  }

  .date-select {
    background: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
    cursor: pointer;
    flex: 1;
    min-width: 180px;
  }
  .date-select:focus {
    outline: 2px solid var(--color-accent);
    border-color: var(--color-accent);
  }

  .btn {
    background: var(--color-accent);
    color: #fff;
    border: none;
    border-radius: var(--radius-sm);
    padding: 0.5rem 1.25rem;
    font-size: 0.9rem;
    cursor: pointer;
    font-family: var(--font-display);
    letter-spacing: 0.05em;
    transition: var(--transition);
    white-space: nowrap;
  }
  .btn:hover { background: var(--color-accent-hover); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .status {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    flex-basis: 100%;
  }

  .news-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: 2rem 2.5rem;
    box-shadow: var(--shadow);
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .news-date {
    font-family: var(--font-display);
    font-size: 0.85rem;
    color: var(--color-accent2);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 0.25rem;
  }

  /* Markdown content styles */
  .news-body { line-height: 1.75; }
  .news-body h1 {
    font-family: var(--font-display);
    font-size: 1.9rem;
    color: var(--color-accent);
    text-shadow: 0 0 12px var(--color-accent-glow);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
  }
  .news-body h2 {
    font-family: var(--font-display);
    font-size: 1.35rem;
    color: var(--color-accent2);
    margin-top: 1.75rem;
    margin-bottom: 0.5rem;
  }
  .news-body h3 {
    font-size: 1.1rem;
    color: var(--color-text);
    margin-top: 1.25rem;
  }
  .news-body p { margin: 0.75rem 0; }
  .news-body ul, .news-body ol {
    padding-left: 1.5rem;
    margin: 0.75rem 0;
  }
  .news-body li { margin: 0.3rem 0; }
  .news-body a {
    color: var(--color-accent);
    text-decoration: none;
  }
  .news-body a:hover { text-decoration: underline; }
  .news-body code {
    background: var(--color-code-bg);
    border-radius: 3px;
    padding: 0.1em 0.4em;
    font-size: 0.9em;
    color: var(--color-accent2);
  }
  .news-body pre {
    background: var(--color-code-bg);
    border-radius: var(--radius-sm);
    padding: 1rem;
    overflow-x: auto;
    border-left: 3px solid var(--color-accent);
  }
  .news-body pre code { background: none; padding: 0; color: var(--color-text); }
  .news-body blockquote {
    border-left: 3px solid var(--color-accent2);
    margin: 1rem 0;
    padding: 0.5rem 1rem;
    color: var(--color-text-muted);
    font-style: italic;
    background: var(--color-code-bg);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  }
  .news-body hr {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: 1.5rem 0;
  }
  .news-body strong { color: var(--color-accent2); }
  .news-body em { color: var(--color-text-muted); }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--color-text-muted);
  }
  .empty-state .icon { font-size: 3rem; margin-bottom: 1rem; }
  .empty-state p { font-size: 1.1rem; }

  .error-msg {
    background: var(--color-error-bg);
    border: 1px solid var(--color-error);
    border-radius: var(--radius-sm);
    padding: 1rem 1.25rem;
    color: var(--color-error);
    font-size: 0.9rem;
  }

  .skeleton {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: 2rem 2.5rem;
  }
  .skel-line {
    background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface-2) 50%, var(--color-border) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 4px;
    height: 1em;
    margin: 0.6rem 0;
  }
  .skel-line.wide { width: 100%; }
  .skel-line.med  { width: 70%; }
  .skel-line.short { width: 40%; }
  .skel-line.title { height: 1.8em; width: 80%; margin-bottom: 1.25rem; }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
</style>

<div class="controls">
  <select class="date-select" aria-label="Select news date">
    <option value="">Loading available dates…</option>
  </select>
  <button class="btn" id="load-btn">Load News</button>
  <div class="status" id="status"></div>
</div>
<div id="content">
  <div class="empty-state">
    <div class="icon">📰</div>
    <p>Select a date above to read the JRPG news.</p>
  </div>
</div>
`;

/** Fetches and renders JRPG news markdown files from the GitHub API. */
export class NewsReader extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = TEMPLATE;

    this._select = shadow.getElementById ? shadow.querySelector('.date-select') : null;
    this._select = shadow.querySelector('.date-select');
    this._loadBtn = shadow.querySelector('#load-btn');
    this._content = shadow.querySelector('#content');
    this._status = shadow.querySelector('#status');

    this._loadBtn.addEventListener('click', () => this._loadSelected());
    this._select.addEventListener('change', () => {
      if (this._select.value) this._loadSelected();
    });

    this._fetchAvailableDates();
  }

  async _fetchAvailableDates() {
    this._setStatus('Fetching available news files…');
    try {
      const res = await fetch(GITHUB_API, {
        headers: { Accept: 'application/vnd.github.v3+json' }
      });
      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
      const files = await res.json();

      const newsDates = files
        .map(f => f.name)
        .filter(n => FILE_PATTERN.test(n))
        .sort()
        .reverse();

      if (!newsDates.length) {
        this._setStatus('No news files found.');
        return;
      }

      this._select.innerHTML = newsDates.map(name => {
        const [, date] = FILE_PATTERN.exec(name);
        return `<option value="${name}">${this._formatDate(date)}</option>`;
      }).join('');

      this._setStatus(`${newsDates.length} edition${newsDates.length > 1 ? 's' : ''} available`);
      bus.emit('news:dates-loaded', { count: newsDates.length });

      // Auto-load the most recent
      this._loadSelected();
    } catch (err) {
      this._setStatus('');
      this._showError(`Could not fetch file list: ${err.message}`);
    }
  }

  async _loadSelected() {
    const filename = this._select.value;
    if (!filename) return;

    const [, date] = FILE_PATTERN.exec(filename);
    this._showSkeleton();
    this._loadBtn.disabled = true;
    this._setStatus('Loading…');

    try {
      const res = await fetch(`${RAW_BASE}${filename}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const markdown = await res.text();
      this._renderMarkdown(markdown, date);
      this._setStatus(`Loaded ${this._formatDate(date)}`);
      bus.emit('news:loaded', { date, filename });
    } catch (err) {
      this._showError(`Failed to load ${filename}: ${err.message}`);
      this._setStatus('');
    } finally {
      this._loadBtn.disabled = false;
    }
  }

  _renderMarkdown(md, date) {
    const html = this._parseMarkdown(md);
    this._content.innerHTML = `
      <article class="news-card">
        <div class="news-date">${this._formatDate(date)}</div>
        <div class="news-body">${html}</div>
      </article>
    `;
  }

  /** Lightweight Markdown-to-HTML parser (no external deps). */
  _parseMarkdown(md) {
    let html = md
      // Escape HTML entities first to prevent XSS
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

      // Fenced code blocks
      .replace(/```([^\n]*)\n([\s\S]*?)```/g, (_, lang, code) =>
        `<pre><code class="lang-${lang.trim() || 'text'}">${code.trimEnd()}</code></pre>`)

      // Headings
      .replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
      .replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
      .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
      .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
      .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
      .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')

      // Horizontal rule
      .replace(/^(?:---|\*\*\*|___)\s*$/gm, '<hr>')

      // Blockquote
      .replace(/^>\s?(.+)$/gm, '<blockquote>$1</blockquote>')

      // Unordered list items
      .replace(/^[-*+]\s+(.+)$/gm, '<li>$1</li>')

      // Ordered list items
      .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')

      // Wrap consecutive <li> in <ul>
      .replace(/(<li>[\s\S]*?<\/li>)(\n(?!<li>)|$)/g, (match) =>
        `<ul>${match.trim()}</ul>`)

      // Bold & italic
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')

      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')

      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

      // Images (renders as link to avoid mixed-content / layout issues)
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">[Image: $1]</a>')

      // Paragraphs: wrap lines not already wrapped in a block tag
      .replace(/^(?!<[hupbad]|<li|<pre|<hr|<blockquote)(.+)$/gm, '<p>$1</p>')

      // Clean up empty paragraphs
      .replace(/<p>\s*<\/p>/g, '')

      // Collapse <ul> wrapping that may have been nested by the regex
      .replace(/<\/ul>\s*<ul>/g, '');

    return html;
  }

  _showSkeleton() {
    this._content.innerHTML = `
      <div class="skeleton">
        <div class="skel-line title"></div>
        <div class="skel-line wide"></div>
        <div class="skel-line med"></div>
        <div class="skel-line wide"></div>
        <div class="skel-line short"></div>
        <br>
        <div class="skel-line med"></div>
        <div class="skel-line wide"></div>
        <div class="skel-line wide"></div>
        <div class="skel-line med"></div>
      </div>
    `;
  }

  _showError(msg) {
    this._content.innerHTML = `<div class="error-msg">⚠️ ${this._esc(msg)}</div>`;
  }

  _setStatus(msg) {
    this._status.textContent = msg;
  }

  _formatDate(iso) {
    const [y, m, d] = iso.split('-');
    const dt = new Date(+y, +m - 1, +d);
    return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  _esc(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

customElements.define('news-reader', NewsReader);
