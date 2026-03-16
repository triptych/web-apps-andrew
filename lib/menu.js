/**
 * <drop-menu> — accessible dropdown menu
 *
 * Events:
 *   'menu-select' → { item, value }
 *
 * Attributes (on menu-item):
 *   value — optional value for the item (defaults to text content)
 *   disabled — disables the item
 *
 * Usage:
 *   <drop-menu>
 *     <button slot="trigger">Open</button>
 *     <menu-item value="copy">Copy</menu-item>
 *     <menu-item value="paste">Paste</menu-item>
 *     <menu-separator></menu-separator>
 *     <menu-item value="delete" disabled>Delete</menu-item>
 *   </drop-menu>
 */

class DropMenu extends HTMLElement {
  #open = false;

  connectedCallback() {
    this.setAttribute('role', 'menu');
    this.#trigger?.addEventListener('click', this.#onTriggerClick);
    this.addEventListener('keydown', this.#onKeyDown);
    this.addEventListener('click', this.#onItemClick);
    document.addEventListener('pointerdown', this.#onOutsideClick);
  }

  disconnectedCallback() {
    this.#trigger?.removeEventListener('click', this.#onTriggerClick);
    this.removeEventListener('keydown', this.#onKeyDown);
    this.removeEventListener('click', this.#onItemClick);
    document.removeEventListener('pointerdown', this.#onOutsideClick);
  }

  get #trigger() { return this.querySelector('[slot="trigger"]'); }
  get #items() { return [...this.querySelectorAll('menu-item:not([disabled])')]; }

  toggle(force) {
    this.#open = force ?? !this.#open;
    this.classList.toggle('open', this.#open);
    this.#trigger?.setAttribute('aria-expanded', this.#open);
    if (this.#open) this.#items[0]?.focus();
  }

  #onTriggerClick = (e) => {
    e.stopPropagation();
    this.toggle();
  };

  #onOutsideClick = (e) => {
    if (this.#open && !this.contains(e.target)) this.toggle(false);
  };

  #onItemClick = (e) => {
    const item = e.target.closest('menu-item');
    if (!item || item.hasAttribute('disabled')) return;
    this.dispatchEvent(new CustomEvent('menu-select', {
      bubbles: true,
      detail: { item, value: item.getAttribute('value') ?? item.textContent.trim() },
    }));
    this.toggle(false);
  };

  #onKeyDown = (e) => {
    const items = this.#items;
    const current = document.activeElement;
    const idx = items.indexOf(current);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        items[(idx + 1) % items.length]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length]?.focus();
        break;
      case 'Home':
        e.preventDefault();
        items[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        items[items.length - 1]?.focus();
        break;
      case 'Escape':
        this.toggle(false);
        this.#trigger?.focus();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        current.click();
        break;
    }
  };
}

class MenuItem extends HTMLElement {
  connectedCallback() {
    this.setAttribute('role', 'menuitem');
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '-1');
  }
}

class MenuSeparator extends HTMLElement {
  connectedCallback() {
    this.setAttribute('role', 'separator');
  }
}

customElements.define('drop-menu', DropMenu);
customElements.define('menu-item', MenuItem);
customElements.define('menu-separator', MenuSeparator);
