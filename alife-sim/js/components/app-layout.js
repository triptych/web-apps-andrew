import { bus } from '../events/bus.js';

/**
 * Shell layout with header + main content area.
 * @attr {string} theme - 'light' | 'dark'
 */
export class AppLayout extends HTMLElement {
  static get observedAttributes() { return ['theme']; }

  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 18px; height: 48px; flex-shrink: 0;
          background: var(--color-surface, #111827);
          border-bottom: 1px solid var(--color-border, #2d3f5a);
        }
        .logo {
          font-size: 15px; font-weight: 700; letter-spacing: .04em;
          color: var(--color-accent, #22d3ee);
        }
        .logo span { color: var(--color-accent2, #a78bfa); }
        main { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
      </style>
      <header>
        <div class="logo">A<span>Life</span> Simulator</div>
        <slot name="header-actions"></slot>
      </header>
      <main><slot></slot></main>
    `;
    bus.emit('layout:ready');
  }

  attributeChangedCallback(name, _, val) {
    if (name === 'theme') document.documentElement.dataset.theme = val;
  }

  disconnectedCallback() {}
}

customElements.define('app-layout', AppLayout);
