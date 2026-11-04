import {
  decodeBase64ToBytes,
  decodeUtf8,
  encodeBase64,
  encodeBytesToBase64,
  wrapBase64,
} from '../lib/base64';
import { formatBytes, safeFilename, sniffFileType, type FileType } from '../lib/fileType';
import { readUrlState, writeUrlState } from '../lib/urlState';
import { downloadBlob } from './download';
import { wireCopy, wireShare } from './ui';

const schema = { dir: 'string', urlSafe: 'number' } as const;
const defaults = { dir: 'encode', urlSafe: 0 };
const STATUS_BASE = 'mt-2 text-xs text-zinc-500 dark:text-zinc-500';
const STATUS_ERROR = 'mt-2 text-xs text-rose-600 dark:text-rose-400';
const LARGE_FILE = 10 * 1024 * 1024;

function initRoot(root: HTMLElement): void {
  const textInput = root.querySelector<HTMLTextAreaElement>('[data-text-input]');
  const output = root.querySelector<HTMLTextAreaElement>('[data-output]');
  const dirSelect = root.querySelector<HTMLSelectElement>('[data-dir-select]');
  const urlSafeBox = root.querySelector<HTMLInputElement>('[data-urlsafe-checkbox]');
  const wrapSelect = root.querySelector<HTMLSelectElement>('[data-wrap-select]');
  const wrapField = root.querySelector<HTMLElement>('[data-wrap-field]');
  const fileField = root.querySelector<HTMLElement>('[data-file-field]');
  const fileInput = root.querySelector<HTMLInputElement>('[data-file-input]');
  const fileInfo = root.querySelector<HTMLElement>('[data-file-info]');
  const fileClear = root.querySelector<HTMLButtonElement>('[data-file-clear]');
  const textField = root.querySelector<HTMLElement>('[data-text-field]');
  const inputLabel = root.querySelector<HTMLElement>('[data-input-label]');
  const outputLabel = root.querySelector<HTMLElement>('[data-output-label]');
  const statusEl = root.querySelector<HTMLElement>('[data-status]');
  const downloadRow = root.querySelector<HTMLElement>('[data-download-row]');
  const filenameInput = root.querySelector<HTMLInputElement>('[data-filename]');
  const downloadButton = root.querySelector<HTMLButtonElement>('[data-download]');
  const copyButton = root.querySelector<HTMLButtonElement>('[data-copy]');
  if (!textInput || !output || !dirSelect || !urlSafeBox || !wrapSelect) return;

  let fileBytes: Uint8Array | null = null;
  let filenameDirty = false;
  let downloadData: { bytes: Uint8Array; type: FileType } | null = null;

  const setStatus = (message: string, error = false): void => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = error ? STATUS_ERROR : STATUS_BASE;
  };

  const setVisible = (element: HTMLElement | null, visible: boolean): void => {
    if (!element) return;
    element.hidden = !visible;
    element.style.display = visible ? '' : 'none';
  };

  const render = (): void => {
    const decoding = dirSelect.value === 'decode';
    const urlSafe = urlSafeBox.checked;
    const wrap = Number(wrapSelect.value) || 0;

    setVisible(fileField, !decoding);
    setVisible(wrapField, !decoding);
    setVisible(downloadRow, decoding);
    setVisible(textField, decoding || fileBytes === null);
    if (inputLabel) inputLabel.textContent = decoding ? 'Base64 input' : 'Text to encode';
    if (outputLabel) outputLabel.textContent = decoding ? 'Decoded output' : 'Base64 output';
    wrapSelect.disabled = urlSafe;
    downloadData = null;
    if (downloadButton) downloadButton.disabled = true;

    if (decoding) {
      if (copyButton) copyButton.disabled = true;
      const raw = textInput.value.trim();
      if (!raw) {
        output.value = '';
        setStatus('');
        return;
      }

      const bytes = decodeBase64ToBytes(raw);
      if (!bytes) {
        output.value = '';
        setStatus('That is not valid Base64.', true);
        return;
      }

      const type = sniffFileType(bytes);
      const text = decodeUtf8(bytes);
      output.value = text ?? '';
      downloadData = { bytes, type };
      if (downloadButton) downloadButton.disabled = false;
      if (filenameInput && !filenameDirty) filenameInput.value = `decoded.${type.extension}`;
      if (copyButton) copyButton.disabled = text == null;

      const warning = bytes.length > LARGE_FILE ? ' · large file, this may take a moment' : '';
      const preview = text == null ? ' · download to open' : '';
      setStatus(`${type.label} · ${formatBytes(bytes.length)}${preview}${warning}`);
      return;
    }

    const encoded = fileBytes
      ? encodeBytesToBase64(fileBytes, urlSafe)
      : encodeBase64(textInput.value, urlSafe);
    output.value = wrapBase64(encoded, urlSafe ? 0 : wrap);
    if (copyButton) copyButton.disabled = false;
    setStatus('');
  };

  const persist = (): void => {
    writeUrlState(
      schema,
      { dir: dirSelect.value, urlSafe: urlSafeBox.checked ? 1 : 0 },
      { defaults },
    );
  };

  const applyState = (initial = false): void => {
    const state = readUrlState(schema);
    dirSelect.value = state.dir === 'decode' ? 'decode' : 'encode';
    urlSafeBox.checked = state.urlSafe === 1;

    const legacy = new URLSearchParams(window.location.search).get('in');
    if (legacy) textInput.value = legacy;
    else if (initial && dirSelect.value === 'decode') textInput.value = '';
  };

  const clearFile = (): void => {
    fileBytes = null;
    if (fileInput) fileInput.value = '';
    if (fileInfo) {
      fileInfo.textContent = '';
      fileInfo.hidden = true;
    }
    if (fileClear) fileClear.hidden = true;
    render();
  };

  const loadFile = async (file: File): Promise<void> => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    fileBytes = bytes;
    if (fileInfo) {
      const warning = bytes.length > LARGE_FILE ? ' · large file, this may take a moment' : '';
      fileInfo.textContent = `${file.name} · ${formatBytes(bytes.length)}${warning}`;
      fileInfo.hidden = false;
    }
    if (fileClear) fileClear.hidden = false;
    render();
  };

  applyState(true);
  render();
  persist();

  textInput.addEventListener('input', render);
  wrapSelect.addEventListener('change', render);

  dirSelect.addEventListener('change', () => {
    if (dirSelect.value === 'decode') {
      const encoded = output.value.replace(/\s+/g, '');
      if (encoded) textInput.value = encoded;
    } else {
      textInput.value = output.value;
    }
    persist();
    render();
  });

  urlSafeBox.addEventListener('change', () => {
    persist();
    render();
  });

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) void loadFile(file);
  });

  fileClear?.addEventListener('click', clearFile);

  filenameInput?.addEventListener('input', () => {
    filenameDirty = filenameInput.value.trim().length > 0;
  });

  downloadButton?.addEventListener('click', () => {
    if (!downloadData) return;
    const { bytes, type } = downloadData;
    const name = safeFilename(filenameInput?.value ?? 'decoded', type.extension);
    const buffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    downloadBlob(name, new Blob([buffer], { type: type.mime }));
  });

  window.addEventListener('popstate', () => {
    applyState();
    render();
  });

  wireShare(root);
  wireCopy(root);
}

document.querySelectorAll<HTMLElement>('[data-base64-widget]').forEach(initRoot);
