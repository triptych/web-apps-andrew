import { bus } from '../events/bus.js';

const TEMPLATE = `
<style>
  :host { display: contents; }
  .backdrop {
    display: none;
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(4px);
    z-index: 1000;
    align-items: center;
    justify-content: center;
  }
  :host([open]) .backdrop { display: flex; }
  .dialog {
    background: var(--color-surface);
    border: 1px solid var(--color-accent);
    border-radius: var(--radius);
    padding: 2rem;
    max-width: 480px;
    width: 90%;
    box-shadow: var(--shadow-lg);
    position: relative;
  }
  .close-btn {
    position: absolute; top: 0.75rem; right: 0.75rem;
    background: none; border: none; cursor: pointer;
    color: var(--color-text-muted); font-size: 1.25rem;
    line-height: 1;
  }
  .close-btn:hover { color: var(--color-accent); }
  ::slotted(*) { color: var(--color-text); }
</style>
<div class="backdrop" part="backdrop">
  <div class="dialog" role="dialog" aria-modal="true" part="dialog">
    <button class="close-btn" aria-label="Close">✕</button>
    <slot></slot>
  </div>
</div>
`;

/** Accessible modal dialog driven by event bus or open attribute. */
export class AppModal extends HTMLElement {
  static get observedAttributes() { return ['open']; }

  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = TEMPLATE;

    this._closeBtn = shadow.querySelector('.close-btn');
    this._backdrop = shadow.querySelector('.backdrop');
    this._dialog = shadow.querySelector('.dialog');

    this._closeBtn.addEventListener('click', () => this._close());
    this._backdrop.addEventListener('click', e => {
      if (e.target === this._backdrop) this._close();
    });
    this._keyHandler = e => { if (e.key === 'Escape') this._close(); };
    document.addEventListener('keydown', this._keyHandler);

    this._busOpen = () => this._open();
    this._busClose = () => this._close();
    bus.on('modal:request-open', this._busOpen);
    bus.on('modal:request-close', this._busClose);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._keyHandler);
    bus.off('modal:request-open', this._busOpen);
    bus.off('modal:request-close', this._busClose);
  }

  attributeChangedCallback(name, _old, value) {
    if (name === 'open' && this.shadowRoot) {
      this._backdrop.style.display = value !== null ? 'flex' : 'none';
    }
  }

  _open() {
    this._prevFocus = document.activeElement;
    this.setAttribute('open', '');
    this._closeBtn?.focus();
    this.dispatchEvent(new CustomEvent('modal:open', { bubbles: true, composed: true }));
  }

  _close() {
    this.removeAttribute('open');
    this._prevFocus?.focus();
    this.dispatchEvent(new CustomEvent('modal:close', { bubbles: true, composed: true }));
  }
}

customElements.define('app-modal', AppModal);
