/**
 * <drag-container> — wraps draggable items
 * <drag-item> — individual draggable item
 *
 * Events:
 *   drag-container: 'item-dropped' → { item, from, to, newIndex }
 *
 * Usage:
 *   <drag-container>
 *     <drag-item>One</drag-item>
 *     <drag-item>Two</drag-item>
 *   </drag-container>
 */

class DragItem extends HTMLElement {
  connectedCallback() {
    this.setAttribute('draggable', 'true');
    this.addEventListener('dragstart', this.#onDragStart);
    this.addEventListener('dragend', this.#onDragEnd);
  }

  disconnectedCallback() {
    this.removeEventListener('dragstart', this.#onDragStart);
    this.removeEventListener('dragend', this.#onDragEnd);
  }

  #onDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
    this.classList.add('dragging');
    DragItem.dragging = this;
  };

  #onDragEnd = () => {
    this.classList.remove('dragging');
    DragItem.dragging = null;
    document.querySelectorAll('drag-container').forEach(c => c.clearIndicator?.());
  };
}
DragItem.dragging = null;

class DragContainer extends HTMLElement {
  connectedCallback() {
    this.addEventListener('dragover', this.#onDragOver);
    this.addEventListener('drop', this.#onDrop);
    this.addEventListener('dragleave', this.#onDragLeave);
  }

  disconnectedCallback() {
    this.removeEventListener('dragover', this.#onDragOver);
    this.removeEventListener('drop', this.#onDrop);
    this.removeEventListener('dragleave', this.#onDragLeave);
  }

  clearIndicator() {
    this.querySelector('.drop-indicator')?.remove();
  }

  #getItemAfter(y) {
    const items = [...this.querySelectorAll('drag-item:not(.dragging)')];
    return items.find(item => {
      const box = item.getBoundingClientRect();
      return y < box.top + box.height / 2;
    }) ?? null;
  }

  #onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const after = this.#getItemAfter(e.clientY);
    this.clearIndicator();
    const indicator = document.createElement('div');
    indicator.className = 'drop-indicator';
    indicator.style.cssText = 'height:2px;background:currentColor;opacity:0.4;pointer-events:none;';
    if (after) this.insertBefore(indicator, after);
    else this.appendChild(indicator);
  };

  #onDragLeave = (e) => {
    if (!this.contains(e.relatedTarget)) this.clearIndicator();
  };

  #onDrop = (e) => {
    e.preventDefault();
    this.clearIndicator();
    const item = DragItem.dragging;
    if (!item) return;
    const from = item.parentElement;
    const after = this.#getItemAfter(e.clientY);
    if (after) this.insertBefore(item, after);
    else this.appendChild(item);
    const newIndex = [...this.children].indexOf(item);
    this.dispatchEvent(new CustomEvent('item-dropped', {
      bubbles: true,
      detail: { item, from, to: this, newIndex },
    }));
  };
}

customElements.define('drag-item', DragItem);
customElements.define('drag-container', DragContainer);
