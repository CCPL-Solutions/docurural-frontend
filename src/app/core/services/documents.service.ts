import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DeleteDocumentResponse,
  DocumentListParams,
  DocumentListResponse,
} from '../models/document-list.models';
import {
  BatchUploadDocumentResponse,
  UploadDocumentResponse,
} from '../models/upload-document.models';
import { DocumentDetailResponse } from '../models/document-detail.model';
import {
  UpdateDocumentMetadataRequest,
  UpdateDocumentMetadataResponse,
} from '../models/update-document.models';
import { FilterOptionsResponse } from '../models/filter-options.model';

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private readonly http = inject(HttpClient);

  list(params: DocumentListParams): Observable<DocumentListResponse> {
    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('size', params.size)
      .set('sortBy', params.sortBy)
      .set('sortDir', params.sortDir);

    httpParams = this.appendOptional(httpParams, 'q', params.q?.trim());
    httpParams = this.appendOptional(httpParams, 'categoryId', params.categoryId);
    httpParams = this.appendOptional(httpParams, 'responsibleArea', params.responsibleArea?.trim());
    httpParams = this.appendOptional(httpParams, 'dateFrom', params.dateFrom);
    httpParams = this.appendOptional(httpParams, 'dateTo', params.dateTo);
    httpParams = this.appendOptional(httpParams, 'uploadedBy', params.uploadedBy);

    return this.http.get<DocumentListResponse>(`${environment.apiBaseUrl}/documents`, {
      params: httpParams,
    });
  }

  filterOptions(): Observable<FilterOptionsResponse> {
    return this.http.get<FilterOptionsResponse>(`${environment.apiBaseUrl}/documents/filter-options`);
  }

  private appendOptional(params: HttpParams, key: string, value: unknown): HttpParams {
    if (value === null || value === undefined || value === '') return params;
    return params.set(key, String(value));
  }

  create(formData: FormData): Observable<UploadDocumentResponse> {
    return this.http.post<UploadDocumentResponse>(
      `${environment.apiBaseUrl}/documents`,
      formData,
    );
  }

  createBatch(formData: FormData): Observable<HttpEvent<BatchUploadDocumentResponse>> {
    return this.http.post<BatchUploadDocumentResponse>(
      `${environment.apiBaseUrl}/documents/batch`,
      formData,
      { reportProgress: true, observe: 'events' },
    );
  }

  getById(id: number): Observable<DocumentDetailResponse> {
    return this.http.get<DocumentDetailResponse>(`${environment.apiBaseUrl}/documents/${id}`);
  }

  getViewBlob(id: number): Observable<Blob> {
    return this.http.get(`${environment.apiBaseUrl}/documents/${id}/view`, { responseType: 'blob' });
  }

  /** DOC-08: descarga el archivo forzando Content-Disposition: attachment.
   *  Retorna la respuesta completa para que el caller pueda leer el header Content-Disposition
   *  y extraer el nombre original del archivo. */
  download(id: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${environment.apiBaseUrl}/documents/${id}/download`, {
      responseType: 'blob',
      observe: 'response',
    });
  }

  update(id: number, payload: UpdateDocumentMetadataRequest): Observable<UpdateDocumentMetadataResponse> {
    return this.http.put<UpdateDocumentMetadataResponse>(
      `${environment.apiBaseUrl}/documents/${id}`,
      payload,
    );
  }

  deleteLogical(id: number): Observable<DeleteDocumentResponse> {
    return this.http.delete<DeleteDocumentResponse>(`${environment.apiBaseUrl}/documents/${id}`);
  }
}
