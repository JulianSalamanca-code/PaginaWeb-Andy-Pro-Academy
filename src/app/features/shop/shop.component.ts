import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CourseService } from '../../core/services/course.service';
import {
  CartService,
  StockConflictError,
  type Product,
} from '../../core/api/cart.service';
import { num, str } from '../../core/api/booking.service';
import type { OrderCheckout } from '../../core/api/cart.service';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <section class="py-20">
      <div class="container-luxury space-y-12">
        <div class="text-center max-w-2xl mx-auto space-y-3">
          <span class="label-md text-primary">Tienda del Atelier</span>
          <h1 class="text-3xl md:text-4xl text-on-surface">Productos de Autor</h1>
          <p class="text-[0.9375rem] text-on-surface-variant">
            Los insumos que usamos en cabina, seleccionados por su fórmula y rendimiento.
            Mismos productos que ves trabajando en el estudio.
          </p>
        </div>

        @if (error()) {
          <div
            class="p-4 rounded-2xl bg-error-container/15 border border-error-container/40
                   flex items-start gap-3"
          >
            <span class="material-symbols-outlined text-error mt-0.5">error</span>
            <p class="text-sm text-on-surface flex-1">{{ error() }}</p>
            <button type="button" class="label-sm text-error hover:underline" (click)="load()">
              Reintentar
            </button>
          </div>
        }

        <!-- Filtros -->
        <div class="flex flex-wrap gap-3 justify-center">
          @for (category of categories(); track category) {
            <button
              type="button"
              class="chip"
              [class.chip-active]="activeCategory() === category"
              (click)="activeCategory.set(category)"
            >
              {{ category }}
            </button>
          }
        </div>

        <!-- Catálogo -->
        @if (loading()) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="h-80 rounded-2xl bg-surface-container animate-pulse"></div>
            }
          </div>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            @for (product of filtered(); track product.id) {
              <article
                class="card-glass card-glass-hover overflow-hidden flex flex-col shadow-lg group"
              >
                <div
                  class="relative aspect-square bg-gradient-to-br from-surface-container
                         via-surface-low to-surface-lowest flex items-center justify-center"
                >
                  <span
                    class="material-symbols-outlined text-5xl text-primary/30"
                    aria-hidden="true"
                  >
                    {{ str(product.icon) }}
                  </span>

                  @if (minStock(product) <= 5) {
                    <span
                      class="absolute top-3 left-3 px-2.5 py-0.5 rounded-full
                             bg-error-container text-on-error label-sm"
                    >
                      Últimas {{ minStock(product) }}
                    </span>
                  }
                </div>

                <div class="p-5 flex flex-col flex-1 gap-3">
                  <div>
                    <p class="label-sm text-primary">{{ str(product.brand) }}</p>
                    <h2 class="text-lg text-on-surface group-hover:text-primary transition-colors mt-1">
                      {{ str(product.name) }}
                    </h2>
                    <p class="label-sm text-outline mt-0.5">{{ str(product.category) }}</p>
                  </div>

                  <p class="text-sm text-on-surface-variant leading-relaxed flex-1">
                    {{ str(product.description) }}
                  </p>

                  <!-- Presentaciones -->
                  @if ((product.variants?.length ?? 0) > 1) {
                    <div class="flex flex-wrap gap-1.5">
                      @for (variant of product.variants ?? []; track variant.id) {
                        <span
                          class="px-2 py-0.5 rounded-md bg-surface-container-highest
                                 text-outline label-sm"
                        >
                          {{ str(variant.sizeLabel) }}
                        </span>
                      }
                    </div>
                  }

                  <div class="pt-3 border-t border-surface-variant">
                    <div class="flex items-center justify-between">
                      <div>
                        <span class="text-xl text-primary">
                          {{ formatPrice(minPrice(product)) }}
                        </span>
                        @if ((product.variants?.length ?? 0) > 1) {
                          <span class="block label-sm text-outline">precio desde</span>
                        }
                      </div>

                      <button
                        type="button"
                        class="w-10 h-10 rounded-full bg-surface-container-high
                               hover:bg-primary hover:text-on-primary
                               flex items-center justify-center transition-all
                               disabled:opacity-40"
                        [disabled]="minStock(product) === 0"
                        [attr.aria-label]="'Agregar ' + str(product.name) + ' al carrito'"
                        (click)="add(product)"
                      >
                        <span class="material-symbols-outlined text-lg">
                          {{ minStock(product) === 0 ? 'remove_shopping_cart' : 'add_shopping_cart' }}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            } @empty {
              <div class="col-span-full p-12 rounded-3xl bg-surface-container text-center">
                <p class="text-on-surface-variant">No hay productos en esta categoría.</p>
              </div>
            }
          </div>
        }

        <div class="text-center pt-8">
          <a routerLink="/reservar" class="btn-ghost">
            <span class="material-symbols-outlined text-xl">calendar_today</span>
            ¿Buscas una cita? Agenda aquí
          </a>
        </div>
      </div>
    </section>

    <!-- Panel lateral del carrito -->
    @if (cart.isOpen() && cart.count() > 0) {
      <div class="fixed inset-0 z-40">
        <div
          class="absolute inset-0 bg-surface-lowest/70 backdrop-blur-sm"
          (click)="cart.toggle()"
        ></div>

        <aside
          class="absolute right-0 top-0 h-full w-full max-w-md bg-surface-container
                 border-l border-surface-variant flex flex-col shadow-2xl"
          role="dialog"
          aria-label="Carrito de compras"
        >
          <header
            class="flex items-center justify-between p-6 border-b border-surface-variant"
          >
            <h2 class="text-xl text-on-surface flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">shopping_bag</span>
              Tu Carrito
              <span class="label-sm text-outline">({{ cart.count() }})</span>
            </h2>
            <button
              type="button"
              class="w-9 h-9 rounded-full bg-surface-container-highest text-on-surface
                     flex items-center justify-center hover:text-primary transition-colors"
              aria-label="Cerrar carrito"
              (click)="cart.toggle()"
            >
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          </header>

          @if (checkoutDone(); as order) {
            <!-- Confirmación -->
            <div class="flex-1 overflow-y-auto p-6 space-y-5">
              <div
                class="w-14 h-14 rounded-full bg-primary/20 text-primary
                       flex items-center justify-center mx-auto"
              >
                <span class="material-symbols-outlined text-3xl">check_circle</span>
              </div>
              <div class="text-center space-y-2">
                <h3 class="text-2xl text-on-surface">Pedido registrado</h3>
                <p class="text-sm text-on-surface-variant">
                  Tu pedido quedó pendiente de pago.
                </p>
              </div>

              <div class="p-5 rounded-2xl bg-surface-container space-y-3">
                <div class="flex justify-between">
                  <span class="label-sm text-outline">Folio</span>
                  <span class="text-on-surface">{{ str(order.code) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="label-sm text-outline">Total</span>
                  <span class="text-primary text-xl">{{ formatPrice(num(order.total)) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="label-sm text-outline">IVA incluido</span>
                  <span class="text-on-surface-variant">
                    {{ formatPrice(num(order.total) * 0.16 / 1.16) }}
                  </span>
                </div>
              </div>

              @if (order.checkoutUrl) {
                <a
                  [href]="str(order.checkoutUrl)"
                  target="_blank"
                  rel="noopener"
                  class="btn-primary w-full"
                >
                  <span class="material-symbols-outlined text-xl">payments</span>
                  Pagar con Mercado Pago
                </a>
              } @else {
                <div
                  class="p-4 rounded-xl bg-surface-container-lowest/80
                         flex items-start gap-2.5"
                >
                  <span class="material-symbols-outlined text-primary text-base mt-0.5">info</span>
                  <p class="text-sm text-on-surface-variant leading-snug">
                    El enlace de pago se habilita al configurar las llaves de Mercado Pago.
                    Tu folio ya está reservado: coordina el pago con Andy Studio.
                  </p>
                </div>
              }

              <button
                type="button"
                class="btn-ghost w-full"
                (click)="closeAndClear()"
              >
                Cerrar
              </button>
            </div>
          } @else {
            <!-- Formulario -->
            <div class="flex-1 overflow-y-auto">
              <ul class="divide-y divide-surface-variant">
                @for (line of cart.items(); track line.variantId) {
                  <li class="p-5 space-y-3">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="text-on-surface truncate">{{ line.productName }}</p>
                        <p class="label-sm text-outline">
                          {{ line.brand }} · {{ line.sizeLabel }}
                        </p>
                      </div>
                      <button
                        type="button"
                        class="w-7 h-7 rounded-full bg-surface-container-highest
                               text-on-surface flex items-center justify-center
                               hover:text-error transition-colors shrink-0"
                        [attr.aria-label]="'Quitar ' + line.productName"
                        (click)="cart.remove(line.variantId)"
                      >
                        <span class="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>

                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          class="w-8 h-8 rounded-full bg-surface-container-highest
                                 text-on-surface flex items-center justify-center
                                 hover:text-primary transition-colors"
                          [attr.aria-label]="'Quitar una unidad de ' + line.productName"
                          (click)="cart.setQuantity(line.variantId, line.quantity - 1)"
                        >
                          <span class="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <span class="w-8 text-center text-on-surface">{{ line.quantity }}</span>
                        <button
                          type="button"
                          class="w-8 h-8 rounded-full bg-surface-container-highest
                                 text-on-surface flex items-center justify-center
                                 hover:text-primary transition-colors"
                          [attr.aria-label]="'Agregar una unidad de ' + line.productName"
                          (click)="cart.setQuantity(line.variantId, line.quantity + 1)"
                        >
                          <span class="material-symbols-outlined text-sm">add</span>
                        </button>
                      </div>

                      <span class="text-primary">
                        {{ formatPrice(line.unitPrice * line.quantity) }}
                      </span>
                    </div>
                  </li>
                }
              </ul>

              @if (stockWarning(); as warning) {
                <p
                  class="m-5 p-3 rounded-xl bg-tertiary-container/20 text-tertiary
                         text-sm flex items-start gap-2"
                >
                  <span class="material-symbols-outlined text-base mt-0.5">warning</span>
                  {{ warning }}
                </p>
              }

              <!-- Totales -->
              <div class="p-5 border-t border-surface-variant space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-on-surface-variant">Subtotal</span>
                  <span class="text-on-surface">{{ formatPrice(cart.subtotal()) }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-on-surface-variant">IVA 16%</span>
                  <span class="text-on-surface">{{ formatPrice(cart.tax()) }}</span>
                </div>
                <div
                  class="flex justify-between pt-3 border-t border-surface-variant"
                >
                  <span class="label-md text-outline">Total</span>
                  <span class="text-2xl text-primary">{{ formatPrice(cart.total()) }}</span>
                </div>
              </div>
            </div>

            <!-- Datos de contacto -->
            <div class="border-t border-surface-variant p-5 space-y-4">
              @if (checkoutError()) {
                <p class="text-sm text-error flex items-start gap-2">
                  <span class="material-symbols-outlined text-base mt-0.5">error</span>
                  {{ checkoutError() }}
                </p>
              }

              <div class="space-y-2">
                <label for="cart-name" class="label-sm text-outline">Nombre completo *</label>
                <input
                  id="cart-name"
                  type="text"
                  autocomplete="name"
                  class="input-dark"
                  placeholder="Tu nombre"
                  [(ngModel)]="form.name"
                />
              </div>

              <div class="space-y-2">
                <label for="cart-phone" class="label-sm text-outline">WhatsApp *</label>
                <input
                  id="cart-phone"
                  type="tel"
                  autocomplete="tel"
                  class="input-dark"
                  placeholder="+52 222 000 0000"
                  [(ngModel)]="form.phone"
                />
              </div>

              <div class="space-y-2">
                <label for="cart-email" class="label-sm text-outline">Correo electrónico *</label>
                <input
                  id="cart-email"
                  type="email"
                  autocomplete="email"
                  class="input-dark"
                  placeholder="tu@correo.com"
                  [(ngModel)]="form.email"
                />
              </div>

              <button
                type="button"
                class="btn-primary w-full"
                [disabled]="!isValid() || submitting()"
                [class.opacity-50]="!isValid()"
                (click)="checkout()"
              >
                <span class="material-symbols-outlined text-xl">
                  {{ submitting() ? 'hourglass_top' : 'shopping_cart_checkout' }}
                </span>
                {{ submitting() ? 'Registrando…' : 'Generar Pedido' }}
              </button>

              <p class="text-xs text-outline text-center leading-relaxed">
                El stock se descuenta al confirmar el pago, no al agregar al carrito.
              </p>
            </div>
          }
        </aside>
      </div>
    }
  `,
})
export class ShopComponent {
  protected readonly cart = inject(CartService);
  private readonly catalog = inject(CourseService);

  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly submitting = signal(false);
  protected readonly checkoutError = signal('');
  protected readonly stockWarning = signal('');
  protected readonly checkoutDone = signal<OrderCheckout | null>(null);

  protected readonly activeCategory = signal('Todos');

  /** Objeto plano porque ngModel hace two-way binding. */
  protected readonly form = { name: '', phone: '', email: '' };

  constructor() {
    this.load();
  }

  protected readonly num = num;
  protected readonly str = str;

  protected load(): void {
    this.loading.set(true);
    this.error.set('');

    this.catalog.getProducts().subscribe({
      next: (list) => {
        this.products.set(list);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(this.readError(err, 'No se pudieron cargar los productos.'));
        this.loading.set(false);
      },
    });
  }

  /** Categorías distintas del catálogo, para no mostrar filtros vacíos. */
  protected readonly categories = computed<string[]>(() => {
    const distinct = new Set<string>();
    for (const p of this.products()) {
      const category = p.category;
      if (category) distinct.add(category);
    }
    return ['Todos', ...Array.from(distinct)];
  });

  protected filtered(): Product[] {
    const category = this.activeCategory();
    const list = this.products();
    if (category === 'Todos') return list;
    return list.filter((p) => p.category === category);
  }

  /** Precio más bajo entre las variantes, para el "desde". */
  protected minPrice(product: Product): number {
    const variants = product.variants ?? [];
    if (variants.length === 0) return num(product.price);
    return Math.min(...variants.map((v) => num(v.priceOverride ?? product.price)));
  }

  /** Stock total sumando todas las presentaciones. */
  protected minStock(product: Product): number {
    return (product.variants ?? []).reduce((sum, v) => sum + num(v.stockOnHand), 0);
  }

  protected add(product: Product): void {
    const variants = product.variants ?? [];
    if (variants.length === 0) return;

    // Se agrega la presentación con más stock para no agotar la única
    // unidad de la más pequeña.
    const best = variants.reduce((a, b) =>
      num(b.stockOnHand) > num(a.stockOnHand) ? b : a,
    );

    this.cart.add(product, best);
  }

  protected isValid(): boolean {
    const f = this.form;
    return (
      f.name.trim().length >= 3 &&
      f.phone.replace(/\D/g, '').length >= 10 &&
      f.email.includes('@')
    );
  }

  protected checkout(): void {
    if (!this.isValid()) return;

    this.submitting.set(true);
    this.checkoutError.set('');

    this.cart
      .checkout({
        contactName: this.form.name.trim(),
        contactPhone: this.form.phone.trim(),
        contactEmail: this.form.email.trim(),
      })
      .subscribe({
        next: (order) => {
          this.submitting.set(false);
          this.checkoutDone.set(order);
          this.stockWarning.set('');
        },
        error: (err: unknown) => {
          this.submitting.set(false);

          if (err instanceof StockConflictError) {
            // El carrito quedó obsoleto. Se listan los faltantes para que
            // ajuste cantidades en vez de ver un fallo seco.
            const detail = err.shortages
              .map((s) => `${s.productName} ${s.sizeLabel}: quedan ${s.available}`)
              .join(' · ');

            this.checkoutError.set(`${err.message} ${detail}`);
            return;
          }

          this.checkoutError.set(this.readError(err, 'No se pudo crear el pedido.'));
        },
      });
  }

  protected closeAndClear(): void {
    this.cart.markAsPurchased();
    this.checkoutDone.set(null);
    this.form.name = '';
    this.form.phone = '';
    this.form.email = '';
  }

  protected formatPrice(value: number): string {
    return `$${(value ?? 0).toLocaleString('es-MX')} MXN`;
  }

  private readError(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      return (err.error as { message?: string })?.message ?? fallback;
    }
    return fallback;
  }
}