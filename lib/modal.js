/**
 * <modal-dialog> — accessible modal dialog
 *
 * Events:
 *   'modal-open'  → {}
 *   'modal-close' → { reason: 'dismiss' | 'confirm' | 'escape' }
 *
 * Methods:
 *   open()
 *   close(reason)
 *
 * Attributes:
 *   open — present when the modal is open
 *
 * Usage:
 *   <modal-dialog>
 *     <div slot="header">Title</div>
 *     <div slot="body">Content</div>
 *     <div slot="footer">
 *       <button data-action="dismiss">Cancel</button>
 *       <button data-action="confirm">OK</button>
 *     </div>
 *   </modal-dialog>
 *
 *   <button onclick="document.querySelector('modal-dialog').open()">Open</button>
 */

class ModalDialog extends HTMLElement {
  #backdrop = null;
  #previousFocus = null;

  connectedCallback() {
    this.setAttribute('role', 'dialog');
    this.setAttribute('aria-modal', 'true');
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '-1');
    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKeyDown);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('keydown', this.#onKeyDown);
    this.#backdrop?.remove();
  }

  open() {
    this.#previousFocus = document.activeElement;
    this.#backdrop = document.createElement('div');
    this.#backdrop.className = 'modal-backdrop';
    this.#backdrop.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:999;';
    this.#backdrop.addEventListener('click', () => this.close('dismiss'));
    document.body.appendChild(this.#backdrop);

    this.setAttribute('open', '');
    this.#trapFocus();
    this.dispatchEvent(new CustomEvent('modal-open', { bubbles: true }));
  }

  close(reason = 'dismiss') {
    this.removeAttribute('open');
    this.#backdrop?.remove();
    this.#backdrop = null;
    this.#previousFocus?.focus();
    this.#previousFocus = null;
    this.dispatchEvent(new CustomEvent('modal-close', {
      bubbles: true,
      detail: { reason },
    }));
  }

  #onClick = (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action) this.close(action);
  };

  #onKeyDown = (e) => {
    if (e.key === 'Escape') this.close('escape');
    if (e.key === 'Tab') this.#handleTab(e);
  };

  #trapFocus() {
    const focusable = this.#focusableElements();
    focusable[0]?.focus();
  }

  #focusableElements() {
    return [...this.querySelectorAll(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
    )];
  }

  #handleTab(e) {
    const focusable = this.#focusableElements();
    if (!focusable.length) { e.preventDefault(); return; }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

customElements.define('modal-dialog', ModalDialog);
