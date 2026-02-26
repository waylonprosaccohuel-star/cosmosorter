/* ═══════════════════════════════════════════════════════════════
   CosmoSorter 星图整理器 — main.js
   Handles: Starfield, Header scroll, Mobile menu, FAQ accordion,
            Counter animation, Scroll reveal, Active nav
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ─── 1. Starfield Canvas ───────────────────────────────────── */
(function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    buildStars();
  }

  function buildStars() {
    stars = [];
    const count = Math.floor((canvas.width * canvas.height) / 4000);
    for (let i = 0; i < count; i++) {
      stars.push({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        r:     Math.random() * 1.4 + 0.2,
        alpha: Math.random(),
        speed: Math.random() * 0.004 + 0.001,
        phase: Math.random() * Math.PI * 2,
        hue:   Math.random() < 0.15
                 ? (Math.random() < 0.5 ? 240 : 190)
                 : null,
      });
    }
  }

  function draw(ts) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(ts * s.speed + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.hue !== null
        ? `hsla(${s.hue}, 80%, 75%, ${twinkle * 0.8})`
        : `rgba(255, 255, 255, ${twinkle * 0.7})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  resize();
  requestAnimationFrame(draw);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  });
})();


/* ─── 2. Header Scroll Effect ───────────────────────────────── */
(function initHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


/* ─── 3. Mobile Menu ────────────────────────────────────────── */
(function initMobileMenu() {
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
    });
  });
})();


/* ─── 4. FAQ Accordion ──────────────────────────────────────── */
(function initFAQ() {
  const questions = document.querySelectorAll('.faq-question');

  questions.forEach(btn => {
    btn.addEventListener('click', () => {
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';
      const answer     = btn.nextElementSibling;
      const item       = btn.closest('.faq-item');

      // Close all others
      questions.forEach(other => {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          const otherAnswer = other.nextElementSibling;
          if (otherAnswer) otherAnswer.classList.remove('open');
          const otherItem = other.closest('.faq-item');
          if (otherItem) otherItem.classList.remove('active');
        }
      });

      // Toggle current
      const nowOpen = !isExpanded;
      btn.setAttribute('aria-expanded', String(nowOpen));
      if (answer) answer.classList.toggle('open', nowOpen);
      if (item)   item.classList.toggle('active', nowOpen);
    });
  });
})();


/* ─── 5. Counter Animation ──────────────────────────────────── */
(function initCounters() {
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  if (!statNumbers.length) return;

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function animateCounter(el) {
    const target   = parseInt(el.dataset.target, 10);
    const duration = 2000;
    const start    = performance.now();

    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value    = Math.round(easeOutQuart(progress) * target);
      el.textContent = value.toLocaleString('zh-CN');
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString('zh-CN');
    }

    requestAnimationFrame(step);
  }

  const statsSection = document.querySelector('.hero-stats');
  if (!statsSection) return;

  let counted = false;
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !counted) {
      counted = true;
      statNumbers.forEach(el => animateCounter(el));
      observer.disconnect();
    }
  }, { threshold: 0.5 });

  observer.observe(statsSection);
})();


/* ─── 6. Scroll Reveal ──────────────────────────────────────── */
(function initScrollReveal() {
  const selectors = [
    '.feature-card',
    '.pricing-card',
    '.faq-item',
    '.section-header',
    '.cta-banner-inner',
  ];

  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.classList.add('reveal');
      if (i < 4) el.classList.add(`reveal-delay-${i + 1}`);
    });
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();


/* ─── 7. Smooth Scroll for Anchor Links ─────────────────────── */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const headerHeight = document.getElementById('site-header')?.offsetHeight ?? 72;
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();


/* ─── 8. Active Nav Highlight ───────────────────────────────── */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.style.color = link.getAttribute('href') === `#${id}`
            ? 'var(--color-primary)'
            : '';
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => observer.observe(s));
})();