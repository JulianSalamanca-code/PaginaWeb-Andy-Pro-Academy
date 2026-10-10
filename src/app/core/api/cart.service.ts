import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import type { components } from './schema';

export type Product = components['schemas']['ProductDto'];
export type ProductVariant = components['schemas']['ProductVariantDto'];
export type Order = components['schemas']['OrderDto'];
export type OrderCheckout = components['schemas']['OrderCheckoutDto'];
export type CreateOrderRequest = components['schemas']['CreateOrderRequest'];
export type CartItem = components['schemas']['CartItemDto'];
export type StockConflict = components['schemas']['StockConflictResponse'];

export interface CartLine {
  variantId: number;
  productName: string;
  brand: string;
  sizeLabel: string;
  unitPrice: number;
  quantity: number;
}

/**
 * Carrito de compras.
 *
 * Vive en signals del servicio, no en el componente: el navbar y la
 * página de tienda necesitan leer el mismo estado para mostrar el conteo
 * de artículos. Si estuviera en el componente, el navbar no lo vería.
 *
 * El precio unitario se guarda con la línea para poder mostrar el total
 * al instante, pero al comprar el servidor lo recalcula: si alguien
 * manipulara el precio en el navegador, la base cobra lo que vale.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly api = inject(ApiService);

  /** IVA de cosméticos en México. La base lo recalcula igual. */
  private readonly taxRate = 0.16;

  private readonly lines = signal<CartLine[]>([]);
  private readonly open = signal(false);

  readonly items = this.lines.asReadonly();
  readonly isOpen = this.open.asReadonly();

  readonly count = computed(() =>
    this.lines().reduce((sum, line) => sum + line.quantity, 0),
  );

  readonly subtotal = computed(() =>
    Math.round(this.lines().reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) * 100) /
    100,
  );

  readonly tax = computed(() => Math.round(this.subtotal() * this.taxRate * 100) / 100);

  readonly total = computed(() => Math.round((this.subtotal() + this.tax()) * 100) / 100);

  /**
   * Agrega una presentación al carrito.
   *
   * Si ya está en el carrito, acumula en vez de duplicar la línea: tener
   * dos renglones del mismo shampoo parte el control de cantidad y
   * confunde el total.
   */
  add(product: Product, variant: ProductVariant, quantity = 1): void {
    const variantId = variant?.id ?? 0;
    if (variantId === 0) return;

    this.lines.update((current) => {
      const existing = current.find((l) => l.variantId === variantId);

      if (existing) {
        return current.map((l) =>
          l.variantId === variantId ? { ...l, quantity: l.quantity + quantity } : l,
        );
      }

      return [
        ...current,
        {
          variantId,
          productName: product?.name ?? '',
          brand: product?.brand ?? '',
          sizeLabel: variant?.sizeLabel ?? '',
          // El override de la variante manda sobre el precio del
          // producto: una presentación de 500 ml puede costar más.
          unitPrice: variant?.priceOverride ?? product?.price ?? 0,
          quantity,
        },
      ];
    });

    this.open.set(true);
  }

  /** Cambia la cantidad de una línea. Si llega a 0, la quita. */
  setQuantity(variantId: number, quantity: number): void {
    if (quantity <= 0) {
      this.remove(variantId);
      return;
    }

    this.lines.update((current) =>
      current.map((l) => (l.variantId === variantId ? { ...l, quantity } : l)),
    );
  }

  remove(variantId: number): void {
    this.lines.update((current) => current.filter((l) => l.variantId !== variantId));
  }

  clear(): void {
    this.lines.set([]);
  }

  toggle(): void {
    this.open.update((v) => !v);
  }

  /** Vacía el carrito. Se llama tras confirmar el pedido. */
  markAsPurchased(): void {
    this.lines.set([]);
    this.open.set(false);
  }

  // ------------------------------------------------------------------
  // Pedido
  // ------------------------------------------------------------------

  /**
   * Crea el pedido y devuelve el enlace de pago.
   *
   * El 409 con faltantes de stock se traduce a StockConflictError para que
   * la interfaz ofrezca ajustar cantidades en vez de mostrar un fallo.
   */
  checkout(data: {
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    fulfillment?: 'pickup' | 'envio';
    rfcReceiver?: string | null;
  }): Observable<OrderCheckout> {
    const items: CartItem[] = this.lines().map((l) => ({
      variantId: l.variantId,
      quantity: l.quantity,
    }));

    const request: CreateOrderRequest = {
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      items,
      fulfillment: data.fulfillment ?? 'pickup',
      rfcReceiver: data.rfcReceiver ?? null,
    };

    return this.api.post<OrderCheckout, CreateOrderRequest>('/shop/orders', request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 409) {
          return throwError(() => new StockConflictError(error.error as StockConflict));
        }
        return throwError(() => error);
      }),
    );
  }

  /** Confirma el pago tras volver del checkout de Mercado Pago. */
  confirmPayment(orderId: string, paymentId: string): Observable<Order> {
    return this.api.post<Order, unknown>(`/shop/orders/${orderId}/confirm`, {
      paymentId,
    });
  }
}

/** Error de stock insuficiente al crear el pedido. */
export class StockConflictError extends Error {
  constructor(readonly conflict: StockConflict) {
    super(conflict.message ?? 'Uno de los productos ya no tiene stock suficiente.');
    this.name = 'StockConflictError';
  }

  get shortages() {
    return this.conflict.shortages ?? [];
  }
}