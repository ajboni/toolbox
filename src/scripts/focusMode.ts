const root = document.documentElement;

let trigger: HTMLElement | null = null;

function exitFocus() {
  root.removeAttribute('data-focus');
  if (trigger?.isConnected) trigger.focus();
  trigger = null;
}

function enterFocus(button: HTMLElement) {
  trigger = button;
  root.setAttribute('data-focus', '');
  document.querySelector<HTMLElement>('[data-focus-exit]')?.focus();
}

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement | null;
  const toggle = target?.closest<HTMLElement>('[data-focus-toggle]');
  if (!toggle) return;
  if (root.hasAttribute('data-focus')) exitFocus();
  else enterFocus(toggle);
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || event.defaultPrevented) return;
  if (!root.hasAttribute('data-focus')) return;
  if (document.querySelector('dialog[open], [data-sidebar].is-open')) return;
  event.preventDefault();
  exitFocus();
});
