import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="py-24 min-h-[70vh] flex items-center">
      <div class="container-luxury">
        <div class="max-w-md mx-auto">
          <div class="text-center space-y-3 mb-8">
            <span class="label-md text-primary">Área de Alumnas</span>
            <h1 class="text-3xl text-on-surface">Inicia Sesión</h1>
            <p class="text-sm text-on-surface-variant">
              Accede para consultar tus reservas y certificados.
            </p>
          </div>

          <div class="card-glass p-8 space-y-5">
            <form class="space-y-5" (submit)="onSubmit($event)">
              <div class="space-y-2">
                <label for="email" class="label-sm text-outline">Correo electrónico</label>
                <input
                  id="email"
                  type="email"
                  autocomplete="email"
                  class="input-dark"
                  placeholder="tu@correo.com"
                  [value]="email()"
                  (input)="email.set($any($event.target).value)"
                />
              </div>

              <div class="space-y-2">
                <label for="password" class="label-sm text-outline">Contraseña</label>
                <input
                  id="password"
                  type="password"
                  autocomplete="current-password"
                  class="input-dark"
                  placeholder="••••••••"
                  [value]="password()"
                  (input)="password.set($any($event.target).value)"
                />
              </div>

              @if (error()) {
                <p class="text-sm text-error flex items-center gap-2">
                  <span class="material-symbols-outlined text-base">error</span>
                  {{ error() }}
                </p>
              }

              <button type="submit" class="btn-primary w-full" [disabled]="submitting()">
                @if (submitting()) {
                  Verificando…
                } @else {
                  Entrar
                }
              </button>
            </form>

            <p class="text-sm text-on-surface-variant text-center pt-2">
              ¿Aún no tienes cuenta?
              <a routerLink="/registro" class="text-primary hover:underline">Regístrate</a>
            </p>
          </div>

          <!-- Aviso: la autenticación real se conecta en la feature/auth -->
          <p
            class="mt-6 p-4 rounded-xl bg-surface-container text-xs text-on-surface-variant
                   flex items-start gap-2.5"
          >
            <span class="material-symbols-outlined text-primary text-base mt-0.5">info</span>
            Autenticación pendiente de conectar con Supabase Auth en la rama
            <code class="text-primary">feature/auth</code>.
          </p>
        </div>
      </div>
    </section>
  `,
})
export class LoginComponent {
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly error = signal('');
  protected readonly submitting = signal(false);

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.error.set('');

    if (!this.email().includes('@')) {
      this.error.set('Introduce un correo válido.');
      return;
    }
    if (this.password().length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    this.submitting.set(true);
    // Placeholder: Supabase Auth entra en feature/auth.
    setTimeout(() => {
      this.submitting.set(false);
      this.error.set('Autenticación aún no habilitada en el prototipo.');
    }, 600);
  }
}