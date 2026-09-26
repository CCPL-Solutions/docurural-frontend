import { Role } from './role.model';
import { UserStatus } from './user-status.model';

export interface AuthenticatedUser {
  id: number;
  fullName: string;
  email: string;
  role: Role;
}

export interface User extends AuthenticatedUser {
  status: UserStatus;
  createdAt: string;
  lastLogin: string | null;
  /** Puede aprobar documentos (HU-32). No viaja en la sesión: el backend lo valida al aprobar. */
  canApprove: boolean;
}
