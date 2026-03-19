import { bus } from '../events/bus.js';

const FORTUNES = [
  "The dragon you fear most guards the treasure you seek.",
  "A hidden door waits behind the waterfall of your doubt.",
  "Your next companion shall arrive bearing an unusual hat.",
  "The map is wrong. Trust the old woman at the crossroads.",
  "Beware the merchant who smiles too wide at midnight.",
  "What you seek lies three leagues past where you wish to stop.",
  "The dungeon's deepest room holds a mirror, not a monster.",
  "Your sword arm is strong; your listening ear is stronger.",
  "A cursed item will save your life before the next moon.",
  "The wizard you distrust speaks one truth worth keeping.",
  "Riches await beneath the tavern you have passed a hundred times.",
  "Your greatest spell has yet to be cast. Save it wisely.",
  "An unlikely alliance with a goblin shall tip the balance.",
  "The prophecy spoke of you, but got your name slightly wrong.",
  "Strength alone will not open the iron gate. Bring cheese.",
  "A forgotten scroll in your pack holds tomorrow's answer.",
  "The healer you overlooked will carry the party to victory.",
  "Do not trust the second bridge. The third is safe.",
  "Your rivals act from fear. Fear is a door, not a wall.",
  "The final boss is tired. So are you. Negotiate.",
  "Fortune favors the rogue who greases the hinge beforehand.",
  "The ancient ruin is ancient for a reason. Mind your step.",
  "A minor enchantment will avert a major catastrophe.",
  "The tavern keeper knows more than she lets on. Ask again.",
  "One of your party carries a secret that will surprise you — pleasantly.",
  "The dark forest path is quicker and only somewhat cursed.",
  "Today's failed saving throw is tomorrow's interesting scar.",
  "You will find what you lost under the cloak of your enemy.",
  "The ghost is not angry. It is lonely. Offer a kind word.",
  "Level up your patience; the dungeon rewards the unhurried.",
];

/**
 * Fortune card that reveals a random RPG fortune on demand.
 * Emits `fortune:revealed` on the event bus with the fortune text as detail.
 */
export class FortuneCard extends HTMLElement {
  #fortune = null;
  #revealed = false;
  #root = null;

  connectedCallback() {
    this.#root = this.attachShadow({ mode: 'open' });
    this.#render();

    this.#root.addEventListener('click', (e) => {
      if (e.target.closest('#reveal-btn')) this.#reveal();
      if (e.target.closest('#new-btn'))    this.#reset();
    });

    this.#root.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!this.#revealed) this.#reveal();
      }
    });
  }

  disconnectedCallback() {}

  #pick() {
    return FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
  }

  #reveal() {
    this.#fortune = this.#pick();
    this.#revealed = true;
    this.#render();
    bus.emit('fortune:revealed', { fortune: this.#fortune });
  }

  #reset() {
    this.#fortune = null;
    this.#revealed = false;
    this.#render();
  }

  #render() {
    this.#root.innerHTML = `
      <style>
        :host { display: block; }
        .card {
          background: var(--color-surface);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-card);
          padding: 2.5rem 2rem;
          max-width: 480px;
          width: 100%;
          text-align: center;
          position: relative;
          transition: transform var(--transition), box-shadow var(--transition);
        }
        .scroll-top, .scroll-bottom {
          width: 100%;
          height: 24px;
          background: var(--color-scroll);
          border-radius: var(--radius-lg);
          margin: -2.5rem -2rem;
          display: block;
        }
        .scroll-top { margin-bottom: 1.5rem; margin-top: 0; border-radius: var(--radius-lg) var(--radius-lg) 4px 4px; }
        .scroll-bottom { margin-top: 1.5rem; margin-bottom: 0; border-radius: 4px 4px var(--radius-lg) var(--radius-lg); }
        .rune { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .title {
          font-family: var(--font-display);
          font-size: 1.1rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-accent);
          margin-bottom: 1.5rem;
        }
        .fortune-text {
          font-family: var(--font-body);
          font-size: 1.2rem;
          line-height: 1.7;
          color: var(--color-text);
          font-style: italic;
          min-height: 4rem;
          margin-bottom: 1.5rem;
        }
        .placeholder {
          color: var(--color-muted);
          font-size: 1rem;
          font-style: normal;
          min-height: 4rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
        button {
          font-family: var(--font-display);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 0.85rem;
          padding: 0.6rem 1.4rem;
          border: 2px solid var(--color-accent);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background var(--transition), color var(--transition);
          background: transparent;
          color: var(--color-accent);
        }
        button.primary {
          background: var(--color-accent);
          color: var(--color-accent-text);
        }
        button:hover, button:focus-visible {
          background: var(--color-accent-hover);
          color: var(--color-accent-text);
          outline: none;
        }
        .reveal-anim {
          animation: fadeIn 0.5s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      </style>
      <div class="card" tabindex="${this.#revealed ? -1 : 0}" role="region" aria-label="Fortune card">
        <div class="rune">&#x1F4DC;</div>
        <div class="title">The Oracle Speaks</div>
        ${this.#revealed
          ? `<p class="fortune-text reveal-anim">"${this.#fortune}"</p>`
          : `<div class="placeholder">Seek your fate&hellip;</div>`
        }
        <div class="actions">
          ${!this.#revealed
            ? `<button id="reveal-btn" class="primary" aria-label="Reveal your fortune">Consult the Oracle</button>`
            : `<button id="new-btn" aria-label="Get a new fortune">Another Fortune</button>`
          }
        </div>
      </div>
    `;
  }
}

customElements.define('fortune-card', FortuneCard);
