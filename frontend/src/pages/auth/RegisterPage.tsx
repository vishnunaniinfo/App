import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { RegisterData, UserRole } from '../../types';
import { EyeIcon, EyeSlashIcon, CheckIcon } from '@heroicons/react/24/outline';

export const RegisterPage = () => {
  const { register, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showBuilderFields, setShowBuilderFields] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<RegisterData>();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const password = watch('password');

  const onSubmit = async (data: RegisterData) => {
    setIsLoading(true);

    try {
      await register(data);
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
        setError('root', { message: 'Registration failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordRequirements = () => {
    const reqs = [
      { test: /[A-Z]/.test(password || ''), text: 'Uppercase letter' },
      { test: /[a-z]/.test(password || ''), text: 'Lowercase letter' },
      { test: /\d/.test(password || ''), text: 'Number' },
      { test: /[!@#$%^&*(),.?":{}|<>]/.test(password || ''), text: 'Special character' },
    ];

    return reqs;
  };

  return (
    <AuthLayout>
      <div className="children">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Name field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full name
            </label>
            <div className="mt-1">
              <input
                {...register('name', {
                  required: 'Name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters',
                  },
                  maxLength: {
                    value: 255,
                    message: 'Name must be less than 255 characters',
                  },
                })}
                type="text"
                autoComplete="name"
                className={`block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                }`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
          </div>

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
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Builder fields toggle */}
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-gray-700">
              I'm creating a new organization
            </label>
            <input
              type="checkbox"
              checked={showBuilderFields}
              onChange={(e) => setShowBuilderFields(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          {/* Builder name field */}
          {showBuilderFields && (
            <div>
              <label htmlFor="builderName" className="block text-sm font-medium text-gray-700 mb-1">
                Organization name
              </label>
              <div className="mt-1">
                <input
                  {...register('builderName', {
                    required: showBuilderFields ? 'Organization name is required' : false,
                    minLength: {
                      value: 2,
                      message: 'Organization name must be at least 2 characters',
                    },
                    maxLength: {
                      value: 255,
                      message: 'Organization name must be less than 255 characters',
                    },
                  })}
                  type="text"
                  autoComplete="organization"
                  className={`block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.builderName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="Enter your organization name"
                />
                {errors.builderName && (
                  <p className="mt-2 text-sm text-red-600">{errors.builderName.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Subdomain field */}
          {showBuilderFields && (
            <div>
              <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 mb-1">
                Subdomain
              </label>
              <div className="mt-1">
                <div className="flex">
                  <input
                    {...register('subdomain', {
                      required: showBuilderFields ? 'Subdomain is required' : false,
                      minLength: {
                        value: 3,
                        message: 'Subdomain must be at least 3 characters',
                      },
                      maxLength: {
                        value: 100,
                        message: 'Subdomain must be less than 100 characters',
                      },
                      pattern: {
                        value: /^[a-z0-9-]+$/,
                        message: 'Subdomain can only contain lowercase letters, numbers, and hyphens',
                      },
                    })}
                    type="text"
                    autoComplete="off"
                    className={`block w-full appearance-none rounded-l-md border border-gray-300 pl-3 pr-12 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.subdomain ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                    placeholder="my-company"
                  />
                  <div className="flex items-center bg-gray-50 px-3 py-2 border border-l-0 border-t border-b border-r border-gray-300 rounded-r-md text-gray-600 text-sm sm:text-sm">
                    .xavira.app
                  </div>
                </div>
                {errors.subdomain && (
                  <p className="mt-2 text-sm text-red-600">{errors.subdomain.message}</p>
                )}
              </div>
            </div>
          )}

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
                autoComplete="new-password"
                className={`block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 pr-10 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                }`}
                placeholder="Create a password"
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

            {/* Password requirements */}
            {password && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-2">Password must contain:</p>
                <div className="space-y-1">
                  {getPasswordRequirements().map((req, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center mr-2 ${
                        req.test ? 'bg-green-100' : 'bg-gray-200'
                      }`}>
                        {req.test && <CheckIcon className="h-3 w-3 text-green-600" />}
                      </div>
                      <span className={req.test ? 'text-green-700' : 'text-gray-500'}>
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </div>

          {/* Login link */}
          <div className="text-center mt-4">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
            </span>
            <Link
              to="/login"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              Sign in here
            </Link>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;