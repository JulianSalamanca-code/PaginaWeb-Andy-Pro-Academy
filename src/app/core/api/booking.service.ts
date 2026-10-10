import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, catchError, throwError } from 'rxjs';
import { ApiService } from '../api/api.service';
import type { components } from '../api/schema';

export type AvailabilitySlot = components['schemas']['AvailabilitySlotDto'];
export type AvailabilityResponse = components['schemas']['AvailabilityResponseDto'];
export type CreateBookingRequest = components['schemas']['CreateBookingRequest'];
export type Booking = components['schemas']['BookingDto'];
export type BookingDetail = components['schemas']['BookingDetailDto'];
export type AdminBooking = components['schemas']['AdminBookingDto'];
export type SlotConflict = components['schemas']['SlotConflictResponse'];

/**
 * Lee un campo numérico del contrato generado.
 *
 * openapi-typescript marca cada campo como opcional porque OpenAPI 3.0 no
 * distingue "ausente" de "obligatorio". En los DTO de C# estos campos
 * nunca llegan null, así que un 0 aquí solo es red de seguridad ante un
 * cambio futuro en el contrato, no un caso real.
 *
 * Centralizarlo evita repetir el ?? 0 en cada plantilla, que es donde se
 * cuelan los errores de tipo silenciosos.
 */
export function num(value: number | undefined | null): number {
  return value ?? 0;
}

/** Igual que num() pero para textos. */
export function str(value: string | undefined | null): string {
  return value ?? '';
}
@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly api = inject(ApiService);

  /**
   * Horarios libres de un servicio en una fecha.
   *
   * Los complementos se envían porque suman tiempo de cabina: con un
   * laminado de ceja la sesión dura 15 minutos más y los horarios libres
   * cambian. Pedirlos sin complementos daría una disponibilidad que la
   * base rechazaría al confirmar.
   */
  getAvailability(
    date: Date,
    serviceId: number,
    addOnIds: number[] = [],
    specialistId?: number,
  ): Observable<AvailabilityResponse> {
    const params: Record<string, string | number> = {
      date: toIsoDate(date),
      serviceId,
    };

    if (addOnIds.length > 0) {
      params['addOnIds'] = addOnIds.join(',');
    }
    if (specialistId !== undefined) {
      params['specialistId'] = specialistId;
    }

    return this.api.get<AvailabilityResponse>('/booking/availability', params);
  }

  /**
   * Crea la reserva.
   *
   * El 409 no es un fallo cualquiera: significa que el horario se tomó y
   * trae alternativas. Se propaga como SlotConflictError para que el
   * componente lo distinga.
   */
  createBooking(request: CreateBookingRequest): Observable<Booking> {
    return this.api.post<Booking, CreateBookingRequest>('/booking/', request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 409) {
          return throwError(() => new SlotConflictError(error.error as SlotConflict));
        }
        return throwError(() => error);
      }),
    );
  }

  getBooking(id: string): Observable<BookingDetail> {
    return this.api.get<BookingDetail>(`/booking/${id}`);
  }

  /** Reservas de una fecha, para el panel de administración. */
  getAgenda(date: Date): Observable<AdminBooking[]> {
    return this.api.get<AdminBooking[]>('/booking/agenda', { date: toIsoDate(date) });
  }

  /**
   * Cambia el estado de una reserva.
   *
   * Cancelar libera el horario sin borrar el registro: la constraint de
   * la base solo considera activos los estados pendiente, confirmada y
   * completada.
   */
  updateStatus(
    id: string,
    status: 'pendiente' | 'confirmada' | 'completada' | 'cancelada',
    reason?: string,
  ): Observable<BookingDetail> {
    return this.api.patchWith<BookingDetail>(`/booking/${id}/status`, { status, reason });
  }
}

/**
 * Error de horario tomado.
 *
 * Clase propia en vez de mirar el status HTTP en el componente: obliga a
 * que quien reciba el error lo trate explícitamente, y evita que se
 * confunda con un fallo de red donde sí conviene reintentar.
 */
export class SlotConflictError extends Error {
  constructor(readonly conflict: SlotConflict) {
    // message puede venir ausente según el contrato generado; el texto de
    // respaldo evita un error con mensaje vacío si eso ocurre.
    super(conflict.message ?? 'Ese horario acaba de ser tomado. Elige otro.');
    this.name = 'SlotConflictError';
  }

  /** Horarios que siguen libres en la misma fecha. */
  get alternatives(): AvailabilitySlot[] {
    return this.conflict.alternatives ?? [];
  }
}

/**
 * Fecha en formato ISO (YYYY-MM-DD) sin desfase de zona horaria.
 *
 * Usar toISOString() sobre una fecha local puede restar un día: en
 * Puebla (UTC-6) las 20:00 del 31 se convierte a las 02:00 del 1 de
 * noviembre en UTC, y la consulta pediría el día equivocado.
 */
function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}