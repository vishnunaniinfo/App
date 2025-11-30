import { useAuth } from '../contexts/AuthContext';
import { User, UserRole } from '../types';

// Custom hook for authentication
export const useAuth = () => {
  const auth = useAuth();

  // Helper functions
  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!auth.user) return false;
    if (Array.isArray(role)) {
      return role.includes(auth.user.role);
    }
    return auth.user.role === role;
  };

  const isAdmin = (): boolean => hasRole('ADMIN');
  const isManager = (): boolean => hasRole('MANAGER') || isAdmin();
  const isAgent = (): boolean => hasRole('AGENT');

  const canAccessUsers = (): boolean => isAdmin() || isManager();
  const canManageUsers = (): boolean => isAdmin();

  const canAccessProjects = (): boolean => isAdmin() || isManager() || isAgent();
  const canManageProjects = (): boolean => isAdmin() || isManager();

  const canAccessAllLeads = (): boolean => isAdmin() || isManager();
  const canAccessOwnLeads = (): boolean => isAgent();
  const canManageAllLeads = (): boolean => isAdmin() || isManager();
  const canManageOwnLeads = (): boolean => isAgent();

  const canAccessAutomation = (): boolean => isAdmin() || isManager();
  const canManageAutomation = (): boolean => isAdmin() || isManager();

  const canAccessTemplates = (): boolean => isAdmin() || isManager();
  const canManageTemplates = (): boolean => isAdmin() || isManager();

  const canAccessSettings = (): boolean => isAdmin();
  const canManageSettings = (): boolean => isAdmin();

  const canAccessDashboard = (): boolean => true; // All authenticated users

  const getDisplayName = (): string => {
    if (!auth.user) return '';
    return auth.user.name.trim() || auth.user.email.split('@')[0];
  };

  const getInitials = (): string => {
    if (!auth.user) return '';
    const name = getDisplayName();
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isActive = (): boolean => auth.user?.isActive ?? false;
  const isOnline = (): boolean => auth.isAuthenticated && isActive();

  // Get user permissions
  const getPermissions = () => ({
    // Users
    users: {
      read: canAccessUsers(),
      write: canManageUsers(),
      delete: canManageUsers(),
    },
    // Projects
    projects: {
      read: canAccessProjects(),
      write: canManageProjects(),
      delete: canManageProjects(),
    },
    // Leads
    leads: {
      readAll: canAccessAllLeads(),
      readOwn: canAccessOwnLeads(),
      writeAll: canManageAllLeads(),
      writeOwn: canManageOwnLeads(),
      delete: canManageAllLeads(),
    },
    // Automation
    automation: {
      read: canAccessAutomation(),
      write: canManageAutomation(),
      delete: canManageAutomation(),
    },
    // Templates
    templates: {
      read: canAccessTemplates(),
      write: canManageTemplates(),
      delete: canManageTemplates(),
    },
    // Dashboard
    dashboard: {
      read: canAccessDashboard(),
    },
    // Settings
    settings: {
      read: canAccessSettings(),
      write: canManageSettings(),
    },
  });

  // Check specific permission
  const hasPermission = (resource: string, action: string): boolean => {
    const permissions = getPermissions();
    return (permissions as any)[resource]?.[action] ?? false;
  };

  // Get role-based styling
  const getRoleStyles = () => {
    const role = auth.user?.role;
    switch (role) {
      case 'ADMIN':
        return {
          badge: 'bg-purple-100 text-purple-800',
          icon: 'crown',
        };
      case 'MANAGER':
        return {
          badge: 'bg-blue-100 text-blue-800',
          icon: 'shield',
        };
      case 'AGENT':
        return {
          badge: 'bg-green-100 text-green-800',
          icon: 'user',
        };
      default:
        return {
          badge: 'bg-gray-100 text-gray-800',
          icon: 'question',
        };
    }
  };

  // Check if user can perform action on specific resource
  const canPerformAction = (
    action: 'read' | 'write' | 'delete',
    resource: 'users' | 'projects' | 'leads' | 'automation' | 'templates' | 'dashboard' | 'settings',
    resourceOwnerId?: string
  ): boolean => {
    // Admins can do everything
    if (isAdmin()) return true;

    // Managers can manage most things except users
    if (isManager()) {
      if (resource === 'users' && action === 'write') return false;
      if (resource === 'users' && action === 'delete') return false;
      if (resource === 'settings' && action === 'write') return false;
      return true;
    }

    // Agents can only manage their own resources
    if (isAgent()) {
      // Can read their own leads
      if (resource === 'leads' && action === 'read' && resourceOwnerId === auth.user?.id) {
        return true;
      }
      // Can write/update their own leads
      if (resource === 'leads' && action === 'write' && resourceOwnerId === auth.user?.id) {
        return true;
      }
      // Can read dashboard
      if (resource === 'dashboard' && action === 'read') {
        return true;
      }
      // Can read automation and templates (view only)
      if ((resource === 'automation' || resource === 'templates') && action === 'read') {
        return true;
      }
    }

    return false;
  };

  return {
    ...auth,
    // Role helpers
    hasRole,
    isAdmin,
    isManager,
    isAgent,
    // Permission helpers
    canAccessUsers,
    canManageUsers,
    canAccessProjects,
    canManageProjects,
    canAccessAllLeads,
    canAccessOwnLeads,
    canManageAllLeads,
    canManageOwnLeads,
    canAccessAutomation,
    canManageAutomation,
    canAccessTemplates,
    canManageTemplates,
    canAccessSettings,
    canManageSettings,
    canAccessDashboard,
    // Utility helpers
    getDisplayName,
    getInitials,
    isActive,
    isOnline,
    getPermissions,
    hasPermission,
    getRoleStyles,
    canPerformAction,
  };
};

export default useAuth;