import { Link } from 'react-router-dom';
import { config } from '../../lib/config';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">X</span>
            </div>
            <span className="ml-3 text-2xl font-bold text-gray-900">
              {config.appName}
            </span>
          </Link>
        </div>

        {/* Main content area */}
        <div className="bg-white py-8 px-6 shadow-lg rounded-lg sm:px-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome to {config.appName}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Real estate lead management with WhatsApp automation
            </p>
          </div>

          {/* Content will be rendered here */}
          <div className="space-y-6">
            {/* Children components will be rendered here */}
            <div className="children" />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            &copy; 2024 {config.appName}. All rights reserved.
          </p>
          <div className="flex justify-center space-x-6 mt-4">
            <a
              href="/terms"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Terms
            </a>
            <a
              href="/privacy"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Privacy
            </a>
            <a
              href="/support"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Support
            </a>
          </div>
        </div>
      </div>

      {/* Background pattern */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-100 opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-green-100 opacity-20 blur-3xl"></div>
        <svg className="absolute inset-0 h-full w-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </div>
  );
};

export default AuthLayout;