import { AuthenticatedUser } from './user.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: AuthenticatedUser;
}

export interface LogoutResponse {
  message: string;
}

export interface AuthState {
  token: string | null;
  user: AuthenticatedUser | null;
  expiresAt: number | null;
}
