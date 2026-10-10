import { Injectable, computed, inject, signal } from '@angular/core';
import { createClient, type SupabaseClient, type Session, type User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * Estado de la sesión de Supabase Auth.
 *
 * El token vive en un signal, no en el servicio de Supabase, porque los
 * componentes y el interceptor necesitan leerlo de forma reactiva.
 *
 * La sesión se persiste en localStorage: Supabase la restaura al recargar
 * y el signal se actualiza solo con onAuthStateChange, así que no hay que
 * leerla a mano al arrancar.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly client: SupabaseClient | null;

  private readonly _session = signal<Session | null>(null);
  private readonly _loading = signal(true);

  readonly session = this._session.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly isAuthenticated = computed(() => this._session() !== null);

  readonly user = computed<User | null>(() => this._session()?.user ?? null);

  readonly userId = computed<string | null>(() => this._session()?.user?.id ?? null);

  readonly email = computed<string | null>(() => this._session()?.user?.email ?? null);

  /**
   * true si el proyecto tiene URL y anon key configuradas.
   *
   * Sin esto el login se muestra pero no funciona, y es mejor decirlo en
   * la interfaz que dejar un formulario que falla al enviarse.
   */
  readonly isConfigured = computed(
    () => !!environment.supabase?.url && !!environment.supabase?.anonKey,
  );

  constructor() {
    const url = environment.supabase?.url;
    const anonKey = environment.supabase?.anonKey;

    if (!url || !anonKey) {
      // El prototipo sigue funcionando sin login: el catálogo y la reserva
      // son públicos.
      this.client = null;
      this._loading.set(false);
      return;
    }

    this.client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

    // Restaura la sesión guardada al cargar la aplicación.
    void this.restoreSession();
  }

  private async restoreSession(): Promise<void> {
    if (!this.client) return;

    try {
      const { data } = await this.client.auth.getSession();
      this._session.set(data.session);
    } finally {
      // El loading termina pase lo que pase: si la sesión no se restaura,
      // la interfaz no debe quedar cargando para siempre.
      this._loading.set(false);
    }

    this.client.auth.onAuthStateChange((_event, session) => {
      this._session.set(session);
      this._loading.set(false);
    });
  }

  /**
   * Inicia sesión.
   *
   * Devuelve el mensaje de error en vez de lanzar, para que el componente
   * pueda mostrarlo tal cual. Traducir los errores de Supabase al español
   * aquí evita repetir el mapeo en cada formulario.
   */
  async signIn(email: string, password: string): Promise<string | null> {
    if (!this.client) return 'Supabase no está configurado en este entorno.';

    const { error } = await this.client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    return error ? translateAuthError(error.message) : null;
  }

  /**
   * Registra una cuenta nueva.
   *
   * No pide confirmar el correo a propósito: en la demo, exigir verificación
   * rompe el flujo porque nadie tiene acceso al buzón. En producción hay que
   * activarlo en Supabase → Authentication → Providers → Email.
   */
  async signUp(
    fullName: string,
    email: string,
    phone: string,
    password: string,
  ): Promise<string | null> {
    if (!this.client) return 'Supabase no está configurado en este entorno.';

    const { data, error } = await this.client.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
        },
      },
    });

    if (error) return translateAuthError(error.message);

    // Sin confirmación de correo, signUp no crea sesión automáticamente.
    // Se intenta iniciar sesión para no obligar a la clienta a hacerlo a mano.
    if (!data.session) {
      const signInError = await this.signIn(email, password);
      if (signInError) {
        return 'Cuenta creada. Confirma tu correo e inicia sesión.';
      }
    }

    return null;
  }

  async signOut(): Promise<void> {
    if (!this.client) return;
    await this.client.auth.signOut();
    this._session.set(null);
  }

  /**
   * Token de acceso para las llamadas a la API.
   *
   * Se obtiene de la sesión en cada llamada en vez de cachearlo: Supabase
   * refresca el token automáticamente y un valor cacheado envejece sin que
   * nadie lo note hasta que la API devuelve 401.
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.client) return null;

    try {
      const { data } = await this.client.auth.getSession();
      return data.session?.access_token ?? null;
    } catch {
      return null;
    }
  }

  /** Supabase no expone el rol de la app en el JWT, así que se consulta la API. */
  async getProfileRole(): Promise<'student' | 'admin' | null> {
    if (!this.client) return null;

    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('role')
        .eq('id', this.userId() ?? '')
        .maybeSingle();

      if (error) return null;

      const role = data?.role;
      return role === 'admin' ? 'admin' : 'student';
    } catch {
      return null;
    }
  }
}

/**
 * Traduce los mensajes de Supabase al español.
 *
 * Se comparan por fragmento porque los mensajes vienen en inglés y con
 * variantes entre versiones. Un mapeo por texto exacto se rompe en cuanto
 * Supabase cambia una palabra.
 */
function translateAuthError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos.';
  }
  if (m.includes('email not confirmed')) {
    return 'Confirma tu correo antes de iniciar sesión.';
  }
  if (m.includes('user already registered')) {
    return 'Ya existe una cuenta con ese correo. Inicia sesión.';
  }
  if (m.includes('password should be')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (m.includes('email rate limit') || m.includes('too many')) {
    return 'Demasiados intentos. Espera un momento.';
  }
  if (m.includes('fetch') || m.includes('network')) {
    return 'No se pudo conectar. Revisa tu internet.';
  }
  if (m.includes('not configured')) {
    return 'Supabase no está configurado en este entorno.';
  }

  // Si no se reconoce, se devuelve el original: un mensaje en inglés es
  // mejor que uno vacío.
  return message;
}