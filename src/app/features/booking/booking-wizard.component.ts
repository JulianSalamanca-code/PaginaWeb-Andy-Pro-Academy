import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface BookableService {
  id: number;
  name: string;
  tag: string;
  price: number;
  durationMinutes: number;
  description: string;
  badge: string;
}

interface AddOn {
  id: string;
  name: string;
  price: number;
  extraMinutes: number;
  description: string;
}

interface BookingState {
  serviceId: number | null;
  addonIds: string[];
  date: Date | null;
  timeSlot: string | null;
  modality: 'studio' | 'domicilio';
  name: string;
  phone: string;
  email: string;
  notes: string;
}

@Component({
  selector: 'app-booking-wizard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="py-16 lg:py-20" id="reservas">
      <div class="container-luxury space-y-12">
        <!-- Encabezado -->
        <div
          class="flex flex-col md:flex-row md:items-end justify-between gap-6
                 pb-6 border-b border-surface-variant"
        >
          <div>
            <span class="label-md text-primary">Sistema Exclusivo de Agenda</span>
            <h1 class="text-3xl md:text-4xl text-on-surface mt-2">
              Diseña Tu Cita Personalizada
            </h1>
          </div>
          <p class="text-[0.9375rem] text-on-surface-variant max-w-md">
            Selecciona tu servicio y programa tu horario en tiempo real. Espacios limitados
            por día para asegurar atención ininterrumpida.
          </p>
        </div>

        <!-- Indicador de pasos -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          @for (step of steps; track step.number) {
            <button
              type="button"
              class="flex items-center gap-3 p-3.5 rounded-xl text-left
                     transition-colors disabled:cursor-not-allowed"
              [class.bg-surface-container-high]="currentStep() === step.number"
              [class.text-on-surface]="currentStep() === step.number"
              [class.bg-surface-container]="currentStep() !== step.number"
              [class.text-on-surface-variant]="currentStep() !== step.number"
              [disabled]="!canGoTo(step.number)"
              (click)="goToStep(step.number)"
            >
              <span
                class="w-8 h-8 rounded-full flex items-center justify-center
                       label-md font-bold shrink-0"
                [class.bg-primary]="currentStep() === step.number"
                [class.text-on-primary]="currentStep() === step.number"
                [class.bg-surface-container-highest]="currentStep() !== step.number"
              >
                {{ step.number < currentStep() ? '✓' : step.number }}
              </span>
              <span class="flex flex-col min-w-0">
                <span
                  class="label-sm"
                  [class.text-primary]="currentStep() === step.number"
                  [class.text-outline]="currentStep() !== step.number"
                >
                  {{ step.caption }}
                </span>
                <span class="label-md font-semibold truncate">{{ step.title }}</span>
              </span>
            </button>
          }
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <!-- Columna principal: paso activo -->
          <div class="lg:col-span-8">
            <!-- PASO 1: Servicio -->
            @if (currentStep() === 1) {
              <div class="space-y-4">
                <h2 class="text-xl text-on-surface">Elige tu Servicio</h2>
                @for (service of services; track service.id) {
                  <div
                    class="p-6 rounded-2xl cursor-pointer transition-all
                           bg-surface-container hover:bg-surface-container-high shadow-md"
                    [class.bg-surface-container-high]="state().serviceId === service.id"
                    [class.ring-1]="state().serviceId === service.id"
                    [class.ring-primary]="state().serviceId === service.id"
                    (click)="selectService(service.id)"
                    (keydown.enter)="selectService(service.id)"
                    tabindex="0"
                    role="button"
                    [attr.aria-pressed]="state().serviceId === service.id"
                  >
                    <div
                      class="flex flex-col sm:flex-row items-start sm:items-center
                             justify-between gap-4"
                    >
                      <div class="flex items-start gap-4">
                        <div
                          class="w-6 h-6 rounded-full flex items-center justify-center mt-1 shrink-0
                                 text-primary bg-surface-container-highest"
                          [class.bg-primary]="state().serviceId === service.id"
                          [class.text-on-primary]="state().serviceId === service.id"
                        >
                          @if (state().serviceId === service.id) {
                            <span class="material-symbols-outlined text-sm">check</span>
                          }
                        </div>
                        <div class="space-y-1.5">
                          <div class="flex flex-wrap items-center gap-2">
                            <h3 class="text-xl text-on-surface">{{ service.name }}</h3>
                            <span
                              class="px-2.5 py-0.5 rounded-full bg-primary/10
                                     text-primary label-sm"
                            >
                              {{ service.tag }}
                            </span>
                          </div>
                          <p class="text-sm text-on-surface-variant max-w-xl">
                            {{ service.description }}
                          </p>
                        </div>
                      </div>

                      <div
                        class="flex sm:flex-col items-end justify-between
                               w-full sm:w-auto shrink-0 pl-10 sm:pl-0"
                      >
                        <span class="text-xl text-primary">{{ formatPrice(service.price) }}</span>
                        <span class="label-sm text-outline flex items-center gap-1">
                          <span class="material-symbols-outlined text-sm">schedule</span>
                          {{ service.durationMinutes }} min
                        </span>
                      </div>
                    </div>

                    <!-- Complementos, solo para el servicio elegido -->
                    @if (state().serviceId === service.id && serviceSupportsAddons(service.id)) {
                      <div class="mt-5 pt-5 border-t border-surface-variant">
                        <p class="label-md text-primary mb-3">Complementos opcionales</p>
                        <div class="space-y-2">
                          @for (addon of addons; track addon.id) {
                            <label
                              class="flex items-start gap-3 p-3 rounded-xl
                                     bg-surface-container cursor-pointer
                                     hover:bg-surface-container-highest transition-colors"
                            >
                              <input
                                type="checkbox"
                                class="w-4 h-4 mt-0.5 accent-primary cursor-pointer"
                                [checked]="state().addonIds.includes(addon.id)"
                                (change)="toggleAddon(addon.id)"
                              />
                              <span class="flex-1">
                                <span class="flex items-center justify-between gap-3">
                                  <span class="text-sm text-on-surface">{{ addon.name }}</span>
                                  <span class="text-sm text-primary shrink-0">
                                    +{{ formatPrice(addon.price) }}
                                  </span>
                                </span>
                                <span class="block text-xs text-on-surface-variant mt-0.5">
                                  {{ addon.description }} · {{ addon.extraMinutes }} min extra
                                </span>
                              </span>
                            </label>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }

            <!-- PASO 2: Especialista -->
            @if (currentStep() === 2) {
              <div class="space-y-5">
                <h2 class="text-xl text-on-surface">Tu Especialista</h2>
                <div class="card-glass p-6 flex flex-col sm:flex-row items-start gap-5">
                  <div
                    class="w-20 h-20 rounded-full bg-gradient-to-br from-primary
                           to-primary-container flex items-center justify-center
                           text-on-primary shrink-0"
                  >
                    <span class="material-symbols-outlined text-4xl">person</span>
                  </div>
                  <div class="space-y-2">
                    <h3 class="text-2xl text-on-surface">Andy • Master Artist</h3>
                    <p class="text-sm text-on-surface-variant">
                      Cosmetóloga &amp; Estilista Titulada
                    </p>
                    <div class="flex flex-wrap gap-4 pt-2">
                      <span class="label-sm text-primary flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-sm">verified</span>
                        Certificación Clínica
                      </span>
                      <span class="label-sm text-outline flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-sm">star</span>
                        4.9 / 5.0
                      </span>
                      <span class="label-sm text-outline flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-sm">workspace_premium</span>
                        +320 servicios
                      </span>
                    </div>
                  </div>
                </div>

                <div class="card-glass p-6 space-y-3">
                  <h3 class="label-md text-primary">Preparación previa</h3>
                  @if (selectedService(); as service) {
                    <p class="text-sm text-on-surface-variant leading-relaxed">
                      {{ service.preparation }}
                    </p>
                  }
                </div>

                <!-- Modalidad -->
                <div class="space-y-3">
                  <h3 class="text-xl text-on-surface">Modalidad</h3>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      class="p-5 rounded-2xl text-left transition-all
                             bg-surface-container hover:bg-surface-container-high"
                      [class.bg-surface-container-high]="state().modality === 'studio'"
                      [class.ring-1]="state().modality === 'studio'"
                      [class.ring-primary]="state().modality === 'studio'"
                      (click)="setModality('studio')"
                    >
                      <span class="material-symbols-outlined text-2xl text-primary">storefront</span>
                      <p class="text-on-surface mt-2">En el estudio</p>
                      <p class="text-sm text-on-surface-variant">
                        Zona Angelópolis &amp; La Paz, Puebla
                      </p>
                    </button>
                    <button
                      type="button"
                      class="p-5 rounded-2xl text-left transition-all
                             bg-surface-container hover:bg-surface-container-high"
                      [class.bg-surface-container-high]="state().modality === 'domicilio'"
                      [class.ring-1]="state().modality === 'domicilio'"
                      [class.ring-primary]="state().modality === 'domicilio'"
                      (click)="setModality('domicilio')"
                    >
                      <span class="material-symbols-outlined text-2xl text-primary">directions_car</span>
                      <p class="text-on-surface mt-2">A domicilio</p>
                      <p class="text-sm text-on-surface-variant">
                        Puebla capital, Cholula y alrededores. Viáticos según distancia.
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            }

            <!-- PASO 3: Fecha y hora -->
            @if (currentStep() === 3) {
              <div class="space-y-6">
                <h2 class="text-xl text-on-surface">Fecha &amp; Hora</h2>

                <!-- Cinta de fechas -->
                <div>
                  <p class="label-md text-outline mb-3">Elige el día</p>
                  <div class="flex gap-3 overflow-x-auto pb-2">
                    @for (day of availableDays(); track day.iso) {
                      <button
                        type="button"
                        class="shrink-0 w-20 py-3 rounded-2xl text-center transition-all
                               bg-surface-container hover:bg-surface-container-high"
                        [class.bg-primary]="state().date?.toISOString() === day.iso"
                        [class.text-on-primary]="state().date?.toISOString() === day.iso"
                        [class.bg-surface-container-highest]="state().date?.toISOString() !== day.iso"
                        (click)="selectDate(day.date)"
                      >
                        <span class="label-sm block opacity-80">{{ day.weekday }}</span>
                        <span class="text-lg block mt-1">{{ day.dayNumber }}</span>
                        <span class="label-sm block opacity-80">{{ day.month }}</span>
                      </button>
                    }
                  </div>
                </div>

                <!-- Horarios -->
                @if (state().date) {
                  <div>
                    <p class="label-md text-outline mb-3">Horarios disponibles</p>
                    <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      @for (slot of timeSlots(); track slot.time) {
                        <button
                          type="button"
                          class="py-2.5 px-3 rounded-xl text-center label-sm transition-all
                                 bg-surface-container text-on-surface
                                 hover:bg-primary hover:text-on-primary"
                          [class.bg-primary]="state().timeSlot === slot.time"
                          [class.text-on-primary]="state().timeSlot === slot.time"
                          (click)="state.update((s) => ({ ...s, timeSlot: slot.time }))"
                        >
                          {{ slot.label }}
                        </button>
                      } @empty {
                        <p class="col-span-full text-sm text-on-surface-variant py-4">
                          No quedan horarios libres este día. Prueba con otra fecha.
                        </p>
                      }
                    </div>
                  </div>
                } @else {
                  <p class="text-sm text-on-surface-variant">
                    Selecciona primero un día para ver los horarios.
                  </p>
                }

                <div class="p-3 rounded-xl bg-surface-container-lowest/80 flex items-start gap-2.5">
                  <span class="material-symbols-outlined text-primary text-base mt-0.5">lock</span>
                  <p class="text-sm text-on-surface-variant leading-snug">
                    Anticipo del 30% requerido para bloquear agenda en Puebla Studio. Reagenda
                    flexible hasta 24h previas.
                  </p>
                </div>
              </div>
            }

            <!-- PASO 4: Confirmación -->
            @if (currentStep() === 4) {
              @if (confirmed()) {
                <div class="card-glass p-8 text-center space-y-5">
                  <div
                    class="w-16 h-16 rounded-full bg-primary/20 text-primary
                           flex items-center justify-center mx-auto"
                  >
                    <span class="material-symbols-outlined text-4xl">check_circle</span>
                  </div>
                  <h2 class="text-3xl text-on-surface">Solicitud Recibida</h2>
                  <p class="text-on-surface-variant max-w-md mx-auto">
                    Tu cita quedó registrada como <strong>pendiente de anticipo</strong>.
                    Te contactamos por WhatsApp para confirmar los datos de pago.
                  </p>

                  <div class="p-5 rounded-2xl bg-surface-container text-left space-y-3">
                    <div class="flex justify-between">
                      <span class="label-sm text-outline">Folio</span>
                      <span class="text-on-surface">{{ confirmationCode() }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="label-sm text-outline">Servicio</span>
                      <span class="text-on-surface text-right">{{ selectedService()?.name }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="label-sm text-outline">Fecha</span>
                      <span class="text-on-surface">{{ formatDate(state().date) }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="label-sm text-outline">Hora</span>
                      <span class="text-on-primary">{{ state().timeSlot }}</span>
                    </div>
                    <div class="flex justify-between pt-3 border-t border-surface-variant">
                      <span class="label-sm text-outline">Anticipo a pagar</span>
                      <span class="text-xl text-primary">{{ formatPrice(deposit()) }}</span>
                    </div>
                  </div>

                  <div class="flex flex-wrap justify-center gap-4 pt-2">
                    <a routerLink="/" class="btn-ghost">Volver al inicio</a>
                    <a [href]="whatsappLink()" target="_blank" rel="noopener" class="btn-primary">
                      <span class="material-symbols-outlined text-xl">chat</span>
                      Continuar por WhatsApp
                    </a>
                  </div>
                </div>
              } @else {
                <div class="space-y-5">
                  <h2 class="text-xl text-on-surface">Tus Datos</h2>

                  <div class="space-y-4">
                    <div class="space-y-2">
                      <label for="name" class="label-sm text-outline">Nombre completo *</label>
                      <input
                        id="name"
                        type="text"
                        class="input-dark"
                        placeholder="Tu nombre"
                        [value]="state().name"
                        (input)="patch({ name: $any($event.target).value })"
                      />
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div class="space-y-2">
                        <label for="phone" class="label-sm text-outline">WhatsApp *</label>
                        <input
                          id="phone"
                          type="tel"
                          class="input-dark"
                          placeholder="+52 222 000 0000"
                          [value]="state().phone"
                          (input)="patch({ phone: $any($event.target).value })"
                        />
                      </div>
                      <div class="space-y-2">
                        <label for="email" class="label-sm text-outline">Correo electrónico *</label>
                        <input
                          id="email"
                          type="email"
                          class="input-dark"
                          placeholder="tu@correo.com"
                          [value]="state().email"
                          (input)="patch({ email: $any($event.target).value })"
                        />
                      </div>
                    </div>

                    <div class="space-y-2">
                      <label for="notes" class="label-sm text-outline">
                        Peticiones especiales o datos de piel/cabello
                      </label>
                      <textarea
                        id="notes"
                        rows="4"
                        class="input-dark resize-none"
                        placeholder="Alergias, tipo de piel, estilo deseado…"
                        [value]="state().notes"
                        (input)="patch({ notes: $any($event.target).value })"
                      ></textarea>
                    </div>
                  </div>

                  @if (error()) {
                    <p class="text-sm text-error flex items-center gap-2">
                      <span class="material-symbols-outlined text-base">error</span>
                      {{ error() }}
                    </p>
                  }

                  <button type="button" class="btn-primary w-full" (click)="confirm()">
                    <span class="material-symbols-outlined text-xl">event_available</span>
                    Solicitar Mi Cita
                  </button>

                  <p class="text-xs text-outline text-center leading-relaxed">
                    Al solicitar se registra tu cita en estado pendiente. El anticipo del 30%
                    se confirma por transferencia con Andy Studio.
                  </p>
                </div>
              }
            }

            <!-- Navegación entre pasos -->
            @if (!confirmed()) {
              <div class="flex items-center justify-between gap-4 pt-8 mt-8 border-t border-surface-variant">
                <button
                  type="button"
                  class="btn-ghost"
                  [disabled]="currentStep() === 1"
                  [class.opacity-40]="currentStep() === 1"
                  [class.cursor-not-allowed]="currentStep() === 1"
                  (click)="previousStep()"
                >
                  <span class="material-symbols-outlined text-base">arrow_back</span>
                  Anterior
                </button>

                @if (currentStep() < 4) {
                  <button
                    type="button"
                    class="btn-primary"
                    [disabled]="!canAdvance()"
                    [class.opacity-50]="!canAdvance()"
                    (class.cursor-not-allowed)="!canAdvance()"
                    (click)="nextStep()"
                  >
                    {{ advanceLabel() }}
                    <span class="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                }
              </div>
            }
          </div>

          <!-- Panel de resumen -->
          <aside class="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
            <div class="p-6 rounded-3xl bg-surface-container-high/95 backdrop-blur-xl shadow-2xl space-y-6">
              <div class="flex items-center justify-between pb-4 border-b border-surface-variant">
                <div>
                  <span class="label-sm text-primary">Detalle de Solicitud</span>
                  <h2 class="text-xl text-on-surface">Tu Reserva VIP</h2>
                </div>
                <div
                  class="w-10 h-10 rounded-full bg-surface-container-highest
                         flex items-center justify-center text-primary"
                >
                  <span class="material-symbols-outlined text-xl">event_available</span>
                </div>
              </div>

              <div class="flex items-center gap-3.5 p-3 rounded-2xl bg-surface-container">
                <div
                  class="w-12 h-12 rounded-full bg-gradient-to-br from-primary
                         to-primary-container flex items-center justify-center
                         text-on-primary shrink-0"
                >
                  <span class="material-symbols-outlined text-2xl">person</span>
                </div>
                <div>
                  <p class="label-md font-semibold text-on-surface">Andy • Master Artist</p>
                  <p class="label-sm text-outline">Cosmetóloga &amp; Estilista Titulada</p>
                </div>
              </div>

              <!-- Servicio seleccionado -->
              <div class="space-y-3">
                <p class="label-sm text-outline">Servicio Seleccionado</p>
                @if (selectedService(); as service) {
                  <div class="p-4 rounded-xl bg-surface-container-highest space-y-2">
                    <div class="flex justify-between items-start gap-3">
                      <span class="label-lg text-on-surface font-bold">{{ service.name }}</span>
                      <span class="text-xl text-primary shrink-0">
                        {{ formatPrice(service.price) }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2 text-on-surface-variant label-sm">
                      <span class="material-symbols-outlined text-sm text-primary">timelapse</span>
                      {{ service.durationMinutes }} min de sesión
                    </div>
                  </div>
                } @else {
                  <div
                    class="p-4 rounded-xl bg-surface-container text-center
                           text-on-surface-variant text-sm"
                  >
                    Haz clic en cualquiera de los servicios para continuar.
                  </div>
                }
              </div>

              <!-- Complementos -->
              @if (selectedAddons().length > 0) {
                <div class="space-y-2">
                  <p class="label-sm text-outline">Complementos</p>
                  @for (addon of selectedAddons(); track addon.id) {
                    <div class="flex justify-between items-center gap-3 text-sm">
                      <span class="text-on-surface-variant">{{ addon.name }}</span>
                      <span class="text-primary shrink-0">
                        +{{ formatPrice(addon.price) }}
                      </span>
                    </div>
                  }
                </div>
              }

              <!-- Fecha y hora -->
              @if (state().date) {
                <div class="space-y-2">
                  <p class="label-sm text-outline">Tu cita</p>
                  <div
                    class="p-3 rounded-xl bg-surface-container flex items-center gap-3"
                  >
                    <span class="material-symbols-outlined text-primary">event</span>
                    <span class="text-sm text-on-surface">
                      {{ formatDate(state().date) }}
                      @if (state().timeSlot) {
                        · {{ state().timeSlot }}
                      }
                    </span>
                  </div>
                </div>
              }

              <!-- Totales -->
              @if (selectedService(); as service) {
                <div class="pt-4 border-t border-surface-variant space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-on-surface-variant">Total</span>
                    <span class="text-on-surface">{{ formatPrice(total()) }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-on-surface-variant">Anticipo (30%)</span>
                    <span class="text-primary">{{ formatPrice(deposit()) }}</span>
                  </div>
                </div>
              }

              <div class="p-3 rounded-xl bg-surface-container-lowest/80 flex items-start gap-2.5">
                <span class="material-symbols-outlined text-primary text-base mt-0.5">lock</span>
                <p class="text-sm text-on-surface-variant leading-snug">
                  Anticipo del 30% requerido para bloquear agenda. Reagenda flexible hasta
                  24h previas.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  `,
})
export class BookingWizardComponent {
  protected readonly steps = [
    { number: 1, caption: 'Paso Uno', title: 'Elige Servicio' },
    { number: 2, caption: 'Paso Dos', title: 'Especialista Andy' },
    { number: 3, caption: 'Paso Tres', title: 'Fecha & Hora' },
    { number: 4, caption: 'Paso Cuatro', title: 'Confirmación VIP' },
  ];

  // Migrado de studioData.ts (STUDIO_SERVICES + ADD_ONS).
  protected readonly services: (BookableService & { preparation: string })[] = [
    {
      id: 1,
      name: 'Maquillaje Profesional',
      tag: 'Social & Novias',
      price: 1850,
      durationMinutes: 90,
      badge: 'Piel Blindada',
      description:
        'Técnica de piel blindada a prueba de agua y lágrimas, visagismo, pestañas 3D de visón personalizadas y ampolleta flash tensora. Ideal para bodas, XV años y galas.',
      preparation:
        'Acudir con el rostro limpio, sin crema pesada ni bloqueador grasoso. Evitar exfoliaciones agresivas 48 horas previas.',
    },
    {
      id: 2,
      name: 'Peinado de Gala & Novias',
      tag: 'Estilismo',
      price: 1200,
      durationMinutes: 60,
      badge: 'Fijación Flexible',
      description:
        'Ondas al agua estilo Hollywood, recogidos estructurados y peinados bohemios con protección térmica y sellado de brillo duradero sin rigidez.',
      preparation:
        'Cabello lavado 2 a 3 horas antes con shampoo neutro, 100% seco al momento de iniciar y sin aceites ni cremas para peinar.',
    },
    {
      id: 3,
      name: 'Nail Arts & Estructuras',
      tag: 'Manicura',
      price: 850,
      durationMinutes: 75,
      badge: 'Manicura Rusa',
      description:
        'Manicura rusa estética con torno, diseño artístico a mano alzada, esmaltado semipermanente de larga duración, Soft Gel o acrílico fino con cristales Swarovski.',
      preparation:
        'Si requieres retiro de producto acrílico previo, agrégalo en los complementos para garantizar el tiempo de sesión adecuado.',
    },
    {
      id: 4,
      name: 'Extensiones de Cabello Premium',
      tag: '100% Humano',
      price: 3500,
      durationMinutes: 120,
      badge: 'Punto Invisible',
      description:
        'Aplicación profesional de cabello 100% virgen con técnica invisible (nanoring, microrings o punto invisible). Cero tracción, máxima ligereza y adaptación tonal.',
      preparation:
        'Cabello limpio y desenredado. Se sugiere valoración previa para determinar el gramaje y largo ideal (18", 22" o 26").',
    },
    {
      id: 5,
      name: 'Cursos Personalizados 1 a 1',
      tag: 'Certificación',
      price: 2800,
      durationMinutes: 180,
      badge: 'Academia VIP',
      description:
        'Masterclasses individuales de Automaquillaje, Perfeccionamiento de Técnicas para profesionales y Formación en Nail Art. Incluye manual teórico y diploma oficial.',
      preparation:
        'Para automaquillaje, puedes traer tu cosmetiquera actual para evaluar tus productos. Todos los materiales de cabina están incluidos.',
    },
  ];

  protected readonly addons: AddOn[] = [
    {
      id: 'addon-ampolleta',
      name: 'Ampolleta Flash Tensora Anti-Fatiga',
      price: 250,
      extraMinutes: 10,
      description: 'Concentrado dermocosmético tensor con péptidos y ácido hialurónico.',
    },
    {
      id: 'addon-cejas',
      name: 'Diseño y Laminado Express de Ceja',
      price: 200,
      extraMinutes: 15,
      description: 'Perfilado con hilo orgánico y fijación semipermanente de textura pulida.',
    },
    {
      id: 'addon-labios',
      name: 'Tratamiento Labios de Seda & Exfoliación',
      price: 180,
      extraMinutes: 10,
      description: 'Exfoliación con microgránulos botánicos y mascarilla selladora de colágeno.',
    },
    {
      id: 'addon-retiro',
      name: 'Retiro Suave de Gel o Acrílico Previo',
      price: 150,
      extraMinutes: 20,
      description: 'Eliminación segura sin limado excesivo para preservar la salud de la uña.',
    },
  ];

  protected readonly currentStep = signal(1);
  protected readonly confirmed = signal(false);
  protected readonly error = signal('');
  protected readonly confirmationCode = signal('');

  protected readonly state = signal<BookingState>({
    serviceId: null,
    addonIds: [],
    date: null,
    timeSlot: null,
    modality: 'studio',
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  protected readonly selectedService = computed(() => {
    const id = this.state().serviceId;
    return this.services.find((s) => s.id === id);
  });

  protected readonly selectedAddons = computed(() =>
    this.state().addonIds
      .map((id) => this.addons.find((a) => a.id === id))
      .filter((a): a is AddOn => a !== undefined)
  );

  protected readonly total = computed(() => {
    const service = this.selectedService();
    if (!service) return 0;
    return service.price + this.selectedAddons().reduce((sum, a) => sum + a.price, 0);
  });

  protected readonly deposit = computed(() => Math.round(this.total() * 0.3));

  protected readonly availableDays = computed(() => {
    const days: { date: Date; iso: string; weekday: string; dayNumber: number; month: string }[] =
      [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    // Lun–Sáb, seis días de agenda.
    for (let i = 0; i < 14; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const weekdayIndex = date.getDay();
      if (weekdayIndex === 0) continue; // domingo cerrado

      days.push({
        date,
        iso: date.toISOString().slice(0, 10),
        weekday: new Intl.DateTimeFormat('es-MX', { weekday: 'short' })
          .format(date)
          .replace('.', '')
          .toUpperCase(),
        dayNumber: date.getDate(),
        month: new Intl.DateTimeFormat('es-MX', { month: 'short' })
          .format(date)
          .replace('.', '')
          .toUpperCase(),
      });
    }
    return days;
  });

  /** Horarios base del estudio. La lógica real de ocupación llega con /api/availability. */
  protected readonly timeSlots = computed(() => {
    if (!this.state().date) return [];
    const isSaturday = this.state().date!.getDay() === 6;

    const base = [
      { time: '10:00', label: '10:00 AM' },
      { time: '11:30', label: '11:30 AM' },
      { time: '13:30', label: '01:30 PM' },
      { time: '15:00', label: '03:00 PM' },
      { time: '16:30', label: '04:30 PM' },
      { time: '18:00', label: '06:00 PM' },
    ];

    // El sábado cierra antes.
    return isSaturday ? base.slice(0, 5) : base;
  });

  protected readonly whatsappLink = computed(() => {
    const service = this.selectedService();
    const message = service
      ? `¡Hola Andy! Deseo formalizar mi cita para: ${service.name} (${service.durationMinutes} min - ${this.formatPrice(service.price)} MXN) en Puebla Studio.`
      : '¡Hola Andy! Deseo información sobre servicios y cursos.';
    return `https://wa.me/522221234567?text=${encodeURIComponent(message)}`;
  });

  protected serviceSupportsAddons(serviceId: number): boolean {
    return [1, 2, 3].includes(serviceId);
  }

  protected selectService(serviceId: number): void {
    this.state.update((s) => ({
      ...s,
      serviceId: serviceId,
      // Al cambiar de servicio se limpian complementos no aplicables y el horario.
      addonIds: this.serviceSupportsAddons(serviceId) ? s.addonIds : [],
      timeSlot: null,
    }));
  }

  protected toggleAddon(addonId: string): void {
    this.state.update((s) => ({
      ...s,
      addonIds: s.addonIds.includes(addonId)
        ? s.addonIds.filter((id) => id !== addonId)
        : [...s.addonIds, addonId],
    }));
  }

  protected selectDate(date: Date): void {
    this.state.update((s) => ({ ...s, date, timeSlot: null }));
  }

  protected setModality(modality: 'studio' | 'domicilio'): void {
    this.state.update((s) => ({ ...s, modality }));
  }

  protected patch(partial: Partial<BookingState>): void {
    this.state.update((s) => ({ ...s, ...partial }));
    this.error.set('');
  }

  protected canGoTo(step: number): boolean {
    if (step === 1) return true;
    if (step === 2) return this.state().serviceId !== null;
    if (step === 3) return this.state().serviceId !== null;
    return this.state().timeSlot !== null;
  }

  protected canAdvance(): boolean {
    switch (this.currentStep()) {
      case 1:
        return this.state().serviceId !== null;
      case 2:
        return true;
      case 3:
        return this.state().date !== null && this.state().timeSlot !== null;
      case 4:
        return false;
      default:
        return false;
    }
  }

  protected advanceLabel(): string {
    switch (this.currentStep()) {
      case 1:
        return 'Continuar: Elegir Horario';
      case 2:
        return 'Continuar: Ver Disponibilidad';
      case 3:
        return 'Continuar: Mis Datos';
      default:
        return 'Continuar';
    }
  }

  protected nextStep(): void {
    if (this.canAdvance() && this.currentStep() < 4) {
      this.currentStep.update((n) => n + 1);
    }
  }

  protected previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update((n) => n - 1);
    }
  }

  protected goToStep(step: number): void {
    if (this.canGoTo(step)) {
      this.currentStep.set(step);
    }
  }

  protected confirm(): void {
    this.error.set('');
    const s = this.state();

    if (s.name.trim().length < 3) {
      this.error.set('Escribe tu nombre completo.');
      return;
    }
    if (s.phone.replace(/\D/g, '').length < 10) {
      this.error.set('Escribe un número de WhatsApp válido con lada.');
      return;
    }
    if (!s.email.includes('@')) {
      this.error.set('Escribe un correo válido para confirmar tu cita.');
      return;
    }

    // TODO: sustituir por POST /api/bookings en feature/booking.
    const code = `ANDY-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    this.confirmationCode.set(code);
    this.confirmed.set(true);
  }

  protected formatPrice(value: number): string {
    return `$${value.toLocaleString('es-MX')} MXN`;
  }

  protected formatDate(date: Date | null): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }
}
