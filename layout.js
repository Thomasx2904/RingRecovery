/* Ring Recovery 2.1 — animation controls and tablet viewport support.
   Enhances the existing motion controller; does not add tracking or send data. */
(() => {
  'use strict';
  const root = document.documentElement;
  const control = document.getElementById('motion-toggle');
  const heroFoot = document.querySelector('.hero-foot');
  const header = document.getElementById('header');
  const menu = document.getElementById('mobile-menu');
  const menuButton = document.getElementById('menu-toggle');
  const footer = document.querySelector('footer');
  if (!control || !heroFoot || !header || !menu || !menuButton || !footer) return;

  const sweep = document.querySelector('.scan-sweep');
  if (sweep) {
    const clip = document.createElement('div');
    clip.className = 'scan-sweep-clip';
    clip.setAttribute('aria-hidden', 'true');
    sweep.replaceWith(clip);
    clip.appendChild(sweep);
  }

  // Move the original element, preserving its existing pause/resume listener.
  heroFoot.querySelector('.hero-foot-note')?.remove();
  heroFoot.appendChild(control);
  const primaryLabel = document.getElementById('motion-label');
  primaryLabel.classList.remove('sr-only');
  primaryLabel.classList.add('motion-text');

  const mirrors = [];
  let forwarding = false;
  control.addEventListener('click', event => { if (forwarding) event.stopPropagation(); });
  function makeMirror(parent) {
    const button = document.createElement('button');
    button.className = 'motion-toggle';
    button.type = 'button';
    button.hidden = control.hidden;
    button.innerHTML = '<span class="pause-icon" aria-hidden="true"></span><span class="motion-text"></span>';
    button.addEventListener('click', () => {
      if (!control.disabled) {
        forwarding = true;
        try { control.click(); } finally { forwarding = false; }
      }
      syncControls();
    });
    parent.appendChild(button);
    mirrors.push(button);
  }
  const menuSettings = document.createElement('div');
  menuSettings.className = 'menu-preferences';
  const settingsTitle = document.createElement('p');
  settingsTitle.textContent = 'PAGE SETTINGS';
  menuSettings.appendChild(settingsTitle);
  menu.appendChild(menuSettings);
  makeMirror(menuSettings);

  const footerSettings = document.createElement('div');
  footerSettings.className = 'wrap footer-preferences';
  const footerLabel = document.createElement('span');
  footerLabel.textContent = 'Page animations';
  footerSettings.appendChild(footerLabel);
  const footerBottom = footer.querySelector('.footer-bottom');
  footer.insertBefore(footerSettings, footerBottom);
  makeMirror(footerSettings);

  function syncControls() {
    const isPaused = control.getAttribute('aria-pressed') === 'true';
    const label = control.disabled ? 'Motion reduced' : isPaused ? 'Resume animations' : 'Pause animations';
    primaryLabel.textContent = label;
    mirrors.forEach(button => {
      button.hidden = control.hidden;
      button.disabled = control.disabled;
      button.setAttribute('aria-pressed', String(isPaused));
      button.setAttribute('aria-label', control.getAttribute('aria-label') || label);
      button.title = control.title;
      button.querySelector('.motion-text').textContent = label;
    });
  }
  syncControls();
  new MutationObserver(syncControls).observe(control, {
    attributes: true, attributeFilter: ['aria-pressed', 'aria-label', 'disabled', 'hidden', 'title']
  });

  // Keep the menu within the visible screen, including after rotation and zoom.
  let viewportFrame = 0;
  function fitViewport() {
    viewportFrame = 0;
    const viewport = window.visualViewport;
    const bottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
    const room = Math.max(0, bottom - header.getBoundingClientRect().bottom - 12);
    menu.style.setProperty('--menu-room', room + 'px');
  }
  function scheduleViewport() {
    if (!viewportFrame) viewportFrame = requestAnimationFrame(fitViewport);
  }
  function closeMenu() {
    const focusWasInside = menu.contains(document.activeElement);
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    document.getElementById('menu-label').textContent = 'Menu';
    // Never leave keyboard focus in an element just hidden by a breakpoint.
    if (focusWasInside) {
      if (getComputedStyle(menuButton).display !== 'none') menuButton.focus({preventScroll: true});
      else header.querySelector('.brand').focus({preventScroll: true});
    }
  }
  const wideNavigation = matchMedia('(min-width: 1200px)');
  const onLayoutChange = () => { closeMenu(); scheduleViewport(); };
  wideNavigation.addEventListener('change', onLayoutChange);
  window.addEventListener('resize', scheduleViewport, {passive: true});
  window.addEventListener('scroll', scheduleViewport, {passive: true});
  window.visualViewport?.addEventListener('resize', scheduleViewport, {passive: true});
  window.visualViewport?.addEventListener('scroll', scheduleViewport, {passive: true});
  menuButton.addEventListener('click', scheduleViewport);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleViewport).observe(header);
  header.addEventListener('focusout', () => {
    setTimeout(() => { if (!menu.hidden && !header.contains(document.activeElement)) closeMenu(); }, 0);
  });

  // A phone's contact dock must not sit over an enquiry field or software keyboard.
  const form = document.getElementById('lost-form');
  const updateEditing = () => {
    const el = document.activeElement;
    root.classList.toggle('editing-enquiry', !!(form && form.contains(el) && el.matches('input, textarea')));
    scheduleViewport();
  };
  document.addEventListener('focusin', updateEditing);
  document.addEventListener('focusout', () => setTimeout(updateEditing, 0));
  window.addEventListener('pageshow', () => { syncControls(); updateEditing(); });
  scheduleViewport();
})();
