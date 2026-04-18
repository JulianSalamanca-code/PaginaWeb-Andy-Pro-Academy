import { Injectable } from '@angular/core';
import { Course } from '../models/course.model';

@Injectable({
  providedIn: 'root'
})
export class CourseService {

  private courses: Course[] = [
    {
      id: '1',
      title: 'Curso de Uñas Acrílicas',
      slug: 'unas-acrilicas',
      description: 'Aprende desde cero a crear uñas acrílicas profesionales.',
      shortDescription: 'Domina uñas acrílicas desde casa',
      category: 'Uñas',
      level: 'Básico',
      price: 49,
      thumbnail: 'https://via.placeholder.com/400x300',
      isPublished: true,
      createdAt: new Date()
    },
    {
      id: '2',
      title: 'Maquillaje Profesional',
      slug: 'maquillaje-pro',
      description: 'Técnicas avanzadas de maquillaje profesional.',
      shortDescription: 'Conviértete en makeup artist',
      category: 'Maquillaje',
      level: 'Intermedio',
      price: 79,
      thumbnail: 'https://via.placeholder.com/400x300',
      isPublished: true,
      createdAt: new Date()
    }
  ];

  getCourses(): Course[] {
    return this.courses;
  }

  getFeaturedCourses(): Course[] {
    return this.courses.slice(0, 2);
  }
}
