import { User } from './user.model';
import { UserStatus } from './user-status.model';

export interface UserListResponse {
  totalUsers: number;
  users: User[];
}

export type SortBy = 'fullName' | 'createdAt';
export type SortDir = 'asc' | 'desc';

export interface UpdateUserStatusRequest {
  status: UserStatus;
}

export interface UpdateUserStatusResponse {
  id: number;
  fullName: string;
  status: UserStatus;
  message: string;
}
