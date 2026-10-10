# Andy Pro Academy

Sistema de reservaciones y tienda para **Andy Cosmetología • Puebla Studio**.

Maquillaje profesional, estilismo de gala, manicura rusa, cursos con
certificación y venta de insumos de cabina.

---

## Estructura

El sistema vive en **dos repositorios** que se despliegan por separado:

```
FRONTEND/   Angular 21 · sitio público y panel de administración
BACKEND/    ASP.NET Core 10 · API REST sobre Supabase Postgres
            ├── db/migrations/ Esquema, seguridad y datos
            └── src/
                ├── Endpoints/ Un archivo por módulo
                ├── Data/      Repositorios (Npgsql)
                ├── Models/    DTOs → generan los tipos del frontend
                ├── Services/  Mercado Pago, JWT, migraciones
                └── Middleware/ Autenticación
```

Este repositorio contiene el frontend y la documentación general.

- **front** — https://github.com/JulianSalamanca-code/PaginaWeb-Andy-Pro-Academy
- **back** — https://github.com/JulianSalamanca-code/Bakend-Andy-proacademy

---

## Puesta en marcha

### Requisitos

- Node.js 20 o superior
- .NET SDK 10 o superior
- Un proyecto de Supabase

### 1. Base de datos

Las migraciones están en `BACKEND/db/migrations/`. Se aplican en orden desde
el **SQL Editor** de Supabase, o con:

```bash
supabase db push
```

| Archivo | Qué hace |
|---|---|
| `000_reset.sql` | Borra el esquema. Destructivo, solo en desarrollo |
| `001_schema.sql` | Tablas, índices y la constraint anti-doble-booking |
| `002_rls.sql` | Row Level Security: quién lee y quién escribe |
| `003_functions.sql` | Disponibilidad, reservas y cobro de pedidos |
| `004_seed.sql` | Contenido inicial del estudio |
| `005_shop_fixes.sql` | Correcciones incrementales |

### 2. Backend

El backend está en el **otro repositorio**. Clónalo y:

```bash
cd ../Bakend-Andy-proacademy/src/AndyProAcademy.Api
dotnet run
```

La configuración va en `appsettings.Development.json`, que está en
`.gitignore`. La plantilla está en `.env.example`.

```json
{
  "Supabase": {
    "JwtSecret": "<JWT secret de Supabase>",
    "DbHost": "aws-0-us-east-1.pooler.supabase.com",
    "DbPort": "6543",
    "DbName": "postgres",
    "DbUser": "postgres.xxxxxxxxxxxxxx",
    "DbPassword": "<contraseña>"
  }
}
```

- API: <http://localhost:5080>
- Swagger: <http://localhost:5080/swagger>

### 3. Frontend

```bash
npm install
npm start
```

<http://localhost:4200>

Para que funcione el login:

```typescript
// src/environments/environment.ts
supabase: {
  url: 'https://xxxxxxxx.supabase.co',
  anonKey: '<anon key>',
}
```

---

## Módulos

| Ruta | Qué hace |
|---|---|
| `/` | Portada editorial con cursos y reseñas |
| `/servicios` | Catálogo de los 5 servicios |
| `/cursos` | 3 módulos con temario completo |
| `/tienda` | Productos con carrito y checkout |
| `/reservar` | Asistente de 4 pasos con horarios reales |
| `/mis-reservas` | Historial del cliente (requiere sesión) |
| `/login` · `/registro` | Supabase Auth |
| `/admin` | Panel (requiere rol admin) |

---

## Decisiones de diseño

**El stock se descuenta al cobrar, no al carrito.** Si bajara antes, una
clienta que abandona el checkout dejaría producto bloqueado sin haber
comprado nada.

**Los precios los calcula la base.** El frontend manda identificadores y
cantidades; si mandara el total, podría comprar un shampoo de 650 por un
peso.

**La agenda se protege en Postgres, no en el frontend.** Una constraint de
exclusión rechaza el solapamiento aunque dos peticiones lleguen a la vez.
Validar en el navegador es UX, no seguridad.

**El JWT se valida de verdad.** Se comprueba firma, expiración y
algoritmo. La anon key de Supabase es un JWT firmado con `role: 'anon'`, así
que el filtro exige `authenticated` explícitamente.

**El stock se ajusta por deltas.** Poner "stock = 5" desde el panel
pisaría las ventas que ocurrieron mientras se escribía. Cada ajuste guarda
su motivo en `inventory_movements`.

---

## Ramas

```
main    producción, siempre desplegable
dev     integración, siempre compila
feature/catalogo · booking · admin · tienda · auth
```

Las features salen de `dev`. Antes de abrir una nueva, integra las
pendientes:

```bash
git checkout dev
git merge feature/<nombre>
```

---

## Pruebas

`scripts/e2e.mjs` ejercita los flujos reales contra la API y la base de
datos —sin mocks— incluyendo agenda, tienda, validaciones y seguridad.
Son 57 verificaciones.

```bash
# con la API en :5080 y el frontend en :4200
node scripts/e2e.mjs
```

Deja datos de prueba en la base a propósito (la reserva queda cancelada,
los pedidos pendientes) para poder revisar qué se creó.

---

## Documentación

- **[DEPLOY.md](DEPLOY.md)** — cómo publicar en Cloudflare Pages y Azure
- **[INTEGRACIONES.md](INTEGRACIONES.md)** — qué falta para producción y
  qué preguntar a la clienta
- **[db/README.md](https://github.com/JulianSalamanca-code/Bakend-Andy-proacademy/blob/dev/db/README.md)**
  — decisiones del esquema (en el repo del backend)

---

## Estado

Prototipo funcional. Ver `INTEGRACIONES.md` para lo que falta.

- [x] Catálogo con contenido real en base de datos
- [x] Agenda con protección contra doble booking
- [x] Tienda con control de inventario
- [x] Panel de administración
- [x] Login con roles
- [ ] Facturación CFDI 4.0
- [ ] Mercado Pago con llaves de producción
- [ ] Datos de contacto reales