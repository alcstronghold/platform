import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';

import { PermissionService } from '../services/permission.service';

export const sessionsGuard: CanActivateFn = () => {
  const permissions = inject(PermissionService);
  const router = inject(Router);

  return permissions.canAccessSessions()
    ? true
    : router.createUrlTree(['/dashboard']);
};
