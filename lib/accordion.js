/**
 * <accordion-group> — manages accordion items; optional single-open mode
 * <accordion-item> — individual collapsible section
 *
 * Events:
 *   accordion-item: 'accordion-change' → { item, open }
 *
 * Attributes (on accordion-group):
 *   single — only one item open at a time
 *
 * Attributes (on accordion-item):
 *   open — present when expanded
 *
 * Usage:
 *   <accordion-group single>
 *     <accordion-item>
 *       <div slot="header">Section 1</div>
 *       <div slot="body">Content 1</div>
 *     </accordion-item>
 *     <accordion-item open>
 *       <div slot="header">Section 2</div>
 *       <div slot="body">Content 2</div>
 *     </accordion-item>
 *   </accordion-group>
 */

class AccordionItem extends HTMLElement {
  #header = null;
  #body = null;

  connectedCallback() {
    this.#render();
    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKeyDown);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('keydown', this.#onKeyDown);
  }

  #render() {
    const headerSlot = this.querySelector('[slot="header"]');
    const bodySlot = this.querySelector('[slot="body"]');
    if (!headerSlot || !bodySlot) return;

    this.#header = headerSlot;
    this.#body = bodySlot;

    this.#header.setAttribute('role', 'button');
    this.#header.setAttribute('tabindex', '0');
    this.#header.setAttribute('aria-expanded', this.hasAttribute('open'));

    this.#body.hidden = !this.hasAttribute('open');
  }

  toggle(force) {
    const open = force ?? !this.hasAttribute('open');
    if (open) this.setAttribute('open', '');
    else this.removeAttribute('open');

    this.#header?.setAttribute('aria-expanded', open);
    if (this.#body) this.#body.hidden = !open;

    this.dispatchEvent(new CustomEvent('accordion-change', {
      bubbles: true,
      detail: { item: this, open },
    }));
  }

  #onClick = (e) => {
    if (e.target.closest('[slot="header"]')) this.toggle();
  };

  #onKeyDown = (e) => {
    if (e.target === this.#header && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      this.toggle();
    }
  };
}

class AccordionGroup extends HTMLElement {
  connectedCallback() {
    this.addEventListener('accordion-change', this.#onChange);
  }

  disconnectedCallback() {
    this.removeEventListener('accordion-change', this.#onChange);
  }

  #onChange = (e) => {
    if (!this.hasAttribute('single') || !e.detail.open) return;
    [...this.querySelectorAll('accordion-item')].forEach(item => {
      if (item !== e.target && item.hasAttribute('open')) item.toggle(false);
    });
  };
}

customElements.define('accordion-item', AccordionItem);
customElements.define('accordion-group', AccordionGroup);
