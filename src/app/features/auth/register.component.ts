import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
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
            <form class="space-y-5" (ngSubmit)="submit()">
              <div class="space-y-2">
                <label for="name" class="label-sm text-outline">Nombre completo</label>
                <input
                  id="name"
                  type="text"
                  autocomplete="name"
                  class="input-dark"
                  placeholder="Tu nombre"
                  name="name"
                  [(ngModel)]="name"
                  [disabled]="submitting()"
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
                  name="email"
                  [(ngModel)]="email"
                  [disabled]="submitting()"
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
                  name="phone"
                  [(ngModel)]="phone"
                  [disabled]="submitting()"
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
                  name="password"
                  [(ngModel)]="password"
                  [disabled]="submitting()"
                />
              </div>

              @if (error()) {
                <p class="text-sm text-error flex items-start gap-2">
                  <span class="material-symbols-outlined text-base mt-0.5">error</span>
                  <span>{{ error() }}</span>
                </p>
              }

              <button
                type="submit"
                class="btn-primary w-full"
                [disabled]="submitting() || !auth.isConfigured()"
                [class.opacity-50]="!auth.isConfigured()"
              >
                {{ submitting() ? 'Creando cuenta…' : 'Crear Cuenta' }}
              </button>
            </form>

            <p class="text-sm text-on-surface-variant text-center pt-2">
              ¿Ya tienes cuenta?
              <a routerLink="/login" class="text-primary hover:underline">Inicia sesión</a>
            </p>
          </div>

          <p
            class="mt-6 p-4 rounded-xl bg-surface-container text-xs text-on-surface-variant
                   flex items-start gap-2.5"
          >
            <span class="material-symbols-outlined text-primary text-base mt-0.5">privacy_tip</span>
            Tu cuenta sirve para consultar reservas y certificados. Puedes reservar sin
            crearla: la cuenta solo es para llevar tu historial.
          </p>
        </div>
      </div>
    </section>
  `,
})
export class RegisterComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected name = '';
  protected email = '';
  protected phone = '';
  protected password = '';

  protected readonly submitting = signal(false);
  protected readonly error = signal('');

  protected async submit(): Promise<void> {
    this.error.set('');

    if (this.name.trim().length < 3) {
      this.error.set('Escribe tu nombre completo.');
      return;
    }
    if (!this.email.includes('@')) {
      this.error.set('Escribe un correo válido.');
      return;
    }
    if (this.password.length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    this.submitting.set(true);

    const error = await this.auth.signUp(this.name, this.email, this.phone, this.password);
    this.submitting.set(false);

    if (error) {
      this.error.set(error);
      return;
    }

    await this.router.navigateByUrl('/');
  }
}