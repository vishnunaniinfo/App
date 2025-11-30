import { Link } from 'react-router-dom';
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {/* 404 icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <HomeIcon className="h-6 w-6 text-blue-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Page not found</h2>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for.
          </p>

          {/* Action buttons */}
          <div className="space-y-4">
            <Link
              to="/dashboard"
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <HomeIcon className="mr-2 h-4 w-4" />
              Go back home
            </Link>

            <button
              onClick={() => window.history.back()}
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;