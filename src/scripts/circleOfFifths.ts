import { readUrlState, writeUrlState } from '../lib/urlState';
import type { ParamSchema } from '../lib/urlState';
import { renderScaleChords } from '../lib/music/view';
import { createPlayer, notesMidi } from '../lib/music/audio';
import {
  chordFamily,
  circleChords,
  circleForKey,
  keySignatureLabel,
  type CircleRing,
  type RingChord,
} from '../lib/music/circle';
import { paintMusicPanel } from './musicPanel';

const SCHEMA: ParamSchema = { key: 'string' };
const DEFAULT_KEY = 'C';
const SEGMENT = 30;

function initCircle(root: HTMLElement): void {
  const panel = root.querySelector<HTMLElement>('[data-music-panel]');
  const wheel = root.querySelector<SVGGElement>('[data-wheel]');
  const labels = Array.from(root.querySelectorAll<SVGTextElement>('[data-wheel-label]'));
  const groups = root.querySelectorAll<SVGGElement>('[data-circle-key]');
  const cells = Array.from(root.querySelectorAll<SVGGElement>('[data-cell]'));
  const majorEl = root.querySelector<SVGTextElement>('[data-circle-major]');
  const minorEl = root.querySelector<SVGTextElement>('[data-circle-minor]');
  const sigEl = root.querySelector<SVGTextElement>('[data-circle-signature]');

  const player = createPlayer();
  let currentKey = DEFAULT_KEY;

  const chordByCell = new Map<string, RingChord>();
  circleChords().forEach((chord) => chordByCell.set(`${chord.ring}:${chord.index}`, chord));

  const cards = (): HTMLElement[] =>
    Array.from(root.querySelectorAll<HTMLElement>('[data-chord]'));
  const clearPlaying = (): void => {
    cards().forEach((card) => card.removeAttribute('data-playing'));
  };

  if (!player) {
    root.querySelectorAll<HTMLButtonElement>('[data-chord-play]').forEach((btn) => {
      btn.disabled = true;
    });
  }

  const applyKey = (key: string, write: boolean, animate = true): void => {
    const entry = circleForKey(key) ?? circleForKey(DEFAULT_KEY)!;
    currentKey = entry.major;

    const rotation = -entry.index * SEGMENT;
    if (!animate) {
      if (wheel) wheel.style.transition = 'none';
      labels.forEach((label) => (label.style.transition = 'none'));
    }
    if (wheel) wheel.style.transform = `rotate(${rotation}deg)`;
    labels.forEach((label) => {
      label.style.transform = `rotate(${-rotation}deg)`;
    });
    if (!animate) {
      requestAnimationFrame(() => {
        if (wheel) wheel.style.transition = '';
        labels.forEach((label) => (label.style.transition = ''));
      });
    }

    const family = chordFamily(entry.major);
    cells.forEach((cell) => {
      const ring = cell.dataset.ring as CircleRing | undefined;
      const index = Number(cell.dataset.index);
      const selected = family.some((chord) => chord.ring === ring && chord.index === index);
      cell.toggleAttribute('data-selected', selected);
    });

    if (majorEl) majorEl.textContent = entry.major;
    if (minorEl) minorEl.textContent = `${entry.minor} minor`;
    if (sigEl) sigEl.textContent = keySignatureLabel(entry.accidentals);

    if (panel) {
      paintMusicPanel(panel, renderScaleChords({ root: entry.major, scale: 'major', sev: '0' }));
    }

    if (write) {
      writeUrlState(SCHEMA, { key: entry.major }, { defaults: { key: DEFAULT_KEY } });
    }
  };

  const select = (key: string): void => {
    if (key === currentKey) return;
    player?.stop();
    clearPlaying();
    applyKey(key, true);
  };

  groups.forEach((group) => {
    const key = group.dataset.circleKey;
    if (!key) return;
    group.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        select(key);
      }
    });
  });

  cells.forEach((cell) => {
    cell.addEventListener('click', () => {
      const key = cell.closest<SVGGElement>('[data-circle-key]')?.dataset.circleKey;
      if (key) select(key);

      if (!player) return;
      const ring = cell.dataset.ring;
      const index = cell.dataset.index;
      if (!ring || index == null) return;
      const chord = chordByCell.get(`${ring}:${index}`);
      if (!chord) return;
      player.playChord(notesMidi(chord.notes), { duration: 1.2 });
    });
  });

  cards().forEach((card, index) => {
    const btn = card.querySelector<HTMLButtonElement>('[data-chord-play]');
    if (!btn || !player) return;
    btn.addEventListener('click', () => {
      if (card.hasAttribute('data-playing')) {
        player.stop();
        card.removeAttribute('data-playing');
        return;
      }
      const view = renderScaleChords({ root: currentKey, scale: 'major', sev: '0' });
      const chord = view.chords[index];
      if (!chord) return;
      clearPlaying();
      card.setAttribute('data-playing', '');
      player.playChord(notesMidi(chord.notes), {
        duration: 1.2,
        onEnd: () => card.removeAttribute('data-playing'),
      });
    });
  });

  const initial = readUrlState(SCHEMA);
  applyKey(typeof initial.key === 'string' ? initial.key : DEFAULT_KEY, false, false);

  window.addEventListener('popstate', () => {
    const state = readUrlState(SCHEMA);
    const key = typeof state.key === 'string' ? state.key : DEFAULT_KEY;
    if (key !== currentKey) applyKey(key, false);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      player?.stop();
      clearPlaying();
    }
  });
}

document.querySelectorAll<HTMLElement>('[data-circle-widget]').forEach(initCircle);
