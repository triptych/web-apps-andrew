/**
 * Singleton event bus for decoupled component communication.
 *
 * Usage:
 *   import { bus } from './lib/bus.js';
 *
 *   // Emit
 *   bus.emit('something:happened', { value: 42 });
 *
 *   // Subscribe (returns unsubscribe function)
 *   const off = bus.on('something:happened', (e) => console.log(e.detail));
 *   off(); // unsubscribe
 */

class EventBus extends EventTarget {
  /**
   * Emit a named event with optional detail payload.
   * @param {string} name
   * @param {*} detail
   */
  emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail }));
  }

  /**
   * Subscribe to a named event.
   * @param {string} name
   * @param {function} callback - receives the CustomEvent
   * @returns {function} unsubscribe
   */
  on(name, callback) {
    this.addEventListener(name, callback);
    return () => this.removeEventListener(name, callback);
  }
}

export const bus = new EventBus();
