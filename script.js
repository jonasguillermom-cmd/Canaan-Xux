/* ═══════════════════════════════════════════
   Cana'an Xu'x — script.js
═══════════════════════════════════════════ */

const SUPABASE_URL  = 'https://biiefknpnkynfobbetav.supabase.co';
const SUPABASE_ANON = 'sb_publishable_YDHCImfe22Si2-LKmS5uiw_CNnpsIQr';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

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

function actualizarHeaderUsuario() {
  const btnIngresar = document.getElementById('btn-ingresar');
  const txtSesion   = document.getElementById('txt-sesion');
  if (!btnIngresar) return;
  if (usuarioActual) {
    const nombre = usuarioActual.user_metadata?.nombre_completo || usuarioActual.email.split('@')[0];
    if (txtSesion) txtSesion.textContent = '👤 ' + nombre.split(' ')[0];
    btnIngresar.href = '#';
    btnIngresar.onclick = toggleMenuUsuario;
  } else {
    if (txtSesion) txtSesion.textContent = 'Ingresar';
    btnIngresar.href = 'login.html';
    btnIngresar.onclick = null;
    document.getElementById('menu-usuario')?.remove();
  }
}

function toggleMenuUsuario(e) {
  e.preventDefault();
  e.stopPropagation();
  const existente = document.getElementById('menu-usuario');
  if (existente) { existente.remove(); return; }
  const menu = document.createElement('div');
  menu.id = 'menu-usuario';
  menu.style.cssText = `
    position:fixed;top:68px;right:24px;background:#fff;
    border:1px solid #e0e0e0;border-radius:10px;
    box-shadow:0 4px 20px rgba(0,0,0,.15);z-index:9999;
    min-width:200px;overflow:hidden;
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
  document.getElementById('btn-cerrar-sesion').addEventListener('click', function(e) {
    e.preventDefault();
    cerrarSesion();
  });
  setTimeout(() => {
    document.addEventListener('click', function cerrarFuera(ev) {
      const m = document.getElementById('menu-usuario');
      if (m && !m.contains(ev.target) && ev.target !== document.getElementById('btn-ingresar')) {
        m.remove();
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
      usuario_id: usuarioActual.id,
      producto_id: productoId,
      cantidad: 1
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

// ─── TARJETA PRODUCTO ───
function tarjetaProducto(p) {
  const agotado = p.stock <= 0;
  return `
    <div class="prod-card" data-category="${p.subcategoria || ''}" data-producto-id="${p.id}" data-price="${p.precio}" ${!agotado ? 'onclick="addToCart(this)"' : ''}>
      <div class="prod-img-wrap">
        ${agotado ? '<span class="prod-badge agotado">Agotado</span>' : ''}
        <img src="${p.imagen_url || ''}" alt="${p.nombre}" onerror="this.style.background='#f5f0e8'">
      </div>
      <div class="prod-info">
        <div class="prod-name">${p.nombre}</div>
        ${p.descripcion ? `<div style="font-size:12px;color:#7a7a6a;margin:4px 0;">${p.descripcion}</div>` : ''}
        <div class="prod-price ${agotado ? 'sold' : ''}">
          ${agotado ? 'Agotado' : '$ ' + parseFloat(p.precio).toFixed(2)}
        </div>
        <button class="btn-add" ${agotado ? 'disabled' : ''}>
          ${agotado ? 'Agotado' : 'Agregar al carrito'}
        </button>
      </div>
    </div>`;
}

// ─── CARGAR PRODUCTOS INDEX ───
async function cargarProductosIndex() {
  const gridVendidos = document.getElementById('grid-vendidos');
  const gridOtros    = document.getElementById('grid-otros');
  if (!gridVendidos) return;

  const { data } = await db.from('productos')
    .select('*').eq('activo', true).eq('categoria', 'otros')
    .order('creado_en', { ascending: false });

  const destacados = (data || []).filter(p => p.subcategoria === 'destacado');
  const otros      = (data || []).filter(p => p.subcategoria !== 'destacado');

  gridVendidos.innerHTML = destacados.length
    ? destacados.map(tarjetaProducto).join('')
    : '<p style="grid-column:1/-1;text-align:center;color:#7a7a6a;padding:20px">Agrega productos destacados desde el panel admin.</p>';

  if (gridOtros) gridOtros.innerHTML = otros.map(tarjetaProducto).join('') || '';
}

// ─── CARGAR PRODUCTOS EN PÁGINAS DE CATEGORÍA ───
async function cargarProductosCategoria(categoria) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const { data } = await db.from('productos')
    .select('*').eq('activo', true).eq('categoria', categoria)
    .order('creado_en', { ascending: false });

  if (!data || data.length === 0) {
    grid.innerHTML = '<p style="text-align:center;padding:40px;color:#7a7a6a;grid-column:1/-1">Pronto tendremos productos disponibles.</p>';
    return;
  }

  grid.innerHTML = data.map(tarjetaProducto).join('');
}

// ─── INICIALIZAR ───
document.addEventListener('DOMContentLoaded', async () => {
  const { data } = await db.auth.getSession();
  usuarioActual = data?.session?.user || null;

  const pagina = window.location.pathname.split('/').pop();

  if (PAGINAS_PROTEGIDAS.includes(pagina) && !usuarioActual) {
    sessionStorage.setItem('redirigir_tras_login', pagina);
    window.location.href = 'login.html';
    return;
  }

  actualizarHeaderUsuario();
  await actualizarBadgeCarrito();

  // Cargar productos según la página actual
  if (pagina === 'index.html' || pagina === '')  await cargarProductosIndex();
  if (pagina === 'miel.html')                    await cargarProductosCategoria('miel');
  if (pagina === 'velas.html')                   await cargarProductosCategoria('velas');
  if (pagina === 'melipona.html')                await cargarProductosCategoria('melipona');

  db.auth.onAuthStateChange(async (event, session) => {
    usuarioActual = session?.user || null;
    actualizarHeaderUsuario();
    await actualizarBadgeCarrito();
  });
});
