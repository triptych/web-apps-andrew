import { bus } from '../events/bus.js';

/**
 * App shell layout with header, main, and footer slots.
 * Attributes:
 *   theme: "light" | "dark"
 */
export class AppLayout extends HTMLElement {
  static get observedAttributes() { return ['theme']; }

  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: var(--color-bg);
          color: var(--color-text);
          font-family: var(--font-body);
        }
        header { padding: 1.5rem 2rem; border-bottom: 1px solid var(--color-border); }
        main   { flex: 1; padding: 2rem; display: flex; align-items: center; justify-content: center; }
        footer { padding: 1rem 2rem; text-align: center; font-size: 0.8rem; opacity: 0.6; border-top: 1px solid var(--color-border); }
      </style>
      <header><slot name="header"></slot></header>
      <main><slot></slot></main>
      <footer><slot name="footer"></slot></footer>
    `;
    bus.emit('layout:ready');
  }

  attributeChangedCallback(name, _old, value) {
    if (name === 'theme') {
      document.documentElement.setAttribute('data-theme', value);
    }
  }

  disconnectedCallback() {}
}

customElements.define('app-layout', AppLayout);
