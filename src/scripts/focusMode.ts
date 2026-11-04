const root = document.documentElement;

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement | null;
  if (!target?.closest('[data-focus-toggle]')) return;
  root.toggleAttribute('data-focus');
  if (root.hasAttribute('data-focus')) {
    document.querySelector<HTMLElement>('[data-focus-exit]')?.focus();
  }
});
