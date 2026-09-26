import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BadgeComponent } from '@shared/components/badge/badge.component';

/** Etiqueta "Aprobador" (HU-32). Atenuada si el usuario está inactivo: ya no aprueba. */
@Component({
  selector: 'app-approver-badge',
  imports: [BadgeComponent, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-badge
      [variant]="inactive() ? 'neutral' : 'accent'"
      matTooltip="Inactivo: no cuenta como aprobador activo"
      i18n-matTooltip="@@users.list.approverInactive"
      [matTooltipDisabled]="!inactive()"
    >
      <mat-icon class="approver-badge__icon" aria-hidden="true">verified</mat-icon>
      <ng-container i18n="@@users.list.approverBadge">Aprobador</ng-container>
      @if (inactive()) {
        <span class="visually-hidden" i18n="@@users.list.approverInactive"
          >Inactivo: no cuenta como aprobador activo</span
        >
      }
    </app-badge>
  `,
  styleUrl: './approver-badge.component.scss',
})
export class ApproverBadgeComponent {
  readonly inactive = input(false);
}
