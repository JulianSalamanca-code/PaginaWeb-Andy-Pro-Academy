import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="py-24 min-h-[70vh] flex items-center">
      <div class="container-luxury">
        <div class="max-w-md mx-auto">
          <div class="text-center space-y-3 mb-8">
            <span class="label-md text-primary">Área de Alumnas</span>
            <h1 class="text-3xl text-on-surface">Crea tu Cuenta</h1>
            <p class="text-sm text-on-surface-variant">
              Registra tus datos para reservar más rápido en el futuro.
            </p>
          </div>

          <div class="card-glass p-8 space-y-5">
            <form class="space-y-5" (submit)="onSubmit($event)">
              <div class="space-y-2">
                <label for="name" class="label-sm text-outline">Nombre completo</label>
                <input
                  id="name"
                  type="text"
                  autocomplete="name"
                  class="input-dark"
                  placeholder="Tu nombre"
                  [value]="name()"
                  (input)="name.set($any($event.target).value)"
                />
              </div>

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
                <label for="phone" class="label-sm text-outline">WhatsApp</label>
                <input
                  id="phone"
                  type="tel"
                  autocomplete="tel"
                  class="input-dark"
                  placeholder="+52 222 000 0000"
                  [value]="phone()"
                  (input)="phone.set($any($event.target).value)"
                />
              </div>

              <div class="space-y-2">
                <label for="password" class="label-sm text-outline">Contraseña</label>
                <input
                  id="password"
                  type="password"
                  autocomplete="new-password"
                  class="input-dark"
                  placeholder="Mínimo 6 caracteres"
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
                  Creando cuenta…
                } @else {
                  Crear Cuenta
                }
              </button>
            </form>

            <p class="text-sm text-on-surface-variant text-center pt-2">
              ¿Ya tienes cuenta?
              <a routerLink="/login" class="text-primary hover:underline">Inicia sesión</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class RegisterComponent {
  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly phone = signal('');
  protected readonly password = signal('');
  protected readonly error = signal('');
  protected readonly submitting = signal(false);

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.error.set('');

    if (this.name().trim().length < 3) {
      this.error.set('Escribe tu nombre completo.');
      return;
    }
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
      this.error.set('Registro aún no habilitado en el prototipo.');
    }, 600);
  }
}