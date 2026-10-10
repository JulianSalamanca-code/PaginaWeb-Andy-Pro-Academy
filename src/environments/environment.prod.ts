export const environment = {
  production: true,

  /**
   * En producción la URL de la API no se compila: la resuelve el host al
   * arrancar. Se deja vacío a propósito para no publicar un localhost.
   */
  apiBaseUrl: '/api',

  supabase: {
    url: '',
    anonKey: '',
  },
} as const;