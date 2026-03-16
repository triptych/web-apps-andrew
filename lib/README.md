# llib — Reusable Custom Element Library

Plain JS custom elements. No build step, no dependencies. Import via `<script type="module">`.

## Modules

| File | Elements | Description |
|------|----------|-------------|
| `drag-drop.js` | `<drag-container>`, `<drag-item>` | Sortable drag-and-drop lists |
| `tabs.js` | `<tab-group>`, `<tab-item>`, `<tab-panel>` | Accessible tabbed interface |
| `menu.js` | `<drop-menu>`, `<menu-item>`, `<menu-separator>` | Dropdown/context menu |
| `modal.js` | `<modal-dialog>` | Accessible modal dialog with backdrop |
| `toast.js` | `<toast-rack>`, `<toast-item>` | Toast / notification system |
| `accordion.js` | `<accordion-group>`, `<accordion-item>` | Collapsible accordion sections |
| `tooltip.js` | `<tool-tip>` | Hover/focus tooltips |

## Usage

```html
<script type="module" src="./llib/tabs.js"></script>

<tab-group>
  <tab-list>
    <tab-item>Tab 1</tab-item>
    <tab-item>Tab 2</tab-item>
  </tab-list>
  <tab-panel>Content 1</tab-panel>
  <tab-panel>Content 2</tab-panel>
</tab-group>
```

## Events

All events bubble. Listen on any ancestor.

| Element | Event | `detail` |
|---------|-------|---------|
| `drag-container` | `item-dropped` | `{ item, from, to, newIndex }` |
| `tab-group` | `tab-change` | `{ tab, panel, index }` |
| `drop-menu` | `menu-select` | `{ item, value }` |
| `modal-dialog` | `modal-open` | `{}` |
| `modal-dialog` | `modal-close` | `{ reason }` |
| `toast-rack` | `toast-dismiss` | `{ toast, id }` |
| `accordion-item` | `accordion-change` | `{ item, open }` |

## Styling

All elements are unstyled by default. Add classes or target element names in CSS:

```css
tab-item { cursor: pointer; padding: 8px 16px; }
tab-item.active { border-bottom: 2px solid currentColor; }
tab-panel { padding: 16px; }

toast-rack { position: fixed; bottom: 1rem; right: 1rem; display: flex; flex-direction: column; gap: 8px; }
toast-item { background: #333; color: #fff; padding: 8px 12px; border-radius: 4px; opacity: 0; transition: opacity 0.2s; }
toast-item.visible { opacity: 1; }
```
