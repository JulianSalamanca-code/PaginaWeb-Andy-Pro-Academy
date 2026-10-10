import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <div class="flex flex-col min-h-screen bg-surface text-on-surface">
      <app-navbar />

      <!-- pt-20 compensa la navbar fija -->
      <main class="flex-1 pt-20">
        <router-outlet />
      </main>

      <app-footer />
    </div>
  `,
})
export class MainLayoutComponent {}