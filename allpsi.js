(() => {
  const sections = document.querySelectorAll('.page-section');
  const pills = document.querySelectorAll('nav .pill');
  const year = document.querySelector('[data-year]');
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
  }

  if (year) year.textContent = new Date().getFullYear();
  window.addEventListener('hashchange', route);
  pills.forEach((link) => {
    link.addEventListener('click', () => {
      const target = link.dataset.page;
      if (target) {
        window.location.hash = target;
      }
    });
  });
  route();

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
