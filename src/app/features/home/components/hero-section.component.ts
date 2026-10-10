import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="relative overflow-hidden">
      <!-- Resplandores difusos del fondo -->
      <div class="bokeh-glow -top-40 right-1/4 w-96 h-96 bg-primary/10"></div>
      <div class="bokeh-glow top-[40%] -left-20 w-[500px] h-[500px] bg-secondary-container/20"></div>
      <div class="bokeh-glow bottom-[10%] right-10 w-[450px] h-[450px] bg-primary-container/10"></div>

      <div class="container-luxury relative pt-8 pb-20">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <!-- Copia y llamadas a la acción -->
          <div class="lg:col-span-7 flex flex-col space-y-8 z-10">
            <div
              class="inline-flex items-center gap-3 w-fit px-4 py-1.5 rounded-full
                     bg-surface-container-high shadow-inner"
            >
              <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span class="label-md text-primary">Atelier Exclusivo • Puebla, Pue.</span>
            </div>

            <div class="space-y-4">
              <h1 class="text-[2.375rem] leading-[1.05] md:text-[3.5rem] text-on-surface">
                Realza Tu Belleza con
                <span class="italic text-primary">Maestría,</span>
                Pasión y Exclusividad
              </h1>
              <p class="text-lg leading-relaxed text-on-surface-variant max-w-2xl font-light">
                Atención personalizada de alta costura en Puebla, México. Maquillaje
                profesional, estilismo de gala, manicure de autor y formación técnica
                especializada. Un espacio íntimo creado para celebrar tu brillo único.
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-4 pt-2">
              <a routerLink="/reservar" class="btn-primary">
                <span class="material-symbols-outlined text-xl">calendar_today</span>
                Agendar Cita Ahora
              </a>
              <a routerLink="/cursos" class="btn-ghost">
                <span class="material-symbols-outlined text-xl">school</span>
                Ver Cursos Personalizados
              </a>
            </div>

            <!-- Distintivos de confianza -->
            <div class="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              @for (badge of badges; track badge.label) {
                <div class="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container-low">
                  <div
                    class="w-10 h-10 rounded-full bg-surface-container-highest
                           flex items-center justify-center text-primary"
                  >
                    <span class="material-symbols-outlined text-lg">{{ badge.icon }}</span>
                  </div>
                  <div>
                    <p class="text-[0.8125rem] font-semibold text-on-surface">{{ badge.label }}</p>
                    <p class="label-sm text-outline">{{ badge.caption }}</p>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Composición visual -->
          <div class="lg:col-span-5 relative flex justify-center lg:justify-end">
            <div
              class="relative w-full max-w-md aspect-[4/5] rounded-3xl overflow-hidden
                     shadow-2xl bg-surface-container border border-surface-variant"
            >
              <!-- Componente de reemplazo mientras llegan las fotos reales -->
              <div
                class="w-full h-full flex flex-col items-center justify-center gap-6
                       bg-gradient-to-br from-surface-container via-surface-low to-surface-lowest p-8"
              >
                <div
                  class="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-container
                         flex items-center justify-center text-on-primary
                         shadow-[0_0_40px_rgba(212,149,178,0.4)]"
                >
                  <span class="material-symbols-outlined text-4xl">spa</span>
                </div>
                <p class="font-display text-2xl text-on-surface text-center">Andy Studio</p>
                <p class="label-sm text-primary text-center">Puebla • Citas Abiertas</p>
              </div>

              <div class="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-80"></div>

              <!-- Tarjeta editorial flotante -->
              <div
                class="absolute bottom-6 left-6 right-6 p-5 rounded-2xl
                       bg-surface-container/85 backdrop-blur-md shadow-xl
                       flex items-center justify-between"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-primary"
                  >
                    <span class="material-symbols-outlined text-2xl">auto_awesome</span>
                  </div>
                  <div>
                    <p class="text-lg text-on-surface">Andy Studio</p>
                    <p class="label-sm text-primary">Atelier Exclusivo</p>
                  </div>
                </div>
                <span
                  class="label-sm px-3 py-1 rounded-full bg-surface-bright
                         text-on-surface tracking-wider"
                >
                  En Agenda
                </span>
              </div>
            </div>

            <!-- Tarjeta secundaria solapada -->
            <div
              class="hidden sm:flex flex-col gap-1 absolute -bottom-8 -left-8 p-4 rounded-2xl
                     bg-surface-container-high/90 backdrop-blur-lg shadow-2xl max-w-[210px]"
            >
              <div class="flex items-center gap-1.5 text-primary">
                <span class="material-symbols-outlined text-sm">verified</span>
                <span class="label-sm">Piel Blindada</span>
              </div>
              <p class="text-sm text-on-surface-variant leading-snug">
                Resistencia 24h a humedad y lágrimas para novias y graduadas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class HeroSectionComponent {
  protected readonly badges = [
    { icon: 'star', label: '4.9 ★ Rating', caption: 'Calificación VIP' },
    { icon: 'spa', label: '100% Cosmecéutica', caption: 'Insumos Premium' },
    { icon: 'person_pin', label: 'Atención 1 a 1', caption: 'Privacidad Absoluta' },
  ];
}