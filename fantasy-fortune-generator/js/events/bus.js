/** Singleton event bus for decoupled component communication. */
const target = new EventTarget();

export const bus = {
  /**
   * Listen for a named event.
   * @param {string} name
   * @param {(e: CustomEvent) => void} callback
   * @returns {() => void} unsubscribe function
   */
  on(name, callback) {
    target.addEventListener(name, callback);
    return () => target.removeEventListener(name, callback);
  },

  /**
   * Emit a named event with optional detail payload.
   * @param {string} name
   * @param {*} [detail]
   */
  emit(name, detail) {
    target.dispatchEvent(new CustomEvent(name, { detail }));
  },
};
