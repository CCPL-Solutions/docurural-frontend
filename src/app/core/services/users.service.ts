import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserStatus } from '../models/user-status.model';
import {
  SortBy,
  SortDir,
  UpdateUserStatusResponse,
  UserListResponse,
} from '../models/user-list.models';
import {
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
} from '../models/user-form.models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);

  list(sortBy: SortBy = 'fullName', sortDir: SortDir = 'asc'): Observable<UserListResponse> {
    const params = new HttpParams().set('sortBy', sortBy).set('sortDir', sortDir);
    return this.http.get<UserListResponse>(`${environment.apiBaseUrl}/users`, { params });
  }

  updateStatus(id: number, status: UserStatus): Observable<UpdateUserStatusResponse> {
    return this.http.patch<UpdateUserStatusResponse>(
      `${environment.apiBaseUrl}/users/${id}/status`,
      { status },
    );
  }

  create(req: CreateUserRequest): Observable<CreateUserResponse> {
    return this.http.post<CreateUserResponse>(`${environment.apiBaseUrl}/users`, req);
  }

  update(id: number, req: UpdateUserRequest): Observable<UpdateUserResponse> {
    return this.http.put<UpdateUserResponse>(`${environment.apiBaseUrl}/users/${id}`, req);
  }
}
