import './components/app-layout.js';
import './components/app-modal.js';
import './components/news-reader.js';
import { bus } from './events/bus.js';

bus.on('layout:ready', () => {
  bus.emit('app:ready', { ts: Date.now() });
});

bus.on('news:loaded', ({ detail }) => {
  document.title = `JRPG News — ${detail.date}`;
});
