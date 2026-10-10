import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="bg-surface-lowest text-on-surface-variant mt-space-2xl border-t border-surface-variant">
      <div class="container-luxury pt-space-2xl pb-16">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <!-- Marca -->
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <span
                class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-container
                       flex items-center justify-center text-on-primary"
              >
                <span class="material-symbols-outlined text-xl">spa</span>
              </span>
              <span class="font-display text-xl text-on-surface">Andy Cosmetología</span>
            </div>
            <p class="text-sm leading-relaxed">
              Santuario digital y estudio dermatológico exclusivo en Puebla. Rituales de autor,
              cosmecéutica avanzada y bienestar integral con atención personalizada VIP.
            </p>
            <div class="pt-2">
              <span
                class="inline-flex items-center gap-2 px-3 py-1 rounded-full
                       bg-surface-container-high text-primary label-sm"
              >
                <span class="material-symbols-outlined text-sm">verified</span>
                Certificación Clínica
              </span>
            </div>
          </div>

          <!-- Ubicación -->
          <div class="space-y-4">
            <h4 class="text-lg text-on-surface">Ubicación &amp; Contacto</h4>
            <div class="space-y-3 text-sm">
              <div class="flex items-start gap-3">
                <span class="material-symbols-outlined text-primary text-lg mt-0.5">location_on</span>
                <span>
                  {{ studioAddress() }}
                  <br />
                  <span class="label-sm text-outline">Zona Angelópolis &amp; La Paz</span>
                </span>
              </div>
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-primary text-lg">schedule</span>
                <span>
                  Lun – Sáb: 9:00 AM – 8:00 PM
                  <br />
                  Previa Cita Exclusiva
                </span>
              </div>
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-primary text-lg">chat</span>
                <a
                  [href]="whatsappLink()"
                  target="_blank"
                  rel="noopener"
                  class="hover:text-primary transition-colors"
                >
                  {{ studioPhone() }}
                </a>
              </div>
            </div>
          </div>

          <!-- Enlaces -->
          <div class="space-y-4">
            <h4 class="text-lg text-on-surface">Navegación</h4>
            <ul class="space-y-2.5 text-sm">
              @for (link of links; track link.path) {
                <li class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-outline text-base">check</span>
                  <a
                    [routerLink]="link.path"
                    class="hover:text-primary transition-colors"
                  >
                    {{ link.label }}
                  </a>
                </li>
              }
            </ul>
          </div>

          <!-- Contacto VIP -->
          <div class="space-y-4">
            <h4 class="text-lg text-on-surface">Experiencia VIP</h4>
            <p class="text-sm leading-relaxed">
              Atención 1 a 1 sin grupos distractores. Agenda tu cita o escribe directo para
              paquetes de novias y cotizaciones.
            </p>
            <a
              [href]="whatsappLink()"
              target="_blank"
              rel="noopener"
              class="btn-ghost w-full !py-3 !px-4 !text-[0.6875rem]"
            >
              <span class="material-symbols-outlined text-base">chat</span>
              Concierge WhatsApp
            </a>
          </div>
        </div>

        <!-- Barra legal -->
        <div
          class="pt-8 border-t border-surface-variant flex flex-col sm:flex-row
                 items-center justify-between gap-4 text-xs text-outline"
        >
          <p>© 2026 Andy Cosmetología • Puebla Studio. Todos los derechos reservados.</p>
          <div class="flex items-center gap-6">
            <a routerLink="/aviso-de-privacidad" class="hover:text-primary transition-colors">
              Aviso de Privacidad
            </a>
            <a routerLink="/terminos" class="hover:text-primary transition-colors">
              Términos
            </a>
          </div>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  protected readonly links = [
    { path: '/servicios', label: 'Servicios' },
    { path: '/cursos', label: 'Cursos' },
    { path: '/tienda', label: 'Tienda' },
    { path: '/reservar', label: 'Reservar Cita' },
    { path: '/mis-reservas', label: 'Mis Reservas' },
  ];

  // TODO: sustituir por los datos reales del estudio antes de publicar.
  protected readonly studioAddress = () => 'Puebla, Pue., México';
  protected readonly studioPhone = () => '+52 222 123 4567';

  protected readonly whatsappLink = () =>
    `https://wa.me/522221234567?text=${encodeURIComponent(
      'Hola Andy, deseo información sobre servicios y cursos.'
    )}`;
}