import { bus } from '../events/bus.js';

const TEMPLATE = `
<style>
  :host {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-body);
  }
  header {
    background: var(--color-surface);
    border-bottom: 2px solid var(--color-accent);
    padding: 1rem 2rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: var(--shadow);
  }
  .logo {
    font-family: var(--font-display);
    font-size: 1.5rem;
    color: var(--color-accent);
    text-shadow: 0 0 10px var(--color-accent-glow);
    letter-spacing: 0.05em;
  }
  .logo span {
    color: var(--color-accent2);
  }
  main {
    flex: 1;
    padding: 2rem;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }
  footer {
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
    padding: 0.75rem 2rem;
    text-align: center;
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }
</style>
<header>
  <div class="logo">⚔️ JRPG <span>News</span></div>
</header>
<main><slot></slot></main>
<footer>Fetched from github.com/triptych/triptych</footer>
`;

/** Top-level page shell with header/main/footer layout. */
export class AppLayout extends HTMLElement {
  static get observedAttributes() { return ['theme']; }

  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = TEMPLATE;
    this._applyTheme(this.getAttribute('theme') || 'dark');
    bus.emit('layout:ready', {});
  }

  attributeChangedCallback(name, _old, value) {
    if (name === 'theme') this._applyTheme(value);
  }

  _applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme || 'dark');
  }
}

customElements.define('app-layout', AppLayout);
