# web-apps-andrew

A collection of vanilla HTML/CSS/JS web apps and reusable custom element components. No build step, no frameworks, no dependencies.

## Projects

### [markdown-to-html-converter](./markdown-to-html-converter/)

A browser-based Markdown editor and live preview tool. Paste or type Markdown on the left and see rendered HTML on the right. Includes source view, copy, and download options.

### [lib](./lib/)

A reusable custom element library (`lib`) — plain JS web components ready to drop into any project via `<script type="module">`.

| Component | Elements |
|-----------|----------|
| Tabs | `<tab-group>`, `<tab-item>`, `<tab-panel>` |
| Modal | `<modal-dialog>` |
| Menu | `<drop-menu>`, `<menu-item>`, `<menu-separator>` |
| Toast | `<toast-rack>`, `<toast-item>` |
| Accordion | `<accordion-group>`, `<accordion-item>` |
| Drag & Drop | `<drag-container>`, `<drag-item>` |
| Tooltip | `<tool-tip>` |

See [lib/README.md](./lib/README.md) for full usage and API docs.

## Philosophy

- No build tools
- No frameworks
- No dependencies
- Standard web platform APIs only

## License

MIT — see [LICENSE](./LICENSE)
