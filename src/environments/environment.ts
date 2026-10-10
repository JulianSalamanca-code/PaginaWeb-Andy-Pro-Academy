/**
 * Configuración por entorno.
 *
 * `production: false` es el valor por defecto de Angular; no se cambia a
 * mano, se genera con `ng generate environments`.
 */
export const environment = {
  production: false,

  /** Raíz de la API en C#. En desarrollo local corre en el mismo equipo. */
  apiBaseUrl: 'http://localhost:5080/api',

  /**
   * Supabase, solo la URL y la anon key: son públicas por diseño.
   * La contraseña de la base y el JWT secret viven únicamente en el
   * backend, nunca aquí.
   */
  supabase: {
    url: '',
    anonKey: '',
  },
} as const;