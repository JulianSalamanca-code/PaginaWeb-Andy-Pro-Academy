import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),

    provideHttpClient(
      // withFetch() usa la API fetch en lugar de XMLHttpRequest. Es lo que
      // Angular recomienda con SSR: el transfer cache necesita fetch, y sin
      // esto avisa por consola en cada arranque.
      withFetch(),
      withInterceptors([authInterceptor]),
    ),

    provideClientHydration(withEventReplay()),
  ],
};