import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Modos de render por ruta.
 *
 * Prerender: el HTML se genera en tiempo de compilación, así que el sitio se
 * publica como archivos estáticos y los buscadores indexan contenido real sin
 * ejecutar JavaScript. Todas las páginas públicas sirven el mismo catálogo.
 *
 * Client: la ruta se renderiza en el navegador. El asistente de reserva
 * necesita el estado del formulario y no aporta nada al SEO.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'servicios', renderMode: RenderMode.Prerender },
  { path: 'cursos', renderMode: RenderMode.Prerender },
  { path: 'tienda', renderMode: RenderMode.Prerender },

  { path: 'reservar', renderMode: RenderMode.Client },
  { path: 'mis-reservas', renderMode: RenderMode.Client },
  { path: 'login', renderMode: RenderMode.Client },
  { path: 'registro', renderMode: RenderMode.Client },
  { path: 'admin', renderMode: RenderMode.Client },

  { path: '**', renderMode: RenderMode.Client },
];
