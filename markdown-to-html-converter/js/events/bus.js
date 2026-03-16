/**
 * Singleton event bus for decoupled component communication.
 * All inter-component events should flow through this bus.
 */
class EventBus extends EventTarget {
  /**
   * Emit a named event with optional detail payload.
   * @param {string} name - Event name (e.g. 'markdown:change')
   * @param {*} detail - Payload attached to the event
   */
  emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail }));
  }

  /**
   * Subscribe to a named event.
   * @param {string} name - Event name to listen for
   * @param {function} callback - Handler receiving the CustomEvent
   * @returns {function} Unsubscribe function
   */
  on(name, callback) {
    this.addEventListener(name, callback);
    return () => this.removeEventListener(name, callback);
  }
}

export const bus = new EventBus();
