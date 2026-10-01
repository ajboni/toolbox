export async function flash(button: HTMLElement, message: string): Promise<void> {
  const original = button.textContent;
  button.textContent = message;
  window.setTimeout(() => {
    button.textContent = original;
  }, 1500);
}

export function wireShare(root: ParentNode): void {
  const button = root.querySelector<HTMLButtonElement>('[data-share]');
  if (!button) return;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      await flash(button, 'Link copied');
    } catch {
      await flash(button, 'Copy failed');
    }
  });
}

export function wireCopy(root: ParentNode): void {
  const buttons = root.querySelectorAll<HTMLButtonElement>('[data-copy]');
  buttons.forEach((button) => {
    button.addEventListener('click', async () => {
      const selector = button.dataset.copy;
      const target = selector ? root.querySelector<HTMLElement>(selector) : null;
      const text =
        target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement
          ? target.value.trim()
          : target?.textContent?.trim() ?? '';
      if (!text || text === '–') return;
      try {
        await navigator.clipboard.writeText(text);
        await flash(button, 'Copied');
      } catch {
        await flash(button, 'Copy failed');
      }
    });
  });
}
