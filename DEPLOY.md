# Despliegue

## Resumen

| Pieza | Dónde | Costo |
|---|---|---|
| Frontend (Angular) | Cloudflare Pages | Gratis |
| API (C#) | Azure Static Web Apps o Contenedores | Gratis hasta 100k requests/mes |
| Base de datos | Supabase Postgres | Gratis (500 MB) |
| Pagos | Mercado Pago | Comisión por transacción |

---

## 1. Frontend en Cloudflare Pages

**Conectar el repositorio**

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → *Connect to Git*
2. Elegir `JulianSalamanca-code/PaginaWeb-Andy-Pro-Academy`
3. Rama: `main` (o `dev` mientras haya pruebas)

**Configuración del build**

| Campo | Valor |
|---|---|
| Framework preset | Angular |
| Build command | `npm run build` |
| Build output directory | `dist/andy-pro-academy/browser` |
| Root directory | `FRONTEND` |

> El repositorio tiene `FRONTEND/` y `BACKEND/` en la raíz, por eso el root
> directory es obligatorio. Sin él, Cloudflare busca `package.json` en la raíz
> del repo y falla.

**Variables de entorno** (Settings → Environment variables)

```
SUPABASE_URL          = https://xxxxxxxx.supabase.co
SUPABASE_ANON_KEY     = <anon key>
```

Son públicas por diseño: viajan en el bundle del navegador. La seguridad no
depende de ellas, sino de que la API valide el JWT.

---

## 2. API en Azure

La API es .NET, así que Azure es lo que tiene hosting gratuito para este
ecosistema.

**Azure Static Web Apps** — opción recomendada

1. Portal de Azure → **Static Web Apps** → *Create*
2. *Source* → GitHub → `Bakend-Andy-proacademy`
3. Build location: `BACKEND`
4. App location: `AndyProAcademy.Api`
5. Output location: `bin/Release/net10.0/publish`

La API queda en `https://<nombre>.azurewebsites.net`.

**Variables en Azure** (Configuration → Environment variables)

```
Supabase__DbHost      = aws-0-us-east-1.pooler.supabase.com
Supabase__DbPort      = 6543
Supabase__DbName      = postgres
Supabase__DbUser      = postgres.xxxxxxxxxxxxxx
Supabase__DbPassword  = <contraseña>
Supabase__JwtSecret   = <JWT secret de Supabase>
Supabase__ProjectUrl  = https://xxxxxxxx.supabase.co

MercadoPago__Production = false
MercadoPago__PublicKey   = <public key>
MercadoPago__AccessToken = <access token>
MercadoPago__BackendUrl  = https://<api>.azurewebsites.net

Database__AllowMigrations = false
Database__AllowReset      = false
```

> **Los `__` dobles no son un error.** En ASP.NET Core, `:` es el separador
> de configuración y Azure lo usa para sus propios fines; `__` lo reemplaza.
> Sin esto, Azure ignora silenciosamente las variables con dos puntos.

**Sobre el puerto 6543**

`Pooling=false` está forzado en `ConnectionStringFactory` porque el pooler de
transacciones no soporta prepared statements. Es obligatorio y ya está
resuelto en el código; no hay que cambiar nada.

---

## 3. CORS

La política `AngularDev` de `Program.cs` solo permite `localhost:4200`. Al
publicar hay que añadir el dominio real:

```csharp
.WithOrigins(
    "http://localhost:4200",
    "https://andyproacademy.pages.dev",     // ← Cloudflare Pages
    "https://andystudio.com")                // ← dominio propio
```

Sin esto, el navegador bloquea las llamadas a la API y todo el sitio
aparece vacío aunque el backend esté bien.

---

## 4. Base de datos

Las migraciones ya están aplicadas en desarrollo. En producción:

```bash
supabase link --db-url "<url-de-conexion>"
supabase db push
```

Las migraciones viven en `BACKEND/db/migrations/`.

---

## 5. Antes de dar por terminado

Checklist corto:

- [ ] `Database__AllowMigrations` y `AllowReset` en **false**
- [ ] Confirmación de correo activada en Supabase Auth
- [ ] Usuario admin promovido:
      ```sql
      update public.profiles set role = 'admin' where email = 'tu@correo.com';
      ```
- [ ] Mercado Pago en sandbox con llaves reales
- [ ] CORS con el dominio de producción
- [ ] `ng build` pasa sin errores
- [ ] `/admin` responde 401 sin sesión

---

## Cosas que siguen pendientes

Nada de esto bloquea una demo, pero sí una operación real:

**Facturación (CFDI 4.0).** El prototipo no emite comprobantes. El
esquema ya tiene `rfc_receiver`, `tax_rate` y `payment_reference` listos.
Hace falta un PAC con API REST. Ver `INTEGRACIONES.md`.

**Envíos.** El esquema soporta `fulfillment = 'envio'` pero la interfaz
solo ofrece pick-up en el estudio.

**Realtime.** Supabase Realtime está disponible en el plan gratuito y
permitiría que las reservas nuevas aparezcan en el panel sin recargar.
No está implementado; el panel recarga al cambiar de estado.