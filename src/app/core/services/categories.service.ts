import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CategoryStatus } from '../models/category-status.model';
import {
  CategorySortBy,
  CategorySortDir,
  CategoryListResponse,
  CreateCategoryRequest,
  CreateCategoryResponse,
  UpdateCategoryRequest,
  UpdateCategoryResponse,
  UpdateCategoryStatusRequest,
  UpdateCategoryStatusResponse,
} from '../models/category-list.models';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);

  list(
    sortBy: CategorySortBy = 'name',
    sortDir: CategorySortDir = 'asc',
  ): Observable<CategoryListResponse> {
    const params = new HttpParams().set('sortBy', sortBy).set('sortDir', sortDir);
    return this.http.get<CategoryListResponse>(`${environment.apiBaseUrl}/categories`, { params });
  }

  create(payload: CreateCategoryRequest): Observable<CreateCategoryResponse> {
    return this.http.post<CreateCategoryResponse>(`${environment.apiBaseUrl}/categories`, payload);
  }

  update(id: number, payload: UpdateCategoryRequest): Observable<UpdateCategoryResponse> {
    return this.http.put<UpdateCategoryResponse>(
      `${environment.apiBaseUrl}/categories/${id}`,
      payload,
    );
  }

  updateStatus(id: number, status: CategoryStatus): Observable<UpdateCategoryStatusResponse> {
    return this.http.patch<UpdateCategoryStatusResponse>(
      `${environment.apiBaseUrl}/categories/${id}/status`,
      { status } satisfies UpdateCategoryStatusRequest,
    );
  }
}
