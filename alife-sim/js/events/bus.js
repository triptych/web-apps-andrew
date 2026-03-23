/**
 * Singleton event bus for decoupled component communication.
 */
class EventBus extends EventTarget {
  /** @param {string} name @param {*} detail */
  emit(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, { detail }));
  }
  /** @param {string} name @param {(e: CustomEvent) => void} cb */
  on(name, cb) {
    this.addEventListener(name, cb);
  }
  /** @param {string} name @param {(e: CustomEvent) => void} cb */
  off(name, cb) {
    this.removeEventListener(name, cb);
  }
}

export const bus = new EventBus();
