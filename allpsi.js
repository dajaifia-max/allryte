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
})();
