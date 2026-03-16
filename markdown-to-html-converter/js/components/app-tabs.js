/**
 * Tabbed interface reading <tab-panel label="..."> children.
 * Emits `tabs:change` (bubbles, composed) on tab switch.
 * Keyboard: ArrowLeft/Right/Home/End
 */
export class AppTabs extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this._panels = [...this.querySelectorAll('tab-panel')];
    this._activeIndex = 0;
    this._render();
    this._bindKeys();
  }

  disconnectedCallback() {
    this.shadowRoot?.querySelector('[role="tablist"]')
      ?.removeEventListener('keydown', this._onKeyDown);
  }

  _render() {
    const labels = this._panels.map(p => p.getAttribute('label') || '');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .tablist-wrapper {
          background: var(--color-surface, #fff);
          border-bottom: 1px solid var(--color-border, #dee2e6);
          padding: 0 1rem;
          flex-shrink: 0;
        }
        [role="tablist"] {
          display: flex;
          gap: .25rem;
          list-style: none;
          margin: 0; padding: 0;
        }
        [role="tab"] {
          padding: .65rem 1rem;
          border: none;
          background: none;
          cursor: pointer;
          font-size: .875rem;
          font-weight: 500;
          color: var(--color-text-muted, #6c757d);
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: color var(--transition, 150ms ease), border-color var(--transition, 150ms ease);
          white-space: nowrap;
          outline: none;
        }
        [role="tab"]:hover { color: var(--color-text, #212529); }
        [role="tab"][aria-selected="true"] {
          color: var(--color-accent, #4f46e5);
          border-bottom-color: var(--color-accent, #4f46e5);
        }
        [role="tab"]:focus-visible {
          outline: 2px solid var(--color-accent, #4f46e5);
          outline-offset: -2px;
          border-radius: 4px 4px 0 0;
        }
        .panel-host {
          flex: 1;
          overflow: hidden;
          position: relative;
        }
        ::slotted(tab-panel) {
          display: none;
          height: 100%;
        }
        ::slotted(tab-panel[active]) {
          display: block;
        }
      </style>
      <div class="tablist-wrapper">
        <ul role="tablist" aria-label="Content tabs">
          ${labels.map((label, i) => `
            <li role="presentation">
              <button
                role="tab"
                id="tab-${i}"
                aria-controls="panel-${i}"
                aria-selected="${i === this._activeIndex}"
                tabindex="${i === this._activeIndex ? '0' : '-1'}"
              >${label}</button>
            </li>
          `).join('')}
        </ul>
      </div>
      <div class="panel-host">
        <slot></slot>
      </div>
    `;

    this._panels.forEach((panel, i) => {
      panel.id = `panel-${i}`;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', `tab-${i}`);
      if (i === this._activeIndex) panel.setAttribute('active', '');
      else panel.removeAttribute('active');
    });

    this.shadowRoot.querySelectorAll('[role="tab"]').forEach((btn, i) => {
      btn.addEventListener('click', () => this._activate(i));
    });
  }

  _activate(index) {
    const from = this._activeIndex;
    if (from === index) return;
    this._activeIndex = index;

    const tabs = this.shadowRoot.querySelectorAll('[role="tab"]');
    tabs.forEach((btn, i) => {
      const active = i === index;
      btn.setAttribute('aria-selected', String(active));
      btn.tabIndex = active ? 0 : -1;
    });

    this._panels.forEach((panel, i) => {
      if (i === index) panel.setAttribute('active', '');
      else panel.removeAttribute('active');
    });

    this.dispatchEvent(new CustomEvent('tabs:change', {
      detail: { from, to: index, label: this._panels[index].getAttribute('label') },
      bubbles: true,
      composed: true,
    }));

    // Focus new tab
    tabs[index]?.focus();
  }

  _bindKeys() {
    this._onKeyDown = (e) => {
      const tabs = [...this.shadowRoot.querySelectorAll('[role="tab"]')];
      const current = tabs.findIndex(t => t === this.shadowRoot.activeElement);
      if (current === -1) return;

      let next = current;
      if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      else return;

      e.preventDefault();
      this._activate(next);
    };

    this.shadowRoot.querySelector('[role="tablist"]')
      ?.addEventListener('keydown', this._onKeyDown);
  }
}

customElements.define('app-tabs', AppTabs);

// Minimal tab-panel host element
export class TabPanel extends HTMLElement {}
customElements.define('tab-panel', TabPanel);
