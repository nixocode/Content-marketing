// Content & Marketing — gallery + lightbox + scroll reveal.

const BASE = import.meta.env.BASE_URL;

const POSTS   = Array.from({ length: 23 }, (_, i) => `post-${String(i + 1).padStart(2, '0')}.jpg`);
const STORIES = Array.from({ length: 8  }, (_, i) => `story-${String(i + 1).padStart(2, '0')}.jpg`);

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
  .querySelectorAll('.reveal, .section-head, .impact-card, .video-placeholder')
  .forEach((el) => {
    el.classList.add('reveal');
    io.observe(el);
  });
