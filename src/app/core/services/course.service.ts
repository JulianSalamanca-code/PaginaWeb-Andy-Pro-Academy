import { Injectable, inject } from '@angular/core';
import { Observable, of, catchError, map } from 'rxjs';
import { ApiService } from '../api/api.service';
import type {
  Course,
  CourseSummary,
  Faq,
  HomeData,
  Product,
  Review,
  ServiceWithAddOns,
  Specialist,
} from './catalog.types';

// Se reexportan para que los componentes importen de un lugar estable. El
// archivo generado schema.d.ts se sobrescribe en cada regeneración del
// contrato, así que no conviene importarlo directamente desde ahí.
export type {
  AddOn,
  Course,
  CourseSummary,
  Faq,
  HomeData,
  Product,
  ProductVariant,
  Review,
  Service,
  ServiceSummary,
  ServiceWithAddOns,
  Specialist,
} from './catalog.types';

/**
 * Catálogo del estudio.
 *
 * Los tipos vienen del documento OpenAPI de la API en C#, generados con
 * openapi-typescript. Cambiar un DTO en el backend actualiza el contrato
 * aquí, no al revés.
 *
 * Cuando la API no responde se devuelve el catálogo embebido de
 * EMBEDDED_COURSES. Es lo que permite que el build con prerender funcione
 * sin la base de datos levantada: si no, la compilación fallaría al pedir
 * los slugs y no se podría ni generar el sitio estático. También cubre el
 * arranque en frío y el caso en que el plan gratuito de Supabase pausa el
 * proyecto a los 7 días sin actividad.
 */
@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly api = inject(ApiService);

  // ------------------------------------------------------------------
  // Cursos
  // ------------------------------------------------------------------

  getCourses(): Observable<Course[]> {
    return this.api.get<Course[]>('/catalog/courses').pipe(catchError(() => of(EMBEDDED_COURSES)));
  }

  getFeaturedCourses(limit = 3): Observable<CourseSummary[]> {
    return this.api.get<HomeData>('/catalog/home').pipe(
      map((data) => data.featuredCourses?.slice(0, limit) ?? []),
      catchError(() => of(EMBEDDED_COURSES.slice(0, limit))),
    );
  }

  getCourseBySlug(slug: string): Observable<Course | null> {
    return this.api.get<Course>(`/catalog/courses/${slug}`).pipe(
      catchError(() => of(EMBEDDED_COURSES.find((c) => c.slug === slug) ?? null)),
    );
  }

  // ------------------------------------------------------------------
  // Servicios
  // ------------------------------------------------------------------

  getServices(): Observable<ServiceWithAddOns[]> {
    return this.api.get<ServiceWithAddOns[]>('/catalog/services');
  }

  getServiceBySlug(slug: string): Observable<ServiceWithAddOns> {
    return this.api.get<ServiceWithAddOns>(`/catalog/services/${slug}`);
  }

  getSpecialists(): Observable<Specialist[]> {
    return this.api.get<Specialist[]>('/catalog/specialists');
  }

  // ------------------------------------------------------------------
  // Tienda
  // ------------------------------------------------------------------

  getProducts(category?: string): Observable<Product[]> {
    return this.api.get<Product[]>('/catalog/products', category ? { category } : undefined);
  }

  // ------------------------------------------------------------------
  // Contenido
  // ------------------------------------------------------------------

  getReviews(limit = 6): Observable<Review[]> {
    return this.api.get<Review[]>('/catalog/reviews', { limit });
  }

  getFaqs(): Observable<Faq[]> {
    return this.api.get<Faq[]>('/catalog/faqs');
  }
}

/**
 * Catálogo de respaldo.
 *
 * Refleja el contenido sembrado en la base, para que el sitio siga
 * viéndose completo si la API no está disponible.
 */
