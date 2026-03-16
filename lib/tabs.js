/**
 * <tab-group> — manages tabs and panels
 *
 * Events:
 *   'tab-change' → { tab, panel, index }
 *
 * Attributes (on tab-group):
 *   active — index of the active tab (default: 0)
 *
 * Usage:
 *   <tab-group>
 *     <tab-list>
 *       <tab-item>Tab 1</tab-item>
 *       <tab-item>Tab 2</tab-item>
 *     </tab-list>
 *     <tab-panel>Content 1</tab-panel>
 *     <tab-panel>Content 2</tab-panel>
 *   </tab-group>
 */

class TabGroup extends HTMLElement {
  static observedAttributes = ['active'];

  connectedCallback() {
    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKeyDown);
    this.#activate(Number(this.getAttribute('active') ?? 0), false);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('keydown', this.#onKeyDown);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'active' && oldVal !== newVal) {
      this.#activate(Number(newVal), false);
    }
  }

  get tabs() { return [...this.querySelectorAll('tab-item')]; }
  get panels() { return [...this.querySelectorAll('tab-panel')]; }

  #activate(index, emit = true) {
    const tabs = this.tabs;
    const panels = this.panels;
    if (!tabs.length) return;
    index = Math.max(0, Math.min(index, tabs.length - 1));

    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', active);
      tab.setAttribute('tabindex', active ? '0' : '-1');
    });
    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
    });

    if (emit) {
      this.dispatchEvent(new CustomEvent('tab-change', {
        bubbles: true,
        detail: { tab: tabs[index], panel: panels[index], index },
      }));
    }
  }

  #onClick = (e) => {
    const tab = e.target.closest('tab-item');
    if (!tab) return;
    const index = this.tabs.indexOf(tab);
    if (index !== -1) this.#activate(index);
  };

  #onKeyDown = (e) => {
    if (!e.target.closest('tab-item')) return;
    const tabs = this.tabs;
    const current = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
    let next = current;
    if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    this.#activate(next);
    tabs[next].focus();
  };
}

class TabItem extends HTMLElement {
  connectedCallback() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'tab');
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '-1');
  }
}

class TabPanel extends HTMLElement {
  connectedCallback() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'tabpanel');
  }
}

customElements.define('tab-group', TabGroup);
customElements.define('tab-item', TabItem);
customElements.define('tab-panel', TabPanel);
