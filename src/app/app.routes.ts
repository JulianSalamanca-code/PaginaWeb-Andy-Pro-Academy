import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        title: 'Andy Cosmetología • Puebla Studio',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'servicios',
        title: 'Servicios | Andy Cosmetología',
        loadComponent: () =>
          import('./features/services/services.component').then((m) => m.ServicesComponent),
      },
      {
        path: 'cursos',
        title: 'Cursos y Certificaciones | Andy Cosmetología',
        loadComponent: () =>
          import('./features/courses/courses.component').then((m) => m.CoursesComponent),
      },
      {
        path: 'tienda',
        title: 'Tienda | Andy Cosmetología',
        loadComponent: () => import('./features/shop/shop.component').then((m) => m.ShopComponent),
      },
      {
        path: 'reservar',
        title: 'Reservar Cita | Andy Cosmetología',
        loadComponent: () =>
          import('./features/booking/booking-wizard.component').then(
            (m) => m.BookingWizardComponent
          ),
      },
      {
        path: 'mis-reservas',
        title: 'Mis Reservas | Andy Cosmetología',
        loadComponent: () =>
          import('./features/bookings/my-bookings.component').then((m) => m.MyBookingsComponent),
      },
      {
        path: 'login',
        title: 'Iniciar Sesión | Andy Cosmetología',
        loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'registro',
        title: 'Crear Cuenta | Andy Cosmetología',
        loadComponent: () =>
          import('./features/auth/register.component').then((m) => m.RegisterComponent),
      },
    ],
  },
  {
    // Fuera del layout público: el admin tiene su propia pantalla completa.
    path: 'admin',
    title: 'Panel de Administración | Andy Studio',
    loadComponent: () => import('./features/admin/admin.component').then((m) => m.AdminComponent),
  },
  { path: '**', redirectTo: '' },
];
