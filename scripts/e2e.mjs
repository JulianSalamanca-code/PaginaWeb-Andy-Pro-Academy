/**
 * Prueba de extremo a extremo del sistema completo.
 *
 * Ejercita los flujos reales contra la API y la base de datos, sin mocks:
 *   1. Salud de la API y conexion a Supabase
 *   2. Lectura del catalogo
 *   3. Agenda: disponibilidad, reserva, conflicto de horario, cambio de estado
 *   4. Tienda: pedido, calculo de IVA, control de stock
 *   5. Seguridad: el panel exige sesion
 *   6. Frontend: rutas y prerenderizado
 *
 * Los datos de prueba se dejan en la base al terminar: las reservas quedan
 * canceladas y los pedidos pendientes, para poder revisar que se creo.
 *
 * Uso:  node scripts/e2e.mjs [apiUrl] [webUrl]
 */

const API = process.argv[2] || 'http://localhost:5080';
const WEB = process.argv[3] || 'http://localhost:4200';

let passed = 0;
let failed = 0;
const failures = [];
const created = { bookings: [], orders: [] };

const green = '\x1b[32m';
const red = '\x1b[31m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

function check(name, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ${green}PASA${reset}  ${name}${detail ? ` ${dim}${detail}${reset}` : ''}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  ${red}FALLA${reset} ${name}${detail ? ` ${dim}${detail}${reset}` : ''}`);
  }
}

function section(title) {
  const pad = Math.max(0, 56 - title.length);
  console.log(`\n${dim}-- ${title} ${'-'.repeat(pad)}${reset}`);
}

async function request(method, path, payload) {
  const options = { method, redirect: 'manual' };

  if (payload !== undefined) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(payload);
  }

  const res = await fetch(`${API}${path}`, options);
  const text = await res.text();

  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return { status: res.status, body };
}

const get = (path) => request('GET', path);
const post = (path, payload) => request('POST', path, payload);
const patch = (path, payload) => request('PATCH', path, payload);

/** Fecha ISO a N dias vista, ajustada al proximo dia de la semana pedido. */
function futureDate(days, weekday = null) {
  const d = new Date();
  d.setDate(d.getDate() + days);

  if (weekday !== null) {
    while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// =====================================================================
// 1. Salud
// =====================================================================
section('1. Salud y conexion');

const health = await get('/api/health');
check('API responde', health.status === 200, `HTTP ${health.status}`);

const db = await get('/api/health/database');
check('Supabase conectado', db.status === 200, `HTTP ${db.status}`);

if (db.status === 200) {
  check('Base reporta estado ok', db.body?.status === 'ok');
}

// =====================================================================
// 2. Catalogo
// =====================================================================
section('2. Catalogo');

const services = await get('/api/catalog/services');
check(
  'Servicios',
  services.status === 200 && services.body?.length === 5,
  `${services.body?.length ?? 0} servicios`,
);

const withAddons = (services.body || []).filter((s) => (s.addOns || []).length > 0);
check('Servicios con complementos', withAddons.length >= 3, `${withAddons.length}`);

const courses = await get('/api/catalog/courses');
check(
  'Cursos',
  courses.status === 200 && courses.body?.length === 3,
  `${courses.body?.length ?? 0} cursos`,
);

const withTopics = (courses.body || []).filter((c) => (c.topics || []).length > 0);
check('Cursos con temario', withTopics.length === 3, `${withTopics.length}/3`);

const depositOk = (courses.body || []).every(
  (c) => Math.abs(c.depositAmount - Math.round(c.price * 0.3 * 100) / 100) < 0.01,
);
check('Anticipo = 30% del precio', depositOk);

const products = await get('/api/catalog/products');
check(
  'Productos',
  products.status === 200 && products.body?.length >= 8,
  `${products.body?.length ?? 0} productos`,
);

const reviews = await get('/api/catalog/reviews?limit=3');
check('Resenas', reviews.status === 200 && reviews.body?.length === 3);

const faqs = await get('/api/catalog/faqs');
check('FAQ', faqs.status === 200 && faqs.body?.length === 5);

// =====================================================================
// 3. Agenda
// =====================================================================
section('3. Reservas');

const fecha = futureDate(21, 1); // proximo lunes
const avail = await get(`/api/booking/availability?date=${fecha}&serviceId=1`);

check('Disponibilidad responde', avail.status === 200);
check('Devuelve horarios', (avail.body?.slots || []).length > 0, `${avail.body?.slots?.length ?? 0}`);
check('Duracion correcta (90 min)', avail.body?.durationMinutes === 90);
check('Anticipo 555 (30% de 1850)', avail.body?.depositAmount === 555);

const availConAddons = await get(`/api/booking/availability?date=${fecha}&serviceId=1&addOnIds=1,2`);
check(
  'Complementos alargan la sesion',
  availConAddons.body?.durationMinutes === 115,
  `${availConAddons.body?.durationMinutes} min`,
);

const domingo = futureDate(21, 0);
const availDomingo = await get(`/api/booking/availability?date=${domingo}&serviceId=1`);
check('Domingo sin horarios', (availDomingo.body?.slots || []).length === 0);

const slot = avail.body.slots[0];

const booking = await post('/api/booking/', {
  specialistId: avail.body.specialistId,
  startsAt: slot.startsAt,
  contactName: 'Prueba E2E',
  contactPhone: '2221234567',
  contactEmail: 'e2e@test.local',
  serviceId: 1,
  addOnIds: [1, 2],
  modality: 'studio',
  notes: 'Reserva de prueba automatizada',
});

check(
  'Reserva creada',
  booking.status === 201,
  booking.status === 201 ? booking.body?.code : `HTTP ${booking.status}`,
);

if (booking.status === 201) {
  const b = booking.body;
  created.bookings.push(b.id);

  check('Folio con prefijo ANDY-', b.code?.startsWith('ANDY-'), b.code);
  check('Estado pendiente', b.status === 'pendiente');
  check('Total 2300 (1850+250+200)', b.priceTotal === 2300, `${b.priceTotal}`);
  check('Anticipo 690 (30%)', b.depositAmount === 690, `${b.depositAmount}`);
  check('Saldo 1610', b.balanceAmount === 1610, `${b.balanceAmount}`);
  check('Duracion 115 min', (new Date(b.endsAt) - new Date(b.startsAt)) / 60000 === 115);
}

const conflict = await post('/api/booking/', {
  specialistId: avail.body.specialistId,
  startsAt: slot.startsAt,
  contactName: 'Segunda Cliente E2E',
  contactPhone: '2229998888',
  contactEmail: 'e2e2@test.local',
  serviceId: 1,
});

check('Doble reserva rechazada', conflict.status === 409, `HTTP ${conflict.status}`);
check(
  'Devuelve alternativas',
  (conflict.body?.alternatives || []).length > 0,
  `${conflict.body?.alternatives?.length ?? 0}`,
);

const badPhone = await post('/api/booking/', {
  specialistId: 1,
  startsAt: slot.startsAt,
  contactName: 'X',
  contactPhone: '123',
  contactEmail: 'a@b.com',
  serviceId: 1,
});
check('Rechaza telefono invalido', badPhone.status === 400);

const noSubject = await post('/api/booking/', {
  specialistId: 1,
  startsAt: slot.startsAt,
  contactName: 'Test',
  contactPhone: '2221234567',
  contactEmail: 'a@b.com',
});
check('Rechaza sin servicio ni curso', noSubject.status === 400);

const past = await post('/api/booking/', {
  specialistId: 1,
  startsAt: '2020-01-01T15:00:00Z',
  contactName: 'Test E2E',
  contactPhone: '2221234567',
  contactEmail: 'a@b.com',
  serviceId: 1,
});
check('Rechaza fecha pasada', past.status === 400);

if (booking.status === 201) {
  const confirm = await patch(`/api/booking/${booking.body.id}/status`, { status: 'confirmada' });
  check(
    'Confirmar reserva',
    confirm.status === 200 && confirm.body?.booking?.status === 'confirmada',
  );

  const complete = await patch(`/api/booking/${booking.body.id}/status`, { status: 'completada' });
  check(
    'Completar reserva',
    complete.status === 200 && complete.body?.booking?.status === 'completada',
  );

  const cancel = await patch(`/api/booking/${booking.body.id}/status`, { status: 'cancelada' });
  check(
    'Cancelar reserva',
    cancel.status === 200 && cancel.body?.booking?.status === 'cancelada',
  );

  const bad = await patch(`/api/booking/${booking.body.id}/status`, { status: 'inventado' });
  check('Rechaza estado invalido', bad.status === 400);
}

// =====================================================================
// 4. Tienda
// =====================================================================
section('4. Tienda');

const variantId = products.body[0].variants[0].id;
const stockInicial = products.body[0].variants[0].stockOnHand;
const unitPrice = products.body[0].price;

const order = await post('/api/shop/orders', {
  contactName: 'Compradora E2E',
  contactPhone: '2221234567',
  contactEmail: 'compradora@test.local',
  items: [{ variantId, quantity: 2 }],
});

check(
  'Pedido creado',
  order.status === 201,
  order.status === 201 ? order.body?.code : `HTTP ${order.status}`,
);

if (order.status === 201) {
  const o = order.body;
  created.orders.push(o.orderId);
  const esperado = Math.round(unitPrice * 2 * 1.16 * 100) / 100;

  check('Folio con prefijo PED-', o.code?.startsWith('PED-'), o.code);
  check('Estado pendiente', o.status === 'pendiente');
  check(`Total ${esperado} (precio x2 + IVA)`, o.total === esperado, `${o.total}`);
}

const afterOrder = await get('/api/catalog/products');
const stockAfter = afterOrder.body
  .flatMap((p) => p.variants || [])
  .find((v) => v.id === variantId)?.stockOnHand;

check(
  'Stock intacto tras crear pedido',
  stockAfter === stockInicial,
  `${stockInicial} -> ${stockAfter}`,
);

const overstock = await post('/api/shop/orders', {
  contactName: 'Compradora E2E',
  contactPhone: '2221234567',
  contactEmail: 'compradora@test.local',
  items: [{ variantId, quantity: 9999 }],
});

check('Rechaza sobreventa', overstock.status === 409, `HTTP ${overstock.status}`);
check('Detalla el faltante', (overstock.body?.shortages || []).length > 0);

const emptyCart = await post('/api/shop/orders', {
  contactName: 'Compradora E2E',
  contactPhone: '2221234567',
  contactEmail: 'compradora@test.local',
  items: [],
});
check('Rechaza carrito vacio', emptyCart.status === 400);

if (order.status === 201) {
  const confirm = await post(`/api/shop/orders/${order.body.orderId}/confirm`, {});
  check(
    'Rechaza confirmar sin llaves de MP',
    confirm.status === 400,
    `HTTP ${confirm.status}`,
  );
}

const shopSummary = await get('/api/shop/summary');
check(
  'Resumen de tienda',
  shopSummary.status === 200 && shopSummary.body?.productsPublished >= 8,
);

// =====================================================================
// 5. Seguridad
// =====================================================================
section('5. Seguridad del panel');

const noToken = await get('/api/admin/metrics');
check('Sin token da 401', noToken.status === 401, `HTTP ${noToken.status}`);

const badToken = await fetch(`${API}/api/admin/products`, {
  headers: {
    Authorization:
      'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiJ9.invalido',
  },
});
check('Token falso da 401', badToken.status === 401, `HTTP ${badToken.status}`);

const basicAuth = await fetch(`${API}/api/admin/metrics`, {
  headers: { Authorization: 'Basic YWRtaW46YWRtaW4=' },
});
check('Esquema no Bearer da 401', basicAuth.status === 401, `HTTP ${basicAuth.status}`);

const publico = await get('/api/catalog/services');
check('Catalogo sigue publico', publico.status === 200);

// =====================================================================
// 6. Frontend
// =====================================================================
section('6. Frontend');

const rutas = ['/', '/servicios', '/cursos', '/tienda', '/reservar', '/login', '/registro'];

for (const ruta of rutas) {
  try {
    const res = await fetch(`${WEB}${ruta}`, { redirect: 'manual' });
    check(`Ruta ${ruta}`, res.status === 200, `HTTP ${res.status}`);
  } catch (e) {
    check(`Ruta ${ruta}`, false, e.message);
  }
}

try {
  const home = await (await fetch(`${WEB}/`)).text();
  check('Home prerenderizada con contenido', home.includes('Realza Tu Belleza'));
  check('Home trae precio formateado', /\$[\d,]+/.test(home));
} catch {
  /* la ruta ya se verifico arriba */
}

try {
  const cursos = await (await fetch(`${WEB}/cursos`)).text();
  check('Cursos prerenderizados con temario', cursos.includes('Visagismo'));
} catch {
  /* la ruta ya se verifico arriba */
}

// =====================================================================
// Resultado
// =====================================================================
console.log(`\n${'='.repeat(62)}`);
console.log(`  ${passed} pruebas pasaron, ${failed} fallaron`);

if (failed > 0) {
  console.log(`\n  ${red}Fallaron:${reset}`);
  failures.forEach((f) => console.log(`    - ${f}`));
}

console.log(
  `\n  ${dim}Datos creados: ${created.bookings.length} reservas, ${created.orders.length} pedidos${reset}`,
);
console.log('');

process.exit(failed > 0 ? 1 : 0);