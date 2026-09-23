import { User } from './user.model';

export interface ToggleStatusDialogData {
  user: User;
  action: 'activate' | 'deactivate';
}

export interface ToggleStatusDialogResult {
  success: true;
  message: string;
}
