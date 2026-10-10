import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
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
            <form class="space-y-5" (ngSubmit)="submit()">
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
                <label for="password" class="label-sm text-outline">Contraseña</label>
                <input
                  id="password"
                  type="password"
                  autocomplete="current-password"
                  class="input-dark"
                  placeholder="••••••••"
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
                {{ submitting() ? 'Verificando…' : 'Entrar' }}
              </button>
            </form>

            <p class="text-sm text-on-surface-variant text-center pt-2">
              ¿Aún no tienes cuenta?
              <a routerLink="/registro" class="text-primary hover:underline">Regístrate</a>
            </p>
          </div>

          @if (!auth.isConfigured()) {
            <p
              class="mt-6 p-4 rounded-xl bg-surface-container text-xs text-on-surface-variant
                     flex items-start gap-2.5"
            >
              <span class="material-symbols-outlined text-primary text-base mt-0.5">info</span>
              Supabase no está configurado. Añade la URL y la anon key en
              <code class="text-primary">src/environments/environment.ts</code> para activar el
              inicio de sesión.
            </p>
          }
        </div>
      </div>
    </section>
  `,
})
export class LoginComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected email = '';
  protected password = '';

  protected readonly submitting = signal(false);
  protected readonly error = signal('');

  protected async submit(): Promise<void> {
    this.error.set('');

    if (!this.email.includes('@')) {
      this.error.set('Escribe un correo válido.');
      return;
    }
    if (this.password.length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    this.submitting.set(true);

    const error = await this.auth.signIn(this.email, this.password);
    this.submitting.set(false);

    if (error) {
      this.error.set(error);
      return;
    }

    // Vuelve a la página que intentaba abrir, o al inicio.
    const redirect = this.route.snapshot.queryParamMap.get('redirect');
    await this.router.navigateByUrl(redirect || '/');
  }
}