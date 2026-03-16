import { bus } from '../events/bus.js';
import { parseMarkdown } from '../markdown.js';

/**
 * Live HTML preview of parsed markdown.
 * Listens to `markdown:change` on the event bus.
 */
export class AppPreview extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: flex; flex-direction: column; height: 100%; }
        .toolbar {
          display: flex;
          align-items: center;
          padding: .5rem 1rem;
          background: var(--color-surface, #fff);
          border-bottom: 1px solid var(--color-border, #dee2e6);
          flex-shrink: 0;
        }
        .toolbar-label {
          font-size: .75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: .05em;
          color: var(--color-text-muted, #6c757d);
        }
        .preview-area {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem 2rem;
          background: var(--color-surface, #fff);
        }
      </style>
      <div class="toolbar">
        <span class="toolbar-label">Preview</span>
      </div>
      <div class="preview-area md-preview" id="preview"></div>
    `;

    this._preview = this.shadowRoot.getElementById('preview');

    this._unsub = bus.on('markdown:change', ({ detail }) => {
      this._preview.innerHTML = parseMarkdown(detail.value);
    });

    bus.emit('markdown:request');
  }

  disconnectedCallback() {
    this._unsub?.();
  }
}

customElements.define('app-preview', AppPreview);
