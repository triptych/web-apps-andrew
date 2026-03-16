// Register all custom elements
import './components/app-menubar.js';
import './components/app-layout.js';
import './components/app-tabs.js';
import './components/app-modal.js';
import './components/app-editor.js';
import './components/app-preview.js';
import './components/app-source.js';

import { bus } from './events/bus.js';

// Bootstrap: fire app:ready once DOM is parsed
bus.emit('app:ready', { timestamp: Date.now() });
