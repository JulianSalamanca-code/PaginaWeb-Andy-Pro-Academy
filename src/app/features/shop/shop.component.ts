import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  size: string;
  stock: number;
}

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [RouterLink],
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

        <div class="flex flex-wrap gap-3 justify-center">
          @for (category of categories; track category) {
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

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          @for (product of filtered(); track product.id) {
            <article
              class="card-glass card-glass-hover overflow-hidden flex flex-col shadow-lg group"
            >
              <div
                class="relative aspect-square bg-gradient-to-br from-surface-container
                       via-surface-low to-surface-lowest flex items-center justify-center"
              >
                <span class="material-symbols-outlined text-5xl text-primary/30" aria-hidden="true">
                  {{ product.icon }}
                </span>
                @if (product.stock <= 5) {
                  <span
                    class="absolute top-3 left-3 px-2.5 py-0.5 rounded-full
                           bg-error-container text-on-error label-sm"
                  >
                    Últimas {{ product.stock }}
                  </span>
                }
              </div>

              <div class="p-5 flex flex-col flex-1 gap-3">
                <div>
                  <p class="label-sm text-primary">{{ product.brand }}</p>
                  <h2 class="text-lg text-on-surface group-hover:text-primary transition-colors mt-1">
                    {{ product.name }}
                  </h2>
                </div>

                <p class="text-sm text-on-surface-variant leading-relaxed flex-1">
                  {{ product.description }}
                </p>

                <div class="pt-3 border-t border-surface-variant">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="text-xl text-primary">{{ formatPrice(product.price) }}</span>
                      <span class="block label-sm text-outline">{{ product.size }}</span>
                    </div>
                    <button
                      type="button"
                      class="w-10 h-10 rounded-full bg-surface-container-high
                             hover:bg-primary hover:text-on-primary
                             flex items-center justify-center transition-all"
                      [attr.aria-label]="'Agregar ' + product.name + ' al carrito'"
                      (click)="addToCart(product)"
                    >
                      <span class="material-symbols-outlined text-lg">add_shopping_cart</span>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          }
        </div>

        <!-- Carrito -->
        @if (cart().length > 0) {
          <div class="card-glass p-6 space-y-5">
            <div class="flex items-center justify-between">
              <h2 class="text-xl text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">shopping_bag</span>
                Tu Carrito
              </h2>
              <button
                type="button"
                class="label-sm text-outline hover:text-error transition-colors"
                (click)="cart.set([])"
              >
                Vaciar
              </button>
            </div>

            <ul class="divide-y divide-surface-variant">
              @for (item of cart(); track item.product.id) {
                <li class="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p class="text-on-surface">{{ item.product.name }}</p>
                    <p class="label-sm text-outline">{{ item.product.size }}</p>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-primary">{{ formatPrice(item.product.price) }}</span>
                    <button
                      type="button"
                      class="w-7 h-7 rounded-full bg-surface-container-high
                             text-on-surface flex items-center justify-center"
                      [attr.aria-label]="'Quitar ' + item.product.name"
                      (click)="removeFromCart(item.product.id)"
                    >
                      <span class="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                </li>
              }
            </ul>

            <div class="pt-4 border-t border-surface-variant flex items-center justify-between">
              <span class="label-md text-outline">Total</span>
              <span class="text-2xl text-primary">{{ formatPrice(cartTotal()) }}</span>
            </div>

            <div
              class="p-3 rounded-xl bg-surface-container-lowest/80
                     flex items-start gap-2.5"
            >
              <span class="material-symbols-outlined text-primary text-base mt-0.5">info</span>
              <p class="text-sm text-on-surface-variant leading-snug">
                Checkout en modo prototipo. El pago real con Mercado Pago se conecta en
                producción.
              </p>
            </div>

            <button type="button" class="btn-primary w-full" (click)="checkout()">
              <span class="material-symbols-outlined text-xl">shopping_cart_checkout</span>
              Continuar al Checkout
            </button>
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
  `,
})
export class ShopComponent {
  protected readonly categories = ['Todos', 'Cuidado Capilar', 'Estilizado', 'Manicura'];
  protected readonly activeCategory = signal('Todos');
  protected readonly cart = signal<{ product: Product; qty: number }[]>([]);

  // Catálogo semilla para la demostración.
  protected readonly products: (Product & { icon: string })[] = [
    {
      id: 'p-olaplex-3',
      name: 'Olaplex No. 3 Reparador',
      brand: 'Olaplex',
      category: 'Cuidado Capilar',
      icon: 'spa',
      description: 'Reconstructor de enlaces para cabello dañado por calor y química.',
      price: 650,
      size: '100 ml',
      stock: 12,
    },
    {
      id: 'p-olaplex-7',
      name: 'Olaplex No. 7 Aceite Protector',
      brand: 'Olaplex',
      category: 'Cuidado Capilar',
      icon: 'water_drop',
      description: 'Aceite seco que sella el corte y reduce el frizz hasta 72 horas.',
      price: 720,
      size: '100 ml',
      stock: 8,
    },
    {
      id: 'p-kerastase',
      name: 'Kérastase Nutritive Bain Satin',
      brand: 'Kérastase',
      category: 'Cuidado Capilar',
      icon: 'favorite',
      description: 'Baño nutritivo para cabello grueso, seco o rizado.',
      price: 890,
      size: '250 ml',
      stock: 6,
    },
    {
      id: 'p-moroccanoil',
      name: 'Moroccanoil Treatment',
      brand: 'Moroccanoil',
      category: 'Cuidado Capilar',
      icon: 'oil_barrel',
      description: 'Tratamiento con aceite de argán para brillo y suavidad.',
      price: 950,
      size: '250 ml',
      stock: 4,
    },
    {
      id: 'p-gel-fijacion',
      name: 'Gel de Fijación Firme',
      brand: 'Studio Exclusivo',
      category: 'Estilizado',
      icon: 'blur_on',
      description: 'Fijación fuerte sin residuo ni sensación acartonada.',
      price: 320,
      size: '150 ml',
      stock: 15,
    },
    {
      id: 'p-spray-frizz',
      name: 'Spray Antifrizz',
      brand: 'Studio Exclusivo',
      category: 'Estilizado',
      icon: 'air',
      description: 'Termoprotección y control de frizz para peinados de gala.',
      price: 380,
      size: '200 ml',
      stock: 9,
    },
    {
      id: 'p-gel-cuticula',
      name: 'Gel de Cutícula Premium',
      brand: 'Studio Exclusivo',
      category: 'Manicura',
      icon: 'back_hand',
      description: 'Gel constructor para nivelación y manicura rusa.',
      price: 290,
      size: '30 ml',
      stock: 11,
    },
    {
      id: 'p-aceite-jojoba',
      name: 'Aceite de Jojoba para Cutícula',
      brand: 'Studio Exclusivo',
      category: 'Manicura',
      icon: 'eco',
      description: 'Hidratación profunda de cutícula y masaje aromaterapéutico.',
      price: 260,
      size: '30 ml',
      stock: 3,
    },
  ];

  protected readonly cartTotal = computed(() =>
    this.cart().reduce((sum, item) => sum + item.product.price * item.qty, 0)
  );

  protected filtered() {
    const category = this.activeCategory();
    if (category === 'Todos') return this.products;
    return this.products.filter((p) => p.category === category);
  }

  protected addToCart(product: Product): void {
    this.cart.update((items) => {
      const existing = items.find((i) => i.product.id === product.id);
      if (existing) {
        return items.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...items, { product, qty: 1 }];
    });
  }

  protected removeFromCart(productId: string): void {
    this.cart.update((items) => items.filter((i) => i.product.id !== productId));
  }

  protected checkout(): void {
    // El checkout real con Mercado Pago entra en feature/tienda.
    alert('Checkout en modo prototipo. El pago se habilita en producción.');
  }

  protected formatPrice(value: number): string {
    return `$${value.toLocaleString('es-MX')} MXN`;
  }
}
