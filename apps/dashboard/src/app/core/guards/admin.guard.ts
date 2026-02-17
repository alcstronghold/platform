import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.user();
  const isAdmin = user?.role?.adminAccess === true;

  if (isAdmin) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
