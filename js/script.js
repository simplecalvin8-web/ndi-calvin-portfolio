(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const isSmallScreen = window.matchMedia('(max-width: 760px)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const menuToggle = $('#menuToggle');
  const nav = $('#nav');
  const toTop = $('#toTop');
  const year = $('#year');

  if (year) year.textContent = new Date().getFullYear();

  // Mobile navigation: one listener, closes after a selection.
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(open));
    });

    $$('.nav a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }));
  }

  // Reveal animations. Disable the observer when motion is explicitly reduced.
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px' });
    $$('.reveal').forEach(el => observer.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('visible'));
  }

  // Lightweight active-section tracking.
  const sections = $$('main section[id]');
  const links = $$('.nav a');
  let scrollTick = false;
  function updateScrollUI() {
    if (toTop) toTop.classList.toggle('show', window.scrollY > 550);
    let current = 'home';
    sections.forEach(section => {
      if (window.scrollY >= section.offsetTop - 180) current = section.id;
    });
    links.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${current}`));
    scrollTick = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollTick) {
      scrollTick = true;
      requestAnimationFrame(updateScrollUI);
    }
  }, { passive: true });
  updateScrollUI();

  if (toTop) {
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  }

  // Smooth in-page navigation without breaking external links.
  $$('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const target = $(id);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }));

  // Cursor glow is desktop-only. It is completely removed from the mobile work.
  const glow = $('.cursor-glow');
  if (glow && !isTouch && !isSmallScreen && !reduceMotion) {
    let glowX = 0, glowY = 0, glowFrame = false;
    window.addEventListener('pointermove', event => {
      glowX = event.clientX;
      glowY = event.clientY;
      if (!glowFrame) {
        glowFrame = true;
        requestAnimationFrame(() => {
          glow.style.left = `${glowX}px`;
          glow.style.top = `${glowY}px`;
          glowFrame = false;
        });
      }
    }, { passive: true });
  } else if (glow) {
    glow.remove();
  }

  const projectData = {
    fixlink: {
      title: 'Fixlink Cameroon',
      desc: 'Electricity services platform concept for connecting clients with quality electricians.',
      tags: ['HTML', 'CSS', 'JavaScript', 'Electrical Services']
    },
    electric: {
      title: "Simple's Electric Services",
      desc: 'Professional electrician business website concept with service presentation, inquiries and digital customer communication.',
      tags: ['HTML', 'CSS', 'JavaScript', 'Electrical']
    },
    shop: {
      title: "Simple's Shop",
      desc: 'E-commerce platform concept covering fashion, shoes, watches, beauty, home and living.',
      tags: ['HTML', 'CSS', 'JavaScript', 'SQL', 'E-commerce']
    },
    motivation: {
      title: 'Ntaima — Motivation Site',
      desc: 'Live motivation and inspiration website with Motivation, Success, Confidence, Study, Life and Love sections.',
      tags: ['Live Site', 'Motivation', 'Ntaima'],
      live: 'https://ntaima.netlify.app/'
    },
    caminfra: {
      title: 'CAM-INFRA',
      desc: 'Cameroon Infrastructure Monitoring & Citizen Reporting Platform concept for reporting and tracking public infrastructure issues.',
      tags: ['Civic Tech', 'HTML', 'CSS', 'JavaScript']
    }
  };

  // Project details modal.
  const modal = $('#projectModal');
  const modalTitle = $('#modalTitle');
  const modalDescription = $('#modalDescription');
  const modalTags = $('#modalTags');
  const modalLive = $('#modalLive');
  const modalClose = $('#modalClose');
  const modalBackdrop = $('[data-close-modal]');
  let previousOverflow = '';

  function openModal(key) {
    const data = projectData[key];
    if (!data || !modal) return;
    if (modalTitle) modalTitle.textContent = data.title;
    if (modalDescription) modalDescription.textContent = data.desc;
    if (modalTags) modalTags.innerHTML = data.tags.map(tag => `<span>${tag}</span>`).join('');
    if (modalLive) {
      if (data.live) {
        modalLive.hidden = false;
        modalLive.href = data.live;
      } else {
        modalLive.hidden = true;
        modalLive.removeAttribute('href');
      }
    }
    previousOverflow = document.body.style.overflow;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (modalClose) modalClose.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = previousOverflow;
  }

  $$('.project-card').forEach(card => {
    const details = $('.details-btn', card);
    if (details) details.addEventListener('click', event => {
      event.stopPropagation();
      openModal(card.dataset.project);
    });
  });
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal?.classList.contains('open')) closeModal();
  });

  // High-performance magical particle background.
  // Mobile devices get a static/subtle field instead of a continuous canvas loop.
  const canvas = $('#magicCanvas');
  const ctx = canvas?.getContext('2d', { alpha: true });
  const particles = [];
  const particleCount = reduceMotion ? 0 : (isSmallScreen ? 12 : 48);
  let animationId = 0;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let canvasDpr = 1;

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    // Never let a high-density Android display create a huge backing canvas.
    canvasDpr = Math.min(window.devicePixelRatio || 1, isSmallScreen ? 1 : 1.35);
    canvas.width = Math.max(1, Math.floor(canvasWidth * canvasDpr));
    canvas.height = Math.max(1, Math.floor(canvasHeight * canvasDpr));
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.setTransform(canvasDpr, 0, 0, canvasDpr, 0, 0);
  }

  function seedParticles() {
    particles.length = 0;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        r: 0.35 + Math.random() * (isSmallScreen ? 0.75 : 1.15),
        vx: (Math.random() - 0.5) * (isSmallScreen ? 0.06 : 0.16),
        vy: (Math.random() - 0.5) * (isSmallScreen ? 0.05 : 0.11),
        a: 0.14 + Math.random() * 0.38
      });
    }
  }

  function drawParticles() {
    if (!ctx || !canvas || document.hidden) {
      animationId = 0;
      return;
    }
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -2) p.x = canvasWidth + 2;
      if (p.x > canvasWidth + 2) p.x = -2;
      if (p.y < -2) p.y = canvasHeight + 2;
      if (p.y > canvasHeight + 2) p.y = -2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,200,75,${p.a})`;
      ctx.fill();
    });
    animationId = requestAnimationFrame(drawParticles);
  }

  function startParticles() {
    if (!canvas || !ctx || particleCount === 0 || animationId) return;
    animationId = requestAnimationFrame(drawParticles);
  }

  function stopParticles() {
    if (animationId) cancelAnimationFrame(animationId);
    animationId = 0;
  }

  if (canvas && ctx) {
    resizeCanvas();
    seedParticles();
    // Mobile: keep canvas but do not animate it; this avoids battery/scroll jank.
    if (!isSmallScreen && !reduceMotion) startParticles();
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeCanvas();
        seedParticles();
        if (!isSmallScreen && !reduceMotion) startParticles();
      }, 180);
    }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopParticles();
      else if (!isSmallScreen && !reduceMotion) startParticles();
    });
  }

  // CSS dust: fewer particles on touch screens.
  const dustLayer = $('#goldDust');
  if (dustLayer && !reduceMotion) {
    const dustCount = isSmallScreen ? 8 : 24;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < dustCount; i++) {
      const spark = document.createElement('i');
      spark.className = 'dust';
      spark.style.left = `${Math.random() * 100}%`;
      spark.style.top = `${75 + Math.random() * 25}%`;
      spark.style.setProperty('--x', `${(Math.random() - 0.5) * (isSmallScreen ? 100 : 220)}px`);
      spark.style.animationDelay = `${-Math.random() * 7}s`;
      spark.style.animationDuration = `${isSmallScreen ? 8 + Math.random() * 5 : 5 + Math.random() * 6}s`;
      fragment.appendChild(spark);
    }
    dustLayer.appendChild(fragment);
  }

  // Click/tap spark burst: tiny and short-lived on mobile.
  if (!reduceMotion && dustLayer) {
    const burstCount = isSmallScreen ? 3 : 7;
    window.addEventListener('pointerdown', event => {
      if (event.target.closest('button, a, input, textarea, select')) return;
      for (let i = 0; i < burstCount; i++) {
        const spark = document.createElement('i');
        spark.className = 'dust click-spark';
        spark.style.left = `${event.clientX}px`;
        spark.style.top = `${event.clientY}px`;
        spark.style.setProperty('--x', `${(Math.random() - 0.5) * (isSmallScreen ? 70 : 120)}px`);
        spark.style.setProperty('--y', `${(Math.random() - 0.5) * (isSmallScreen ? 70 : 120)}px`);
        dustLayer.appendChild(spark);
        window.setTimeout(() => spark.remove(), 700);
      }
    }, { passive: true });
  }

  // Desktop-only card tilt. Touch devices never receive transform calculations.
  if (!isTouch && !reduceMotion) {
    $$('.project-card').forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(800px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg) translateY(-7px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }
})();
