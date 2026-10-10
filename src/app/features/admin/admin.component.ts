import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminService } from '../../core/api/admin.service';
import { num, str } from '../../core/api/booking.service';
import type { AdminMetrics, AgendaEntry, AdminProduct } from '../../core/api/admin.service';

type BookingStatus = 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
type Tab = 'agenda' | 'inventario';

/**
 * Panel de administración.
 *
 * Es la pantalla que Andy usa todos los días, así que la prioridad es que
 * un cambio se vea en la base de inmediato: confirmar una cita o mover el
 * stock tienen que reflejarse sin recargar, o deja de confiar en el sistema.
 *
 * Las métricas, la agenda y el inventario llegan de la base. No hay datos
 * embebidos: un panel que muestra números de mentira es peor que no
 * tener panel, porque Andy tomaría decisiones con ellos.
 */
@Component({
  selector: 'app-admin',
  standalone: true,
  // FormsModule aporta ngModel, necesario para el formulario de ajuste
  // manual de stock. El resto del panel usa signals y eventos.
  imports: [RouterLink, FormsModule],
  template: `
    <section class="py-12 min-h-screen">
      <div class="container-luxury space-y-8">
        <!-- Encabezado -->
        <div
          class="flex flex-col md:flex-row md:items-center justify-between gap-4
                 pb-6 border-b border-surface-variant"
        >
          <div>
            <h1 class="text-3xl text-on-surface">Panel de Administración</h1>
            <p class="text-on-surface-variant mt-1">Agenda, reservas e inventario</p>
          </div>

          <div class="flex items-center gap-3">
            <span
              class="inline-flex items-center gap-2 px-4 py-2 rounded-full
                     bg-error-container/20 border border-error-container
                     label-sm text-error"
            >
              <span class="material-symbols-outlined text-base">science</span>
              Modo Demo — sin cobros reales
            </span>
          </div>
        </div>

        @if (error()) {
          <div
            class="p-4 rounded-2xl bg-error-container/15 border border-error-container/40
                   flex items-start gap-3"
          >
            <span class="material-symbols-outlined text-error mt-0.5">error</span>
            <p class="text-sm text-on-surface flex-1">{{ error() }}</p>
            <button
              type="button"
              class="label-sm text-error hover:underline"
              (click)="reload()"
            >
              Reintentar
            </button>
          </div>
        }

        <!-- Métricas -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          @for (metric of metricsCards(); track metric.label) {
            <div class="card-glass p-5 space-y-2">
              <div class="flex items-center justify-between">
                <span class="label-sm text-outline">{{ metric.label }}</span>
                <span class="material-symbols-outlined text-primary">{{ metric.icon }}</span>
              </div>
              @if (metrics(); as m) {
                <p class="text-3xl text-on-surface">{{ metric.value(m) }}</p>
              } @else {
                <div class="h-9 w-20 bg-surface-container-highest rounded animate-pulse"></div>
              }
              <p class="text-xs text-on-surface-variant">{{ metric.caption }}</p>
            </div>
          }
        </div>

        <!-- Pestañas -->
        <div class="flex gap-3 border-b border-surface-variant pb-4">
          @for (t of tabs; track t.id) {
            <button
              type="button"
              class="chip"
              [class.chip-active]="tab() === t.id"
              (click)="switchTab(t.id)"
            >
              <span class="material-symbols-outlined text-base mr-1.5">{{ t.icon }}</span>
              {{ t.label }}
            </button>
          }
        </div>

        <!-- Pestaña: agenda -->
        @if (tab() === 'agenda') {
          <div class="space-y-6">
            <!-- Selector de fecha -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 class="text-xl text-on-surface">Agenda</h2>
                <p class="text-sm text-on-surface-variant">{{ selectedDateLabel() }}</p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="w-10 h-10 rounded-full bg-surface-container-high text-on-surface
                         flex items-center justify-center hover:text-primary transition-colors"
                  aria-label="Día anterior"
                  (click)="shiftDate(-1)"
                >
                  <span class="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <input
                  type="date"
                  class="input-dark !w-auto"
                  [value]="selectedDateIso()"
                  (change)="onDateInput($any($event.target).value)"
                />
                <button
                  type="button"
                  class="w-10 h-10 rounded-full bg-surface-container-high text-on-surface
                         flex items-center justify-center hover:text-primary transition-colors"
                  aria-label="Día siguiente"
                  (click)="shiftDate(1)"
                >
                  <span class="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>

            <!-- Filtros de estado -->
            <div class="flex flex-wrap gap-2">
              @for (filter of filters; track filter) {
                <button
                  type="button"
                  class="chip !py-1.5 !px-3 !text-[0.625rem]"
                  [class.chip-active]="statusFilter() === filter"
                  (click)="statusFilter.set(filter)"
                >
                  {{ filter }}
                  @if (filter !== 'todas') {
                    <span class="ml-1 opacity-70">{{ countByStatus(filter) }}</span>
                  }
                </button>
              }
            </div>

            @if (loading()) {
              <div class="space-y-3">
                @for (i of [1, 2, 3]; track i) {
                  <div class="h-20 rounded-2xl bg-surface-container animate-pulse"></div>
                }
              </div>
            } @else {
              <div class="space-y-3">
                @for (entry of filteredAgenda(); track entry.id) {
                  <article
                    class="card-glass p-5 flex flex-col lg:flex-row lg:items-center
                           gap-4"
                    [class.opacity-50]="entry.status === 'cancelada'"
                  >
                    <!-- Hora -->
                    <div class="flex lg:flex-col lg:items-start gap-2 lg:gap-1 shrink-0 lg:w-32">
                      <span class="text-lg text-primary font-semibold">
                        {{ formatTime(str(entry.startsAt)) }}
                      </span>
                      <span class="label-sm text-outline">
                        {{ formatTime(str(entry.endsAt)) }}
                      </span>
                    </div>

                    <!-- Info -->
                    <div class="flex-1 min-w-0 space-y-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <h3 class="text-on-surface">{{ str(entry.clientName) }}</h3>
                        <span
                          class="px-2.5 py-0.5 rounded-full label-sm"
                          [class]="statusClass(str(entry.status))"
                        >
                          {{ str(entry.status) }}
                        </span>
                        @if (entry.depositPaid) {
                          <span
                            class="px-2.5 py-0.5 rounded-full label-sm bg-primary/15 text-primary"
                          >
                            anticipo pagado
                          </span>
                        } @else {
                          <span
                            class="px-2.5 py-0.5 rounded-full label-sm
                                   bg-tertiary-container/20 text-tertiary"
                          >
                            anticipo pendiente
                          </span>
                        }
                      </div>

                      <p class="text-sm text-on-surface-variant">
                        {{ str(entry.subject) }}
                        @if (entry.modality === 'domicilio') {
                          · a domicilio
                        } @else {
                          · en el estudio
                        }
                      </p>

                      <div class="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                        <span class="text-xs text-outline flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-xs">tag</span>
                          {{ str(entry.code) }}
                        </span>
                        <span class="text-xs text-outline flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-xs">phone</span>
                          {{ str(entry.clientPhone) }}
                        </span>
                        @if (entry.notes) {
                          <span class="text-xs text-outline flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-xs">sticky_note_2</span>
                            {{ str(entry.notes) }}
                          </span>
                        }
                        @if (entry.rfcReceiver) {
                          <span class="text-xs text-outline flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-xs">receipt_long</span>
                            RFC {{ str(entry.rfcReceiver) }}
                          </span>
                        }
                      </div>
                    </div>

                    <!-- Importe y acciones -->
                    <div class="flex items-center justify-between lg:justify-end gap-4 shrink-0">
                      <div class="text-right">
                        <span class="label-sm text-outline block">Anticipo</span>
                        <span class="text-primary text-lg">
                          {{ formatPrice(num(entry.deposit)) }}
                        </span>
                        <span class="block label-sm text-outline">
                          de {{ formatPrice(num(entry.total)) }}
                        </span>
                      </div>

                      <div class="flex items-center gap-2">
                        @if (entry.status === 'pendiente') {
                          <button
                            type="button"
                            class="px-4 py-2 rounded-full bg-primary text-on-primary
                                   label-sm hover:opacity-90 transition-opacity"
                            [disabled]="busyId() === entry.id"
                            (click)="setStatus(str(entry.id), 'confirmada')"
                          >
                            Confirmar
                          </button>
                        }
                        @if (entry.status === 'confirmada') {
                          <button
                            type="button"
                            class="px-4 py-2 rounded-full bg-surface-container-highest
                                   text-on-surface label-sm hover:text-primary transition-colors"
                            [disabled]="busyId() === entry.id"
                            (click)="setStatus(str(entry.id), 'completada')"
                          >
                            Completar
                          </button>
                        }
                        @if (entry.status !== 'cancelada' && entry.status !== 'completada') {
                          <button
                            type="button"
                            class="w-9 h-9 rounded-full bg-surface-container-highest
                                   text-on-surface-variant flex items-center justify-center
                                   hover:text-error transition-colors"
                            [attr.aria-label]="'Cancelar reserva ' + str(entry.code)"
                            [disabled]="busyId() === entry.id"
                            (click)="cancel(entry)"
                          >
                            <span class="material-symbols-outlined text-base">close</span>
                          </button>
                        }
                      </div>
                    </div>
                  </article>
                } @empty {
                  <div
                    class="p-12 rounded-3xl bg-surface-container text-center space-y-3"
                  >
                    <span
                      class="material-symbols-outlined text-4xl text-primary/40"
                      aria-hidden="true"
                    >
                      event_busy
                    </span>
                    <p class="text-on-surface">
                      {{ statusFilter() === 'todas'
                        ? 'No hay citas programadas para este día.'
                        : 'No hay reservas con este estado.' }}
                    </p>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Pestaña: inventario -->
        @if (tab() === 'inventario') {
          <div class="space-y-6">
            <div>
              <h2 class="text-xl text-on-surface">Inventario de Tienda</h2>
              <p class="text-sm text-on-surface-variant">
                Ajusta por unidades, no por total: poner el total pisaría las ventas
                que ocurrieron mientras escribías.
              </p>
            </div>

            @if (loadingProducts()) {
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                @for (i of [1, 2, 3]; track i) {
                  <div class="h-28 rounded-2xl bg-surface-container animate-pulse"></div>
                }
              </div>
            } @else {
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                @for (product of products(); track product.id) {
                  <article class="card-glass p-5 space-y-4">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="label-sm text-primary">{{ str(product.brand) }}</p>
                        <h3 class="text-on-surface truncate mt-0.5">
                          {{ str(product.name) }}
                        </h3>
                        <p class="text-xs text-outline mt-1">{{ str(product.category) }}</p>
                      </div>
                      <button
                        type="button"
                        class="label-sm px-2.5 py-1 rounded-full shrink-0 transition-colors"
                        [class.bg-primary/15]="product.isPublished"
                        [class.text-primary]="product.isPublished"
                        [class.bg-surface-container-highest]="!product.isPublished"
                        [class.text-outline]="!product.isPublished"
                        [title]="product.isPublished ? 'Ocultar del catálogo' : 'Mostrar en el catálogo'"
                        (click)="togglePublished(product)"
                      >
                        {{ product.isPublished ? 'visible' : 'oculto' }}
                      </button>
                    </div>

                    <div class="text-lg text-primary">
                      {{ formatPrice(num(product.price)) }}
                    </div>

                    @for (variant of product.variants ?? []; track variant.id) {
                      <div
                        class="flex items-center justify-between gap-3 pt-3
                               border-t border-surface-variant"
                      >
                        <div>
                          <p class="text-sm text-on-surface-variant">
                            {{ str(variant.sizeLabel) }}
                          </p>
                          <p
                            class="text-2xl"
                            [class.text-error]="num(variant.stockOnHand) === 0"
                            [class.text-tertiary]="num(variant.stockOnHand) > 0 && num(variant.stockOnHand) <= 5"
                            [class.text-on-surface]="num(variant.stockOnHand) > 5"
                          >
                            {{ num(variant.stockOnHand) }}
                          </p>
                        </div>

                        <div class="flex items-center gap-1">
                          <button
                            type="button"
                            class="w-9 h-9 rounded-full bg-surface-container-high
                                   text-on-surface flex items-center justify-center
                                   hover:text-primary transition-colors"
                            [attr.aria-label]="'Quitar una unidad de ' + str(product.name)"
                            [disabled]="num(variant.stockOnHand) === 0 || busyVariant() === variant.id"
                            (click)="adjustStock(variant, -1)"
                          >
                            <span class="material-symbols-outlined text-base">remove</span>
                          </button>
                          <button
                            type="button"
                            class="w-9 h-9 rounded-full bg-surface-container-high
                                   text-on-surface flex items-center justify-center
                                   hover:text-primary transition-colors"
                            [attr.aria-label]="'Agregar una unidad de ' + str(product.name)"
                            [disabled]="busyVariant() === variant.id"
                            (click)="adjustStock(variant, 1)"
                          >
                            <span class="material-symbols-outlined text-base">add</span>
                          </button>
                        </div>
                      </div>
                    }
                  </article>
                }
              </div>
            }

            <!-- Ajuste manual -->
            <div class="card-glass p-6 space-y-4">
              <h3 class="text-lg text-on-surface">Ajuste manual de stock</h3>
              <p class="text-sm text-on-surface-variant">
                Para movimientos grandes o correcciones. El motivo queda registrado
                para poder auditar el cambio después.
              </p>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="space-y-2">
                  <label for="variant" class="label-sm text-outline">Producto</label>
                  <select id="variant" class="input-dark" [(ngModel)]="stockForm.variantId">
                    <option value="">Selecciona…</option>
                    @for (product of products(); track product.id) {
                      @for (variant of product.variants ?? []; track variant.id) {
                        <option [value]="variant.id">
                          {{ str(product.name) }} — {{ str(variant.sizeLabel) }}
                          ({{ num(variant.stockOnHand) }})
                        </option>
                      }
                    }
                  </select>
                </div>

                <div class="space-y-2">
                  <label for="delta" class="label-sm text-outline">Unidades (+ / −)</label>
                  <input
                    id="delta"
                    type="number"
                    class="input-dark"
                    placeholder="-5"
                    [(ngModel)]="stockForm.delta"
                  />
                </div>

                <div class="space-y-2">
                  <label for="reason" class="label-sm text-outline">Motivo</label>
                  <input
                    id="reason"
                    type="text"
                    class="input-dark"
                    placeholder="Merma, recepción, corrección…"
                    [(ngModel)]="stockForm.reason"
                  />
                </div>
              </div>

              @if (stockError()) {
                <p class="text-sm text-error flex items-start gap-2">
                  <span class="material-symbols-outlined text-base mt-0.5">error</span>
                  {{ stockError() }}
                </p>
              }

              <button
                type="button"
                class="btn-primary !py-3 !px-6 !text-[0.6875rem]"
                [disabled]="!canSubmitStock() || busyVariant() !== null"
                [class.opacity-50]="!canSubmitStock()"
                (click)="submitStockAdjust()"
              >
                <span class="material-symbols-outlined text-base">inventory</span>
                Aplicar Ajuste
              </button>
            </div>
          </div>
        }

        <div class="pt-4">
          <a routerLink="/" class="btn-ghost">
            <span class="material-symbols-outlined text-base">arrow_back</span>
            Volver al sitio
          </a>
        </div>
      </div>
    </section>
  `,
})
export class AdminComponent {
  private readonly adminService = inject(AdminService);

