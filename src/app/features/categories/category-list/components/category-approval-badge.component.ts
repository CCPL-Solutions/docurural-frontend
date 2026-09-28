import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BadgeComponent, BadgeVariant } from '@shared/components/badge/badge.component';

/** Valor de "Requiere aprobación" (HU-31): "Sí"/"No" en la tabla y "Aprobación: Sí/No" en tarjetas. */
@Component({
  selector: 'app-category-approval-badge',
  imports: [BadgeComponent, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-badge [variant]="variant()">
      @if (size() === 'sm') {
        <mat-icon class="approval-badge__icon" aria-hidden="true">approval</mat-icon>
        @if (requiresApproval()) {
          <ng-container i18n="@@categories.approval.cardYes">Aprobación: Sí</ng-container>
        } @else {
          <ng-container i18n="@@categories.approval.cardNo">Aprobación: No</ng-container>
        }
      } @else {
        @if (requiresApproval()) {
          <ng-container i18n="@@categories.approval.yes">Sí</ng-container>
        } @else {
          <ng-container i18n="@@categories.approval.no">No</ng-container>
        }
      }
    </app-badge>
  `,
  styleUrl: './category-approval-badge.component.scss',
})
export class CategoryApprovalBadgeComponent {
  readonly requiresApproval = input.required<boolean>();
  readonly size = input<'md' | 'sm'>('md');
  /** Categoría inactiva: se atenúa como el resto de la fila, sin perder el valor (FR-011). */
  readonly muted = input(false);

  protected readonly variant = computed<BadgeVariant>(() =>
    this.requiresApproval() && !this.muted() ? 'primary' : 'neutral',
  );
}
