import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type BookingStatus = 'pendiente' | 'confirmada' | 'completada' | 'cancelada';

interface AdminBooking {
  id: string;
  client: string;
  service: string;
  date: string;
  time: string;
  total: number;
  deposit: number;
  status: BookingStatus;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="py-12">
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
          <div
            class="inline-flex items-center gap-2 px-4 py-2 rounded-full
                   bg-error-container/20 border border-error-container label-sm text-error self-start"
          >
            <span class="material-symbols-outlined text-base">science</span>
            Modo Demo — sin cobros reales
          </div>
        </div>

        <!-- Métricas -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          @for (metric of metrics(); track metric.label) {
            <div class="card-glass p-5 space-y-2">
              <div class="flex items-center justify-between">
                <span class="label-sm text-outline">{{ metric.label }}</span>
                <span class="material-symbols-outlined text-primary">{{ metric.icon }}</span>
              </div>
              <p class="text-3xl text-on-surface">{{ metric.value }}</p>
              <p class="text-xs text-on-surface-variant">{{ metric.caption }}</p>
            </div>
          }
        </div>

        <!-- Reservas del día -->
        <div class="space-y-4">
          <h2 class="text-xl text-on-surface">Agenda de Hoy</h2>
          <div class="card-glass overflow-hidden">
            <table class="w-full text-left">
              <thead>
                <tr class="border-b border-surface-variant">
                  <th class="label-sm text-outline px-5 py-3">Hora</th>
                  <th class="label-sm text-outline px-5 py-3">Cliente</th>
                  <th class="label-sm text-outline px-5 py-3">Servicio</th>
                  <th class="label-sm text-outline px-5 py-3 text-right">Anticipo</th>
                  <th class="label-sm text-outline px-5 py-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                @for (booking of todayBookings(); track booking.id) {
                  <tr class="border-b border-surface-variant last:border-0">
                    <td class="px-5 py-4 text-primary font-semibold">{{ booking.time }}</td>
                    <td class="px-5 py-4 text-on-surface">{{ booking.client }}</td>
                    <td class="px-5 py-4 text-on-surface-variant">{{ booking.service }}</td>
                    <td class="px-5 py-4 text-right text-on-surface">
                      {{ formatPrice(booking.deposit) }}
                    </td>
                    <td class="px-5 py-4 text-right">
                      <span
                        class="px-3 py-1 rounded-full label-sm"
                        [class]="statusClass(booking.status)"
                      >
                        {{ booking.status }}
                      </span>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="px-5 py-12 text-center text-on-surface-variant">
                      No hay citas programadas para hoy.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Todas las reservas -->
        <div class="space-y-4">
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <h2 class="text-xl text-on-surface">Todas las Reservas</h2>
            <div class="flex flex-wrap gap-2">
              @for (filter of filters; track filter) {
                <button
                  type="button"
                  class="chip !py-1.5 !px-3 !text-[0.625rem]"
                  [class.chip-active]="activeFilter() === filter"
                  (click)="activeFilter.set(filter)"
                >
                  {{ filter }}
                </button>
              }
            </div>
          </div>

          <div class="card-glass overflow-x-auto">
            <table class="w-full text-left min-w-[640px]">
              <thead>
                <tr class="border-b border-surface-variant">
                  <th class="label-sm text-outline px-5 py-3">Folio</th>
                  <th class="label-sm text-outline px-5 py-3">Cliente</th>
                  <th class="label-sm text-outline px-5 py-3">Fecha</th>
                  <th class="label-sm text-outline px-5 py-3">Servicio</th>
                  <th class="label-sm text-outline px-5 py-3 text-right">Total</th>
                  <th class="label-sm text-outline px-5 py-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                @for (booking of filteredBookings(); track booking.id) {
                  <tr class="border-b border-surface-variant last:border-0">
                    <td class="px-5 py-4 text-outline text-sm">{{ booking.id }}</td>
                    <td class="px-5 py-4 text-on-surface">{{ booking.client }}</td>
                    <td class="px-5 py-4 text-on-surface-variant">
                      {{ booking.date }} · {{ booking.time }}
                    </td>
                    <td class="px-5 py-4 text-on-surface-variant">{{ booking.service }}</td>
                    <td class="px-5 py-4 text-right text-on-surface">
                      {{ formatPrice(booking.total) }}
                    </td>
                    <td class="px-5 py-4 text-right">
                      <span
                        class="px-3 py-1 rounded-full label-sm cursor-pointer"
                        [class]="statusClass(booking.status)"
                        (click)="cycleStatus(booking.id)"
                        title="Clic para cambiar el estado"
                      >
                        {{ booking.status }}
                      </span>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="px-5 py-12 text-center text-on-surface-variant">
                      No hay reservas con este filtro.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <p class="text-xs text-outline">
            En el prototipo, hacer clic en el estado la cambia en memoria para demostrar el
            flujo de confirmación.
          </p>
        </div>

