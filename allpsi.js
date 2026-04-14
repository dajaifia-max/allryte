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
    const emailFields = form.querySelectorAll('input[type="email"]');
    const emailField = emailFields[0];
    const confirmEmailField = emailFields[1];
    const phoneField = form.querySelector('input[type="tel"]');
    const nameField = form.querySelector('input[autocomplete="name"]');
    const selectField = form.querySelector('select');

    // Common domain typos and their corrections
    const commonTypos = {
      'gmail.con': 'gmail.com',
      'gmail.comm': 'gmail.com',
      'yahoo.con': 'yahoo.com',
      'yahoo.comm': 'yahoo.com',
      'hotmail.con': 'hotmail.com',
      'hotmail.comm': 'hotmail.com',
      'outlook.con': 'outlook.com',
      'outlook.comm': 'outlook.com',
      'aol.con': 'aol.com',
      'aol.comm': 'aol.com',
      'gmial.com': 'gmail.com',
      'gmaill.com': 'gmail.com',
      'gmil.com': 'gmail.com',
      'yaho.com': 'yahoo.com',
      'yaho0.com': 'yahoo.com',
    };

    // Common disposable/temporary email domains
    const disposableDomains = [
      'tempmail.com', '10minutemail.com', 'guerrillamail.com',
      'mailinator.com', 'trashmail.com', 'sharklasers.com',
      'getairmail.com', 'yopmail.com', 'maildrop.cc',
      'temp-mail.org', 'throwawaymail.com', 'fakeinbox.com',
      'tempmail.de', 'tempmail.co', 'tempmail.net',
      'tempmail.us', 'tempmail.eu', 'tempmail.asia',
      'tempmail.info', 'tempmail.biz', 'tempmail.me',
      'tempmail.io', 'tempmail.co.uk', 'tempmail.ca',
      'tempmail.au', 'tempmail.in', 'tempmail.jp',
      'tempmail.cn', 'tempmail.ru', 'tempmail.br',
      'tempmail.mx', 'tempmail.es', 'tempmail.fr',
      'tempmail.de', 'tempmail.it', 'tempmail.nl',
      'tempmail.pl', 'tempmail.se', 'tempmail.no',
      'tempmail.dk', 'tempmail.fi', 'tempmail.gr',
      'tempmail.pt', 'tempmail.ch', 'tempmail.at',
      'tempmail.cz', 'tempmail.hu', 'tempmail.ro',
      'tempmail.bg', 'tempmail.hr', 'tempmail.si',
      'tempmail.sk', 'tempmail.lv', 'tempmail.ee',
      'tempmail.lt', 'tempmail.ua', 'tempmail.by',
      'tempmail.kz', 'tempmail.uz', 'tempmail.ge',
      'tempmail.am', 'tempmail.az', 'tempmail.kg',
      'tempmail.tj', 'tempmail.tm', 'tempmail.md',
      'tempmail.al', 'tempmail.mk', 'tempmail.rs',
      'tempmail.ba', 'tempmail.me', 'tempmail.tr',
      'tempmail.cy', 'tempmail.il', 'tempmail.jo',
      'tempmail.lb', 'tempmail.ps', 'tempmail.sa',
      'tempmail.ae', 'tempmail.qa', 'tempmail.bh',
      'tempmail.kw', 'tempmail.om', 'tempmail.ye',
      'tempmail.ir', 'tempmail.pk', 'tempmail.af',
      'tempmail.bd', 'tempmail.lk', 'tempmail.np',
      'tempmail.in', 'tempmail.mm', 'tempmail.th',
      'tempmail.vn', 'tempmail.kh', 'tempmail.la',
      'tempmail.my', 'tempmail.sg', 'tempmail.id',
      'tempmail.ph', 'tempmail.bn', 'tempmail.tw',
      'tempmail.hk', 'tempmail.mo', 'tempmail.cn',
      'tempmail.kr', 'tempmail.jp', 'tempmail.mn',
      'tempmail.kz', 'tempmail.uz', 'tempmail.tm',
      'tempmail.ru', 'tempmail.ua', 'tempmail.by',
      'tempmail.pl', 'tempmail.cz', 'tempmail.sk',
      'tempmail.hu', 'tempmail.ro', 'tempmail.bg',
      'tempmail.rs', 'tempmail.hr', 'tempmail.si',
      'tempmail.ba', 'tempmail.mk', 'tempmail.al',
      'tempmail.gr', 'tempmail.tr', 'tempmail.cy',
      'tempmail.il', 'tempmail.jo', 'tempmail.lb',
      'tempmail.ps', 'tempmail.sa', 'tempmail.ae',
      'tempmail.qa', 'tempmail.bh', 'tempmail.kw',
      'tempmail.om', 'tempmail.ye', 'tempmail.ir',
      'tempmail.pk', 'tempmail.af', 'tempmail.bd',
      'tempmail.lk', 'tempmail.np', 'tempmail.mm',
      'tempmail.th', 'tempmail.vn', 'tempmail.kh',
      'tempmail.la', 'tempmail.my', 'tempmail.sg',
      'tempmail.id', 'tempmail.ph', 'tempmail.bn',
      'tempmail.tw', 'tempmail.hk', 'tempmail.mo',
      'tempmail.kr', 'tempmail.mn',
    ];

    function validateEmail(email) {
      const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!re.test(email)) return false;
      
      // Check for common typos
      const domain = email.split('@')[1].toLowerCase();
      if (commonTypos[domain]) {
        return { valid: false, suggestion: commonTypos[domain] };
      }
      
      // Check for disposable domains
      if (disposableDomains.includes(domain)) {
        return { valid: false, disposable: true };
      }
      
      return { valid: true };
    }

    function validatePhone(phone) {
      if (!phone) return { valid: true }; // Phone is optional
      const re = /^[\d\s\-\(\)]+$/;
      const digits = phone.replace(/[^\d]/g, '');
      return { valid: re.test(phone) && digits.length >= 10 };
    }

    function validateForm() {
      let isValid = true;
      let emailError = '';
      
      // Validate name
      if (nameField && !nameField.value.trim()) {
        nameField.closest('.field').classList.add('invalid');
        isValid = false;
      } else if (nameField) {
        nameField.closest('.field').classList.remove('invalid');
      }
      
      // Validate email
      if (emailField) {
        if (!emailField.value.trim()) {
          emailField.closest('.field').classList.add('invalid');
          emailError = 'Email is required';
          isValid = false;
        } else {
          const emailValidation = validateEmail(emailField.value);
          if (!emailValidation.valid) {
            emailField.closest('.field').classList.add('invalid');
            if (emailValidation.suggestion) {
              emailError = `Did you mean ${emailField.value.split('@')[0]}@${emailValidation.suggestion}?`;
            } else if (emailValidation.disposable) {
              emailError = 'Please use a real email address, not a temporary one';
            } else {
              emailError = 'Please enter a valid email address';
            }
            isValid = false;
          } else {
            emailField.closest('.field').classList.remove('invalid');
          }
        }
      }
      
      // Validate email confirmation
      if (confirmEmailField) {
        if (!confirmEmailField.value.trim()) {
          confirmEmailField.closest('.field').classList.add('invalid');
          isValid = false;
        } else if (emailField && confirmEmailField.value !== emailField.value) {
          confirmEmailField.closest('.field').classList.add('invalid');
          emailError = 'Email addresses do not match';
          isValid = false;
        } else {
          confirmEmailField.closest('.field').classList.remove('invalid');
        }
      }
      
      // Validate phone (optional)
      if (phoneField && phoneField.value.trim()) {
        const phoneValidation = validatePhone(phoneField.value);
        if (!phoneValidation.valid) {
          phoneField.closest('.field').classList.add('invalid');
          isValid = false;
        } else {
          phoneField.closest('.field').classList.remove('invalid');
        }
      } else if (phoneField) {
        phoneField.closest('.field').classList.remove('invalid');
      }
      
      return { isValid, emailError };
    }

    submitBtn.addEventListener('click', (e) => {
      const validation = validateForm();
      if (!validation.isValid) {
        e.preventDefault();
        // Scroll to first invalid field
        const firstInvalid = form.querySelector('.invalid');
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        // Show error message if available
        if (validation.emailError) {
          alert(validation.emailError);
        }
      } else {
        // Here you would normally submit the form
        alert('Form submitted successfully! (This is just a demo - connect to real endpoint)');
      }
    });

    // Clear validation on input
    [nameField, emailField, confirmEmailField, phoneField].forEach(field => {
      if (field) {
        field.addEventListener('input', () => {
          const fieldContainer = field.closest('.field');
          fieldContainer.classList.remove('invalid');
        });
      }
    });
  }
})();
