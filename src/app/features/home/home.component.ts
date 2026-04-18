import { Component } from '@angular/core';
import { CourseService } from '../../core/services/course.service';
import { CourseCardComponent } from '../../shared/components/course-card/course-card.component';

@Component({
  standalone: true,
  imports: [CourseCardComponent],
  template: `
    <!-- HERO -->
    <section class="bg-gradient-to-r from-pink-500 to-pink-400 text-white py-20">
      <div class="max-w-7xl mx-auto px-6 text-center">

        <h1 class="text-4xl md:text-5xl font-bold mb-4">
          Aprende, crece y brilla ✨
        </h1>

        <p class="text-lg mb-6">
          Conviértete en profesional de la belleza desde casa
        </p>

        <div class="flex justify-center gap-4">

          <a class="bg-white text-pink-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100">
            Inscríbete ahora
          </a>

          <a class="border border-white px-6 py-3 rounded-lg hover:bg-white hover:text-pink-600 transition">
            Ver cursos
          </a>

        </div>

      </div>
    </section>

    <!-- BENEFICIOS -->
    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8 text-center">

        <div>
          <h3 class="font-semibold text-lg mb-2">Clases Online</h3>
          <p class="text-gray-500">Aprende a tu ritmo desde cualquier lugar</p>
        </div>

        <div>
          <h3 class="font-semibold text-lg mb-2">Certificación</h3>
          <p class="text-gray-500">Obtén certificado profesional</p>
        </div>

        <div>
          <h3 class="font-semibold text-lg mb-2">Acceso de por vida</h3>
          <p class="text-gray-500">Revisa tus cursos cuando quieras</p>
        </div>

      </div>
    </section>

    <!-- CURSOS DESTACADOS -->
    <section class="py-16 bg-gray-50">
      <div class="max-w-7xl mx-auto px-6">

        <h2 class="text-2xl font-bold mb-8 text-center">
          Cursos Destacados
        </h2>

        <div class="grid md:grid-cols-3 gap-6">

          <app-course-card
            *ngFor="let course of courses"
            [course]="course">
          </app-course-card>

        </div>

      </div>
    </section>

    <!-- CTA FINAL -->
    <section class="py-20 bg-pink-500 text-white text-center">

      <h2 class="text-3xl font-bold mb-4">
        Empieza hoy tu carrera en belleza
      </h2>

      <a class="bg-white text-pink-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
        Ver todos los cursos
      </a>

    </section>
  `
})
export class HomeComponent {

  courses = this.courseService.getFeaturedCourses();

  constructor(private courseService: CourseService) {}
}
