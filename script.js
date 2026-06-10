/* ═══════════════════════════════════════════
   MIEL ORO — JavaScript
   Archivo: script.js
═══════════════════════════════════════════ */

// ─── HERO SLIDER ───
let slide = 0;
const slides = document.querySelectorAll('.hero-slide');
const dots   = document.querySelectorAll('.hero-dot');

function goSlide(n) {
  if (!slides.length) return;
  slides[slide].classList.remove('active');
  dots[slide].classList.remove('active');
  slide = (n + slides.length) % slides.length;
  slides[slide].classList.add('active');
  dots[slide].classList.add('active');
}

function changeSlide(d) {
  goSlide(slide + d);
}

// Avance automático cada 5 segundos
if (slides.length) setInterval(() => changeSlide(1), 5000);


// ─── CARRITO ───
let count = 0;

function addToCart(card) {
  const btn = card.querySelector('.btn-add');
  if (btn.disabled) return;

  count++;
  document.getElementById('cart-count').textContent = count;

  const orig = btn.textContent;
  btn.textContent = '✓ Agregado';
  btn.style.background = '#4caf50';

  setTimeout(() => {
    btn.textContent = orig;
    btn.style.background = '';
  }, 1600);
}


// ─── BUSCADOR ───
function toggleSearch() {
  document.querySelector('.search-overlay').classList.toggle('open');
}

// Cerrar buscador al hacer clic en el fondo
document.querySelector('.search-overlay').addEventListener('click', function (e) {
  if (e.target === this) this.classList.remove('open');
});

// Cerrar buscador con botón ✕
document.querySelector('.search-close').addEventListener('click', function () {
  document.querySelector('.search-overlay').classList.remove('open');
});


// ─── MENÚ HAMBURGUESA ───
(function () {
  const nav      = document.querySelector('nav');
  if (!nav) return;

  // Crear barra con botón hamburguesa
  const toggleBar = document.createElement('div');
  toggleBar.className = 'nav-toggle-bar';

  const label = document.createElement('span');
  label.className = 'nav-toggle-label';
  label.textContent = 'Menú';

  const btn = document.createElement('button');
  btn.className = 'nav-toggle';
  btn.setAttribute('aria-label', 'Abrir menú');
  btn.innerHTML = '<span></span><span></span><span></span>';

  toggleBar.appendChild(label);
  toggleBar.appendChild(btn);
  nav.insertBefore(toggleBar, nav.firstChild);

  const navInner = nav.querySelector('.nav-inner');

  btn.addEventListener('click', function () {
    const isOpen = navInner.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    // Ocultar label cuando está abierto
    label.style.opacity = isOpen ? '0' : '';
  });

  // Dropdown táctil: abrir/cerrar con tap en móvil
  nav.querySelectorAll('.nav-item').forEach(item => {
    const trigger = item.querySelector(':scope > span');
    const dropdown = item.querySelector('.dropdown');
    if (!trigger || !dropdown) return;

    trigger.addEventListener('click', function (e) {
      // Solo en móvil (cuando la hamburguesa es visible)
      if (window.innerWidth > 768) return;
      e.stopPropagation();
      const isOpen = item.classList.toggle('open');
      // Cerrar otros dropdowns abiertos
      nav.querySelectorAll('.nav-item.open').forEach(other => {
        if (other !== item) other.classList.remove('open');
      });
    });
  });

  // Cerrar menú al hacer clic fuera
  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target)) {
      navInner.classList.remove('open');
      btn.classList.remove('open');
      label.style.opacity = '';
      nav.querySelectorAll('.nav-item.open').forEach(i => i.classList.remove('open'));
    }
  });

  // Cerrar menú al cambiar a pantalla grande
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768) {
      navInner.classList.remove('open');
      btn.classList.remove('open');
      label.style.opacity = '';
    }
  });
})();