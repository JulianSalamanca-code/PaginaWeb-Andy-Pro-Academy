import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import type { components } from './schema';
import type { BookingDetail } from './booking.service';

export type AdminMetrics = components['schemas']['AdminMetricsDto'];
export type AgendaEntry = components['schemas']['AgendaEntryDto'];
export type AdminBookingDetail = components['schemas']['AdminBookingDetailDto'];
export type AdminProduct = components['schemas']['AdminProductDto'];
export type AdminVariant = components['schemas']['AdminVariantDto'];
export type UpsertProductRequest = components['schemas']['UpsertProductRequest'];
export type AdjustStockRequest = components['schemas']['AdjustStockRequest'];

/**
 * Servicio del panel de administración.
 *
 * A diferencia del catálogo, aquí casi todo son escrituras: cada cambio
 * que Andy hace en el estudio tiene que verse en la base de inmediato. Si
 * actualiza un precio y la clienta sigue viendo el anterior, deja de
 * confiar en el sistema.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly api = inject(ApiService);

  getMetrics(): Observable<AdminMetrics> {
    return this.api.get<AdminMetrics>('/admin/metrics');
  }

  getAgenda(date: Date): Observable<AgendaEntry[]> {
    return this.api.get<AgendaEntry[]>('/admin/agenda', { date: toIsoDate(date) });
  }

  getBookingDetail(id: string): Observable<AdminBookingDetail> {
    return this.api.get<AdminBookingDetail>(`/admin/bookings/${id}`);
  }

  getProducts(): Observable<AdminProduct[]> {
    return this.api.get<AdminProduct[]>('/admin/products');
  }

  /** Crea un producto si no trae Id; lo actualiza si lo trae. */
  saveProduct(request: UpsertProductRequest): Observable<AdminProduct> {
    return this.api.post<AdminProduct, UpsertProductRequest>('/admin/products', request);
  }

  togglePublished(id: string, isPublished: boolean): Observable<{ id: string }> {
    return this.api.patchWith<{ id: string; isPublished: boolean }>(
      `/admin/products/${id}/published`,
      { isPublished },
    );
  }

  /**
   * Ajusta el stock de una variante.
   *
   * Se manda cuántas unidades entran o salen, no el total. Poner el total
   * desde el panel pisaría las ventas que ocurrieron mientras se escribía,
   * y la diferencia sería inexplicable después.
   */
  adjustStock(
    variantId: number,
    delta: number,
    reason: string,
  ): Observable<{ variantId: number; stockOnHand: number }> {
    const body: AdjustStockRequest = { delta, reason };
    return this.api.post(`/admin/variants/${variantId}/stock`, body);
  }

  /**
   * Confirma, completa o cancela una reserva.
   *
   * Cancelar libera el horario sin borrar el registro: la constraint de
   * la base solo considera activos los estados pendiente, confirmada y
   * completada, así que el hueco vuelve a quedar libre.
   */
  updateBookingStatus(
    id: string,
    status: 'pendiente' | 'confirmada' | 'completada' | 'cancelada',
    reason?: string,
  ): Observable<BookingDetail> {
    // El endpoint vive bajo /api/booking, no bajo /api/admin: el cambio de
    // estado es parte del flujo de reserva y lo comparte el panel.
    return this.api.patchWith<BookingDetail>(`/booking/${id}/status`, { status, reason });
  }
}

/**
 * Fecha en formato ISO (YYYY-MM-DD) sin desfase de zona horaria.
 *
 * toISOString() puede restar un día: en Puebla (UTC-6) las 20:00 del 31 se
 * convierten a las 02:00 del 1 de noviembre en UTC, y la agenda pediría el
 * día equivocado.
 */
function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}