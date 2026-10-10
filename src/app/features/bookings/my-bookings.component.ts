import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="py-20 min-h-[70vh]">
      <div class="container-luxury max-w-3xl space-y-8">
        <div class="text-center space-y-3">
          <span class="label-md text-primary">Área de Alumnas</span>
          <h1 class="text-3xl md:text-4xl text-on-surface">Mis Reservas</h1>
          <p class="text-on-surface-variant">
            Consulta el estado de tus citas y certificados.
          </p>
        </div>

        <div class="card-glass p-8 text-center space-y-5">
          <div
            class="w-16 h-16 rounded-full bg-surface-container-highest text-primary
                   flex items-center justify-center mx-auto"
          >
            <span class="material-symbols-outlined text-3xl">lock</span>
          </div>
          <h2 class="text-2xl text-on-surface">Inicia sesión para ver tus reservas</h2>
          <p class="text-on-surface-variant max-w-md mx-auto">
            Necesitas una cuenta para consultar tu historial de citas, comprobantes y
            certificados de los cursos.
          </p>
          <div class="flex flex-wrap justify-center gap-4 pt-2">
            <a routerLink="/login" class="btn-primary">
              <span class="material-symbols-outlined text-xl">login</span>
              Iniciar Sesión
            </a>
            <a routerLink="/registro" class="btn-ghost">Crear Cuenta</a>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class MyBookingsComponent {}
