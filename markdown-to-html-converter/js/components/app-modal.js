import { bus } from '../events/bus.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: contents; }
    .backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.45);
      z-index: 100;
      align-items: center;
      justify-content: center;
      animation: fade-in 120ms ease;
    }
    :host([open]) .backdrop { display: flex; }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    .dialog {
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #dee2e6);
      border-radius: var(--radius-lg, 12px);
      box-shadow: var(--shadow-lg, 0 10px 25px rgba(0,0,0,.12));
      padding: 1.5rem;
      max-width: 360px;
      width: calc(100% - 2rem);
      animation: slide-up 150ms ease;
    }
    @keyframes slide-up { from { transform: translateY(8px); opacity: 0; } to { transform: none; opacity: 1; } }
    .dialog-title {
      font-size: 1.05rem;
      font-weight: 600;
      margin-bottom: .5rem;
      color: var(--color-text, #212529);
    }
    .dialog-body {
      font-size: .9rem;
      color: var(--color-text-muted, #6c757d);
      margin-bottom: 1.25rem;
    }
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
    }
    button.close-btn {
      padding: .45rem 1.1rem;
      border: none;
      border-radius: var(--radius, 6px);
      background: var(--color-accent, #4f46e5);
      color: var(--color-accent-fg, #fff);
      font-size: .875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background var(--transition, 150ms ease);
    }
    button.close-btn:hover { background: var(--color-accent-hover, #4338ca); }
  </style>
  <div class="backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div class="dialog">
      <div class="dialog-title" id="modal-title"><slot name="title">Notice</slot></div>
      <div class="dialog-body"><slot name="body"></slot></div>
      <div class="dialog-footer">
        <button class="close-btn">OK</button>
      </div>
    </div>
  </div>
`;

/**
 * Modal dialog component.
 * Open via `open` attribute or bus event `modal:request-open`.
 * Emits `modal:open` and `modal:close` (bubbles, composed).
 */
export class AppModal extends HTMLElement {
  static get observedAttributes() { return ['open']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._backdrop = this.shadowRoot.querySelector('.backdrop');
    this._closeBtn = this.shadowRoot.querySelector('.close-btn');
    this._previousFocus = null;

    this._onClose = this._onClose.bind(this);
    this._onBackdropClick = this._onBackdropClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
  }

  connectedCallback() {
    this._closeBtn.addEventListener('click', this._onClose);
    this._backdrop.addEventListener('click', this._onBackdropClick);
    document.addEventListener('keydown', this._onKeyDown);

    this._unsubOpen = bus.on('modal:request-open', (e) => {
      if (!e.detail?.id || e.detail.id === this.id) this.setAttribute('open', '');
    });
    this._unsubClose = bus.on('modal:request-close', (e) => {
      if (!e.detail?.id || e.detail.id === this.id) this.removeAttribute('open');
    });
  }

  disconnectedCallback() {
    this._closeBtn.removeEventListener('click', this._onClose);
    this._backdrop.removeEventListener('click', this._onBackdropClick);
    document.removeEventListener('keydown', this._onKeyDown);
    this._unsubOpen?.();
    this._unsubClose?.();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name !== 'open') return;
    if (newVal !== null) {
      this._previousFocus = document.activeElement;
      requestAnimationFrame(() => this._closeBtn.focus());
      this.dispatchEvent(new CustomEvent('modal:open', { bubbles: true, composed: true }));
    } else {
      this._previousFocus?.focus();
      this.dispatchEvent(new CustomEvent('modal:close', { bubbles: true, composed: true }));
    }
  }

  _onClose() { this.removeAttribute('open'); }

  _onBackdropClick(e) {
    if (e.target === this._backdrop) this._onClose();
  }

  _onKeyDown(e) {
    if (!this.hasAttribute('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); this._onClose(); }
    // Trap focus within dialog
    if (e.key === 'Tab') {
      const focusable = [...this.shadowRoot.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
}

customElements.define('app-modal', AppModal);
