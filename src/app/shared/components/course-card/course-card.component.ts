import { Component, Input } from '@angular/core';
import { Course } from '../../../core/models/course.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden">

      <img [src]="course.thumbnail" class="w-full h-48 object-cover" />

      <div class="p-4">

        <h3 class="font-semibold text-lg mb-2">
          {{ course.title }}
        </h3>

        <p class="text-sm text-gray-500 mb-3">
          {{ course.shortDescription }}
        </p>

        <div class="flex justify-between items-center">

          <span class="text-pink-600 font-bold">
            ${{ course.price }}
          </span>

          <a
            [routerLink]="['/courses', course.slug]"
            class="text-sm text-pink-500 hover:underline"
          >
            Ver más
          </a>

        </div>

      </div>
    </div>
  `
})
export class CourseCardComponent {
  @Input() course!: Course;
}
