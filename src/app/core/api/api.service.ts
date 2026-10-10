import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Cliente HTTP de la API.
 *
 * Centraliza la URL base y el manejo de errores. Todos los servicios de
 * datos pasan por aquí, de modo que cambiar el host o añadir un
 * interceptor (por ejemplo el JWT de Supabase) se hace en un solo punto.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  /** Raíz de la API, sin barra final. */
  readonly baseUrl = environment.apiBaseUrl;

  get<T>(path: string, params?: Record<string, string | number | boolean>): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, { params });
  }

  post<TResponse, TBody>(path: string, body: TBody): Observable<TResponse> {
    return this.http.post<TResponse>(`${this.baseUrl}${path}`, body);
  }
<<<<<<< HEAD
=======

  patch<TResponse, TBody>(path: string, body: TBody): Observable<TResponse> {
    return this.http.patch<TResponse>(`${this.baseUrl}${path}`, body);
  }

  /**
   * Igual que patch() pero devolviendo el valor de la respuesta.
   *
   * Existe porque patch tipado con un solo argumento genérico no compila
   * cuando el cuerpo es un objeto literal: TypeScript no puede inferir TBody
   * desde un argumento inline. Wrappear el cuerpo con este overload evita
   * tener que anotar el tipo en cada llamada.
   */
  patchWith<TResponse>(path: string, body: unknown): Observable<TResponse> {
    return this.http.patch<TResponse>(`${this.baseUrl}${path}`, body);
  }
>>>>>>> feature/booking
}