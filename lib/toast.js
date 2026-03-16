/**
 * <toast-rack> — container that manages toast notifications
 *
 * Events (on toast-rack):
 *   'toast-dismiss' → { toast, id }
 *
 * Methods (on toast-rack):
 *   show({ message, type, duration })
 *     type: 'info' | 'success' | 'warning' | 'error'  (default: 'info')
 *     duration: ms before auto-dismiss  (default: 4000, 0 = no auto-dismiss)
 *   dismissAll()
 *
 * Usage:
 *   <!-- place once, near end of body -->
 *   <toast-rack></toast-rack>
 *
 *   <script type="module">
 *     import './llib/toast.js';
 *     document.querySelector('toast-rack').show({ message: 'Saved!', type: 'success' });
 *   </script>
 */

let _id = 0;

class ToastRack extends HTMLElement {
  connectedCallback() {
    this.setAttribute('role', 'region');
    this.setAttribute('aria-live', 'polite');
    this.setAttribute('aria-label', 'Notifications');
    this.addEventListener('click', this.#onClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#onClick);
  }

  show({ message = '', type = 'info', duration = 4000 } = {}) {
    const id = ++_id;
    const toast = document.createElement('toast-item');
    toast.dataset.id = id;
    toast.dataset.type = type;
    toast.textContent = message;

    const dismiss = document.createElement('button');
    dismiss.className = 'toast-dismiss';
    dismiss.setAttribute('aria-label', 'Dismiss');
    dismiss.textContent = '×';
    toast.appendChild(dismiss);

    this.appendChild(toast);
    // Trigger entrance animation
    requestAnimationFrame(() => toast.classList.add('visible'));

    if (duration > 0) {
      setTimeout(() => this.#remove(toast, id), duration);
    }
    return id;
  }

  dismissAll() {
    [...this.querySelectorAll('toast-item')].forEach(t =>
      this.#remove(t, Number(t.dataset.id))
    );
  }

  #onClick = (e) => {
    const btn = e.target.closest('.toast-dismiss');
    if (!btn) return;
    const toast = btn.closest('toast-item');
    if (toast) this.#remove(toast, Number(toast.dataset.id));
  };

  #remove(toast, id) {
    if (!toast.isConnected) return;
    toast.classList.remove('visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    this.dispatchEvent(new CustomEvent('toast-dismiss', {
      bubbles: true,
      detail: { toast, id },
    }));
  }
}

class ToastItem extends HTMLElement {}

customElements.define('toast-rack', ToastRack);
customElements.define('toast-item', ToastItem);
