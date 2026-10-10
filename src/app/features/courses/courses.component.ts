import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Course, CourseService } from '../../core/services/course.service';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="py-20">
      <div class="container-luxury space-y-16">
        <div class="text-center max-w-2xl mx-auto space-y-3">
          <span class="label-md text-primary">Capacitación Exclusiva</span>
          <h1 class="text-3xl md:text-4xl text-on-surface">Academia &amp; Cursos</h1>
          <p class="text-[0.9375rem] text-on-surface-variant">
            Mentorías inmersivas diseñadas para llevar tus habilidades al estándar
            editorial, ya sea para transformar tu rutina o potenciar tu portafolio.
          </p>
        </div>

        <!-- Valor de los cursos -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (value of values; track value.title) {
            <div class="p-5 rounded-2xl bg-surface-container space-y-2">
              <div
                class="w-9 h-9 rounded-full bg-primary/20 text-primary
                       flex items-center justify-center"
              >
                <span class="material-symbols-outlined text-lg">{{ value.icon }}</span>
              </div>
              <h3 class="text-[0.8125rem] font-semibold text-on-surface">{{ value.title }}</h3>
              <p class="text-sm text-on-surface-variant">{{ value.description }}</p>
            </div>
          }
        </div>

        <!-- Filtros -->
        <div class="flex flex-wrap gap-3">
          @for (filter of filters; track filter) {
            <button
              type="button"
              class="chip"
              [class.chip-active]="activeFilter() === filter"
              (click)="activeFilter.set(filter)"
            >
              {{ filter }}
            </button>
          }
        </div>

        <!-- Listado -->
        <div class="space-y-6">
          @for (course of filteredCourses(); track course.id) {
            <article
              class="card-glass card-glass-hover p-6 md:p-8
                     grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <div class="lg:col-span-7 space-y-4">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="text-2xl text-on-surface">{{ course.title }}</h2>
                  <span class="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary label-sm">
                    {{ course.tag }}
                  </span>
                </div>

                <p class="text-[0.9375rem] text-on-surface-variant leading-relaxed">
                  {{ course.description }}
                </p>

                @if (course.topics?.length) {
                  <div class="space-y-2">
                    <h3 class="label-md text-primary">Temario</h3>
                    <ul class="space-y-1.5">
                      @for (topic of course.topics; track topic) {
                        <li class="flex items-start gap-2.5 text-sm text-on-surface-variant">
                          <span
                            class="material-symbols-outlined text-primary text-base mt-0.5 shrink-0"
                          >
                            check
                          </span>
                          {{ topic }}
                        </li>
                      }
                    </ul>
                  </div>
                }
              </div>

              <aside class="lg:col-span-5 space-y-5">
                <dl class="space-y-3 p-5 rounded-2xl bg-surface-container">
                  <div class="flex items-center justify-between gap-4">
                    <dt class="label-sm text-outline">Duración</dt>
                    <dd class="text-sm text-on-surface text-right">{{ course.durationLabel }}</dd>
                  </div>
                  <div class="flex items-center justify-between gap-4">
                    <dt class="label-sm text-outline">Nivel</dt>
                    <dd class="text-sm text-on-surface text-right">{{ course.level }}</dd>
                  </div>
                  <div class="flex items-center justify-between gap-4">
                    <dt class="label-sm text-outline">Sesiones</dt>
                    <dd class="text-sm text-on-surface text-right">{{ course.sessionCount }}</dd>
                  </div>
                </dl>

                @if (course.includes?.length) {
                  <div class="p-5 rounded-2xl bg-surface-container space-y-2">
                    <h3 class="label-md text-primary">Incluye</h3>
                    <ul class="space-y-1.5">
                      @for (item of course.includes; track item) {
                        <li class="flex items-start gap-2.5 text-sm text-on-surface-variant">
                          <span
                            class="material-symbols-outlined text-primary text-base mt-0.5 shrink-0"
                          >
                            workspace_premium
                          </span>
                          {{ item }}
                        </li>
                      }
                    </ul>
                  </div>
                }

                <div
                  class="pt-5 border-t border-surface-variant
                         flex items-center justify-between gap-4"
                >
                  <div>
                    <span class="label-sm text-outline block">Inversión</span>
                    <span class="text-2xl text-primary">{{ formatPrice(course.price) }}</span>
                    <span class="block label-sm text-outline mt-1">
                      Anticipo {{ formatPrice(course.depositAmount) }}
                    </span>
                  </div>
                  <a
                    routerLink="/reservar"
                    [queryParams]="{ curso: course.slug }"
                    class="btn-primary !py-3 !px-6 !text-[0.6875rem]"
                  >
                    Reservar
                    <span class="material-symbols-outlined text-base">arrow_forward</span>
                  </a>
                </div>
              </aside>
            </article>
          } @empty {
            <p class="text-center text-on-surface-variant py-12">
              No hay cursos publicados en esta categoría.
            </p>
          }
        </div>
      </div>
    </section>
  `,
})
export class CoursesComponent {
  private readonly courseService = inject(CourseService);

  protected readonly filters = ['Todos', 'Inicial', 'Profesional', 'Avanzado'];
  protected readonly activeFilter = signal('Todos');

  protected readonly values = [
    {
      icon: 'psychology',
      title: 'Modalidad 100% 1 a 1',
      description: 'Atención total de la profesora sin grupos distractores ni prisas de tiempo.',
    },
    {
      icon: 'palette',
      title: 'Insumos de Cabina Incluidos',
      description: 'Practica con marcas internacionales de alta gama (Huda, Dior, NARS, OPI).',
    },
    {
      icon: 'menu_book',
      title: 'Manual Teórico & Colorimetría',
      description: 'Guía física y digital con listas de productos recomendados y morfología.',
    },
    {
      icon: 'support_agent',
      title: 'Asesoría Post-Curso',
      description: '30 días de seguimiento directo para resolver dudas en tus creaciones.',
    },
  ];

  /**
   * Datos de la API como signal.
   *
   * toSignal mantiene la plantilla reactiva sin suscribirse a mano en
   * ngOnInit ni worries de desuscribir.
   */
  private readonly courses = toSignal(this.courseService.getCourses(), {
    initialValue: [] as Course[],
  });

  protected filteredCourses(): Course[] {
    const filter = this.activeFilter();
    const courses = this.courses();

    if (filter === 'Todos') return courses;
    return courses.filter((c) => c.tag?.includes(filter));
  }

  protected formatPrice(value: number | undefined): string {
    // openapi-typescript marca cada campo como opcional porque OpenAPI 3.0
    // no distingue "ausente" de "obligatorio". El DTO de C# sí: price y
    // depositAmount nunca llegan null. El 0 es una red de seguridad para
    // que un cambio futuro en el contrato no rompa la vista.
    return `$${(value ?? 0).toLocaleString('es-MX')} MXN`;
  }
}