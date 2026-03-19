import { bus } from '../events/bus.js';

/**
 * Displays a scrollable list of previously revealed fortunes.
 * Listens for `fortune:revealed` on the event bus.
 */
export class FortuneHistory extends HTMLElement {
  #history = [];
  #root = null;
  #off = null;

  connectedCallback() {
    this.#root = this.attachShadow({ mode: 'open' });
    this.#render();
    this.#off = bus.on('fortune:revealed', (e) => {
      this.#history.unshift(e.detail.fortune);
      this.#render();
    });
  }

  disconnectedCallback() {
    this.#off?.();
  }

  #render() {
    this.#root.innerHTML = `
      <style>
        :host { display: block; width: 100%; max-width: 480px; }
        .panel {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 1.25rem 1.5rem;
        }
        h2 {
          font-family: var(--font-display);
          font-size: 0.85rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--color-muted);
          margin: 0 0 1rem;
        }
        ul { list-style: none; margin: 0; padding: 0; }
        li {
          font-style: italic;
          font-size: 0.9rem;
          line-height: 1.5;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--color-border);
          color: var(--color-text-muted);
          animation: slideIn 0.3s ease;
        }
        li:last-child { border-bottom: none; }
        li::before { content: '⚔ '; opacity: 0.4; }
        .empty { color: var(--color-muted); font-size: 0.9rem; font-style: italic; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      </style>
      <div class="panel">
        <h2>Chronicles of Fate</h2>
        ${this.#history.length === 0
          ? `<p class="empty">No fortunes yet received.</p>`
          : `<ul>${this.#history.map(f => `<li>${f}</li>`).join('')}</ul>`
        }
      </div>
    `;
  }
}

customElements.define('fortune-history', FortuneHistory);
