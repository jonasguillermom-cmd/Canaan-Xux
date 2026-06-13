/* ═══════════════════════════════════════════
   MIEL ORO — JavaScript
   Archivo: script.js
═══════════════════════════════════════════ */

// ─── HERO SLIDER ───
let slide = 0;
const slides = document.querySelectorAll('.hero-slide');
const dots   = document.querySelectorAll('.hero-dot');

function goSlide(n) {
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
setInterval(() => changeSlide(1), 5000);


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



/* ═══════════════════════════════════════════
   Cana'an Xu'x — script.js
═══════════════════════════════════════════ */

const SUPABASE_URL  = 'https://biiefknpnkynfobbetav.supabase.co';
const SUPABASE_ANON = 'sb_publishable_YDHCImfe22Si2-LKmS5uiw_CNnpsIQr';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── PÁGINAS QUE REQUIEREN SESIÓN ───
// Si el usuario no ha iniciado sesión en estas páginas, lo manda a login
const PAGINAS_PROTEGIDAS = ['carrito.html'];

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

// ─── SESIÓN ───
let usuarioActual = null;

async function inicializarSesion() {
  const { data } = await db.auth.getSession();
  usuarioActual = data?.session?.user || null;

  // Verificar si esta página requiere sesión
  const paginaActual = window.location.pathname.split('/').pop();
  if (PAGINAS_PROTEGIDAS.includes(paginaActual) && !usuarioActual) {
    sessionStorage.setItem('redirigir_tras_login', paginaActual);
    window.location.href = 'login.html';
    return;
  }

  actualizarHeaderUsuario();
  await actualizarBadgeCarrito();
}

function actualizarHeaderUsuario() {
  const btnIngresar = document.getElementById('btn-ingresar');
  const txtSesion   = document.getElementById('txt-sesion');
  if (!btnIngresar) return;

  if (usuarioActual) {
    // Mostrar nombre del usuario
    const nombre = usuarioActual.user_metadata?.nombre_completo || usuarioActual.email.split('@')[0];
    const nombreCorto = nombre.split(' ')[0]; // Solo el primer nombre
    if (txtSesion) txtSesion.textContent = '👤 ' + nombreCorto;
    btnIngresar.href = '#';
    btnIngresar.onclick = menuUsuario;
  } else {
    if (txtSesion) txtSesion.textContent = 'Ingresar';
    btnIngresar.href = 'login.html';
    btnIngresar.onclick = null;
  }
}

// Mini menú al hacer clic en el nombre
function menuUsuario(e) {
  e.preventDefault();
  // Si ya existe el menú, lo quita
  const existente = document.getElementById('menu-usuario');
  if (existente) { existente.remove(); return; }

  const menu = document.createElement('div');
  menu.id = 'menu-usuario';
  menu.style.cssText = `
    position:absolute; top:68px; right:24px; background:#fff;
    border:1px solid #e0e0e0; border-radius:10px;
    box-shadow:0 4px 20px rgba(0,0,0,.12); z-index:999;
    min-width:180px; overflow:hidden;
  `;
  const nombre = usuarioActual.user_metadata?.nombre_completo || usuarioActual.email;
  menu.innerHTML = `
    <div style="padding:14px 16px; border-bottom:1px solid #f0f0f0;">
      <div style="font-weight:700; font-size:14px; color:#3d3b1f;">${nombre.split(' ')[0]}</div>
      <div style="font-size:12px; color:#666;">${usuarioActual.email}</div>
    </div>
    <a href="carrito.html" style="display:block;padding:12px 16px;font-size:14px;color:#3d3b1f;border-bottom:1px solid #f0f0f0;">🛒 Mi carrito</a>
    <a href="#" onclick="cerrarSesion()" style="display:block;padding:12px 16px;font-size:14px;color:#c0392b;">↩ Cerrar sesión</a>
  `;
  document.querySelector('header').style.position = 'relative';
  document.querySelector('header').appendChild(menu);

  // Cerrar al hacer clic fuera
  setTimeout(() => {
    document.addEventListener('click', function cerrar(ev) {
      if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('click', cerrar); }
    });
  }, 100);
}

async function cerrarSesion() {
  await db.auth.signOut();
  usuarioActual = null;
  localStorage.removeItem('carrito_canaan');
  window.location.href = 'index.html';
}

// ─── CARRITO ───
async function actualizarBadgeCarrito() {
  let count = 0;
  if (usuarioActual) {
    const { data } = await db.from('carrito').select('cantidad').eq('usuario_id', usuarioActual.id);
    count = data?.reduce((s, r) => s + r.cantidad, 0) || 0;
  } else {
    const local = JSON.parse(localStorage.getItem('carrito_canaan') || '[]');
    count = local.reduce((s, i) => s + i.cantidad, 0);
  }
  const badge = document.getElementById('cart-count');
  if (badge) badge.textContent = count;
}

async function addToCart(card) {
  const btn = card.querySelector('.btn-add');
  if (!btn || btn.disabled) return;

  // Si no hay sesión → mandar a registrarse
  if (!usuarioActual) {
    sessionStorage.setItem('redirigir_tras_login', 'carrito.html');
    window.location.href = 'registro.html';
    return;
  }

  const productoId = card.dataset.productoId;
  const nombre     = card.querySelector('.prod-name')?.textContent || '';
  const precio     = parseFloat(card.querySelector('.prod-price')?.textContent.replace(/[^0-9.]/g, '')) || 0;

  if (productoId) {
    // Guardar en Supabase
    const { error } = await db.from('carrito').upsert({
      usuario_id:  usuarioActual.id,
      producto_id: productoId,
      cantidad:    1
    }, { onConflict: 'usuario_id,producto_id' });

    if (!error) {
      mostrarConfirmacion(btn);
      await actualizarBadgeCarrito();
    }
  } else {
    // Producto sin ID de BD → guardar en localStorage con nombre/precio
    const local = JSON.parse(localStorage.getItem('carrito_canaan') || '[]');
    const existe = local.find(i => i.nombre === nombre);
    if (existe) existe.cantidad++;
    else local.push({ nombre, precio, cantidad: 1 });
    localStorage.setItem('carrito_canaan', JSON.stringify(local));
    mostrarConfirmacion(btn);
    await actualizarBadgeCarrito();
  }
}

function mostrarConfirmacion(btn) {
  const orig = btn.textContent;
  btn.textContent = '✓ Agregado';
  btn.style.background = '#4caf50';
  setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 1600);
}

// Botón carrito en header → requiere sesión
document.getElementById('cart-btn')?.addEventListener('click', function(e) {
  e.preventDefault();
  if (!usuarioActual) {
    sessionStorage.setItem('redirigir_tras_login', 'carrito.html');
    window.location.href = 'login.html';
  } else {
    window.location.href = 'carrito.html';
  }
});

// ─── INICIALIZAR ───
document.addEventListener('DOMContentLoaded', inicializarSesion);

db.auth.onAuthStateChange((event, session) => {
  usuarioActual = session?.user || null;
  actualizarHeaderUsuario();
  actualizarBadgeCarrito();
});
  
});
