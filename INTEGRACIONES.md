# Integraciones pendientes

Este documento describe **qué falta para pasar de prototipo a producción**
y **qué hay que preguntar a la clienta**. No es un código por escribir: es
la lista de decisiones que alguien tiene que tomar.

---

## 1. Facturación electrónica (CFDI 4.0) — obligatorio en México

### Por qué no es opcional

En México, **toda venta a consumidores exige comprobante fiscal**. No es una
opción de negocio: es obligación legal. Quien vende sin facturar está en
facturación informal, con consecuencias para la clienta (no puede deducir
gastos, sus clientes corporativos no pueden comprobar el gasto) y para el
estudio (SAT puede exigir regularización).

### Lo que ya está hecho

El esquema se preparó para esto desde el principio, aunque el prototipo no
emita nada:

| Campo | Tabla | Para qué |
|---|---|---|
| `rfc_receiver` | `bookings`, `orders` | RFC de quien pide factura |
| `rfc_required` | `services` | Marca los servicios que exigen comprobante |
| `tax_rate` | `products` | IVA 16% en cosméticos |
| `payment_reference` | `bookings`, `orders` | Referencia del pago para el PAC |

### Lo que falta

**Nunca se construye esto a mano.** CFDI 4.0 es un estándar con
requisitos formales y un estándar de certificación del SAT. Se usa un **PAC**
(Proveedor Autorizado de Certificación).

**Lo que hay que tener antes de contratar un PAC:**

1. **Constancia de Situación Fiscal** — la emite el SAT, es gratis
2. **RFC** (persona física o moral)
3. **e.firma (firma electrónica / FIEL)** — sin esto no se puede timbrar.
   Se expide en el SAT y tiene un costo único
4. **Certificado de sello digital**, si se factura por volumen alto

### Proveedores con API

| PAC | Nota |
|---|---|
| **Facturama** | Plan gratuito con CFDI limitados al mes. API REST estable |
| **Finkl** | Alternativa mexicana |
| **SW Sapien / Edicom** | Más orientados a contabilidad |

### Preguntas para la clienta

- ¿Tiene RFC y constancia de situación fiscal?
- ¿Es persona física o moral?
- ¿Tiene e.firma?
- ¿Emite factura a todo el mundo o solo a quien la pide?
- ¿Su contador ya tiene un PAC, o hay que contratar uno?
- ¿Factura con nosotros o cada clienta pide su comprobante por separado?

### Costo aside

La API del PAC es un `POST` con los datos del pedido. Va al endpoint
`/api/shop/webhooks` o uno nuevo, no al webhook de Mercado Pago: son cosas
distintas y conviene no mezclarlas.

---

## 2. Pagos — Mercado Pago

### Estado actual

El flujo está completo y funciona en modo sandbox:

1. Se crea el pedido con importe calculado en la base
2. Se genera la preferencia de pago
3. La clienta paga
4. El webhook confirma y descuenta el stock

**Falta poner las llaves reales** en `MercadoPago__PublicKey` y
`MercadoPago__AccessToken`, y pasar `MercadoPago__Production` a `true`.

### Antes de producción

- [ ] **Certificar la cuenta.** Mercado Pago pide verificar la identidad y
      el banco. Sin cuenta certificada solo funcionan las llaves de prueba
- [ ] **Reemplazar la URL del webhook** por el dominio real. Mercado Pago
      llama a `BackendUrl/api/shop/webhooks/mercadopago`
- [ ] **Probar el flujo real** con una compra de bajo valor y luego
      devolver el dinero desde el panel de Mercado Pago
- [ ] **Definir la política de reembolso.** No está en el código

### Decisión pendiente

El proyecto se apunta a **Mercado Pago** porque es lo que usa una clienta
mexicana: SPEI, OXXO y MSI son los métodos que espera ver. **Stripe** sería
técnicamente superior, pero su checkout se siente ajeno y el formato de
tarjetas no es lo que la gente busca en México.

Conviene validar esta decisión con la clienta antes de integrarlo.

---

