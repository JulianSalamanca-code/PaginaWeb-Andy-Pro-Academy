import { Injectable } from '@angular/core';
import { Course } from '../models/course.model';

/**
 * Fuente de datos de cursos.
 *
 * En el prototipo sirve el catálogo embebido, migrado de studioData.ts.
 * La feature/catalog lo reemplaza por GET /api/courses sin cambiar los
 * componentes: la firma de los métodos no cambia.
 */
@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly courses: Course[] = [
    {
      id: 'course-automaquillaje',
      slug: 'automaquillaje-vip-pro',
      title: 'Automaquillaje VIP Pro',
      tagline: 'Transformación total de tu rutina de belleza',
      description:
        'Descubre los rasgos únicos de tu rostro y domina una rutina de día fresca y una de noche glamurosa que dure intacta horas.',
      tag: 'Nivel Inicial / Intermedio',
      level: 'Principiantes y Entusiastas',
      duration: '4 horas en 1 sesión intensiva',
      sessions: 1,
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
      coverUrl: null,
      isPublished: true,
    },
    {
      id: 'course-piel-blindada',
      slug: 'piel-blindada-novias',
      title: 'Perfeccionamiento: Piel Blindada & Novias',
      tagline: 'La técnica estrella más cotizada en Puebla',
      description:
        'Aprende a crear pieles de efecto aerógrafo, 100% impermeables al agua, lágrimas y clima húmedo. La técnica más cotizada de Puebla.',
      tag: 'Especialización Profesional',
      level: 'Maquillistas en activo y cosmetólogas',
      duration: '6 horas de inmersión práctica',
      sessions: 1,
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
      coverUrl: null,
      isPublished: true,
    },
    {
      id: 'course-manicura-rusa',
      slug: 'manicura-rusa-soft-gel',
      title: 'Manicura Rusa Estética & Soft Gel Avanzado',
      tagline: 'El estándar europeo de máxima pulcritud',
      description:
        'Manejo quirúrgico del torno para una cutícula impecable y nivelación con Rubber Base y Soft Gel. Pensado para manicuristas dedicadas.',
      tag: 'Estructura & Anatomía',
      level: 'Manicuristas y principiantes dedicadas',
      duration: '8 horas (divididas en 2 sesiones)',
      sessions: 2,
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
      coverUrl: null,
      isPublished: true,
    },
  ];

  getCourses(): Course[] {
    return this.courses;
  }

  getFeaturedCourses(limit = 3): Course[] {
    return this.courses.filter((c) => c.isPublished).slice(0, limit);
  }

  getBySlug(slug: string): Course | undefined {
    return this.courses.find((c) => c.slug === slug);
  }
}
