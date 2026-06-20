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
  const img = (p.imagenes && p.imagenes[0]) ? p.imagenes[0] : (p.imagen_url || '');
  return `
    <div class="prod-card" data-category="${p.subcategoria || ''}" data-producto-id="${p.id}" data-price="${p.precio}">
      <a href="producto.html?id=${p.id}" style="text-decoration:none;color:inherit;display:block">
        <div class="prod-img-wrap">
          ${agotado ? '<span class="prod-badge agotado">Agotado</span>' : ''}
          <img src="${img}" alt="${p.nombre}" onerror="this.style.background='#f5f0e8'">
        </div>
        <div class="prod-info">
          <div class="prod-name">${p.nombre}</div>
          <div class="prod-price ${agotado ? 'sold' : ''}">
            ${agotado ? 'Agotado' : '$ ' + parseFloat(p.precio).toFixed(2)}
          </div>
        </div>
      </a>
      <div style="padding:0 16px 16px">
        <button class="btn-add" ${agotado ? 'disabled' : ''} onclick="event.stopPropagation();addToCartById('${p.id}',this)">
          ${agotado ? 'Agotado' : 'Agregar al carrito'}
        </button>
      </div>
    </div>`;
}

// Agregar al carrito directo desde la tarjeta (sin entrar al detalle)
async function addToCartById(productoId, btn) {
  if (!usuarioActual) {
    sessionStorage.setItem('redirigir_tras_login', 'carrito.html');
    window.location.href = 'registro.html';
    return;
  }
  const { error } = await db.from('carrito').upsert({
    usuario_id: usuarioActual.id,
    producto_id: productoId,
    cantidad: 1
  }, { onConflict: 'usuario_id,producto_id' });
  if (!error) { mostrarConfirmacion(btn); await actualizarBadgeCarrito(); }
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

// ─── PAGINACIÓN ───
const PRODUCTOS_POR_PAGINA = 8;
let paginaActualCat = 1;
let todosLosProductos = [];

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

  todosLosProductos = data;
  paginaActualCat = 1;
  renderPaginaCategoria();
}

function renderPaginaCategoria() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const total    = todosLosProductos.length;
  const totalPag = Math.ceil(total / PRODUCTOS_POR_PAGINA);
  const inicio   = (paginaActualCat - 1) * PRODUCTOS_POR_PAGINA;
  const fin      = inicio + PRODUCTOS_POR_PAGINA;
  const pagina   = todosLosProductos.slice(inicio, fin);

  grid.innerHTML = pagina.map(tarjetaProducto).join('');

  // Quitar paginación anterior si existe
  const paginacionAnterior = document.getElementById('paginacion-cat');
  if (paginacionAnterior) paginacionAnterior.remove();

  // Solo mostrar paginación si hay más de una página
  if (totalPag <= 1) return;

  const paginacion = document.createElement('div');
  paginacion.id = 'paginacion-cat';
  paginacion.style.cssText = `
    display:flex;align-items:center;justify-content:center;
    gap:8px;padding:32px 16px;flex-wrap:wrap;
  `;

  // Botón anterior
  const btnPrev = document.createElement('button');
  btnPrev.textContent = '←';
  btnPrev.disabled = paginaActualCat === 1;
  btnPrev.style.cssText = estilosBtnPag(paginaActualCat === 1, false);
  btnPrev.onclick = () => irPagina(paginaActualCat - 1);
  paginacion.appendChild(btnPrev);

  // Números de página
  for (let i = 1; i <= totalPag; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.style.cssText = estilosBtnPag(false, i === paginaActualCat);
    btn.onclick = () => irPagina(i);
    paginacion.appendChild(btn);
  }

  // Botón siguiente
  const btnNext = document.createElement('button');
  btnNext.textContent = '→';
  btnNext.disabled = paginaActualCat === totalPag;
  btnNext.style.cssText = estilosBtnPag(paginaActualCat === totalPag, false);
  btnNext.onclick = () => irPagina(paginaActualCat + 1);
  paginacion.appendChild(btnNext);

  grid.parentElement.appendChild(paginacion);
}

function estilosBtnPag(disabled, activo) {
  if (disabled) return 'width:40px;height:40px;border-radius:8px;border:1.5px solid #e0d8cc;background:#f5f0e8;color:#bbb;cursor:not-allowed;font-family:inherit;font-size:14px;font-weight:700;';
  if (activo)   return 'width:40px;height:40px;border-radius:8px;border:none;background:#eb904d;color:#fff;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;';
  return 'width:40px;height:40px;border-radius:8px;border:1.5px solid #e0d8cc;background:#fff;color:#3d3b1f;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;';
}

function irPagina(n) {
  paginaActualCat = n;
  renderPaginaCategoria();
  // Scroll al inicio de los productos
  const grid = document.getElementById('products-grid');
  if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── CONTENIDO EDITABLE DEL SITIO ───
// Carga todos los textos/imágenes marcados con data-editable de la página actual
// y los reemplaza con lo guardado en Supabase (si existe).
async function cargarContenidoEditable(paginaId) {
  const elementos = document.querySelectorAll('[data-editable]');
  if (!elementos.length) return;

  const { data } = await db
    .from('contenido_sitio')
    .select('clave, tipo, valor')
    .eq('pagina', paginaId);

  if (!data || !data.length) return;

  const mapa = {};
  data.forEach(item => { mapa[item.clave] = item; });

  elementos.forEach(el => {
    const clave = el.getAttribute('data-editable');
    const item = mapa[clave];
    if (!item || !item.valor) return;

    if (item.tipo === 'imagen') {
      if (el.tagName === 'IMG') {
        el.src = item.valor;
        el.style.display = '';      // por si onerror la había ocultado
        el.onerror = null;          // evitar que vuelva a ocultarse
        // Si el contenedor padre tiene un placeholder hermano, ocultarlo
        const placeholder = el.parentElement?.querySelector('.bee-card-overlay, .nos-hex-placeholder, .blog-img-placeholder, .img-placeholder');
        if (placeholder && !placeholder.classList.contains('bee-card-overlay')) placeholder.style.display = 'none';
      } else {
        el.style.backgroundImage = `url('${item.valor}')`;
      }
    } else {
      el.innerHTML = item.valor;
    }
  });
}

// ─── INICIALIZAR ───
document.addEventListener('DOMContentLoaded', async () => {
  const { data } = await db.auth.getSession();
  usuarioActual = data?.session?.user || null;

  const pagina = window.location.pathname.split('/').pop();
  const paginaId = pagina === '' ? 'index.html' : pagina;

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

  // Cargar contenido editable (textos/imágenes) de esta página
  await cargarContenidoEditable(paginaId);

  db.auth.onAuthStateChange(async (event, session) => {
    usuarioActual = session?.user || null;
    actualizarHeaderUsuario();
    await actualizarBadgeCarrito();
  });
});