## 3. Anticipo del 30% de las citas

### Estado actual

El anticipo se **calcula** (30% del total) y se **muestra**, pero el cobro es
manual: la clienta recibe el folio y Andy confirma la recepción por
WhatsApp o transferencia.

### Opciones

| Opción | Cómo funciona | Cuándo tiene sentido |
|---|---|---|
| **Manual** (actual) | Transferencia o efectivo, Andy confirma | Pocos pedidos al día |
| **Stripe/Mercado Pago** | Cobro automático del 30% al reservar | Muchas reservas, riesgo de cancelaciones |

**Así funciona ahora**: una cita creada queda `pendiente` hasta
que Andy la marca `confirmada` a mano. Funciona bien para un volumen bajo.

Si se integra el cobro automático, hay que decidir qué pasa cuando **la
reserva no se paga**: ¿se libera el horario automáticamente? ¿después de
cuánto tiempo? Esa regla **no está escrita** y es una decisión de negocio.

---

## 4. Envíos

El esquema soporta `fulfillment = 'envio'`, pero la interfaz solo ofrece
**pick-up en el estudio**.

Si se activan envíos hay que definir:

- ¿A qué ciudades y con qué costo?
- ¿Quién entrega: courier, paquetería o la propia empresa?
- ¿Se cobra el envío aparte o se incluye?
- ¿Cómo se calcula el costo? (peso, destino, paquete)
- ¿Quién gestiona las guías de rastreo?

Nada de esto está implementado.

---

## 5. Correo electrónico y notificaciones

No hay envío de correos. Hoy la confirmación es visual y por WhatsApp.

Para una operación real hacen falta:

- Confirmación de reserva (a la clienta)
- Aviso al estudio (nueva reserva)
- Recordatorio de cita el día anterior
- Aviso de pedido listo para recoger

**Supabase Auth envía correos**, pero solo los de autenticación. Para lo
demás hace falta un proveedor (Resend, SendGrid, Brevo) o las
funciones Edge de Supabase con SMTP.

---

## 6. Datos del estudio

En el código hay **placeholders** que deben reemplazarse:

| Dato | Dónde | Valor actual |
|---|---|---|
| WhatsApp | `footer.component.ts`, `booking-wizard.component.ts` | `+52 222 123 4567` |
| Dirección | `footer.component.ts` | "Zona Angelópolis & La Paz" |
| Correo de admin | — | sin definir |

Están marcados con `TODO` en el código.

---

## 7. Imágenes

Los productos y servicios tienen `image_url` en `NULL` a propósito. El
frontend dibuja un **placeholder** con gradiente y el logo, así que nunca
se ve una imagen rota.

Para subir las fotos reales hay dos caminos:

- **Storage de Supabase** (recomendado): bucket público, se sube desde el
  panel de administración. El plan gratuito da 1 GB
- **Un CDN externo** (Cloudinary, imgix): mejor para transformar y
  comprimir, pero tiene costo por encima de cierto volumen

Nada de esto está implementado.

---

## Resumen para la conversación

**Lo que hay que preguntar:**

1. ¿Tiene RFC, constancia de situación fiscal y e.firma?
2. ¿Su contador ya tiene PAC?
3. ¿Mercado Pago ya está confirmado o hay que certificarlo?
4. ¿Se cobra el anticipo en línea o se sigue manual?
5. ¿Hay envíos a domicilio? ¿A dónde y con quién?
6. ¿Quién mantiene el sistema después de la entrega?
7. ¿Hay más personas con acceso al panel?

**Lo que falta decidir (no se puede unanswered con una pregunta):**

- Cuánto tiempo se bloquea un horario sin pagar
- Política de reembolso y cancelación
- Si se factura a todo el mundo o bajo solicitud

Nada de lo anterior se puede resolver con una pregunta: son reglas del
negocio que solo la clienta puede definir.

**Lo que ya funciona y no hay que volver a hacer:**

- Agenda con protección contra doble booking
- Tienda con control de inventario
- Panel de administración
- Login con roles
- Cálculo de IVA