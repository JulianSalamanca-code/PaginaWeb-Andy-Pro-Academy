import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeroSectionComponent } from './components/hero-section.component';

interface CoursePreview {
  id: string;
  title: string;
  tag: string;
  duration: string;
  price: number;
  level: string;
  description: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, HeroSectionComponent],
  template: `
    <app-hero-section />

    <!-- Cursos destacados -->
    <section class="py-20 bg-surface-container-lowest/80 relative">
      <div class="container-luxury space-y-12">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-surface-variant">
          <div>
            <span class="label-md text-primary">Capacitación Exclusiva</span>
            <h2 class="text-3xl md:text-4xl text-on-surface mt-2">Academia &amp; Cursos</h2>
          </div>
          <p class="text-[0.9375rem] text-on-surface-variant max-w-md">
            Sesiones privadas 1 a 1 con Andy. Domina desde visagismo anatómico hasta diseño
            ruso de uñas, con insumos de cabina y diploma de certificación.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          @for (course of courses; track course.id) {
            <article
              class="card-glass card-glass-hover overflow-hidden flex flex-col
                     shadow-lg group"
            >
              <!-- Marcador superior en lugar de foto -->
              <div
                class="relative aspect-[4/3] bg-gradient-to-br from-surface-container
                       via-surface-low to-surface-lowest flex items-center justify-center"
              >
                <span
                  class="material-symbols-outlined text-6xl text-primary/30"
                  aria-hidden="true"
                >
                  school
                </span>
                <span
                  class="absolute top-4 right-4 px-3 py-1 rounded-full
                         bg-surface/80 backdrop-blur-md text-primary label-sm"
                >
                  {{ course.tag }}
                </span>
              </div>

              <div class="p-6 flex flex-col flex-1 space-y-4">
                <div class="space-y-2">
                  <h3 class="text-xl text-on-surface group-hover:text-primary transition-colors">
                    {{ course.title }}
                  </h3>
                  <p class="text-sm text-on-surface-variant leading-relaxed">
                    {{ course.description }}
                  </p>
                </div>

                <dl class="flex items-center gap-4 text-xs text-outline">
                  <div class="flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm">schedule</span>
                    <span>{{ course.duration }}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm">signal_cellular_alt</span>
                    <span>{{ course.level }}</span>
                  </div>
                </dl>

                <div
                  class="pt-4 border-t border-surface-variant
                         flex items-center justify-between mt-auto"
                >
                  <div>
                    <span class="label-sm text-outline block">Inversión</span>
                    <span class="text-xl text-primary">{{ formatPrice(course.price) }}</span>
                  </div>
                  <a
                    routerLink="/reservar"
                    [queryParams]="{ curso: course.id }"
                    class="px-5 py-2.5 rounded-full bg-surface-container-high
                           hover:bg-primary hover:text-on-primary
                           label-sm transition-all"
                  >
                    Reservar
                  </a>
                </div>
              </div>
            </article>
          }
        </div>

        <div class="flex justify-center pt-4">
          <a routerLink="/cursos" class="btn-ghost">
            Ver Todos los Cursos
            <span class="material-symbols-outlined text-base">arrow_forward</span>
          </a>
        </div>
      </div>
    </section>

    <!-- Franja de Testimonios -->
    <section class="py-20">
      <div class="container-luxury space-y-12">
        <div class="text-center max-w-2xl mx-auto space-y-3">
          <span class="label-md text-primary">Experiencias Reales</span>
          <h2 class="text-3xl md:text-4xl text-on-surface">
            La Confianza de Nuestras Clientas VIP
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          @for (review of reviews; track review.author) {
            <figure class="p-8 rounded-3xl bg-surface-container space-y-6 flex flex-col shadow-lg">
              <div class="space-y-4">
                <div class="flex items-center gap-1 text-primary" aria-label="5 estrellas">
                  @for (star of stars; track star) {
                    <span class="material-symbols-outlined text-base">star</span>
                  }
                </div>
                <blockquote class="text-[0.9375rem] text-on-surface leading-relaxed italic">
                  "{{ review.text }}"
                </blockquote>
              </div>
              <figcaption
                class="flex items-center gap-3 pt-4 border-t border-surface-variant"
              >
                <div
                  class="w-11 h-11 rounded-full bg-secondary-container flex items-center
                         justify-center font-semibold text-primary"
                >
                  {{ review.initials }}
                </div>
                <div>
                  <p class="text-[0.8125rem] font-semibold text-on-surface">{{ review.author }}</p>
                  <p class="label-sm text-outline">{{ review.role }}</p>
                </div>
              </figcaption>
            </figure>
          }
        </div>
      </div>
    </section>

    <!-- Llamada final -->
    <section class="py-20 bg-gradient-to-r from-surface-container to-surface-container-high relative overflow-hidden">
      <div class="bokeh-glow -right-20 top-0 w-96 h-96 bg-primary/10"></div>
      <div class="container-luxury relative text-center space-y-6">
        <span class="label-md text-primary">Agenda Exclusiva</span>
        <h2 class="text-3xl md:text-4xl text-on-surface max-w-2xl mx-auto">
          Empieza hoy tu carrera en belleza
        </h2>
        <p class="text-on-surface-variant max-w-xl mx-auto">
          Cupos limitados por día para asegurar atención ininterrumpida. Reagenda flexible
          hasta 24 horas previas.
        </p>
        <div class="flex flex-wrap justify-center gap-4 pt-2">
          <a routerLink="/reservar" class="btn-primary">
            <span class="material-symbols-outlined text-xl">calendar_today</span>
            Agendar Cita
          </a>
          <a routerLink="/tienda" class="btn-ghost">
            <span class="material-symbols-outlined text-xl">shopping_bag</span>
            Ver Tienda
          </a>
        </div>
      </div>
    </section>
  `,
})
export class HomeComponent {
  protected readonly stars = [1, 2, 3, 4, 5];

