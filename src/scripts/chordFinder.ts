import { readUrlState, writeUrlState } from '../lib/urlState';
import {
  renderScaleChords,
  SCALE_CHORD_DEFAULTS,
  SCALE_CHORD_SCHEMA,
} from '../lib/music/view';
import { createPlayer, notesMidi } from '../lib/music/audio';
import { paintMusicPanel } from './musicPanel';

type State = Record<string, string | number>;

function initWidget(root: HTMLElement): void {
  const panel = root.querySelector<HTMLElement>('[data-music-panel]');
  const rootSelect = root.querySelector<HTMLSelectElement>('[data-field="root"]');
  const scaleSelect = root.querySelector<HTMLSelectElement>('[data-field="scale"]');
  const sevInput = root.querySelector<HTMLInputElement>('[data-field="sev"]');
  const shareBtn = root.querySelector<HTMLButtonElement>('[data-share]');
  const playBtn = root.querySelector<HTMLButtonElement>('[data-play-scale]');

  const player = createPlayer();
  if (!player) {
    if (playBtn) playBtn.disabled = true;
    root.querySelectorAll<HTMLButtonElement>('[data-chord-play], [data-note-play]').forEach(
      (btn) => {
        btn.disabled = true;
      },
    );
  }

  const notePills = (): HTMLElement[] =>
    Array.from(root.querySelectorAll<HTMLElement>('[data-note]'));
  const chordCards = (): HTMLElement[] =>
    Array.from(root.querySelectorAll<HTMLElement>('[data-chord]'));

  const clearPlaying = (): void => {
    notePills().forEach((note) => note.removeAttribute('data-playing'));
    chordCards().forEach((card) => card.removeAttribute('data-playing'));
  };

  const setPlaying = (value: boolean): void => {
    if (!playBtn) return;
    playBtn.textContent = value ? 'Stop' : 'Play scale';
    playBtn.setAttribute('aria-pressed', value ? 'true' : 'false');
  };

  const stopAudio = (): void => {
    player?.stop();
    setPlaying(false);
    clearPlaying();
  };

  const applyState = (state: State): void => {
    if (rootSelect) {
      rootSelect.value = String(state.root ?? SCALE_CHORD_DEFAULTS.root);
      if (rootSelect.value === '') rootSelect.value = SCALE_CHORD_DEFAULTS.root;
    }
    if (scaleSelect) {
      scaleSelect.value = String(state.scale ?? SCALE_CHORD_DEFAULTS.scale);
      if (scaleSelect.value === '') scaleSelect.value = SCALE_CHORD_DEFAULTS.scale;
    }
    if (sevInput) {
      sevInput.checked = String(state.sev ?? SCALE_CHORD_DEFAULTS.sev) === '1';
    }
  };

  const readValues = (): Record<string, string> => ({
    root: rootSelect ? rootSelect.value : SCALE_CHORD_DEFAULTS.root,
    scale: scaleSelect ? scaleSelect.value : SCALE_CHORD_DEFAULTS.scale,
    sev: sevInput && sevInput.checked ? '1' : '0',
  });

  const paint = (): void => {
    const values = readValues();
    if (panel) paintMusicPanel(panel, renderScaleChords(values));
    writeUrlState(SCALE_CHORD_SCHEMA, values, { defaults: SCALE_CHORD_DEFAULTS });
  };

  const playScale = (): void => {
    if (!player) return;
    const view = renderScaleChords(readValues());
    clearPlaying();
    setPlaying(true);
    player.playSequence(notesMidi(view.notes), {
      bpm: 200,
      onStep: (index) => {
        notePills().forEach((note) => note.removeAttribute('data-playing'));
        const pill = notePills()[index];
        if (pill) pill.setAttribute('data-playing', '');
      },
      onEnd: () => {
        clearPlaying();
        setPlaying(false);
      },
    });
  };

  applyState(readUrlState(SCALE_CHORD_SCHEMA));
  paint();

  for (const el of [rootSelect, scaleSelect, sevInput]) {
    if (!el) continue;
    el.addEventListener('input', () => {
      stopAudio();
      paint();
    });
    el.addEventListener('change', () => {
      stopAudio();
      paint();
    });
  }

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      const playing = playBtn.getAttribute('aria-pressed') === 'true';
      if (playing) stopAudio();
      else playScale();
    });
  }

  chordCards().forEach((card, index) => {
    const btn = card.querySelector<HTMLButtonElement>('[data-chord-play]');
    if (!btn || !player) return;
    btn.addEventListener('click', () => {
      if (card.hasAttribute('data-playing')) {
        stopAudio();
        return;
      }
      const view = renderScaleChords(readValues());
      const chord = view.chords[index];
      if (!chord) return;
      clearPlaying();
      card.setAttribute('data-playing', '');
      player.playChord(notesMidi(chord.notes), {
        onEnd: () => card.removeAttribute('data-playing'),
      });
    });
  });

  notePills().forEach((pill, index) => {
    if (!player || !(pill instanceof HTMLButtonElement)) return;
    pill.addEventListener('click', () => {
      const view = renderScaleChords(readValues());
      const note = view.notes[index];
      if (!note) return;
      const [midi] = notesMidi([note]);
      if (midi == null) return;
      clearPlaying();
      pill.setAttribute('data-playing', '');
      player.playNote(midi, {
        onEnd: () => pill.removeAttribute('data-playing'),
      });
    });
  });

  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const original = shareBtn.textContent;
      try {
        await navigator.clipboard.writeText(window.location.href);
        shareBtn.textContent = 'Link copied';
      } catch {
        shareBtn.textContent = 'Copy failed';
      }
      window.setTimeout(() => {
        shareBtn.textContent = original;
      }, 1500);
    });
  }

  window.addEventListener('popstate', () => {
    stopAudio();
    applyState(readUrlState(SCALE_CHORD_SCHEMA));
    if (panel) paintMusicPanel(panel, renderScaleChords(readValues()));
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAudio();
  });
}

document.querySelectorAll<HTMLElement>('[data-scale-widget]').forEach(initWidget);
