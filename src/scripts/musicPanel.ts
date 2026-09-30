import type { ScaleChordView } from '../lib/music/view';

export function paintMusicPanel(root: HTMLElement, view: ScaleChordView): void {
  const rootNameEl = root.querySelector<HTMLElement>('[data-root-name]');
  if (rootNameEl) rootNameEl.textContent = view.rootName;

  const scaleNameEl = root.querySelector<HTMLElement>('[data-scale-name]');
  if (scaleNameEl) scaleNameEl.textContent = view.scaleName;

  root.dataset.seventh = view.seventh ? '1' : '0';

  const notesEl = root.querySelector<HTMLElement>('[data-scale-notes]');
  if (notesEl) {
    const pills = notesEl.querySelectorAll<HTMLElement>('[data-note]');
    view.notes.forEach((note, index) => {
      const pill = pills[index];
      if (pill) pill.textContent = note.name;
    });
  }

  const cards = root.querySelectorAll<HTMLElement>('[data-chord]');
  view.chords.forEach((chord, index) => {
    const card = cards[index];
    if (!card) return;
    card.dataset.kind = chord.kind;

    const roman = card.querySelector<HTMLElement>('[data-chord-roman]');
    if (roman) roman.textContent = chord.roman;

    const symbol = card.querySelector<HTMLElement>('[data-chord-symbol]');
    if (symbol) symbol.textContent = chord.symbol;

    const notes = card.querySelector<HTMLElement>('[data-chord-notes]');
    if (notes) notes.textContent = chord.notes.map((note) => note.name).join(' ');

    const quality = card.querySelector<HTMLElement>('[data-chord-quality]');
    if (quality) quality.textContent = chord.quality;
  });
}
