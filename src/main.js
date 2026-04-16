// Content & Marketing — gallery + lightbox + scroll reveal.

const BASE = import.meta.env.BASE_URL;

const POSTS   = Array.from({ length: 16 }, (_, i) => `post-${String(i + 1).padStart(2, '0')}.jpg`);
const STORIES = Array.from({ length: 15 }, (_, i) => `story-${String(i + 1).padStart(2, '0')}.jpg`);

// ---------- Render tiles ----------
function renderGrid(container, files, subdir, label) {
  if (!container) return;
  const frag = document.createDocumentFragment();
  files.forEach((f, i) => {
    const fig = document.createElement('figure');
    fig.className = subdir === 'posts' ? 'post-tile reveal' : 'story-tile reveal';
    fig.dataset.index = i;
    fig.dataset.src = `${BASE}${subdir}/${f}`;
    fig.innerHTML = `<img src="${BASE}${subdir}/${f}" alt="${label} ${i + 1}" loading="lazy" decoding="async" />`;
    frag.appendChild(fig);
  });
  container.appendChild(frag);
}

renderGrid(document.getElementById('post-grid'),  POSTS,   'posts',   'Feed post');
renderGrid(document.getElementById('story-rail'), STORIES, 'stories', 'Story');

// ---------- Lightbox ----------
const lightbox  = document.getElementById('lightbox');
const lbImg     = lightbox?.querySelector('.lightbox-img');
const btnClose  = lightbox?.querySelector('.lightbox-close');
const btnPrev   = lightbox?.querySelector('.lightbox-prev');
const btnNext   = lightbox?.querySelector('.lightbox-next');

let currentSet = [];
let currentIdx = 0;

function openLightbox(set, idx) {
  if (!lightbox || !lbImg) return;
  currentSet = set;
  currentIdx = idx;
  lbImg.src = set[idx];
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (lbImg) lbImg.src = '';
}

function step(delta) {
  if (!currentSet.length) return;
  currentIdx = (currentIdx + delta + currentSet.length) % currentSet.length;
  if (lbImg) lbImg.src = currentSet[currentIdx];
}

function tilesInContainer(el) {
  return [...el.querySelectorAll('[data-src]')].map(t => t.dataset.src);
}

document.addEventListener('click', (e) => {
  const tile = e.target.closest('.post-tile, .story-tile');
  if (tile) {
    const container = tile.parentElement;
    const set = tilesInContainer(container);
    const idx = +tile.dataset.index;
    openLightbox(set, idx);
    return;
  }
  if (e.target === lightbox) closeLightbox();
});

btnClose?.addEventListener('click', closeLightbox);
btnPrev?.addEventListener('click', () => step(-1));
btnNext?.addEventListener('click', () => step(1));

document.addEventListener('keydown', (e) => {
  if (lightbox?.getAttribute('aria-hidden') === 'true') return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft')  step(-1);
  if (e.key === 'ArrowRight') step(1);
});

// ---------- Scroll reveal ----------
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    }
  });
}, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

document
  .querySelectorAll('.reveal, .section-head, .impact-card')
  .forEach((el) => {
    el.classList.add('reveal');
    io.observe(el);
  });

// ---------- Rail scroll (arrows + drag + wheel) ----------
function enhanceRail(rail) {
  if (!rail) return;
  const wrap = rail.closest('.rail-wrap') || rail.parentElement;

  // Arrow buttons
  const prev = wrap.querySelector('.rail-prev');
  const next = wrap.querySelector('.rail-next');
  const step = () => Math.max(240, Math.round(rail.clientWidth * 0.8));
  prev?.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
  next?.addEventListener('click', () => rail.scrollBy({ left:  step(), behavior: 'smooth' }));

  const updateArrows = () => {
    if (!prev || !next) return;
    const max = rail.scrollWidth - rail.clientWidth - 2;
    prev.toggleAttribute('disabled', rail.scrollLeft <= 2);
    next.toggleAttribute('disabled', rail.scrollLeft >= max);
  };
  rail.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);
  updateArrows();

  // Vertical wheel → horizontal scroll on desktop
  rail.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      rail.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });

  // Click-drag on desktop (pointer events)
  let isDown = false, startX = 0, startLeft = 0, moved = 0;
  rail.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return;
    isDown = true; moved = 0;
    startX = e.clientX;
    startLeft = rail.scrollLeft;
    rail.setPointerCapture(e.pointerId);
    rail.classList.add('is-dragging');
  });
  rail.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    moved = Math.abs(dx);
    rail.scrollLeft = startLeft - dx;
  });
  const end = () => {
    isDown = false;
    rail.classList.remove('is-dragging');
  };
  rail.addEventListener('pointerup', end);
  rail.addEventListener('pointercancel', end);
  // Swallow the click that ends a drag, so the lightbox doesn't open
  rail.addEventListener('click', (e) => {
    if (moved > 6) { e.stopPropagation(); e.preventDefault(); moved = 0; }
  }, true);
}
document.querySelectorAll('.story-rail').forEach(enhanceRail);

// ---------- Hero stat count-up ----------
function animateStat(el) {
  const raw = el.dataset.target || el.textContent.trim();
  const m = raw.match(/([\d.]+)/);
  if (!m) { el.classList.add('is-in'); return; }
  const target = parseFloat(m[1]);
  const prefix = raw.slice(0, m.index);
  const suffix = raw.slice(m.index + m[0].length);
  const duration = 900;
  const t0 = performance.now();
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const tick = (now) => {
    const t = Math.min(1, (now - t0) / duration);
    const val = target * ease(t);
    const display = Number.isInteger(target) ? Math.round(val) : val.toFixed(1);
    el.textContent = `${prefix}${display}${suffix}`;
    if (t < 1) requestAnimationFrame(tick);
    else el.classList.add('is-in');
  };
  requestAnimationFrame(tick);
}

const heroMeta = document.querySelector('.hero-meta');
if (heroMeta) {
  const stats = heroMeta.querySelectorAll('.hero-meta-item strong');
  stats.forEach((s) => { s.dataset.target = s.textContent.trim(); s.textContent = s.dataset.target.replace(/[\d.]+/, '0'); });
  const hio = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        stats.forEach((s, i) => setTimeout(() => animateStat(s), i * 180));
        hio.disconnect();
      }
    });
  }, { threshold: 0.4 });
  hio.observe(heroMeta);
}
