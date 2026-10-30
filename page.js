/* Ring Recovery guide pages: menu, header height and footer year. No tracking; nothing is sent. */
(() => {
'use strict';
const $ = id => document.getElementById(id), root = document.documentElement;
const header = $('header'), menu = $('mobile-menu'), menuButton = $('menu-toggle');
if ($('year')) $('year').textContent = new Date().getFullYear();
function headerSize() { root.style.setProperty('--header-h', header.offsetHeight + 'px'); }
headerSize();
if ('ResizeObserver' in window) new ResizeObserver(headerSize).observe(header);
else window.addEventListener('resize', headerSize, {passive: true});
window.addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 15), {passive: true});
function closeMenu(focus = false) {
  const wasOpen = !menu.hidden;
  menu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); $('menu-label').textContent = 'Menu';
  if (focus && wasOpen) menuButton.focus();
}
menuButton.hidden = false;
menuButton.addEventListener('click', () => {
  const opening = menu.hidden; menu.hidden = !opening;
  menuButton.setAttribute('aria-expanded', String(opening)); $('menu-label').textContent = opening ? 'Close' : 'Menu';
  if (opening) menu.style.setProperty('--menu-room', Math.max(0, innerHeight - header.getBoundingClientRect().bottom - 12) + 'px');
});
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(true); });
document.addEventListener('click', e => { if (!header.contains(e.target)) closeMenu(); });
const wide = matchMedia('(min-width: 1200px)');
if (wide.addEventListener) wide.addEventListener('change', () => { if (wide.matches) closeMenu(); });
header.addEventListener('focusout', () => setTimeout(() => { if (!menu.hidden && !header.contains(document.activeElement)) closeMenu(); }, 0));
})();