        <!-- Inventario -->
        <div class="space-y-4">
          <h2 class="text-xl text-on-surface">Inventario de Tienda</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (item of inventory(); track item.name) {
              <div class="card-glass p-5 flex items-center justify-between gap-4">
                <div class="min-w-0">
                  <p class="text-on-surface truncate">{{ item.name }}</p>
                  <p class="label-sm text-outline">{{ item.brand }} · {{ item.size }}</p>
                </div>
                <div class="text-right shrink-0">
                  <p
                    class="text-xl"
                    [class.text-error]="item.stock <= 5"
                    [class.text-on-surface]="item.stock > 5"
                  >
                    {{ item.stock }}
                  </p>
                  <p class="label-sm text-outline">en stock</p>
                </div>
              </div>
            }
          </div>
        </div>

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
  protected readonly filters = ['todas', 'pendiente', 'confirmada', 'completada', 'cancelada'];
  protected readonly activeFilter = signal('todas');

  protected readonly bookings = signal<AdminBooking[]>([
    {
      id: 'ANDY-A1B2C3',
      client: 'Valeria R.',
      service: 'Maquillaje Profesional',
      date: 'Hoy',
      time: '10:00 AM',
      total: 1850,
      deposit: 555,
      status: 'confirmada',
    },
    {
      id: 'ANDY-D4E5F6',
      client: 'Camila Morales',
      service: 'Cursos 1 a 1 — Piel Blindada',
      date: 'Hoy',
      time: '01:30 PM',
      total: 3600,
      deposit: 1080,
      status: 'pendiente',
    },
    {
      id: 'ANDY-G7H8I9',
      client: 'Sofía Salgado',
      service: 'Nail Arts & Estructuras',
      date: 'Hoy',
      time: '04:30 PM',
      total: 1030,
      deposit: 309,
      status: 'confirmada',
    },
    {
      id: 'ANDY-J1K2L3',
      client: 'Mariana Elizalde',
      service: 'Peinado de Gala & Novias',
      date: 'Mañana',
      time: '11:30 AM',
      total: 1200,
      deposit: 360,
      status: 'pendiente',
    },
    {
      id: 'ANDY-M4N5O6',
      client: 'Ana Sofía R.',
      service: 'Extensiones de Cabello Premium',
      date: '12 oct',
      time: '03:00 PM',
      total: 3500,
      deposit: 1050,
      status: 'completada',
    },
    {
      id: 'ANDY-P7Q8R9',
      client: 'Lucía Hernández',
      service: 'Manicura Rusa & Soft Gel',
      date: '13 oct',
      time: '10:00 AM',
      total: 3900,
      deposit: 1170,
      status: 'cancelada',
    },
  ]);

  protected readonly inventory = signal([
    { name: 'Olaplex No. 3 Reparador', brand: 'Olaplex', size: '100 ml', stock: 12 },
    { name: 'Kérastase Bain Satin', brand: 'Kérastase', size: '250 ml', stock: 6 },
    { name: 'Moroccanoil Treatment', brand: 'Moroccanoil', size: '250 ml', stock: 4 },
    { name: 'Gel de Fijación Firme', brand: 'Studio', size: '150 ml', stock: 15 },
    { name: 'Spray Antifrizz', brand: 'Studio', size: '200 ml', stock: 9 },
    { name: 'Aceite de Jojoba', brand: 'Studio', size: '30 ml', stock: 3 },
  ]);

  protected readonly todayBookings = computed(() =>
    this.bookings().filter((b) => b.date === 'Hoy')
  );

  protected readonly filteredBookings = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'todas') return this.bookings();
    return this.bookings().filter((b) => b.status === filter);
  });

  protected readonly metrics = computed(() => {
    const all = this.bookings();
    return [
      {
        label: 'Citas Hoy',
        value: this.todayBookings().length,
        caption: 'agenda del día',
        icon: 'event_available',
      },
      {
        label: 'Por Confirmar',
        value: all.filter((b) => b.status === 'pendiente').length,
        caption: 'esperando anticipo',
        icon: 'pending_actions',
      },
      {
        label: 'Ingresos Mes',
        value: this.formatPrice(all.reduce((sum, b) => sum + b.deposit, 0)),
        caption: 'anticipos cobrados',
        icon: 'payments',
      },
      {
        label: 'Stock Bajo',
        value: this.inventory().filter((i) => i.stock <= 5).length,
        caption: 'productos por reponer',
        icon: 'inventory',
      },
    ];
  });

  protected cycleStatus(id: string): void {
    const order: BookingStatus[] = ['pendiente', 'confirmada', 'completada', 'cancelada'];
    this.bookings.update((items) =>
      items.map((b) => {
        if (b.id !== id) return b;
        const next = order[(order.indexOf(b.status) + 1) % order.length];
        return { ...b, status: next };
      })
    );
  }

  protected statusClass(status: BookingStatus): string {
    switch (status) {
      case 'confirmada':
        return 'bg-primary/15 text-primary';
      case 'pendiente':
        return 'bg-tertiary-container/20 text-tertiary';
      case 'completada':
        return 'bg-surface-container-highest text-on-surface-variant';
      case 'cancelada':
        return 'bg-error-container/20 text-error';
    }
  }

  protected formatPrice(value: number): string {
    return `$${value.toLocaleString('es-MX')}`;
  }
}