  // Contenido migrado de studioData.ts (COURSE_MODULES).
  protected readonly courses: CoursePreview[] = [
    {
      id: 'course-automaquillaje',
      title: 'Automaquillaje VIP Pro',
      tag: 'Nivel Inicial',
      duration: '4 horas',
      price: 2800,
      level: 'Principiantes',
      description:
        'Descubre los rasgos únicos de tu rostro y domina una rutina de día fresca y una de noche glamurosa que dure intactas horas.',
    },
    {
      id: 'course-piel-blindada',
      title: 'Piel Blindada & Novias',
      tag: 'Profesional',
      duration: '6 horas',
      price: 3600,
      level: 'En activo',
      description:
        'La técnica estrella más cotizada en Puebla. Crea pieles de efecto aerógrafo, 100% impermeables al agua, lágrimas y clima húmedo.',
    },
    {
      id: 'course-manicura-rusa',
      title: 'Manicura Rusa & Soft Gel',
      tag: 'Avanzado',
      duration: '8 horas',
      price: 3900,
      level: 'Dedicadas',
      description:
        'El estándar europeo de máxima pulcritud. Manejo quirúrgico del torno y nivelación con Rubber Base y Soft Gel.',
    },
  ];

  // Contenido migrado de studioData.ts (REVIEWS_DATA).
  protected readonly reviews = [
    {
      author: 'Valeria R.',
      role: 'Novia VIP',
      initials: 'VR',
      text: 'Mi maquillaje de boda duró intacto desde las 11:00 AM hasta las 4:00 AM del día siguiente. Lloré en la misa, bailé toda la noche y la piel se veía tersa, luminosa y sin brillo graso.',
    },
    {
      author: 'Camila Morales',
      role: 'Maquillista Profesional',
      initials: 'CM',
      text: 'Tomé el curso 1 a 1 de perfeccionamiento en piel blindada. Andy te comparte todos sus secretos sin reservas: productos exactos, ángulos de brocha y mezclas. Ya aumenté los precios de mis servicios.',
    },
    {
      author: 'Sofía Salgado',
      role: 'Clienta Frecuente',
      initials: 'SS',
      text: 'La manicura rusa con Andy es una adicción. La precisión de la cutícula es quirúrgica y mis uñas en Soft Gel resisten 4 semanas intactas. La privacidad y la paz del estudio no tienen comparación.',
    },
  ];

  protected formatPrice(value: number): string {
    return `$${value.toLocaleString('es-MX')} MXN`;
  }
}