const EMBEDDED_COURSES: Course[] = [
  {
    id: 'e1a2b3c4-0001-4000-8000-000000000001',
    slug: 'automaquillaje-vip-pro',
    title: 'Automaquillaje VIP Pro',
    tagline: 'Transformación total de tu rutina de belleza',
    description:
      'Descubre los rasgos únicos de tu rostro y domina una rutina de día fresca y una de noche glamurosa que dure intacta horas.',
    tag: 'Nivel Inicial / Intermedio',
    level: 'Principiantes y Entusiastas',
    durationLabel: '4 horas en 1 sesión intensiva',
    sessionCount: 1,
    price: 2800,
    depositAmount: 840,
    topics: [
      'Visagismo y tipo de óvalo facial',
      'Preparación de piel según tu biotipo dérmico (grasa, seca, mixta o sensible)',
      'Selección exacta del subtono y base de maquillaje',
      'Técnicas de delineado adaptativo para tu tipo de ojo',
      'Diseño y relleno natural de cejas',
      'Transición de maquillaje de día a look nocturno con destellos',
    ],
    includes: [
      'Dossier impreso con guía de brochas y lista de marcas recomendadas',
      'Uso de todo el arsenal de maquillaje del estudio durante la clase',
      'Depuración personalizada de tu cosmetiquera',
      'Diploma de participación avalado por Andy Cosmetología',
    ],
    imageUrl: null,
  },
  {
    id: 'e1a2b3c4-0002-4000-8000-000000000002',
    slug: 'piel-blindada-novias',
    title: 'Perfeccionamiento: Piel Blindada & Novias',
    tagline: 'La técnica estrella más cotizada en Puebla',
    description:
      'Aprende a crear pieles de efecto aerógrafo, 100% impermeables al agua, lágrimas y clima húmedo.',
    tag: 'Especialización Profesional',
    level: 'Maquillistas en activo y cosmetólogas',
    durationLabel: '6 horas de inmersión práctica',
    sessionCount: 1,
    price: 3600,
    depositAmount: 1080,
    topics: [
      'Química cosmética: incompatibilidades entre primers y bases de silicona/agua',
      'Técnica secreta de emulsión y fijación hermética sin efecto acartonado',
      'Visagismo HD y corrección de hiperpigmentación severa',
      'Pestañas personalizadas capa por capa efecto visón 3D',
      'Técnicas de labios con relieve degradado a prueba de transferencias',
      'Estrategias de pricing y contratos de servicio para bodas',
    ],
    includes: [
      'Modelo real para práctica supervisada en cabina',
      'Guía paso a paso de productos y diluyentes exactos',
      'Plantilla de contrato legal para servicios de novias',
      'Diploma con valor curricular de Especialista en Piel Blindada',
    ],
    imageUrl: null,
  },
  {
    id: 'e1a2b3c4-0003-4000-8000-000000000003',
    slug: 'manicura-rusa-soft-gel',
    title: 'Manicura Rusa Estética & Soft Gel Avanzado',
    tagline: 'El estándar europeo de máxima pulcritud',
    description:
      'Manejo quirúrgico del torno para una cutícula impecable y nivelación con Rubber Base y Soft Gel.',
    tag: 'Estructura & Anatomía',
    level: 'Manicuristas y principiantes dedicadas',
    durationLabel: '8 horas (divididas en 2 sesiones)',
    sessionCount: 2,
    price: 3900,
    depositAmount: 1170,
    topics: [
      'Anatomía del aparato ungueal y prevención de onicólisis',
      'Clasificación y uso seguro de fresas diamantadas y de carburo',
      'Técnica rusa combinada (tijera y fresa llama)',
      'Nivelación del ápice para corregir uñas convexas o cóncavas',
      'Esmaltado profundo bajo bolsillo de cutícula para semanas de crecimiento limpio',
      'Fotografía de portafolio editorial con luz anular y macro',
    ],
    includes: [
      'Kit teórico de bioseguridad y esterilización de instrumental',
      'Práctica en modelo bajo supervisión directa de Andy',
      'Acceso a marcas de geles profesionales europeas',
      'Certificación oficial en Manicura Rusa Estética',
    ],
    imageUrl: null,
  },
];