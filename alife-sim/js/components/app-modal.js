import { bus } from '../events/bus.js';

/**
 * Modal dialog. Toggle with `open` attribute or bus events
 * `modal:request-open` / `modal:request-close`.
 */
export class AppModal extends HTMLElement {
  static get observedAttributes() { return ['open']; }

  connectedCallback() {
    this._shadow = this.attachShadow({ mode: 'open' });
    this._shadow.innerHTML = `
      <style>
        :host { display: none; }
        :host([open]) { display: block; }
        .backdrop {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,.7); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
        }
        .dialog {
          background: var(--color-surface, #111827);
          border: 1px solid var(--color-border, #2d3f5a);
          border-radius: 14px;
          padding: 24px;
          min-width: 320px; max-width: 90vw; max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 8px 40px rgba(0,0,0,.7);
        }
        header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px;
        }
        h2 { font-size: 16px; font-weight: 700; }
        .close {
          background: none; border: none; color: var(--color-muted, #94a3b8);
          font-size: 20px; cursor: pointer; line-height: 1; padding: 2px 6px;
          border-radius: 6px;
        }
        .close:hover { color: var(--color-text, #e2e8f0); background: var(--color-surface2, #1e293b); }
      </style>
      <div class="backdrop" role="dialog" aria-modal="true">
        <div class="dialog">
          <header>
            <h2><slot name="title"></slot></h2>
            <button class="close" aria-label="Close">&times;</button>
          </header>
          <slot name="body"></slot>
        </div>
      </div>
    `;

    this._shadow.querySelector('.close').addEventListener('click', () => this._close());
    this._shadow.querySelector('.backdrop').addEventListener('click', e => {
      if (e.target === e.currentTarget) this._close();
    });

    this._onOpen = () => this._open();
    this._onClose = () => this._close();
    bus.on('modal:request-open', this._onOpen);
    bus.on('modal:request-close', this._onClose);

    this.addEventListener('keydown', e => {
      if (e.key === 'Escape') this._close();
    });
  }

  _open() {
    this._prev = document.activeElement;
    this.setAttribute('open', '');
    this.dispatchEvent(new CustomEvent('modal:open', { bubbles: true, composed: true }));
    requestAnimationFrame(() => this._shadow.querySelector('.close')?.focus());
  }

  _close() {
    this.removeAttribute('open');
    this.dispatchEvent(new CustomEvent('modal:close', { bubbles: true, composed: true }));
    this._prev?.focus();
  }

  attributeChangedCallback() {}

  disconnectedCallback() {
    bus.off('modal:request-open', this._onOpen);
    bus.off('modal:request-close', this._onClose);
  }
}

customElements.define('app-modal', AppModal);
