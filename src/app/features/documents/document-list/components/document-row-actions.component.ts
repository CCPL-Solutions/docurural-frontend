import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Document } from '../../../../core/models/document.model';
import { Role } from '../../../../core/models/role.model';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { canEditDocument, canDeleteDocument } from '../utils/document-permissions';

@Component({
  selector: 'app-document-row-actions',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule, IconButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row-actions">
      <app-icon-button tooltip="Ver documento" ariaLabel="Ver documento" (click)="view.emit(doc())">
        <mat-icon>visibility</mat-icon>
      </app-icon-button>
      <app-icon-button
        [tooltip]="downloading() ? 'Descargando…' : 'Descargar'"
        [ariaLabel]="
          downloading()
            ? 'Descargando documento ' + doc().title
            : 'Descargar documento ' + doc().title
        "
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
        <app-icon-button tooltip="Editar" ariaLabel="Editar documento" (click)="edit.emit(doc())">
          <mat-icon>edit</mat-icon>
        </app-icon-button>
      }
      @if (canDelete()) {
        <app-icon-button
          variant="danger"
          tooltip="Eliminar"
          ariaLabel="Eliminar documento"
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
  readonly currentUserName = input.required<string>();
  readonly downloading = input(false);

  readonly view = output<Document>();
  readonly download = output<Document>();
  readonly edit = output<Document>();
  readonly delete = output<Document>();

  protected readonly canEdit = computed(() =>
    canEditDocument(this.role(), this.currentUserName(), this.doc().uploadedBy),
  );
  protected readonly canDelete = computed(() => canDeleteDocument(this.role()));
}
