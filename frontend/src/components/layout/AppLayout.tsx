import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  HomeIcon,
  UsersIcon,
  BuildingOffice2Icon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  Squares2X2Icon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { config } from '../../lib/config';

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      current: location.pathname === '/dashboard',
    },
    {
      name: 'Leads',
      href: '/leads',
      icon: UsersIcon,
      current: location.pathname.startsWith('/leads'),
    },
    {
      name: 'Pipeline',
      href: '/pipeline',
      icon: ArrowsRightLeftIcon,
      current: location.pathname === '/pipeline',
    },
    {
      name: 'Projects',
      href: '/projects',
      icon: BuildingOffice2Icon,
      current: location.pathname.startsWith('/projects'),
    },
    {
      name: 'Automation',
      href: '/automation',
      icon: Squares2X2Icon,
      current: location.pathname.startsWith('/automation'),
    },
    {
      name: 'Templates',
      href: '/templates',
      icon: DocumentTextIcon,
      current: location.pathname.startsWith('/templates'),
    },
    {
      name: 'WhatsApp',
      href: '/whatsapp',
      icon: ChatBubbleLeftRightIcon,
      current: location.pathname.startsWith('/whatsapp'),
    },
  ];

  const settings = [
    {
      name: 'Users',
      href: '/users',
      icon: UsersIcon,
      current: location.pathname.startsWith('/users'),
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Cog6ToothIcon,
      current: location.pathname.startsWith('/settings'),
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getDisplayName = () => {
    if (!user) return '';
    return user.name.trim() || user.email.split('@')[0];
  };

  const getInitials = () => {
    if (!user) return '';
    const name = getDisplayName();
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo and close button */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">X</span>
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-900">
                {config.appName}
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            <div className="space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </NavLink>
              ))}
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200">
              <div className="space-y-1">
                {settings.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>
          </nav>

          {/* User menu */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                {getInitials()}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
              </div>
              <div className="relative">
                <button
                  onClick={handleLogout}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                  title="Logout"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation bar */}
        <div className="sticky top-0 z-10 flex h-16 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden px-4 border-r border-gray-200 text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>

          <div className="flex-1 px-4 flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-gray-900">
                {navigation.find(item => item.current)?.name || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                <span className="sr-only">View notifications</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158 11H9a6 6 0 10 12v1a2 2 0 002 2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
              </button>

              {/* User menu dropdown */}
              <div className="relative">
                <button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <span className="sr-only">Open user menu</span>
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                    {getInitials()}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;