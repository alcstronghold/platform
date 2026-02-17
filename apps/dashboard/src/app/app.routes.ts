import { Routes } from '@angular/router';

import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { loginGuard } from './core/guards/login.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('./features/auth/components/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/components/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'users',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/users/components/users-layout.component').then(
        (m) => m.UsersLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/users/components/user-list.component').then(
            (m) => m.UserListComponent
          ),
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./features/users/components/user-create.component').then(
            (m) => m.UserCreateComponent
          ),
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./features/users/components/user-edit.component').then(
            (m) => m.UserEditComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
