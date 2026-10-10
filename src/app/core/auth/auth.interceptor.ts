import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

/**
 * Adjunta el token de Supabase a las llamadas a la API.
 *
 * Sin esto, el backend rechaza los endpoints de admin con 401 aunque la
 * sesión esté iniciada: no hay forma de que el backend sepa quién es el
 * usuario si el cliente no lo dice.
 *
 * El token se pide en cada llamada y se resuelve de forma asíncrona con
 * switchMap. Se hace así a propósito: cachearlo en memoria funciona hasta
 * que Supabase refresca el token, y entonces la API empieza a devolver 401
 * sin motivo aparente.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  // El login y el registro llaman a Supabase directamente, no a nuestra API.
  // Adjuntarles el token sería inútil.
  const isApiCall = req.url.includes('/api/');

  if (!isApiCall) return next(req);

  return from(auth.getAccessToken()).pipe(
    switchMap((token) => {
      if (!token) return next(req);

      return next(
        req.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
        }),
      );
    }),
  );
};