import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  BookingService,
  SlotConflictError,
  num,
  str,
  type AvailabilitySlot,
  type AvailabilityResponse,
  type Booking,
} from '../../core/api/booking.service';
import { CourseService } from '../../core/services/course.service';
import type { AddOn, ServiceWithAddOns, Specialist } from '../../core/services/catalog.types';

/**
 * Asistente de reserva en cuatro pasos.
 *
 * Los horarios vienen de la API, no se calculan en el cliente: el cálculo
 * en el navegador mostraría horarios que la base ya tiene ocupados, y la
 * clienta descubriría el problema al confirmar, que es el peor momento.
 *
 * El estado vive en signals sueltos en vez de un store externo: el
 * asistente es el único que los usa y así se evita una capa de indirección
 * sinBeneficio.
 */
@Component({
  selector: 'app-booking-wizard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="py-16 lg:py-20">
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
              class="flex items-center gap-3 p-3.5 rounded-xl text-left transition-colors
                     disabled:cursor-not-allowed disabled:opacity-40"
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
                {{ currentStep() > step.number ? '✓' : step.number }}
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
          <!-- Columna principal -->
          <div class="lg:col-span-8">
            <!-- PASO 1: Servicio -->
            @if (currentStep() === 1) {
              <div class="space-y-4">
                <h2 class="text-xl text-on-surface">Elige tu Servicio</h2>

                @if (loadingServices()) {
                  @for (i of [1, 2, 3]; track i) {
                    <div class="p-6 rounded-2xl bg-surface-container animate-pulse h-32"></div>
                  }
                } @else {
                  @for (service of services(); track num(service.service?.id)) {
                    <div
                      class="p-6 rounded-2xl cursor-pointer transition-all
                             bg-surface-container hover:bg-surface-container-high shadow-md"
                      [class.bg-surface-container-high]="num(selectedService()?.service?.id) === num(service.service?.id)"
                      [class.ring-1]="num(selectedService()?.service?.id) === num(service.service?.id)"
                      [class.ring-primary]="num(selectedService()?.service?.id) === num(service.service?.id)"
                      (click)="selectService(service)"
                      (keydown.enter)="selectService(service)"
                      tabindex="0"
                      role="button"
                      [attr.aria-pressed]="num(selectedService()?.service?.id) === num(service.service?.id)"
                    >
                      <div
                        class="flex flex-col sm:flex-row items-start sm:items-center
                               justify-between gap-4"
                      >
                        <div class="flex items-start gap-4">
                          <div
                            class="w-6 h-6 rounded-full flex items-center justify-center mt-1 shrink-0
                                   text-primary bg-surface-container-highest"
                            [class.bg-primary]="num(selectedService()?.service?.id) === num(service.service?.id)"
                            [class.text-on-primary]="num(selectedService()?.service?.id) === num(service.service?.id)"
                          >
                            @if (num(selectedService()?.service?.id) === num(service.service?.id)) {
                              <span class="material-symbols-outlined text-sm">check</span>
                            }
                          </div>
                          <div class="space-y-1.5">
                            <div class="flex flex-wrap items-center gap-2">
                              <h3 class="text-xl text-on-surface">{{ str(service.service?.name) }}</h3>
                              <span
                                class="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary label-sm"
                              >
                                {{ str(service.service?.tagline) }}
                              </span>
                            </div>
                            <p class="text-sm text-on-surface-variant max-w-xl">
                              {{ str(service.service?.description) }}
                            </p>
                          </div>
                        </div>

                        <div
                          class="flex sm:flex-col items-end justify-between
                                 w-full sm:w-auto shrink-0 pl-10 sm:pl-0"
                        >
                          <span class="text-xl text-primary">
                            {{ formatPrice(num(service.service?.price)) }}
                          </span>
                          <span class="label-sm text-outline flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">schedule</span>
                            {{ num(service.service?.durationMinutes) }} min
                          </span>
                        </div>
                      </div>

                      <!-- Complementos del servicio elegido -->
                      @if (
                        num(selectedService()?.service?.id) === num(service.service?.id) &&
                        service.addOns?.length
                      ) {
                        <div class="mt-5 pt-5 border-t border-surface-variant">
                          <p class="label-md text-primary mb-3">Complementos opcionales</p>
                          <div class="space-y-2">
                            @for (addon of service.addOns; track num(addon.id)) {
                              <label
                                class="flex items-start gap-3 p-3 rounded-xl bg-surface-container
                                       cursor-pointer hover:bg-surface-container-highest transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  class="w-4 h-4 mt-0.5 accent-primary cursor-pointer"
                                  [checked]="selectedAddonIds().includes(num(addon.id))"
                                  (change)="toggleAddon(num(addon.id))"
                                  (click)="$event.stopPropagation()"
                                />
                                <span class="flex-1">
                                  <span class="flex items-center justify-between gap-3">
                                    <span class="text-sm text-on-surface">{{ str(addon.name) }}</span>
                                    <span class="text-sm text-primary shrink-0">
                                      +{{ formatPrice(num(addon.price)) }}
                                    </span>
                                  </span>
                                  <span class="block text-xs text-on-surface-variant mt-0.5">
                                    {{ str(addon.description) }} · {{ num(addon.extraMinutes) }} min extra
                                  </span>
                                </span>
                              </label>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  } @empty {
                    <p class="text-on-surface-variant py-8">
                      No se pudieron cargar los servicios. Recarga la página.
                    </p>
                  }
                }
              </div>
            }

            <!-- PASO 2: Especialista -->
            @if (currentStep() === 2) {
              <div class="space-y-5">
                <h2 class="text-xl text-on-surface">Tu Especialista</h2>

                <div class="card-glass p-6 flex flex-col sm:flex-row items-start gap-5">
                  <div
                    class="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-container
                           flex items-center justify-center text-on-primary shrink-0"
                  >
                    <span class="material-symbols-outlined text-4xl">person</span>
                  </div>
                  <div class="space-y-2">
                    <h3 class="text-2xl text-on-surface">
                      {{ specialist()?.name ?? 'Andy • Master Artist' }}
                    </h3>
                    <p class="text-sm text-on-surface-variant">
                      {{ specialist()?.title ?? 'Cosmetóloga & Estilista Titulada' }}
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
                    </div>
                  </div>
                </div>

                @if (selectedService()?.service?.preparation) {
                  <div class="card-glass p-6 space-y-3">
                    <h3 class="label-md text-primary">Preparación previa</h3>
                    <p class="text-sm text-on-surface-variant leading-relaxed">
                      {{ selectedService()?.service?.preparation }}
                    </p>
                  </div>
                }

                <!-- Modalidad -->
                <div class="space-y-3">
                  <h3 class="text-xl text-on-surface">Modalidad</h3>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      class="p-5 rounded-2xl text-left transition-all
                             bg-surface-container hover:bg-surface-container-high"
                      [class.bg-surface-container-high]="modality() === 'studio'"
                      [class.ring-1]="modality() === 'studio'"
                      [class.ring-primary]="modality() === 'studio'"
                      (click)="modality.set('studio')"
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
                      [class.bg-surface-container-high]="modality() === 'domicilio'"
                      [class.ring-1]="modality() === 'domicilio'"
                      [class.ring-primary]="modality() === 'domicilio'"
                      (click)="modality.set('domicilio')"
                    >
                      <span class="material-symbols-outlined text-2xl text-primary">
                        directions_car
                      </span>
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

                <div>
                  <p class="label-md text-outline mb-3">Elige el día</p>
                  <div class="flex gap-3 overflow-x-auto pb-2">
                    @for (day of availableDays(); track day.iso) {
                      <button
                        type="button"
                        class="shrink-0 w-20 py-3 rounded-2xl text-center transition-all
                               bg-surface-container hover:bg-surface-container-high"
                        [class.bg-primary]="selectedDate()?.iso === day.iso"
                        [class.text-on-primary]="selectedDate()?.iso === day.iso"
                        [class.bg-surface-container-highest]="selectedDate()?.iso !== day.iso"
                        (click)="selectDate(day)"
                      >
                        <span class="label-sm block opacity-80">{{ day.weekday }}</span>
                        <span class="text-lg block mt-1">{{ day.dayNumber }}</span>
                        <span class="label-sm block opacity-80">{{ day.month }}</span>
                      </button>
                    }
                  </div>
                </div>

                @if (selectedDate()) {
                  <div>
                    <p class="label-md text-outline mb-3">Horarios disponibles</p>

                    @if (loadingSlots()) {
                      <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        @for (i of [1, 2, 3, 4, 5, 6]; track i) {
                          <div class="h-11 rounded-xl bg-surface-container animate-pulse"></div>
                        }
                      </div>
                    } @else {
                      <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        @for (slot of slots(); track slot.startsAt) {
                          <button
                            type="button"
                            class="py-2.5 px-3 rounded-xl text-center label-sm transition-all
                                   bg-surface-container text-on-surface
                                   hover:bg-primary hover:text-on-primary"
                            [class.bg-primary]="selectedSlot()?.startsAt === slot.startsAt"
                            [class.text-on-primary]="selectedSlot()?.startsAt === slot.startsAt"
                            (click)="selectSlot(slot)"
                          >
                            {{ formatTime(str(slot.startsAt)) }}
                          </button>
                        } @empty {
                          <p class="col-span-full text-sm text-on-surface-variant py-4">
                            No quedan horarios libres este día. Prueba con otra fecha.
                          </p>
                        }
                      </div>
                    }
                  </div>
                } @else {
                  <p class="text-sm text-on-surface-variant">
                    Selecciona primero un día para ver los horarios.
                  </p>
                }

                <div class="p-3 rounded-xl bg-surface-container-lowest/80 flex items-start gap-2.5">
                  <span class="material-symbols-outlined text-primary text-base mt-0.5">lock</span>
                  <p class="text-sm text-on-surface-variant leading-snug">
                    Anticipo del 30% requerido para bloquear agenda. Reagenda flexible hasta
                    24h previas.
                  </p>
                </div>
              </div>
            }

            <!-- PASO 4: Confirmación -->
            @if (currentStep() === 4) {
              @if (confirmed(); as booking) {
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
                    <div class="flex justify-between gap-4">
                      <span class="label-sm text-outline">Folio</span>
                      <span class="text-on-surface">{{ booking.code }}</span>
                    </div>
                    <div class="flex justify-between gap-4">
                      <span class="label-sm text-outline">Servicio</span>
                      <span class="text-on-surface text-right">
                        {{ selectedService()?.service?.name }}
                      </span>
                    </div>
                    <div class="flex justify-between gap-4">
                      <span class="label-sm text-outline">Fecha</span>
                      <span class="text-on-surface">{{ formatSelectedDate() }}</span>
                    </div>
                    <div class="flex justify-between gap-4">
                      <span class="label-sm text-outline">Hora</span>
                      <span class="text-on-surface">
                        {{ selectedSlot() ? formatTime(str(selectedSlot()!.startsAt)) : '—' }}
                      </span>
                    </div>
                    <div class="flex justify-between gap-4">
                      <span class="label-sm text-outline">Modalidad</span>
                      <span class="text-on-surface">
                        {{ modality() === 'studio' ? 'En el estudio' : 'A domicilio' }}
                      </span>
                    </div>
                    <div
                      class="flex justify-between pt-3 border-t border-surface-variant"
                    >
                      <span class="label-sm text-outline">Anticipo a pagar</span>
                      <span class="text-xl text-primary">
                        {{ formatPrice(num(booking.depositAmount)) }}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="label-sm text-outline">Saldo el día del servicio</span>
                      <span class="text-on-surface">{{ formatPrice(num(booking.balanceAmount)) }}</span>
                    </div>
                  </div>

                  <div class="flex flex-wrap justify-center gap-4 pt-2">
                    <a routerLink="/" class="btn-ghost">Volver al inicio</a>
                    <a [href]="whatsappLink(str(booking.code))" target="_blank" rel="noopener" class="btn-primary">
                      <span class="material-symbols-outlined text-xl">chat</span>
                      Confirmar por WhatsApp
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
                        autocomplete="name"
                        class="input-dark"
                        placeholder="Tu nombre"
                        [value]="contactName()"
                        (input)="contactName.set($any($event.target).value)"
                      />
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div class="space-y-2">
                        <label for="phone" class="label-sm text-outline">WhatsApp *</label>
                        <input
                          id="phone"
                          type="tel"
                          autocomplete="tel"
                          class="input-dark"
                          placeholder="+52 222 000 0000"
                          [value]="contactPhone()"
                          (input)="contactPhone.set($any($event.target).value)"
                        />
                      </div>
                      <div class="space-y-2">
                        <label for="email" class="label-sm text-outline">Correo electrónico *</label>
                        <input
                          id="email"
                          type="email"
                          autocomplete="email"
                          class="input-dark"
                          placeholder="tu@correo.com"
                          [value]="contactEmail()"
                          (input)="contactEmail.set($any($event.target).value)"
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
                        [value]="notes()"
                        (input)="notes.set($any($event.target).value)"
                      ></textarea>
                    </div>
                  </div>

                  @if (error()) {
                    <p class="text-sm text-error flex items-start gap-2">
                      <span class="material-symbols-outlined text-base mt-0.5">error</span>
                      <span>{{ error() }}</span>
                    </p>
                  }

                  <button
                    type="button"
                    class="btn-primary w-full"
                    [disabled]="submitting()"
                    (click)="confirm()"
                  >
                    <span class="material-symbols-outlined text-xl">
                      {{ submitting() ? 'hourglass_top' : 'event_available' }}
                    </span>
                    {{ submitting() ? 'Registrando…' : 'Solicitar Mi Cita' }}
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
              <div
                class="flex items-center justify-between gap-4 pt-8 mt-8
                       border-t border-surface-variant"
              >
                <button
                  type="button"
                  class="btn-ghost"
                  [disabled]="currentStep() === 1"
                  [class.opacity-40]="currentStep() === 1"
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
            <div
              class="p-6 rounded-3xl bg-surface-container-high/95 backdrop-blur-xl
                     shadow-2xl space-y-6"
            >
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
                  class="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-container
                         flex items-center justify-center text-on-primary shrink-0"
                >
                  <span class="material-symbols-outlined text-2xl">person</span>
                </div>
                <div>
                  <p class="label-md font-semibold text-on-surface">
                    {{ specialist()?.name ?? 'Andy • Master Artist' }}
                  </p>
                  <p class="label-sm text-outline">
                    {{ specialist()?.title ?? 'Cosmetóloga & Estilista Titulada' }}
                  </p>
                </div>
              </div>

              @if (selectedService(); as service) {
                <div class="space-y-3">
                  <p class="label-sm text-outline">Servicio Seleccionado</p>
                  <div class="p-4 rounded-xl bg-surface-container-highest space-y-2">
                    <div class="flex justify-between items-start gap-3">
                      <span class="label-lg text-on-surface font-bold">
                        {{ str(service.service?.name) }}
                      </span>
                      <span class="text-xl text-primary shrink-0">
                        {{ formatPrice(num(service.service?.price)) }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2 text-on-surface-variant label-sm">
                      <span class="material-symbols-outlined text-sm text-primary">timelapse</span>
                      {{ availability()?.durationMinutes ?? num(service.service?.durationMinutes) }} min
                      de sesión
                    </div>
                  </div>
                </div>

                @if (selectedAddons().length > 0) {
                  <div class="space-y-2">
                    <p class="label-sm text-outline">Complementos</p>
                    @for (addon of selectedAddons(); track num(addon.id)) {
                      <div class="flex justify-between items-center gap-3 text-sm">
                        <span class="text-on-surface-variant">{{ str(addon.name) }}</span>
                        <span class="text-primary shrink-0">+{{ formatPrice(num(addon.price)) }}</span>
                      </div>
                    }
                  </div>
                }

                <div class="pt-4 border-t border-surface-variant space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-on-surface-variant">Total</span>
                    <span class="text-on-surface">{{ formatPrice(total()) }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-on-surface-variant">Anticipo (30%)</span>
                    <span class="text-primary">{{ formatPrice(deposit()) }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-on-surface-variant">Saldo</span>
                    <span class="text-on-surface-variant">{{ formatPrice(total() - deposit()) }}</span>
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
  private readonly bookingService = inject(BookingService);
  private readonly catalog = inject(CourseService);

  /**
   * Lectura defensiva de números del contrato generado.
   *
   * Angular solo expone a la plantilla los miembros de la clase, no los
   * imports de módulo, así que el helper se asigna aquí como campo
   * protegido. Ver num() en booking.service.ts para el porqué.
   */
  protected readonly num = num;
  protected readonly str = str;

  protected readonly steps = [
    { number: 1, caption: 'Paso Uno', title: 'Elige Servicio' },
    { number: 2, caption: 'Paso Dos', title: 'Especialista Andy' },
    { number: 3, caption: 'Paso Tres', title: 'Fecha & Hora' },
    { number: 4, caption: 'Paso Cuatro', title: 'Confirmación VIP' },
  ];

  protected readonly currentStep = signal(1);
  protected readonly loadingServices = signal(true);
  protected readonly loadingSlots = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal('');
  protected readonly confirmed = signal<Booking | null>(null);

  protected readonly services = signal<ServiceWithAddOns[]>([]);
  protected readonly selectedService = signal<ServiceWithAddOns | null>(null);
  protected readonly selectedAddonIds = signal<number[]>([]);
  protected readonly specialist = signal<Specialist | null>(null);

  protected readonly selectedDate = signal<DayOption | null>(null);
  protected readonly slots = signal<AvailabilitySlot[]>([]);
  protected readonly selectedSlot = signal<AvailabilitySlot | null>(null);
  protected readonly availability = signal<AvailabilityResponse | null>(null);

  protected readonly modality = signal<'studio' | 'domicilio'>('studio');
  protected readonly contactName = signal('');
  protected readonly contactPhone = signal('');
  protected readonly contactEmail = signal('');
  protected readonly notes = signal('');

  protected readonly selectedAddons = computed(() =>
    this.selectedAddonIds()
      .map((id) =>
        this.selectedService()?.addOns?.find((a: AddOn) => num(a.id) === id),
      )
      .filter((a): a is AddOn => a !== undefined),
  );

  protected readonly total = computed(() => {
    const service = this.selectedService();
    if (!service?.service) return 0;
    return num(service.service?.price) + this.selectedAddons().reduce((s, a) => s + num(a.price), 0);
  });

  protected readonly deposit = computed(() => Math.round(this.total() * 0.3 * 100) / 100);

  constructor() {
    this.catalog.getServices().subscribe({
      next: (services) => {
        this.services.set(services);
        this.loadingServices.set(false);
      },
      error: () => {
        this.error.set('No se pudo conectar con el servidor. Revisa que la API esté corriendo.');
        this.loadingServices.set(false);
      },
    });

    this.catalog.getSpecialists().subscribe({
      next: (list) => this.specialist.set(list[0] ?? null),
      error: () => {
        // No es crítico: el panel ya tiene un nombre por defecto.
      },
    });
  }

  // ------------------------------------------------------------------
  // Selección
  // ------------------------------------------------------------------

  protected selectService(service: ServiceWithAddOns): void {
    this.selectedService.set(service);
    this.selectedAddonIds.set([]);
    this.selectedSlot.set(null);
    this.error.set('');
  }

  protected toggleAddon(addonId: number): void {
    this.selectedAddonIds.update((ids) =>
      ids.includes(addonId) ? ids.filter((id) => id !== addonId) : [...ids, addonId],
    );

    // Los complementos alargan la sesión, así que los horarios ya no
    // sirven: hay que volver a preguntarlos.
    this.selectedSlot.set(null);
    this.slots.set([]);
  }

  protected selectDate(day: DayOption): void {
    this.selectedDate.set(day);
    this.selectedSlot.set(null);
    this.error.set('');
    this.loadSlots(day);
  }

  protected selectSlot(slot: AvailabilitySlot): void {
    this.selectedSlot.set(slot);
    this.error.set('');
  }

  private loadSlots(day: DayOption): void {
    const service = this.selectedService();
    if (!service?.service?.id) return;

    this.loadingSlots.set(true);

    this.bookingService
      .getAvailability(day.date, num(service.service?.id), this.selectedAddonIds())
      .subscribe({
        next: (response) => {
          this.slots.set(response.slots ?? []);
          this.availability.set(response);
          this.loadingSlots.set(false);
        },
        error: () => {
          this.slots.set([]);
          this.error.set('No se pudieron cargar los horarios. Intenta de nuevo.');
          this.loadingSlots.set(false);
        },
      });
  }

  // ------------------------------------------------------------------
  // Navegación
  // ------------------------------------------------------------------

  protected canGoTo(step: number): boolean {
    if (step === 1) return true;
    if (!this.selectedService()) return false;
    if (step === 3) return true;
    return this.selectedSlot() !== null;
  }

  protected canAdvance(): boolean {
    switch (this.currentStep()) {
      case 1:
        return this.selectedService() !== null;
      case 2:
        return true;
      case 3:
        return this.selectedSlot() !== null;
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
    if (!this.canAdvance() || this.currentStep() >= 4) return;
    this.currentStep.update((n) => n + 1);
  }

  protected previousStep(): void {
    if (this.currentStep() > 1) this.currentStep.update((n) => n - 1);
  }

  protected goToStep(step: number): void {
    if (this.canGoTo(step)) this.currentStep.set(step);
  }

  // ------------------------------------------------------------------
  // Confirmación
  // ------------------------------------------------------------------

  protected confirm(): void {
    this.error.set('');

    const service = this.selectedService();
    const slot = this.selectedSlot();

    if (!service?.service?.id || !slot) {
      this.error.set('Falta el servicio o el horario.');
      return;
    }
    if (this.contactName().trim().length < 3) {
      this.error.set('Escribe tu nombre completo.');
      return;
    }
    if (this.contactPhone().replace(/\D/g, '').length < 10) {
      this.error.set('Escribe un número de WhatsApp válido con lada.');
      return;
    }
    if (!this.contactEmail().includes('@')) {
      this.error.set('Escribe un correo válido para confirmar tu cita.');
      return;
    }

    this.submitting.set(true);

    this.bookingService
      .createBooking({
        specialistId: this.availability()?.specialistId ?? 1,
        startsAt: slot.startsAt,
        contactName: this.contactName().trim(),
        contactPhone: this.contactPhone().trim(),
        contactEmail: this.contactEmail().trim(),
        serviceId: num(service.service?.id),
        addOnIds: this.selectedAddonIds(),
        modality: this.modality(),
        notes: this.notes().trim() || null,
      })
      .subscribe({
        next: (booking) => {
          this.confirmed.set(booking);
          this.submitting.set(false);
        },
        error: (err: unknown) => {
          this.submitting.set(false);

          if (err instanceof SlotConflictError) {
            // El horario se tomó entre elegirlo y confirmar. Se ofrecen
            // los que quedan en vez de un error: la clienta puede
            // reintentar sin recargar.
            this.error.set(err.message);
            this.slots.set(err.alternatives);
            this.selectedSlot.set(null);
            this.currentStep.set(3);
            return;
          }

          if (err instanceof HttpErrorResponse) {
            const message = (err.error as { message?: string })?.message;
            this.error.set(message ?? 'No se pudo registrar tu cita. Intenta de nuevo.');
            return;
          }

          this.error.set('Ocurrió un error inesperado. Intenta de nuevo.');
        },
      });
  }

  // ------------------------------------------------------------------
  // Formato
  // ------------------------------------------------------------------

  protected readonly availableDays = computed<DayOption[]>(() => {
    const days: DayOption[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 14 días Laborables hacia adelante. El rango viene de que
    // working_hours no define domingo.
    for (let i = 0; i < 21; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (date.getDay() === 0) continue;

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const dayNumber = String(date.getDate()).padStart(2, '0');

      days.push({
        date,
        iso: `${year}-${month}-${dayNumber}`,
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

  protected formatPrice(value: number | undefined): string {
    return `$${(value ?? 0).toLocaleString('es-MX')} MXN`;
  }

  /** Horario en la hora de Puebla, no en UTC. */
  protected formatTime(iso: string): string {
    return new Intl.DateTimeFormat('es-MX', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Mexico_City',
    }).format(new Date(iso));
  }

  protected formatSelectedDate(): string {
    const day = this.selectedDate();
    if (!day) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(day.date);
  }

  protected whatsappLink(code: string): string {
    const message =
      `¡Hola Andy! Confirmo mi cita ${code} — ` +
      `${this.selectedService()?.service?.name ?? ''} ` +
      `${this.formatSelectedDate()}`;
    return `https://wa.me/522221234567?text=${encodeURIComponent(message)}`;
  }
}

interface DayOption {
  date: Date;
  iso: string;
  weekday: string;
  dayNumber: number;
  month: string;
}