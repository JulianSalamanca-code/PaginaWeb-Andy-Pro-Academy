import { Component, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../core/api/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header
      class="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      [class.bg-surface]="scrolled()"
      [class.backdrop-blur-xl]="scrolled()"
      [class.border-b]="scrolled()"
      [class.border-surface-variant]="scrolled()"
    >
      <nav class="container-luxury flex items-center justify-between h-20">
        <!-- Marca -->
        <a routerLink="/" class="flex items-center gap-3 shrink-0 group">
          <span
            class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-container
                   flex items-center justify-center text-on-primary
                   shadow-[0_0_20px_rgba(212,149,178,0.3)]"
          >
            <span class="material-symbols-outlined text-xl">spa</span>
          </span>
          <span class="flex flex-col leading-tight">
            <span class="font-display text-lg text-on-surface">Andy Cosmetología</span>
            <span class="label-sm text-primary">Puebla • Studio</span>
          </span>
        </a>

        <!-- Enlaces de escritorio -->
        <ul class="hidden lg:flex items-center gap-8">
          @for (link of links; track link.path) {
            <li>
              <a
                [routerLink]="link.path"
                routerLinkActive="text-primary"
                [routerLinkActiveOptions]="{ exact: link.path === '/' }"
                class="label-md text-on-surface-variant hover:text-primary transition-colors"
              >
                {{ link.label }}
              </a>
            </li>
          }
        </ul>

        <!-- Acciones -->
        <div class="hidden lg:flex items-center gap-3">
          <a
            routerLink="/reservar"
            class="btn-primary !py-2.5 !px-5 !text-[0.6875rem]"
          >
            <span class="material-symbols-outlined text-base">calendar_today</span>
            Reservar
          </a>
          <button
            type="button"
            class="w-10 h-10 rounded-full bg-surface-container-high text-on-surface
                   flex items-center justify-center hover:text-primary transition-colors
                   relative"
            aria-label="Abrir carrito"
            (click)="cart.toggle()"
          >
            <span class="material-symbols-outlined text-lg">shopping_bag</span>
            @if (cart.count() > 0) {
              <span
                class="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full
                       bg-primary text-on-primary label-sm flex items-center justify-center"
              >
                {{ cart.count() }}
              </span>
            }
          </button>
        </div>

        <!-- Botón de menú móvil -->
        <button
          type="button"
          class="lg:hidden w-10 h-10 rounded-full bg-surface-container-high
                 text-on-surface flex items-center justify-center"
          [attr.aria-expanded]="menuOpen()"
          aria-label="Abrir menú"
          (click)="menuOpen.set(!menuOpen())"
        >
          <span class="material-symbols-outlined text-xl">
            {{ menuOpen() ? 'close' : 'menu' }}
          </span>
        </button>
      </nav>

      <!-- Panel móvil -->
      @if (menuOpen()) {
        <div class="lg:hidden bg-surface-container border-t border-surface-variant">
          <ul class="container-luxury flex flex-col py-4 gap-1">
            @for (link of links; track link.path) {
              <li>
                <a
                  [routerLink]="link.path"
                  routerLinkActive="text-primary"
                  class="block py-3 label-md text-on-surface-variant hover:text-primary transition-colors"
                  (click)="menuOpen.set(false)"
                >
                  {{ link.label }}
                </a>
              </li>
            }
            <li class="pt-3 mt-2 border-t border-surface-variant">
              <a
                routerLink="/reservar"
                class="btn-primary w-full"
                (click)="menuOpen.set(false)"
              >
                <span class="material-symbols-outlined text-base">calendar_today</span>
                Reservar Ahora
              </a>
            </li>
          </ul>
        </div>
      }
    </header>
  `,
})
export class NavbarComponent {
  protected readonly links = [
    { path: '/', label: 'Inicio' },
    { path: '/servicios', label: 'Servicios' },
    { path: '/cursos', label: 'Cursos' },
    { path: '/tienda', label: 'Tienda' },
    { path: '/reservar', label: 'Reservar' },
  ];

  protected readonly menuOpen = signal(false);
  protected readonly scrolled = signal(false);

  /**
   * El carrito vive en un servicio, no en el componente, para que el
   * navbar muestre el conteo sin conocer los detalles de la tienda.
   */
  protected readonly cart = inject(CartService);

  constructor() {
    if (typeof window !== 'undefined') {
      const onScroll = () => this.scrolled.set(window.scrollY > 24);
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  }
}