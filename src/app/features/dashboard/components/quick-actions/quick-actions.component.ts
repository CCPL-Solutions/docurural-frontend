import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { QuickAction, QuickActionVariant } from '../../utils/quick-action.model';
import { ROLE_LABELS } from '@core/models/role.model';
import { Role } from '@core/models/role.model';

@Component({
  selector: 'app-quick-actions',
  imports: [RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quick-actions.component.html',
  styleUrl: './quick-actions.component.scss',
})
export class QuickActionsComponent {
  readonly role = input.required<Role>();
  readonly actions = input.required<QuickAction[]>();

  protected readonly roleLabels = ROLE_LABELS;

  protected variantClass(variant: QuickActionVariant): string {
    return `qa-btn--${variant}`;
  }
}
