(() => {
  const sections = document.querySelectorAll('.page-section');
  const pills = document.querySelectorAll('.mobile-nav .pill');
  const year = document.querySelector('[data-year]');
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const navDismiss = document.querySelector('[data-nav-dismiss]');
  const loadingCursor = document.querySelector('.loading-cursor');
  const footerMotif = document.querySelector('.pnw-divider');
  const routeStatus = document.querySelector('#route-status');
  const skipLink = document.querySelector('.skip-link');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compactNavigation = window.matchMedia('(max-width: 1040px)');
  const root = document.documentElement;
  let loadingTimeout;
  let motionFrame;
  let revealObserver;
  const titleMap = {
    launch: 'Allryte Psychiatry | Launch',
    home: 'Allryte Psychiatry | Home',
    services: 'Allryte Psychiatry | Services',
    portal: 'Allryte Psychiatry | Patient Portal',
    about: 'Allryte Psychiatry | About',
    faq: 'Allryte Psychiatry | FAQ',
    contact: 'Allryte Psychiatry | Contact',
  };

  function updateActivePage(page) {
    const normalized = Object.hasOwn(titleMap, page) ? page : 'launch';
    sections.forEach((section) => {
      section.classList.toggle('is-active', section.id === normalized);
    });
    pills.forEach((link) => {
      const isCurrent = link.dataset.page === normalized;
      link.classList.toggle('is-active', isCurrent);
      if (isCurrent) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.body.dataset.page = normalized;
    document.title = titleMap[normalized] || titleMap.launch;
    return normalized;
  }

  function route({ announce = false } = {}) {
    const hash = window.location.hash.slice(1);
    const activePage = updateActivePage(hash || 'launch');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
      updateMotion();
      rearmFooterMotif();
      if (announce) {
        const heading = document.getElementById(activePage)?.querySelector('h1');
        if (heading) {
          heading.setAttribute('tabindex', '-1');
          heading.focus({ preventScroll: true });
        }
        if (routeStatus) {
          routeStatus.textContent = `${heading?.textContent || titleMap[activePage]} section loaded.`;
        }
      }
    }, 10);
  }

  function rearmFooterMotif() {
    if (!footerMotif) return;
    if (reducedMotion.matches || !revealObserver) {
      if (reducedMotion.matches) footerMotif.classList.add('is-visible');
      return;
    }

    revealObserver.unobserve(footerMotif);
    footerMotif.classList.remove('is-visible', 'is-replaying');
    void footerMotif.offsetWidth;
    revealObserver.observe(footerMotif);
  }

  function syncNavigationState() {
    if (!mobileNav) return;
    const isOpen = mobileNav.classList.contains('is-open');
    if (compactNavigation.matches) {
      mobileNav.setAttribute('aria-hidden', String(!isOpen));
    } else {
      mobileNav.removeAttribute('aria-hidden');
    }
  }

  function openMenu() {
    if (!mobileMenuToggle || !mobileNav) return;
    mobileNav.classList.add('is-open');
    document.body.classList.add('nav-open');
    mobileMenuToggle.setAttribute('aria-expanded', 'true');
    mobileMenuToggle.setAttribute('aria-label', 'Close navigation menu');
    syncNavigationState();
    window.setTimeout(() => mobileNav.querySelector('a')?.focus(), reducedMotion.matches ? 0 : 180);
  }

  function closeMenu({ restoreFocus = false } = {}) {
    if (!mobileMenuToggle || !mobileNav) return;
    const wasOpen = mobileNav.classList.contains('is-open');
    mobileNav.classList.remove('is-open');
    document.body.classList.remove('nav-open');
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
    mobileMenuToggle.setAttribute('aria-label', 'Open navigation menu');
    syncNavigationState();
    if (restoreFocus && wasOpen) mobileMenuToggle.focus();
  }

  if (year) year.textContent = new Date().getFullYear();
  skipLink?.addEventListener('click', (event) => {
    event.preventDefault();
    const heading = document.querySelector('.page-section.is-active h1');
    if (!heading) return;
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: false });
  });
  window.addEventListener('hashchange', () => route({ announce: true }));
  pills.forEach((link) => {
    link.addEventListener('click', () => {
      const target = link.dataset.page;
      if (target) {
        window.location.hash = target;
        closeMenu();
      }
    });
  });

  if (mobileMenuToggle && mobileNav) {
    mobileMenuToggle.addEventListener('click', () => {
      if (mobileNav.classList.contains('is-open')) closeMenu({ restoreFocus: true });
      else openMenu();
    });

    navDismiss?.addEventListener('click', () => closeMenu({ restoreFocus: true }));

    document.addEventListener('keydown', (event) => {
      if (!mobileNav.classList.contains('is-open')) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu({ restoreFocus: true });
        return;
      }

      if (event.key === 'Tab') {
        const focusable = [mobileMenuToggle, ...mobileNav.querySelectorAll('a[href]')];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    const handleNavigationBreakpoint = () => {
      if (!compactNavigation.matches) closeMenu();
      else syncNavigationState();
    };
    compactNavigation.addEventListener?.('change', handleNavigationBreakpoint);
    handleNavigationBreakpoint();
  }

  function updateMotion() {
    motionFrame = undefined;
    if (reducedMotion.matches) {
      root.style.setProperty('--scroll-progress', '1');
      root.style.setProperty('--motion-field-shift', '0px');
      root.style.setProperty('--hero-shift', '0px');
      root.style.setProperty('--forest-far-shift', '0px');
      root.style.setProperty('--forest-near-shift', '0px');
      return;
    }

    const scrollTop = window.scrollY || root.scrollTop;
    const scrollRange = Math.max(root.scrollHeight - window.innerHeight, 1);
    const progress = Math.min(Math.max(scrollTop / scrollRange, 0), 1);
    const limitedScroll = Math.min(scrollTop, 1600);
    root.style.setProperty('--scroll-progress', progress.toFixed(4));
    root.style.setProperty('--motion-field-shift', `${limitedScroll * -0.08}px`);
    root.style.setProperty('--hero-shift', `${limitedScroll * -0.035}px`);
    root.style.setProperty('--forest-far-shift', `${limitedScroll * -0.006}px`);
    root.style.setProperty('--forest-near-shift', `${limitedScroll * -0.01}px`);
  }

  function requestMotionUpdate() {
    if (motionFrame) return;
    motionFrame = window.requestAnimationFrame(updateMotion);
  }

  window.addEventListener('scroll', requestMotionUpdate, { passive: true });
  window.addEventListener('resize', requestMotionUpdate, { passive: true });
  reducedMotion.addEventListener?.('change', updateMotion);
  route();

  // Loading cursor logic
  if (loadingCursor) {
    // Show loading cursor after 500ms delay
    loadingTimeout = setTimeout(() => {
      loadingCursor.classList.add('is-visible');
    }, 500);

    // Hide loading cursor when page is fully loaded
    window.addEventListener('load', () => {
      clearTimeout(loadingTimeout);
      loadingCursor.classList.remove('is-visible');
    });

    // Also hide if page loads before the delay
    if (document.readyState === 'complete') {
      clearTimeout(loadingTimeout);
      loadingCursor.classList.remove('is-visible');
    }
  }

  const themeSwitch = document.querySelector('[data-theme-switch]');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    const isLight = theme === 'light';
    themeSwitch?.setAttribute('aria-pressed', String(isLight));
    themeSwitch?.setAttribute('aria-label', isLight ? 'Use dark theme' : 'Use light theme');
    const themeColor = document.querySelector('meta[name="theme-color"]');
    themeColor?.setAttribute('content', isLight ? '#f5f0e7' : '#0b1f1c');
  }

  let savedTheme = 'dark';
  try {
    savedTheme = localStorage.getItem('theme') || 'dark';
  } catch (_) {
    savedTheme = 'dark';
  }
  applyTheme(savedTheme);

  themeSwitch?.addEventListener('click', () => {
    const newTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    try {
      localStorage.setItem('theme', newTheme);
    } catch (_) {
      // The preference still applies for this visit when storage is unavailable.
    }
  });

  const revealChildren = document.querySelectorAll(
    '.services-grid > .service, .portal-grid > .portal-step, .faq-item'
  );
  revealChildren.forEach((element, index) => {
    element.classList.add('reveal-child');
    element.style.setProperty('--reveal-delay', `${(index % 6) * 70}ms`);
  });

  const revealTargets = document.querySelectorAll('.reveal, .reveal-child');
  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    revealTargets.forEach((element) => element.classList.add('is-visible'));
  } else {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        if (entry.target === footerMotif) {
          entry.target.classList.remove('is-replaying');
          void entry.target.offsetWidth;
          entry.target.classList.add('is-replaying');
        }
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
    revealTargets.forEach((element) => revealObserver.observe(element));
  }

  const mapLoadButton = document.querySelector('[data-load-map]');
  mapLoadButton?.addEventListener('click', () => {
    const mapContainer = mapLoadButton.closest('[data-map]');
    const source = mapLoadButton.dataset.mapSrc;
    if (!mapContainer || !source) return;

    mapLoadButton.disabled = true;
    mapLoadButton.textContent = 'Loading map…';
    mapContainer.setAttribute('aria-busy', 'true');

    const iframe = document.createElement('iframe');
    iframe.src = source;
    iframe.title = 'Map showing the Allryte Psychiatry clinic area';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer';
    iframe.allowFullscreen = true;
    iframe.addEventListener('load', () => mapContainer.removeAttribute('aria-busy'), { once: true });
    mapContainer.replaceChildren(iframe);
  });

  // The public site intentionally does not accept intake or clinical details.
  const portalLaunchLinks = [...document.querySelectorAll('[data-portal-launch]')];
  const portalStatusMessages = [...document.querySelectorAll('[data-portal-status]')];
  let portalAvailable = false;

  function setPortalAvailability({ available, message }) {
    portalAvailable = Boolean(available);
    portalLaunchLinks.forEach((link) => {
      link.setAttribute('aria-disabled', String(!portalAvailable));
      link.classList.toggle('is-disabled', !portalAvailable);
    });
    portalStatusMessages.forEach((status) => {
      status.textContent = message;
    });
  }

  portalLaunchLinks.forEach((link) => {
    link.setAttribute('aria-disabled', 'true');
    link.addEventListener('click', (event) => {
      if (portalAvailable) return;
      event.preventDefault();
      const describedBy = link.getAttribute('aria-describedby');
      if (describedBy) document.getElementById(describedBy)?.focus();
    });
  });

  async function checkPortalAvailability() {
    try {
      const response = await fetch('/api/portal/status', {
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('Portal status unavailable');
      setPortalAvailability(await response.json());
    } catch (_) {
      setPortalAvailability({
        available: false,
        message: 'The secure patient portal is not connected yet. Please call the clinic for assistance.',
      });
    }
  }

  if (portalLaunchLinks.length) checkPortalAvailability();
})();
