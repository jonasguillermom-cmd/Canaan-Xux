/* ═══════════════════════════════════════════
   Cana'an Xu'x — script.js
═══════════════════════════════════════════ */

const SUPABASE_URL  = 'https://biiefknpnkynfobbetav.supabase.co';
const SUPABASE_ANON = 'sb_publishable_YDHCImfe22Si2-LKmS5uiw_CNnpsIQr';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession: true,       // mantener sesión en el mismo dispositivo
    storageKey: 'canaan-xux',   // clave única para esta app
  }
});

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
let menuAbierto = false;

function actualizarHeaderUsuario() {
  const btnIngresar = document.getElementById('btn-ingresar');
  const txtSesion   = document.getElementById('txt-sesion');
  if (!btnIngresar) return;

  if (usuarioActual) {
    const nombre = usuarioActual.user_metadata?.nombre_completo || usuarioActual.email.split('@')[0];
    const nombreCorto = nombre.split(' ')[0];
    if (txtSesion) txtSesion.textContent = '👤 ' + nombreCorto;
    btnIngresar.href = '#';
    btnIngresar.onclick = toggleMenuUsuario;
  } else {
    if (txtSesion) txtSesion.textContent = 'Ingresar';
    btnIngresar.href = 'login.html';
    btnIngresar.onclick = null;
    // Quitar menú si existe
    document.getElementById('menu-usuario')?.remove();
  }
}

function toggleMenuUsuario(e) {
  e.preventDefault();
  e.stopPropagation();
  const existente = document.getElementById('menu-usuario');
  if (existente) {
    existente.remove();
    menuAbierto = false;
    return;
  }
  abrirMenuUsuario();
}

function abrirMenuUsuario() {
  const menu = document.createElement('div');
  menu.id = 'menu-usuario';
  menu.style.cssText = `
    position:fixed; top:68px; right:24px; background:#fff;
    border:1px solid #e0e0e0; border-radius:10px;
    box-shadow:0 4px 20px rgba(0,0,0,.15); z-index:9999;
    min-width:200px; overflow:hidden;
  `;
  const nombre = usuarioActual.user_metadata?.nombre_completo || usuarioActual.email;
  menu.innerHTML = `
    <div style="padding:14px 16px;border-bottom:1px solid #f0f0f0;">
      <div style="font-weight:700;font-size:14px;color:#3d3b1f;">${nombre.split(' ')[0]}</div>
      <div style="font-size:12px;color:#999;margin-top:2px;">${usuarioActual.email}</div>
    </div>
    <a href="carrito.html" style="display:block;padding:12px 16px;font-size:14px;color:#3d3b1f;text-decoration:none;border-bottom:1px solid #f5f5f5;">🛒 Mi carrito</a>
    <a href="#" id="btn-cerrar-sesion" style="display:block;padding:12px 16px;font-size:14px;color:#c0392b;text-decoration:none;">↩ Cerrar sesión</a>
  `;
  document.body.appendChild(menu);
  menuAbierto = true;

  // Botón cerrar sesión
  document.getElementById('btn-cerrar-sesion').addEventListener('click', function(e) {
    e.preventDefault();
    cerrarSesion();
  });

  // Cerrar al hacer clic fuera
  setTimeout(() => {
    document.addEventListener('click', function cerrarFuera(ev) {
      const menu = document.getElementById('menu-usuario');
      const btn  = document.getElementById('btn-ingresar');
      if (menu && !menu.contains(ev.target) && ev.target !== btn) {
        menu.remove();
        menuAbierto = false;
        document.removeEventListener('click', cerrarFuera);
      }
    });
  }, 50);
}

async function cerrarSesion() {
  document.getElementById('menu-usuario')?.remove();
  await db.auth.signOut();
  usuarioActual = null;
  actualizarHeaderUsuario();
  await actualizarBadgeCarrito();
  window.location.href = 'index.html';
}

async function inicializarSesion() {
  const { data } = await db.auth.getSession();
  usuarioActual = data?.session?.user || null;

  const paginaActual = window.location.pathname.split('/').pop();
  if (PAGINAS_PROTEGIDAS.includes(paginaActual) && !usuarioActual) {
    sessionStorage.setItem('redirigir_tras_login', paginaActual);
    window.location.href = 'login.html';
    return;
  }

  actualizarHeaderUsuario();
  await actualizarBadgeCarrito();
}

// Detectar cambios de sesión en tiempo real
db.auth.onAuthStateChange(async (event, session) => {
  usuarioActual = session?.user || null;
  actualizarHeaderUsuario();
  await actualizarBadgeCarrito();
});

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

  if (!usuarioActual) {
    sessionStorage.setItem('redirigir_tras_login', 'carrito.html');
    window.location.href = 'registro.html';
    return;
  }

  const productoId = card.dataset.productoId;
  const nombre     = card.querySelector('.prod-name')?.textContent || '';
  const precio     = parseFloat(card.querySelector('.prod-price')?.textContent.replace(/[^0-9.]/g, '')) || 0;

  if (productoId) {
    const { error } = await db.from('carrito').upsert({
      usuario_id:  usuarioActual.id,
      producto_id: productoId,
      cantidad:    1
    }, { onConflict: 'usuario_id,producto_id' });
    if (!error) { mostrarConfirmacion(btn); await actualizarBadgeCarrito(); }
  } else {
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
