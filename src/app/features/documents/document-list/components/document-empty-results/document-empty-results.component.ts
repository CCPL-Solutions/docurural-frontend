import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-document-empty-results',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, MatIconModule],
  templateUrl: './document-empty-results.component.html',
  styleUrl: './document-empty-results.component.scss',
})
export class DocumentEmptyResultsComponent {
  readonly variant = input<'search' | 'filters' | 'combined'>('search');
  readonly searchTerm = input<string | null>(null);

  readonly clearAll = output<void>();

  get icon(): string {
    return this.variant() === 'filters' ? 'filter_alt_off' : 'search_off';
  }

  get title(): string {
    switch (this.variant()) {
      case 'search':
        return $localize`:@@documents.emptyResults.search.title:No se encontraron documentos`;
      case 'filters':
        return $localize`:@@documents.emptyResults.filters.title:Sin documentos con los filtros aplicados`;
      case 'combined':
        return $localize`:@@documents.emptyResults.combined.title:Sin resultados para la búsqueda y los filtros`;
    }
  }

  get message(): string {
    switch (this.variant()) {
      case 'search':
        return this.searchTerm()
          ? $localize`:@@documents.emptyResults.search.messageWithTerm:No se encontraron documentos que coincidan con "${this.searchTerm()}:term:". Intente con otras palabras clave.`
          : $localize`:@@documents.emptyResults.search.message:No se encontraron documentos. Intente con otras palabras clave.`;
      case 'filters':
        return $localize`:@@documents.emptyResults.filters.message:No hay documentos que coincidan con los filtros aplicados.`;
      case 'combined':
        return $localize`:@@documents.emptyResults.combined.message:No se encontraron documentos que coincidan con la búsqueda y los filtros aplicados.`;
    }
  }
}
