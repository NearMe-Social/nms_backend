import { Injectable } from '@nestjs/common';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class AdminPermissionsService {
  getPermissions() {
    // static permissions list for the admin permissions page
    const roles = Object.values(UserRole);

    const permissions = [
      { key: 'view_users', description: 'View user list' },
      { key: 'manage_users', description: 'Create/update/suspend users' },
      { key: 'view_reports', description: 'View reports' },
      { key: 'manage_reports', description: 'Update report status' },
      { key: 'view_flagged_content', description: 'View flagged content' },
      { key: 'manage_content', description: 'Take actions on content' },
      { key: 'manage_permissions', description: 'Manage roles and permissions' },
    ];

    return { roles, permissions };
  }
}
