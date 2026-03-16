import { bus } from '../events/bus.js';
import { parseMarkdown } from '../markdown.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
      background: var(--color-surface, #fff);
      border-bottom: 1px solid var(--color-border, #dee2e6);
      flex-shrink: 0;
    }
    nav {
      display: flex;
      align-items: stretch;
      height: 30px;
      padding: 0 .25rem;
    }
    .menu-item {
      position: relative;
    }
    .menu-trigger {
      background: none;
      border: none;
      padding: 0 .75rem;
      height: 100%;
      font-size: .8rem;
      color: var(--color-text, #212529);
      cursor: pointer;
      border-radius: var(--radius, 6px);
      transition: background var(--transition, 150ms ease);
    }
    .menu-trigger:hover,
    .menu-trigger[aria-expanded="true"] {
      background: var(--color-surface-2, #f1f3f5);
    }
    .dropdown {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      min-width: 180px;
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #dee2e6);
      border-radius: var(--radius, 6px);
      box-shadow: var(--shadow-lg, 0 10px 25px rgba(0,0,0,.12));
      z-index: 1000;
      padding: .25rem 0;
      margin-top: 2px;
    }
    .dropdown.open { display: block; }
    .dropdown-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: .4rem 1rem;
      background: none;
      border: none;
      font-size: .82rem;
      color: var(--color-text, #212529);
      cursor: pointer;
      text-align: left;
      gap: 2rem;
    }
    .dropdown-item:hover { background: var(--color-surface-2, #f1f3f5); }
    .dropdown-item .shortcut {
      font-size: .75rem;
      color: var(--color-text-muted, #6c757d);
    }
    .dropdown-separator {
      height: 1px;
      background: var(--color-border, #dee2e6);
      margin: .25rem 0;
    }
    .filename {
      font-size: .78rem;
      color: var(--color-text-muted, #6c757d);
      padding: 0 .75rem;
      display: flex;
      align-items: center;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  </style>
  <nav role="menubar">
    <div class="menu-item">
      <button class="menu-trigger" aria-haspopup="true" aria-expanded="false" id="file-trigger">File</button>
      <div class="dropdown" id="file-menu" role="menu">
        <button class="dropdown-item" role="menuitem" id="item-new">
          <span>New</span><span class="shortcut">Ctrl+N</span>
        </button>
        <button class="dropdown-item" role="menuitem" id="item-open">
          <span>Open…</span><span class="shortcut">Ctrl+O</span>
        </button>
        <div class="dropdown-separator"></div>
        <button class="dropdown-item" role="menuitem" id="item-save">
          <span>Save</span><span class="shortcut">Ctrl+S</span>
        </button>
        <button class="dropdown-item" role="menuitem" id="item-save-as">
          <span>Save As…</span><span class="shortcut">Ctrl+Shift+S</span>
        </button>
      </div>
    </div>
    <div class="menu-item">
      <button class="menu-trigger" aria-haspopup="true" aria-expanded="false" id="export-trigger">Export</button>
      <div class="dropdown" id="export-menu" role="menu">
        <button class="dropdown-item" role="menuitem" id="item-export-html">
          <span>Export as HTML…</span><span class="shortcut">Ctrl+E</span>
        </button>
      </div>
    </div>
    <span class="filename" id="filename-display"></span>
  </nav>
  <input type="file" id="file-input" accept=".md,.markdown,.txt" style="display:none" aria-hidden="true">
`;

/**
 * Menu bar with File menu (New, Open, Save, Save As).
 * Emits `file:new`, `file:open`, `file:save`, `file:save-as` on the bus.
 * Listens for `markdown:change` to track current content and `file:name-change` to update display.
 */
export class AppMenubar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._currentContent = '';
    this._filename = '';
    this._currentHtml = '';
  }

  connectedCallback() {
    const trigger = this.shadowRoot.getElementById('file-trigger');
    const menu = this.shadowRoot.getElementById('file-menu');

    // Export menu
    const exportTrigger = this.shadowRoot.getElementById('export-trigger');
    const exportMenu = this.shadowRoot.getElementById('export-menu');

    exportTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = exportMenu.classList.toggle('open');
      exportTrigger.setAttribute('aria-expanded', String(open));
    });

    // Toggle file menu
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.classList.toggle('open');
      trigger.setAttribute('aria-expanded', String(open));
    });

    // Close on outside click
    this._onDocClick = () => {
      menu.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
      exportMenu.classList.remove('open');
      exportTrigger.setAttribute('aria-expanded', 'false');
    };
    document.addEventListener('click', this._onDocClick);

    // Close on Escape
    this._onKeydown = (e) => {
      if (e.key === 'Escape') {
        menu.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'n') { e.preventDefault(); this._new(); }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'o') { e.preventDefault(); this._open(); }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 's') { e.preventDefault(); this._save(); }
      if ((e.ctrlKey || e.metaKey) &&  e.shiftKey && e.key.toLowerCase() === 's') { e.preventDefault(); this._saveAs(); }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'e') { e.preventDefault(); this._exportHtml(); }
    };
    document.addEventListener('keydown', this._onKeydown);

    // Export menu item
    this.shadowRoot.getElementById('item-export-html').addEventListener('click', () => {
      exportMenu.classList.remove('open');
      exportTrigger.setAttribute('aria-expanded', 'false');
      this._exportHtml();
    });

    // Menu item actions
    this.shadowRoot.getElementById('item-new').addEventListener('click', () => { this._closeMenu(); this._new(); });
    this.shadowRoot.getElementById('item-open').addEventListener('click', () => { this._closeMenu(); this._open(); });
    this.shadowRoot.getElementById('item-save').addEventListener('click', () => { this._closeMenu(); this._save(); });
    this.shadowRoot.getElementById('item-save-as').addEventListener('click', () => { this._closeMenu(); this._saveAs(); });

    // File picker
    this._fileInput = this.shadowRoot.getElementById('file-input');
    this._fileInput.addEventListener('change', (e) => this._onFileSelected(e));

    // Track editor content and derived HTML
    this._unsubChange = bus.on('markdown:change', (e) => {
      this._currentContent = e.detail.value;
      this._currentHtml = parseMarkdown(e.detail.value);
    });

    // Update filename display from outside
    this._unsubName = bus.on('file:name-change', (e) => { this._setFilename(e.detail.name); });
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._onDocClick);
    document.removeEventListener('keydown', this._onKeydown);
    this._unsubChange?.();
    this._unsubName?.();
  }

  _closeMenu() {
    const menu = this.shadowRoot.getElementById('file-menu');
    const trigger = this.shadowRoot.getElementById('file-trigger');
    menu.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  _setFilename(name) {
    this._filename = name;
    this.shadowRoot.getElementById('filename-display').textContent = name || '';
  }

  _new() {
    bus.emit('file:new', {});
  }

  _open() {
    this._fileInput.value = '';
    this._fileInput.click();
  }

  _save() {
    const name = this._filename || 'document.md';
    this._download(name, this._currentContent);
  }

  _saveAs() {
    const suggested = this._filename || 'document.md';
    const name = prompt('Save as:', suggested);
    if (name === null) return; // cancelled
    const finalName = name.trim() || suggested;
    this._setFilename(finalName);
    bus.emit('file:name-change', { name: finalName });
    this._download(finalName, this._currentContent);
  }

  _exportHtml() {
    const base = (this._filename || 'document').replace(/\.(md|markdown|txt)$/i, '');
    const suggested = base + '.html';
    const name = prompt('Export as:', suggested);
    if (name === null) return;
    const finalName = name.trim() || suggested;
    const fullHtml = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>${base}</title>\n</head>\n<body>\n${this._currentHtml}\n</body>\n</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalName;
    a.click();
    URL.revokeObjectURL(url);
  }

  _download(filename, content) {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  _onFileSelected(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target.result;
      this._setFilename(file.name);
      bus.emit('file:name-change', { name: file.name });
      bus.emit('file:open', { content, name: file.name });
    };
    reader.readAsText(file);
  }
}

customElements.define('app-menubar', AppMenubar);
