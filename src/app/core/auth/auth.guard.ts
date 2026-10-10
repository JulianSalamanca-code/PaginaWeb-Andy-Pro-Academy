import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Exige una sesión iniciada.
 *
 * Espera a que la sesión se restaure antes de decidir: si el guard
 * consulta isAuthenticated antes de que termine la restauración, al
 * recargar la página el usuario es expulsado al login aunque tenga
 * sesión activa.
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isConfigured() && auth.loading()) {
    await waitForSession(auth);
  }

  if (auth.isAuthenticated()) return true;

  // Se guarda la URL de destino para volver después de iniciar sesión.
  return router.createUrlTree(['/login'], {
    queryParams: { redirect: state.url },
  });
};

/**
 * Exige rol de administrador.
 *
 * El rol se consulta a la API, no al JWT: Supabase pone en el token el rol
 * de Postgres (authenticated, anon), que no dice nada sobre si la persona
 * es la dueña del estudio.
 */
export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isConfigured() && auth.loading()) {
    await waitForSession(auth);
  }

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { redirect: '/admin' },
    });
  }

  const role = await auth.getProfileRole();

  // 403 desde aquí significa que la sesión es válida pero no es admin. La
  // URL de la API lo dice; el guard solo traduce eso a una redirección.
  return role === 'admin' ? true : router.createUrlTree(['/']);
};

/**
 * Espera a que AuthService termine de restaurar la sesión.
 *
 * Se resuelve leyendo el signal en un intervalo corto en vez de un
 * setTimeout fijo: así no hay espera adicional cuando la sesión se
 * restaura rápido, y sigue funcionando si tarda varios segundos.
 */
function waitForSession(auth: AuthService): Promise<void> {
  return new Promise((resolve) => {
    if (!auth.loading()) {
      resolve();
      return;
    }

    const interval = setInterval(() => {
      if (!auth.loading()) {
        clearInterval(interval);
        resolve();
      }
    }, 50);
  });
}