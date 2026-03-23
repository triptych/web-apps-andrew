/**
 * Tab container reading <tab-panel label="..."> slotted children.
 * Emits `tabs:change` with { from, to } on change.
 */
export class AppTabs extends HTMLElement {
  #active = 0;

  connectedCallback() {
    this._shadow = this.attachShadow({ mode: 'open' });
    this._render();
  }

  _panels() {
    return [...this.querySelectorAll('tab-panel')];
  }

  _render() {
    const panels = this._panels();
    this._shadow.innerHTML = `
      <style>
        :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
        [role="tablist"] {
          display: flex; gap: 2px; padding: 6px 10px 0;
          background: var(--color-surface, #111827);
          border-bottom: 1px solid var(--color-border, #2d3f5a);
          flex-shrink: 0;
        }
        button[role="tab"] {
          background: none; border: none; border-bottom: 2px solid transparent;
          padding: 6px 16px 8px; font-size: 13px; font-weight: 500;
          color: var(--color-muted, #94a3b8); cursor: pointer;
          transition: color .15s, border-color .15s;
          border-radius: 0;
        }
        button[role="tab"]:hover { color: var(--color-text, #e2e8f0); }
        button[role="tab"][aria-selected="true"] {
          color: var(--color-accent, #22d3ee);
          border-bottom-color: var(--color-accent, #22d3ee);
        }
        .panel-host { flex: 1; overflow: hidden; }
      </style>
      <div role="tablist" aria-label="Simulator tabs">
        ${panels.map((p, i) => `
          <button
            role="tab"
            id="tab-${i}"
            aria-selected="${i === this.#active}"
            aria-controls="panel-${i}"
            tabindex="${i === this.#active ? 0 : -1}"
            data-index="${i}"
          >${p.getAttribute('label')}</button>
        `).join('')}
      </div>
      <div class="panel-host">
        <slot></slot>
      </div>
    `;

    this._shadow.querySelectorAll('[role="tab"]').forEach(btn => {
      btn.addEventListener('click', () => this._activate(+btn.dataset.index));
      btn.addEventListener('keydown', e => this._onKey(e));
    });

    this._updatePanels();
  }

  _activate(idx) {
    const from = this.#active;
    this.#active = idx;
    this.dispatchEvent(new CustomEvent('tabs:change', {
      bubbles: true, composed: true, detail: { from, to: idx }
    }));
    this._updateTabs();
    this._updatePanels();
  }

  _updateTabs() {
    this._shadow.querySelectorAll('[role="tab"]').forEach((btn, i) => {
      const active = i === this.#active;
      btn.setAttribute('aria-selected', active);
      btn.tabIndex = active ? 0 : -1;
    });
  }

  _updatePanels() {
    this._panels().forEach((p, i) => {
      p.hidden = i !== this.#active;
      p.setAttribute('role', 'tabpanel');
      p.id = `panel-${i}`;
      p.setAttribute('aria-labelledby', `tab-${i}`);
    });
  }

  _onKey(e) {
    const tabs = [...this._shadow.querySelectorAll('[role="tab"]')];
    const cur = tabs.indexOf(e.target);
    if (e.key === 'ArrowRight') this._activate((cur + 1) % tabs.length);
    else if (e.key === 'ArrowLeft') this._activate((cur - 1 + tabs.length) % tabs.length);
    else if (e.key === 'Home') this._activate(0);
    else if (e.key === 'End') this._activate(tabs.length - 1);
  }

  disconnectedCallback() {}
}

export class TabPanel extends HTMLElement {
  connectedCallback() {
    this.style.cssText = 'display:block;height:100%;overflow:hidden;';
  }
}

customElements.define('app-tabs', AppTabs);
customElements.define('tab-panel', TabPanel);
