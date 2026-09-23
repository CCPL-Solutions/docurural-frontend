import { Pipe, PipeTransform } from '@angular/core';
import { Role, ROLE_LABELS } from '../../core/models/role.model';

@Pipe({ name: 'roleLabel', pure: true })
export class RoleLabelPipe implements PipeTransform {
  transform(role: Role | null | undefined): string {
    return role ? ROLE_LABELS[role] : '';
  }
}
