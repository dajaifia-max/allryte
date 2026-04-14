(() => {
  const sections = document.querySelectorAll('.page-section');
  const pills = document.querySelectorAll('.mobile-nav .pill');
  const year = document.querySelector('[data-year]');
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const loadingCursor = document.querySelector('.loading-cursor');
  let loadingTimeout;
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
    const normalized = document.getElementById(page) ? page : 'launch';
    sections.forEach((section) => {
      section.classList.toggle('is-active', section.id === normalized);
    });
    pills.forEach((link) => {
      link.classList.toggle('is-active', link.dataset.page === normalized);
    });
    document.body.dataset.page = normalized;
    document.title = titleMap[normalized] || titleMap.launch;
  }

  function route() {
    const hash = window.location.hash.slice(1);
    updateActivePage(hash || 'launch');
    // Small delay to ensure scroll happens after content is updated
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 10);
  }

  if (year) year.textContent = new Date().getFullYear();
  window.addEventListener('hashchange', route);
  pills.forEach((link) => {
    link.addEventListener('click', () => {
      const target = link.dataset.page;
      if (target) {
        window.location.hash = target;
        // Close mobile menu if open
        if (mobileNav.classList.contains('is-open')) {
          mobileNav.classList.remove('is-open');
          mobileMenuToggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });

  // Mobile menu toggle
  if (mobileMenuToggle && mobileNav) {
    mobileMenuToggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('is-open');
      mobileMenuToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (mobileNav.classList.contains('is-open') && 
          !mobileNav.contains(e.target) && 
          !mobileMenuToggle.contains(e.target)) {
        mobileNav.classList.remove('is-open');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) {
        mobileNav.classList.remove('is-open');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        mobileMenuToggle.focus();
      }
    });
  }
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

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

  // Form validation
  const form = document.querySelector('#contact form');
  if (form) {
    const submitBtn = form.querySelector('button[type="button"]');
    const requiredFields = form.querySelectorAll('input[autocomplete="name"], input[autocomplete="email"], select');

    function validateForm() {
      let isValid = true;
      requiredFields.forEach(field => {
        const fieldContainer = field.closest('.field');
        if (!field.value.trim()) {
          fieldContainer.classList.add('invalid');
          isValid = false;
        } else {
          fieldContainer.classList.remove('invalid');
        }
      });
      return isValid;
    }

    submitBtn.addEventListener('click', (e) => {
      if (!validateForm()) {
        e.preventDefault();
        // Scroll to first invalid field
        const firstInvalid = form.querySelector('.invalid');
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        // Here you would normally submit the form
        alert('Form submitted successfully! (This is just a demo - connect to real endpoint)');
      }
    });

    // Clear validation on input
    requiredFields.forEach(field => {
      field.addEventListener('input', () => {
        const fieldContainer = field.closest('.field');
        if (field.value.trim()) {
          fieldContainer.classList.remove('invalid');
        }
      });
    });
  }
})();
