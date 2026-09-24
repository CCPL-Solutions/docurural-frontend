import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { guestGuard } from '@core/guards/guest.guard';
import { roleGuard } from '@core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    // La sesión se vuelve a comprobar al navegar entre páginas del layout (R4).
    canActivateChild: [authGuard],
    loadComponent: () =>
      import('@shared/layout/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('@features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: $localize`:@@routeTitle.dashboard:Inicio — DocuRural`,
      },
      {
        path: 'users',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () =>
          import('@features/users/user-list/user-list.component').then((m) => m.UserListComponent),
        title: $localize`:@@routeTitle.users:Usuarios — DocuRural`,
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('@features/documents/document-list/document-list.component').then(
            (m) => m.DocumentListComponent,
          ),
        title: $localize`:@@routeTitle.documents:Documentos — DocuRural`,
      },
      {
        path: 'documents/:id',
        loadComponent: () =>
          import('@features/documents/document-detail/document-detail.component').then(
            (m) => m.DocumentDetailComponent,
          ),
        title: $localize`:@@routeTitle.document:Documento — DocuRural`,
      },
      {
        path: 'categories',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () =>
          import('@features/categories/category-list/category-list.component').then(
            (m) => m.CategoryListComponent,
          ),
        title: $localize`:@@routeTitle.categories:Categorías — DocuRural`,
      },
    ],
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('@features/auth/login/login.component').then((m) => m.LoginComponent),
    title: $localize`:@@routeTitle.login:Iniciar sesión — DocuRural`,
  },
  {
    path: '**',
    loadComponent: () =>
      import('@features/not-found/not-found.component').then((m) => m.NotFoundComponent),
    title: $localize`:@@routeTitle.notFound:Página no encontrada — DocuRural`,
  },
];
