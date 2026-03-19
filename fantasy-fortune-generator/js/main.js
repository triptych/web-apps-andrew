import { bus } from './events/bus.js';
import './components/app-layout.js';
import './components/fortune-card.js';
import './components/fortune-history.js';

bus.on('layout:ready', () => {
  bus.emit('app:ready');
});

bus.on('fortune:revealed', ({ detail }) => {
  console.log('[fortune]', detail.fortune);
});
