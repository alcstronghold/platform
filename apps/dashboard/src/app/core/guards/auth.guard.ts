import { inject } from '@angular/core';
import { type ActivatedRouteSnapshot, type CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Captura la URL actual para redirigir después del login
  const currentUrl = `/${route.url.map((segment) => segment.path).join('/')}`;
  const queryParams = route.queryParams;
  const queryString = Object.keys(queryParams).length > 0
    ? '?' + new URLSearchParams(queryParams as Record<string, string>).toString()
    : '';

  const redirectUrl = currentUrl + queryString;

  // Redirige a login con redirectUrl
  return router.createUrlTree(['/login'], {
    queryParams: { redirectUrl },
  });
};
