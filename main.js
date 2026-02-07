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
  let lastScroll = 0;
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


  // --- Project Filtering ---
  const filterButtons = document.querySelectorAll('.filter');
  const cards = document.querySelectorAll('.card');

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Update active button
      document.querySelector('.filter.active').classList.remove('active');
      btn.classList.add('active');

      // Filter cards
      cards.forEach((card) => {
        const match = filter === 'all' || card.dataset.category === filter;

        if (match && card.classList.contains('hidden')) {
          // Show: remove hidden, set initial state, animate in
          card.classList.remove('hidden');
          card.classList.add('hiding');
          // Force reflow so the transition fires
          card.offsetHeight;
          card.classList.remove('hiding');
        } else if (!match && !card.classList.contains('hidden')) {
          // Hide: animate out, then display none
          card.classList.add('hiding');
          setTimeout(() => {
            card.classList.add('hidden');
            card.classList.remove('hiding');
          }, 300);
        }
      });
    });
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
