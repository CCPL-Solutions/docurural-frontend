import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DocumentsService } from '../../../../../core/services/documents.service';
import { Document } from '../../../../../core/models/document.model';
import { DeleteDocumentResponse } from '../../../../../core/models/document-list.models';
import { AlertComponent } from '../../../../../shared/components/alert/alert.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { formatFileSize } from '../../utils/file-size';

export interface DeleteDocumentDialogData {
  document: Document;
}

export interface DeleteDocumentDialogResult {
  success: true;
  documentId: number;
  message: string;
}

@Component({
  selector: 'app-delete-document-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatIconModule, AlertComponent, ButtonComponent],
  templateUrl: './delete-document-dialog.component.html',
  styleUrl: './delete-document-dialog.component.scss',
})
export class DeleteDocumentDialogComponent {
  private static readonly CONFIRM_PHRASE = 'ELIMINAR';

  protected readonly data = inject<DeleteDocumentDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<DeleteDocumentDialogComponent, DeleteDocumentDialogResult | undefined>>(
      MatDialogRef,
    );
  private readonly documentsService = inject(DocumentsService);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly errorBlocksAction = signal(false);
  protected readonly confirmationText = signal('');

  protected readonly confirmPhrase = DeleteDocumentDialogComponent.CONFIRM_PHRASE;

  protected readonly canConfirm = computed(
    () => this.confirmationText().trim().toUpperCase() === this.confirmPhrase,
  );

  protected readonly actionDisabled = computed(
    () => this.loading() || this.errorBlocksAction() || !this.canConfirm(),
  );

  protected onConfirmationText(value: string): void {
    this.confirmationText.set(value);
  }

  protected formatSize(bytes: number): string {
    return formatFileSize(bytes);
  }

  protected confirm(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.dialogRef.disableClose = true;

    this.documentsService.deleteLogical(this.data.document.id).subscribe({
      next: (res: DeleteDocumentResponse) => {
        this.dialogRef.close({
          success: true,
          documentId: res.id,
          message: res.message,
        });
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.dialogRef.disableClose = false;
        this.handleError(err);
      },
    });
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }

  private handleError(err: HttpErrorResponse): void {
    switch (err.status) {
      case 403:
        this.errorMessage.set('No tiene permisos para eliminar documentos.');
        this.errorBlocksAction.set(true);
        break;
      case 404:
        this.errorMessage.set(
          'El documento ya no existe o fue eliminado. Cierre este diálogo y actualice el listado.',
        );
        this.errorBlocksAction.set(true);
        break;
      default:
        this.errorMessage.set('No fue posible eliminar el documento. Intente nuevamente.');
        this.errorBlocksAction.set(false);
    }
  }
}
