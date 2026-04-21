/** Singleton event bus for decoupled inter-component communication. */
class EventBus extends EventTarget {
  /** @param {string} name @param {any} detail */
  emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail }));
  }

  /** @param {string} name @param {(e: CustomEvent) => void} callback */
  on(name, callback) {
    this.addEventListener(name, callback);
  }

  /** @param {string} name @param {(e: CustomEvent) => void} callback */
  off(name, callback) {
    this.removeEventListener(name, callback);
  }
}

export const bus = new EventBus();
