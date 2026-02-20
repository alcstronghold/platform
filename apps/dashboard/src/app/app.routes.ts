import { Routes } from '@angular/router';

import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { loginGuard } from './core/guards/login.guard';
import { sessionsGuard } from './core/guards/sessions.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('./features/auth/components/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/components/app-layout.component').then((m) => m.AppLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/components/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'rpg-sessions',
        canActivate: [sessionsGuard],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/rpg-sessions/components/session-list.component').then(
                (m) => m.SessionListComponent,
              ),
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./features/rpg-sessions/components/session-create.component').then(
                (m) => m.SessionCreateComponent,
              ),
          },
          {
            path: ':id/edit',
            loadComponent: () =>
              import('./features/rpg-sessions/components/session-edit.component').then(
                (m) => m.SessionEditComponent,
              ),
          },
        ],
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/users/components/user-list.component').then(
                (m) => m.UserListComponent,
              ),
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./features/users/components/user-create.component').then(
                (m) => m.UserCreateComponent,
              ),
          },
          {
            path: ':id/edit',
            loadComponent: () =>
              import('./features/users/components/user-edit.component').then(
                (m) => m.UserEditComponent,
              ),
          },
        ],
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
