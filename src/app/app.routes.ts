import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Inicio — DocuRural',
      },
      {
        path: 'users',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () =>
          import('./features/users/user-list/user-list.component').then((m) => m.UserListComponent),
        title: 'Usuarios — DocuRural',
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('./features/documents/document-list/document-list.component').then(
            (m) => m.DocumentListComponent,
          ),
        title: 'Documentos — DocuRural',
      },
      {
        path: 'documents/:id',
        loadComponent: () =>
          import('./features/documents/document-detail/document-detail.component').then(
            (m) => m.DocumentDetailComponent,
          ),
        title: 'Documento — DocuRural',
      },
      {
        path: 'categories',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () =>
          import('./features/categories/category-list/category-list.component').then(
            (m) => m.CategoryListComponent,
          ),
        title: 'Categorías — DocuRural',
      },
    ],
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    title: 'Iniciar sesión — DocuRural',
  },
  { path: '**', redirectTo: 'login' },
];
