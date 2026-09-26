import { Role } from './role.model';
import { AuthenticatedUser, User } from './user.model';
import { UserStatus } from './user-status.model';

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
  canApprove: boolean;
}

export interface UpdateUserRequest {
  fullName: string;
  email: string;
  role: Role;
  password?: string;
  confirmPassword?: string;
  /** Si se omite, el backend conserva el valor actual (autoedición). */
  canApprove?: boolean;
}

export interface CreateUserResponse extends User {
  message: string;
}

export interface UpdateUserResponse extends AuthenticatedUser {
  status: UserStatus;
  /** Valor efectivo tras guardar: el backend lo retira al cambiar el rol a READER. */
  canApprove: boolean;
  message: string;
}

// Límites de validación compartidos con el backend (FRM-02).
export const MIN_FULL_NAME_LENGTH = 3;
export const MAX_FULL_NAME_LENGTH = 100;
export const MAX_EMAIL_LENGTH = 150;
export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;
