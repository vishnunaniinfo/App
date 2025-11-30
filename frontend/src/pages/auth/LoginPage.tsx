import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { LoginData } from '../../types';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginData>();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);

    try {
      await login(data);
      // Navigation will be handled by AuthContext
    } catch (error: any) {
      // Set form errors from API response
      if (error.response?.data?.error?.details) {
        error.response.data.error.details.forEach((detail: any) => {
          setError(detail.field, { message: detail.message });
        });
      } else if (error.response?.data?.error?.message) {
        setError('root', { message: error.response.data.error.message });
      } else {
        setError('root', { message: 'Login failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="children">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <div className="mt-1">
              <input
                {...register('email', {
                  required: 'Email address is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                type="email"
                autoComplete="email"
                className={`block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                }`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Password field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="mt-1 relative">
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                })}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={`block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 pr-10 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                }`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Root error */}
          {errors.root && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{errors.root.message}</p>
            </div>
          )}

          {/* Submit button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                isLoading ? 'cursor-wait' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {/* Forgot password link */}
          <div className="text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Register link */}
          <div className="text-center mt-4">
            <span className="text-sm text-gray-600">
              Don't have an account?{' '}
            </span>
            <Link
              to="/register"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              Sign up here
            </Link>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;