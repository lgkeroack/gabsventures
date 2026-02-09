/* =========================================
   Gab's Ventures — Interactions
   Vanilla JS. No dependencies.
   ========================================= */

(function () {
  'use strict';

  // --- Scroll Reveal ---
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal').forEach((el) => {
    revealObserver.observe(el);
  });


  // --- Nav Scroll Effect ---
  const nav = document.querySelector('.nav');
  let ticking = false;

  function updateNav() {
    nav.classList.toggle('scrolled', window.scrollY > 60);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateNav);
      ticking = true;
    }
  }, { passive: true });


  // --- Newsletter Banner ---
  const banner = document.getElementById('banner');
  const bannerClose = document.getElementById('banner-close');

  if (banner && !localStorage.getItem('banner-dismissed')) {
    banner.hidden = false;
  }

  if (bannerClose) {
    bannerClose.addEventListener('click', () => {
      banner.hidden = true;
      localStorage.setItem('banner-dismissed', '1');
    });
  }


  // --- Theme Toggle ---
  const themeToggle = document.getElementById('theme-toggle');

  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    themeToggle.textContent = 'dark';
  }

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    themeToggle.textContent = isLight ? 'dark' : 'light';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });


  // --- Smooth Scroll for Nav Links (enhancement over CSS) ---
  document.querySelectorAll('.nav-links a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navHeight = nav.offsetHeight;
        const y = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });

})();
