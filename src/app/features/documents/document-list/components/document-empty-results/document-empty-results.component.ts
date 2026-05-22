import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-document-empty-results',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './document-empty-results.component.html',
  styleUrl: './document-empty-results.component.scss',
})
export class DocumentEmptyResultsComponent {
  @Input() variant: 'search' | 'filters' | 'combined' = 'search';
  @Input() searchTerm: string | null = null;

  @Output() readonly clearAll = new EventEmitter<void>();

  get icon(): string {
    return this.variant === 'filters' ? 'filter_alt_off' : 'search_off';
  }

  get title(): string {
    switch (this.variant) {
      case 'search':   return 'No se encontraron documentos';
      case 'filters':  return 'Sin documentos con los filtros aplicados';
      case 'combined': return 'Sin resultados para la búsqueda y los filtros';
    }
  }

  get message(): string {
    switch (this.variant) {
      case 'search':
        return this.searchTerm
          ? `No se encontraron documentos que coincidan con "${this.searchTerm}". Intente con otras palabras clave.`
          : 'No se encontraron documentos. Intente con otras palabras clave.';
      case 'filters':
        return 'No hay documentos que coincidan con los filtros aplicados.';
      case 'combined':
        return 'No se encontraron documentos que coincidan con la búsqueda y los filtros aplicados.';
    }
  }
}
