import { bus } from '../events/bus.js';

const PLACEHOLDER = `# Hello, Markdown!

Write your **markdown** here and see it converted in real time.

## Features

- Live preview
- HTML source view
- Copy HTML to clipboard

> Blockquotes work too!

\`\`\`js
const greet = name => \`Hello, \${name}!\`;
console.log(greet('world'));
\`\`\`

| Column A | Column B |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
`;

/**
 * Markdown textarea editor.
 * Emits `markdown:change` on the event bus with `{ value }` detail.
 */
export class AppEditor extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: flex; flex-direction: column; height: 100%; }
        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
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
        .toolbar-actions { display: flex; gap: .4rem; }
        button {
          padding: .3rem .7rem;
          border: 1px solid var(--color-border, #dee2e6);
          border-radius: var(--radius, 6px);
          background: var(--color-surface, #fff);
          color: var(--color-text, #212529);
          font-size: .8rem;
          cursor: pointer;
          transition: background var(--transition, 150ms ease);
        }
        button:hover { background: var(--color-surface-2, #f1f3f5); }
        textarea {
          flex: 1;
          resize: none;
          border: none;
          outline: none;
          padding: 1.25rem;
          font-family: var(--font-mono, monospace);
          font-size: .9rem;
          line-height: 1.7;
          background: var(--color-bg, #f8f9fa);
          color: var(--color-text, #212529);
          tab-size: 2;
          overflow-y: auto;
        }
        textarea::placeholder { color: var(--color-text-muted, #6c757d); }
      </style>
      <div class="toolbar">
        <span class="toolbar-label">Markdown</span>
        <div class="toolbar-actions">
          <button id="clear-btn" title="Clear editor">Clear</button>
          <button id="sample-btn" title="Load sample">Sample</button>
        </div>
      </div>
      <textarea id="md-input" spellcheck="false" placeholder="Type markdown here…" aria-label="Markdown input"></textarea>
    `;

    this._textarea = this.shadowRoot.getElementById('md-input');
    this._textarea.value = PLACEHOLDER;

    this._onInput = () => bus.emit('markdown:change', { value: this._textarea.value });
    this._textarea.addEventListener('input', this._onInput);

    this.shadowRoot.getElementById('clear-btn').addEventListener('click', () => {
      this._textarea.value = '';
      bus.emit('markdown:change', { value: '' });
    });
    this.shadowRoot.getElementById('sample-btn').addEventListener('click', () => {
      this._textarea.value = PLACEHOLDER;
      bus.emit('markdown:change', { value: PLACEHOLDER });
    });

    // Respond to late-connecting components that missed the initial emit
    this._unsubRequest = bus.on('markdown:request', () => {
      bus.emit('markdown:change', { value: this._textarea.value });
    });

    // Emit initial value
    bus.emit('markdown:change', { value: this._textarea.value });

    // File menu integration
    this._unsubNew = bus.on('file:new', () => {
      this._textarea.value = '';
      bus.emit('markdown:change', { value: '' });
    });
    this._unsubOpen = bus.on('file:open', (e) => {
      this._textarea.value = e.detail.content;
      bus.emit('markdown:change', { value: e.detail.content });
    });
  }

  disconnectedCallback() {
    this._textarea?.removeEventListener('input', this._onInput);
    this._unsubNew?.();
    this._unsubOpen?.();
    this._unsubRequest?.();
  }
}

customElements.define('app-editor', AppEditor);
