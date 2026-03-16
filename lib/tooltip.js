/**
 * <tool-tip> — hover/focus tooltip
 *
 * Attributes:
 *   tip      — tooltip text (required)
 *   position — 'top' | 'bottom' | 'left' | 'right'  (default: 'top')
 *   delay    — show delay in ms  (default: 300)
 *
 * Usage:
 *   <tool-tip tip="More info" position="bottom">
 *     <button>Hover me</button>
 *   </tool-tip>
 */

class ToolTip extends HTMLElement {
  #popup = null;
  #timer = null;

  connectedCallback() {
    this.style.position = 'relative';
    this.style.display = 'inline-block';
    this.addEventListener('mouseenter', this.#show);
    this.addEventListener('mouseleave', this.#hide);
    this.addEventListener('focusin', this.#show);
    this.addEventListener('focusout', this.#hide);
  }

  disconnectedCallback() {
    this.removeEventListener('mouseenter', this.#show);
    this.removeEventListener('mouseleave', this.#hide);
    this.removeEventListener('focusin', this.#show);
    this.removeEventListener('focusout', this.#hide);
    clearTimeout(this.#timer);
    this.#popup?.remove();
  }

  #show = () => {
    clearTimeout(this.#timer);
    const delay = Number(this.getAttribute('delay') ?? 300);
    this.#timer = setTimeout(() => {
      const tip = this.getAttribute('tip');
      if (!tip) return;
      this.#popup = document.createElement('div');
      this.#popup.role = 'tooltip';
      this.#popup.textContent = tip;
      this.#popup.style.cssText = `
        position:absolute;
        background:#222;color:#fff;
        padding:4px 8px;border-radius:4px;
        font-size:0.8em;white-space:nowrap;
        pointer-events:none;z-index:9999;
        transition:opacity 0.15s;
      `;
      this.appendChild(this.#popup);
      this.#position();
    }, delay);
  };

  #hide = () => {
    clearTimeout(this.#timer);
    this.#popup?.remove();
    this.#popup = null;
  };

  #position() {
    const p = this.#popup;
    const pos = this.getAttribute('position') ?? 'top';
    const gap = 6;
    const r = this.getBoundingClientRect();
    const pr = p.getBoundingClientRect();

    let top, left;
    switch (pos) {
      case 'bottom': top = r.height + gap; left = (r.width - pr.width) / 2; break;
      case 'left':   top = (r.height - pr.height) / 2; left = -(pr.width + gap); break;
      case 'right':  top = (r.height - pr.height) / 2; left = r.width + gap; break;
      default:       top = -(pr.height + gap); left = (r.width - pr.width) / 2; break;
    }
    p.style.top = `${top}px`;
    p.style.left = `${left}px`;
  }
}

customElements.define('tool-tip', ToolTip);
