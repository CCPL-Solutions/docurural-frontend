import { Role } from './role.model';
import { AuthenticatedUser, User } from './user.model';
import { UserStatus } from './user-status.model';

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
}

export interface UpdateUserRequest {
  fullName: string;
  email: string;
  role: Role;
  password?: string;
  confirmPassword?: string;
}

export interface CreateUserResponse extends User {
  message: string;
}

export interface UpdateUserResponse extends AuthenticatedUser {
  status: UserStatus;
  message: string;
}
