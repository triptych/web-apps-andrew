import { bus } from '../events/bus.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: var(--color-bg, #f8f9fa);
      color: var(--color-text, #212529);
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.25rem;
      height: 52px;
      background: var(--color-surface, #fff);
      border-bottom: 1px solid var(--color-border, #dee2e6);
      box-shadow: var(--shadow, 0 1px 3px rgba(0,0,0,.08));
      flex-shrink: 0;
      gap: 1rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: .5rem;
      font-weight: 700;
      font-size: 1rem;
      color: var(--color-accent, #4f46e5);
      text-decoration: none;
      white-space: nowrap;
    }
    .brand svg { flex-shrink: 0; }
    main {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: .5rem;
    }
    button.theme-toggle {
      background: none;
      border: 1px solid var(--color-border, #dee2e6);
      border-radius: var(--radius, 6px);
      padding: .35rem .6rem;
      cursor: pointer;
      color: var(--color-text-muted, #6c757d);
      font-size: .85rem;
      transition: background var(--transition, 150ms ease), color var(--transition, 150ms ease);
      display: flex;
      align-items: center;
      gap: .3rem;
    }
    button.theme-toggle:hover {
      background: var(--color-surface-2, #f1f3f5);
      color: var(--color-text, #212529);
    }
  </style>
  <header>
    <span class="brand">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
      Markdown Converter
    </span>
    <div class="header-actions">
      <button class="theme-toggle" aria-label="Toggle dark mode" id="theme-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" id="theme-icon">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
        <span id="theme-label">Dark</span>
      </button>
    </div>
  </header>
  <app-menubar></app-menubar>
  <main>
    <slot></slot>
  </main>
`;

const MOON_SVG = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
const SUN_SVG = `<circle cx="12" cy="12" r="5"/>
  <line x1="12" y1="1" x2="12" y2="3"/>
  <line x1="12" y1="21" x2="12" y2="23"/>
  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
  <line x1="1" y1="12" x2="3" y2="12"/>
  <line x1="21" y1="12" x2="23" y2="12"/>
  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;

/**
 * Top-level app shell with header and main content area.
 * Supports `theme` attribute: "light" | "dark"
 */
export class AppLayout extends HTMLElement {
  static get observedAttributes() { return ['theme']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._themeBtn = this.shadowRoot.getElementById('theme-btn');
    this._themeLabel = this.shadowRoot.getElementById('theme-label');
    this._themeIcon = this.shadowRoot.getElementById('theme-icon');
    this._onThemeToggle = this._onThemeToggle.bind(this);
  }

  connectedCallback() {
    this._themeBtn.addEventListener('click', this._onThemeToggle);
    this._applyTheme(this.getAttribute('theme') || 'light');
    bus.emit('layout:ready', { theme: this.getAttribute('theme') || 'light' });
  }

  disconnectedCallback() {
    this._themeBtn.removeEventListener('click', this._onThemeToggle);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'theme' && oldVal !== newVal) {
      this._applyTheme(newVal);
    }
  }

  _applyTheme(theme) {
    const dark = theme === 'dark';
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : '');
    this._themeLabel.textContent = dark ? 'Light' : 'Dark';
    this._themeIcon.innerHTML = dark ? MOON_SVG : SUN_SVG;
  }

  _onThemeToggle() {
    const next = this.getAttribute('theme') === 'dark' ? 'light' : 'dark';
    this.setAttribute('theme', next);
    bus.emit('layout:theme-change', { theme: next });
  }
}

customElements.define('app-layout', AppLayout);
