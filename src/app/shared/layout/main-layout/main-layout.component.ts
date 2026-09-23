import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { isAdmin } from '@core/auth/permissions';
import { AuthService } from '@core/services/auth.service';
import { userInitials } from '@shared/utils/user-initials';
import { RoleLabelPipe } from '../../pipes/role-label.pipe';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, RoleLabelPipe],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  private readonly auth = inject(AuthService);

  protected readonly currentUser = this.auth.currentUser;

  protected readonly sidebarOpen = signal(false);

  protected readonly userInitials = computed(() => userInitials(this.currentUser()?.fullName));

  protected readonly isAdmin = computed(() => isAdmin(this.currentUser()?.role));

  protected onLogout(): void {
    this.auth.logout().subscribe();
  }
}
