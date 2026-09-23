import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Document } from '@core/models/document.model';
import { Role } from '@core/models/role.model';
import { IconButtonComponent } from '@shared/components/icon-button/icon-button.component';
import { canEditDocument, canDeleteDocument } from '@core/auth/permissions';
import { downloadAriaLabel, downloadTooltip } from '@shared/i18n/download-labels';

@Component({
  selector: 'app-document-row-actions',
  imports: [MatIconModule, MatProgressSpinnerModule, IconButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row-actions">
      <app-icon-button
        tooltip="Ver documento"
        i18n-tooltip="@@documents.row.view"
        ariaLabel="Ver documento"
        i18n-ariaLabel="@@documents.row.view"
        [link]="['/documents', doc().id]"
      >
        <mat-icon>visibility</mat-icon>
      </app-icon-button>
      <app-icon-button
        [tooltip]="downloadTooltip(downloading())"
        [ariaLabel]="downloadAriaLabel(doc().title, downloading())"
        [disabled]="downloading()"
        (click)="download.emit(doc())"
      >
        @if (downloading()) {
          <mat-progress-spinner diameter="18" mode="indeterminate" />
        } @else {
          <mat-icon>download</mat-icon>
        }
      </app-icon-button>
      @if (canEdit()) {
        <app-icon-button
          tooltip="Editar"
          i18n-tooltip="@@common.edit"
          ariaLabel="Editar documento"
          i18n-ariaLabel="@@documents.row.editAriaLabel"
          (click)="edit.emit(doc())"
        >
          <mat-icon>edit</mat-icon>
        </app-icon-button>
      }
      @if (canDelete()) {
        <app-icon-button
          variant="danger"
          tooltip="Eliminar"
          i18n-tooltip="@@common.delete"
          ariaLabel="Eliminar documento"
          i18n-ariaLabel="@@documents.row.deleteAriaLabel"
          (click)="delete.emit(doc())"
        >
          <mat-icon>delete_outline</mat-icon>
        </app-icon-button>
      }
    </div>
  `,
  styleUrl: './document-row-actions.component.scss',
})
export class DocumentRowActionsComponent {
  readonly doc = input.required<Document>();
  readonly role = input.required<Role>();
  readonly currentUserId = input.required<number | null>();
  readonly downloading = input(false);

  readonly download = output<Document>();
  readonly edit = output<Document>();
  readonly delete = output<Document>();

  protected readonly canEdit = computed(() =>
    canEditDocument(this.role(), this.currentUserId(), this.doc().uploadedById),
  );
  protected readonly canDelete = computed(() => canDeleteDocument(this.role()));
  protected readonly downloadTooltip = downloadTooltip;
  protected readonly downloadAriaLabel = downloadAriaLabel;
}
