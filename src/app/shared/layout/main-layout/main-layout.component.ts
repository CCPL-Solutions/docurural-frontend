import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { isAdmin } from '@core/auth/permissions';
import { AuthService } from '@core/services/auth.service';
import { userInitials } from '@shared/utils/user-initials';
import { LanguageSwitcherComponent } from '@shared/components/language-switcher/language-switcher.component';
import { RoleLabelPipe } from '../../pipes/role-label.pipe';

@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    RoleLabelPipe,
    LanguageSwitcherComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currentUser = this.auth.currentUser;

  protected readonly sidebarOpen = signal(false);

  protected readonly userInitials = computed(() => userInitials(this.currentUser()?.fullName));

  protected readonly isAdmin = computed(() => isAdmin(this.currentUser()?.role));

  protected onLogout(): void {
    this.auth.logout().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}