  /**
   * Lectura defensiva del contrato generado.
   *
   * Angular solo expone a la plantilla los miembros de la clase, no los
   * imports de módulo, así que los helpers se asignan aquí como campos.
   * Ver num() y str() en booking.service.ts para el porqué.
   */
  protected readonly num = num;
  protected readonly str = str;

  protected readonly tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'agenda', label: 'Agenda', icon: 'event' },
    { id: 'inventario', label: 'Inventario', icon: 'inventory_2' },
  ];

  protected readonly filters: (BookingStatus | 'todas')[] = [
    'todas',
    'pendiente',
    'confirmada',
    'completada',
    'cancelada',
  ];

  protected readonly tab = signal<Tab>('agenda');
  protected readonly statusFilter = signal<BookingStatus | 'todas'>('todas');
  protected readonly selectedDate = signal(new Date());
  protected readonly busyId = signal<string | null>(null);
  protected readonly busyVariant = signal<number | null>(null);

  protected readonly loading = signal(true);
  protected readonly loadingProducts = signal(true);
  protected readonly error = signal('');
  protected readonly stockError = signal('');

  protected readonly metrics = signal<AdminMetrics | null>(null);
  protected readonly agenda = signal<AgendaEntry[]>([]);
  protected readonly products = signal<AdminProduct[]>([]);

  /** Formulario del ajuste manual. Objeto plano porque ngModel hace two-way binding. */
  protected readonly stockForm = { variantId: '', delta: 0, reason: '' };

  protected readonly selectedDateIso = computed(() => {
    const d = this.selectedDate();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  protected readonly filteredAgenda = computed(() => {
    const filter = this.statusFilter();
    const all = this.agenda();
    if (filter === 'todas') return all;
    return all.filter((entry) => entry.status === filter);
  });

  protected readonly metricsCards = computed(() => [
    {
      label: 'Citas Hoy',
      caption: 'agenda del día',
      icon: 'event_available',
      value: (m: AdminMetrics) => String(num(m.bookingsToday)),
    },
    {
      label: 'Por Confirmar',
      caption: 'esperando anticipo',
      icon: 'pending_actions',
      value: (m: AdminMetrics) => String(num(m.pendingConfirmation)),
    },
    {
      label: 'Anticipos Hoy',
      caption: 'por cobrar',
      icon: 'payments',
      value: (m: AdminMetrics) => this.formatPrice(num(m.depositsCollected)),
    },
    {
      label: 'Stock Bajo',
      caption: 'productos por reponer',
      icon: 'inventory',
      value: (m: AdminMetrics) => String(num(m.lowStockProducts) + num(m.outOfStockProducts)),
    },
  ]);

  constructor() {
    this.loadAgenda();
    this.loadMetrics();
  }

  // ------------------------------------------------------------------
  // Carga
  // ------------------------------------------------------------------

  reload(): void {
    this.error.set('');
    this.loadMetrics();
    if (this.tab() === 'agenda') this.loadAgenda();
    else this.loadProducts();
  }

  private loadMetrics(): void {
    this.adminService.getMetrics().subscribe({
      next: (m) => this.metrics.set(m),
      error: () => {
        // No bloquea el panel: la agenda sigue siendo lo importante.
      },
    });
  }

  private loadAgenda(): void {
    this.loading.set(true);
    this.error.set('');

    this.adminService.getAgenda(this.selectedDate()).subscribe({
      next: (entries) => {
        this.agenda.set(entries);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(this.readError(err, 'No se pudo cargar la agenda.'));
        this.loading.set(false);
      },
    });
  }

  private loadProducts(): void {
    this.loadingProducts.set(true);
    this.error.set('');

    this.adminService.getProducts().subscribe({
      next: (list) => {
        this.products.set(list);
        this.loadingProducts.set(false);
      },
      error: (err: unknown) => {
        this.error.set(this.readError(err, 'No se pudo cargar el inventario.'));
        this.loadingProducts.set(false);
      },
    });
  }

  // ------------------------------------------------------------------
  // Acciones
  // ------------------------------------------------------------------

  protected switchTab(tab: Tab): void {
    this.tab.set(tab);
    if (tab === 'inventario' && this.products().length === 0) {
      this.loadProducts();
    }
    if (tab === 'agenda' && this.agenda().length === 0) {
      this.loadAgenda();
    }
  }

  protected setStatus(id: string, status: BookingStatus): void {
    this.busyId.set(id);

    this.adminService.updateBookingStatus(id, status).subscribe({
      next: () => {
        this.busyId.set(null);
        // Se recarga en vez de parchear el objeto local: el estado en la
        // base es la autoridad, y así el panel nunca muestra algo que la
        // API no confirma.
        this.loadAgenda();
        this.loadMetrics();
      },
      error: (err: unknown) => {
        this.busyId.set(null);
        this.error.set(this.readError(err, 'No se pudo actualizar la reserva.'));
      },
    });
  }

  protected cancel(entry: AgendaEntry): void {
    // Se pide confirmación porque cancelar libera el horario: si la
    // clienta lo requería, alguien más podría tomarlo.
    const confirmed = confirm(
      `¿Cancelar la reserva ${str(entry.code)} de ${str(entry.clientName)}?\n\n` +
        `El horario quedara libre y podra ser reservado por otra persona.`,
    );
    if (confirmed) this.setStatus(str(entry.id), 'cancelada');
  }

  protected togglePublished(product: AdminProduct): void {
    this.adminService.togglePublished(str(product.id), !product.isPublished).subscribe({
      next: () => this.loadProducts(),
      error: (err: unknown) =>
        this.error.set(this.readError(err, 'No se pudo cambiar la visibilidad.')),
    });
  }

  protected adjustStock(variant: { id?: number }, delta: number): void {
    const variantId = num(variant.id);
    this.busyVariant.set(variantId);

    const reason = delta > 0 ? 'Ajuste manual desde el panel' : 'Merma o salida de stock';

    this.adminService.adjustStock(variantId, delta, reason).subscribe({
      next: () => {
        this.busyVariant.set(null);
        this.loadProducts();
        this.loadMetrics();
      },
      error: (err: unknown) => {
        this.busyVariant.set(null);
        this.error.set(this.readError(err, 'No se pudo ajustar el stock.'));
      },
    });
  }

  protected canSubmitStock(): boolean {
    const f = this.stockForm;
    return f.variantId !== '' && f.delta !== 0 && f.reason.trim().length > 2;
  }

  protected submitStockAdjust(): void {
    const f = this.stockForm;
    this.stockError.set('');

    if (!this.canSubmitStock()) return;

    this.busyVariant.set(Number(f.variantId));

    this.adminService.adjustStock(Number(f.variantId), f.delta, f.reason.trim()).subscribe({
      next: () => {
        this.busyVariant.set(null);
        this.stockForm.delta = 0;
        this.stockForm.reason = '';
        this.loadProducts();
        this.loadMetrics();
      },
      error: (err: unknown) => {
        this.busyVariant.set(null);
        this.stockError.set(this.readError(err, 'No se pudo aplicar el ajuste.'));
      },
    });
  }

  // ------------------------------------------------------------------
  // Utilidades
  // ------------------------------------------------------------------

  protected shiftDate(days: number): void {
    const next = new Date(this.selectedDate());
    next.setDate(next.getDate() + days);
    this.selectedDate.set(next);
    this.loadAgenda();
    this.loadMetrics();
  }

  protected onDateInput(value: string): void {
    if (!value) return;
    // Se parte la cadena en vez de usar new Date(value): 'YYYY-MM-DD' se
    // interpreta como UTC y en Puebla (UTC-6) retrocede un día.
    const [year, month, day] = value.split('-').map((n) => Number(n));
    this.selectedDate.set(new Date(year, month - 1, day));
    this.loadAgenda();
    this.loadMetrics();
  }

  protected countByStatus(status: string): number {
    return this.agenda().filter((e) => e.status === status).length;
  }

  protected selectedDateLabel(): string {
    const isToday =
      this.selectedDateIso() ===
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

    const label = new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(this.selectedDate());

    return isToday ? `Hoy · ${label}` : label;
  }

  protected formatTime(iso: string): string {
    return new Intl.DateTimeFormat('es-MX', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Mexico_City',
    }).format(new Date(iso));
  }

  protected formatPrice(value: number): string {
    return `$${value.toLocaleString('es-MX')}`;
  }

  protected statusClass(status: string): string {
    switch (status) {
      case 'confirmada':
        return 'bg-primary/15 text-primary';
      case 'pendiente':
        return 'bg-tertiary-container/20 text-tertiary';
      case 'completada':
        return 'bg-surface-container-highest text-on-surface-variant';
      case 'cancelada':
        return 'bg-error-container/20 text-error';
      default:
        return 'bg-surface-container text-on-surface-variant';
    }
  }

  /** Extrae el mensaje que devuelve la API, con un texto de respaldo. */
  private readError(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      const message = (err.error as { message?: string })?.message;
      return message ?? fallback;
    }
    return fallback;
  }
}