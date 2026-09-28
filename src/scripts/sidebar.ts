const sidebar = document.querySelector<HTMLElement>('[data-sidebar]');
const toggle = document.querySelector<HTMLButtonElement>('[data-sidebar-toggle]');
const overlay = document.querySelector<HTMLElement>('[data-sidebar-overlay]');

function setOpen(open: boolean): void {
  if (!sidebar || !toggle || !overlay) return;
  sidebar.classList.toggle('is-open', open);
  overlay.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
}

if (sidebar && toggle && overlay) {
  toggle.addEventListener('click', () => {
    setOpen(!sidebar.classList.contains('is-open'));
  });

  overlay.addEventListener('click', () => setOpen(false));

  sidebar.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });
}
