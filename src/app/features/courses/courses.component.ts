import { Component } from '@angular/core';
import { CourseService } from '../../core/services/course.service';
import { CourseCardComponent } from '../../shared/components/course-card/course-card.component';

@Component({
  standalone: true,
  imports: [CourseCardComponent],
  template: `
    <section class="max-w-7xl mx-auto px-6 py-16">

      <h1 class="text-3xl font-bold mb-8">
        Todos los Cursos
      </h1>

      <div class="grid md:grid-cols-3 gap-6">

        <app-course-card
          *ngFor="let course of courses"
          [course]="course">
        </app-course-card>

      </div>

    </section>
  `
})
export class CoursesComponent {

  courses = this.courseService.getCourses();

  constructor(private courseService: CourseService) {}
}
