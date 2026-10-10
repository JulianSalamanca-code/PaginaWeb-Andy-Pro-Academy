import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface ServiceItem {
  id: number;
  name: string;
  tag: string;
  price: number;
  duration: string;
  description: string;
  badge: string;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="py-20">
      <div class="container-luxury space-y-16">
        <div class="text-center max-w-2xl mx-auto space-y-3">
          <span class="label-md text-primary">Técnicas de Autor</span>
          <h1 class="text-3xl md:text-4xl text-on-surface">
            Catálogo de Alta Cosmética &amp; Estilismo
          </h1>
          <p class="text-[0.9375rem] text-on-surface-variant">
            Resultados hiperdefinidos con formulaciones de grado dermatológico y
            aparatología de vanguardia.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          @for (service of services; track service.id) {
            <article
              class="card-glass card-glass-hover overflow-hidden shadow-lg
                     flex flex-col group"
            >
              <div
                class="relative aspect-[4/3] bg-gradient-to-br from-surface-container
                       via-surface-low to-surface-lowest flex items-center justify-center"
              >
                <span class="material-symbols-outlined text-6xl text-primary/30" aria-hidden="true">
                  {{ service.badgeIcon }}
                </span>
                <span
                  class="absolute top-4 right-4 px-3 py-1 rounded-full bg-surface/80
                         backdrop-blur-md text-primary label-sm"
                >
                  {{ service.badge }}
                </span>
              </div>

              <div class="p-6 flex flex-col flex-1 justify-between gap-4">
                <div class="space-y-3">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="text-xl text-on-surface group-hover:text-primary transition-colors">
                      {{ service.name }}
                    </h2>
                    <span
                      class="px-2.5 py-0.5 rounded-full bg-surface-container-highest
                             text-on-surface-variant label-sm"
                    >
                      {{ service.tag }}
                    </span>
                  </div>
                  <p class="text-sm text-on-surface-variant leading-relaxed">
                    {{ service.description }}
                  </p>
                </div>

                <div
                  class="pt-4 border-t border-surface-variant
                         flex items-center justify-between"
                >
                  <div>
                    <span class="label-sm text-outline block">Inversión</span>
                    <span class="text-xl text-primary">{{ formatPrice(service.price) }}</span>
                    <span class="flex items-center gap-1 label-sm text-outline mt-1">
                      <span class="material-symbols-outlined text-sm">schedule</span>
                      {{ service.duration }}
                    </span>
                  </div>
                  <a
                    routerLink="/reservar"
                    [queryParams]="{ servicio: service.id }"
                    class="px-5 py-2.5 rounded-full bg-surface-container-high
                           hover:bg-primary hover:text-on-primary label-sm transition-all"
                  >
                    Reservar
                  </a>
                </div>
              </div>
            </article>
          }
        </div>
      </div>
    </section>
  `,
})
export class ServicesComponent {
  // Contenido migrado de studioData.ts (STUDIO_SERVICES).
  protected readonly services: (ServiceItem & { badgeIcon: string })[] = [
    {
      id: 1,
      name: 'Maquillaje Profesional',
      tag: 'Social & Novias',
      price: 1850,
      duration: '90 min',
      badge: 'Piel Blindada',
      badgeIcon: 'face',
      description:
        'Técnica de piel blindada a prueba de agua y lágrimas, visagismo, pestañas 3D de visón personalizadas y ampolleta flash tensora. Ideal para bodas, XV años y galas.',
    },
    {
      id: 2,
      name: 'Peinado de Gala & Novias',
      tag: 'Estilismo',
      price: 1200,
      duration: '60 min',
      badge: 'Fijación Flexible',
      badgeIcon: 'auto_awesome',
      description:
        'Ondas al agua estilo Hollywood, recogidos estructurados y peinados bohemios con protección térmica y sellado de brilho duradero sin rigidez.',
    },
    {
      id: 3,
      name: 'Nail Arts & Estructuras',
      tag: 'Manicura',
      price: 850,
      duration: '75 min',
      badge: 'Manicura Rusa',
      badgeIcon: 'back_hand',
      description:
        'Manicura rusa estética con torno, diseño artístico a mano alzada, esmaltado semipermanente de larga duración, Soft Gel o acrílico fino con cristales Swarovski.',
    },
    {
      id: 4,
      name: 'Extensiones de Cabello Premium',
      tag: '100% Humano',
      price: 3500,
      duration: '120 min',
      badge: 'Punto Invisible',
      badgeIcon: 'content_cut',
      description:
        'Aplicación profesional de cabello 100% virgen con técnica invisible (nanoring, microrings o punto invisible). Cero tracción, máxima ligereza y adaptación tonal.',
    },
    {
      id: 5,
      name: 'Cursos Personalizados 1 a 1',
      tag: 'Certificación',
      price: 2800,
      duration: '180 min',
      badge: 'Academia VIP',
      badgeIcon: 'school',
      description:
        'Masterclasses individuales de Automaquillaje, Perfeccionamiento de Técnicas para profesionales y Formación en Nail Art. Incluye manual teórico y diploma oficial.',
    },
  ];

  protected formatPrice(value: number): string {
    return `$${value.toLocaleString('es-MX')} MXN`;
  }
}