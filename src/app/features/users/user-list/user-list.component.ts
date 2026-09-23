import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UsersService } from '@core/services/users.service';
import { NotificationService } from '@core/services/notification.service';
import { User } from '@core/models/user.model';
import { SortBy, SortDir } from '@core/models/user-list.model';
import {
  UserFormDialogComponent,
  UserFormDialogData,
  UserFormDialogResult,
} from '../user-form-dialog/user-form-dialog.component';
import {
  ToggleStatusDialogComponent,
  ToggleStatusDialogData,
  ToggleStatusDialogResult,
} from '../toggle-status-dialog/toggle-status-dialog.component';
import { RoleBadgeComponent } from './components/role-badge.component';
import { StatusBadgeComponent } from './components/status-badge.component';
import { UserIdentityComponent } from './components/user-identity.component';
import { UserRowActionsComponent } from './components/user-row-actions.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { SortTriggerComponent } from '@shared/components/sort-trigger/sort-trigger.component';
import { DatePipe } from '@angular/common';
import { DATE_FORMAT, DATE_TIME_24H_FORMAT } from '@shared/utils/date-formats';
import { DIALOG_MD, DIALOG_SM } from '@shared/ui/dialog-sizes';

type SortOption = 'fullNameAsc' | 'fullNameDesc' | 'createdAtDesc' | 'createdAtAsc';

interface SortOptionConfig {
  value: SortOption;
  label: string;
  sortBy: SortBy;
  sortDir: SortDir;
}

const SORT_OPTIONS: SortOptionConfig[] = [
  { value: 'fullNameAsc', label: 'Nombre A–Z', sortBy: 'fullName', sortDir: 'asc' },
  { value: 'fullNameDesc', label: 'Nombre Z–A', sortBy: 'fullName', sortDir: 'desc' },
  { value: 'createdAtDesc', label: 'Más recientes', sortBy: 'createdAt', sortDir: 'desc' },
  { value: 'createdAtAsc', label: 'Más antiguos', sortBy: 'createdAt', sortDir: 'asc' },
];

@Component({
  selector: 'app-user-list',
  imports: [
    DatePipe,
    MatIconModule,
    MatMenuModule,
    MatDialogModule,
    MatTooltipModule,
    RoleBadgeComponent,
    StatusBadgeComponent,
    UserIdentityComponent,
    UserRowActionsComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    ButtonComponent,
    SortTriggerComponent,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent {
  private readonly usersService = inject(UsersService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  protected readonly loading = signal(false);
  protected readonly users = signal<User[]>([]);
  protected readonly totalUsers = signal(0);
  protected readonly searchTerm = signal('');
  protected readonly selectedSort = signal<SortOption>('fullNameAsc');

  protected readonly sortOptions = SORT_OPTIONS;

  protected readonly currentSortLabel = computed(() => this.currentSortConfig().label);

  protected readonly filteredUsers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const all = this.users();
    if (!term) return all;
    return all.filter(
      (u) => u.fullName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term),
    );
  });

  protected readonly dateFormat = DATE_FORMAT;
  protected readonly dateTimeFormat = DATE_TIME_24H_FORMAT;

  constructor() {
    this.loadUsers();
  }

  protected loadUsers(): void {
    const opt = this.currentSortConfig();
    this.loading.set(true);
    this.usersService.list(opt.sortBy, opt.sortDir).subscribe({
      next: (res) => {
        this.users.set(res.users);
        this.totalUsers.set(res.totalUsers);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.notifications.httpError(
          err,
          'No se pudo cargar el listado',
          'Verifique su conexión e intente nuevamente.',
        );
      },
    });
  }

  protected onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  protected onSortChange(value: SortOption): void {
    this.selectedSort.set(value);
    this.loadUsers();
  }

  protected onToggleStatus(user: User): void {
    const action = user.status === 'ACTIVE' ? 'deactivate' : 'activate';

    const ref = this.dialog.open<
      ToggleStatusDialogComponent,
      ToggleStatusDialogData,
      ToggleStatusDialogResult
    >(ToggleStatusDialogComponent, {
      data: { user, action },
      ...DIALOG_SM,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result?.success) return;
      this.notifications.success('Estado actualizado', result.message);
      this.loadUsers();
    });
  }

  protected goToCreate(): void {
    const ref = this.dialog.open<UserFormDialogComponent, UserFormDialogData, UserFormDialogResult>(
      UserFormDialogComponent,
      { data: { mode: 'create' }, ...DIALOG_MD },
    );
    ref.afterClosed().subscribe((result) => {
      if (result?.kind === 'created') this.loadUsers();
    });
  }

  protected goToEdit(user: User): void {
    const ref = this.dialog.open<UserFormDialogComponent, UserFormDialogData, UserFormDialogResult>(
      UserFormDialogComponent,
      {
        data: { mode: 'edit', user },
        ...DIALOG_MD,
      },
    );
    ref.afterClosed().subscribe((result) => {
      if (result?.kind === 'updated') this.loadUsers();
    });
  }

  protected isMuted(user: User): boolean {
    return user.status === 'INACTIVE';
  }

  private currentSortConfig(): SortOptionConfig {
    return SORT_OPTIONS.find((o) => o.value === this.selectedSort()) ?? SORT_OPTIONS[0];
  }
}
