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

/* ═══════════════════════════════════════════
   MIEL ORO — JavaScript con Supabase
   Archivo: script.js
   
   ⚠️  Reemplaza SUPABASE_URL y SUPABASE_ANON
       con tus datos reales (Settings → API)
═══════════════════════════════════════════ */

/* ── SUPABASE CONFIG ─────────────────────── */
const SUPABASE_URL  = 'https://biiefknpnkynfobbetav.supabase.co';  // ← CAMBIA
const SUPABASE_ANON = 'sb_publishable_YDHCImfe22Si2-LKmS5uiw_CNnpsIQr';                 // ← CAMBIA

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);


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

function changeSlide(d) { goSlide(slide + d); }
if (slides.length) setInterval(() => changeSlide(1), 5000);


// ─── SESIÓN Y CARRITO ───
let usuarioActual = null;

// Carrito local (antes de iniciar sesión)
let carritoLocal = JSON.parse(localStorage.getItem('carrito_canaan') || '[]');

async function inicializarSesion() {
  const { data } = await db.auth.getSession();
  usuarioActual = data?.session?.user || null;
  actualizarHeaderUsuario();
  await actualizarBadgeCarrito();
}

function actualizarHeaderUsuario() {
  const btnIngresa = document.getElementById('btn-ingresar');
  const btnCarrito = document.getElementById('cart-btn');
  if (!btnIngresa) return;

  if (usuarioActual) {
    btnIngresa.innerHTML = `
      <svg class="icon-svg" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      Mi cuenta
    `;
    btnIngresa.href = 'mi-cuenta.html';
  } else {
    btnIngresa.innerHTML = `
      <svg class="icon-svg" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      Ingresar
    `;
    btnIngresa.href = 'login.html';
  }
}

async function actualizarBadgeCarrito() {
  let count = 0;
  if (usuarioActual) {
    const { data } = await db
      .from('carrito')
      .select('cantidad')
      .eq('usuario_id', usuarioActual.id);
    count = data?.reduce((s, r) => s + r.cantidad, 0) || 0;
  } else {
    count = carritoLocal.reduce((s, i) => s + i.cantidad, 0);
  }
  const badge = document.getElementById('cart-count');
  if (badge) badge.textContent = count;
}


// ─── AGREGAR AL CARRITO ───
async function addToCart(card) {
  const btn = card.querySelector('.btn-add');
  if (btn.disabled) return;

  // Obtener ID del producto desde el atributo data del card
  const productoId = card.dataset.productoId;
  const nombre     = card.querySelector('.prod-name')?.textContent || '';
  const precio     = parseFloat(card.querySelector('.prod-price')?.textContent.replace(/[^0-9.]/g,'')) || 0;

  if (usuarioActual) {
    // Usuario con sesión → guardar en Supabase
    if (productoId) {
      const { error } = await db.from('carrito').upsert({
        usuario_id: usuarioActual.id,
        producto_id: productoId,
        cantidad: 1
      }, { onConflict: 'usuario_id,producto_id' });

      if (!error) {
        mostrarConfirmacion(btn);
        await actualizarBadgeCarrito();
      }
    }
  } else {
    // Sin sesión → guardar en localStorage
    const existe = carritoLocal.find(i => i.id === productoId);
    if (existe) {
      existe.cantidad++;
    } else {
      carritoLocal.push({ id: productoId, nombre, precio, cantidad: 1 });
    }
    localStorage.setItem('carrito_canaan', JSON.stringify(carritoLocal));
    mostrarConfirmacion(btn);
    await actualizarBadgeCarrito();
  }
}

function mostrarConfirmacion(btn) {
  const orig = btn.textContent;
  btn.textContent = '✓ Agregado';
  btn.style.background = '#4caf50';
  setTimeout(() => {
    btn.textContent = orig;
    btn.style.background = '';
  }, 1600);
}


// ─── BOTÓN CARRITO → redirige a login si no hay sesión ───
document.getElementById('cart-btn')?.addEventListener('click', function(e) {
  e.preventDefault();
  if (!usuarioActual) {
    // Guarda a dónde volver tras login
    sessionStorage.setItem('redirigir_tras_login', 'carrito.html');
    window.location.href = 'login.html';
  } else {
    window.location.href = 'carrito.html';
  }
});


// ─── CERRAR SESIÓN ───
async function cerrarSesion() {
  await db.auth.signOut();
  usuarioActual = null;
  localStorage.removeItem('carrito_canaan');
  window.location.href = 'index.html';
}


// ─── BUSCADOR ───
function toggleSearch() {
  document.querySelector('.search-overlay')?.classList.toggle('open');
}

document.querySelector('.search-overlay')?.addEventListener('click', function(e) {
  if (e.target === this) this.classList.remove('open');
});

document.querySelector('.search-close')?.addEventListener('click', function() {
  document.querySelector('.search-overlay')?.classList.remove('open');
});


// ─── INICIALIZAR AL CARGAR ───
document.addEventListener('DOMContentLoaded', inicializarSesion);

// Escuchar cambios de sesión en tiempo real
db.auth.onAuthStateChange((event, session) => {
  usuarioActual = session?.user || null;
  actualizarHeaderUsuario();
  actualizarBadgeCarrito();
});
