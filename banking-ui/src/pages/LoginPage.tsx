import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  CheckCircle2,
  TrendingUp,
  Users,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

const extractError = (err: any): string => {
  if (err?.message && !err.response) return err.message;
  const d = err?.response?.data;
  if (d?.errors?.length) return d.errors.map((e: any) => e.message).join(', ');
  return d?.detail || d?.message || d?.title || 'Login failed. Please check your credentials.';
};

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const mutation = useMutation({
    mutationFn: () => authService.login({ email, password }),
    onSuccess: (data) => {
      login(data.token, data.user);
    },
    onError: (err: any) => {
      setError(extractError(err));
    },
  });

  const validateEmail = (email: string) => {
    if (!email) return 'Email is required';
    if (!email.includes('@')) return 'Please enter a valid email';
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  const emailError = touched.email ? validateEmail(email) : '';
  const passwordError = touched.password ? validatePassword(password) : '';
  const isValid = !emailError && !passwordError && email && password;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTouched({ email: true, password: true });

    if (!isValid) return;
    mutation.mutate();
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-between relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">SecureBank</span>
          </div>

          {/* Hero Content */}
          <div className="max-w-lg">
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              Banking built for the modern world
            </h1>
            <p className="text-xl text-blue-100 mb-12">
              Secure, fast, and intelligent financial management at your fingertips.
            </p>

            {/* Trust Indicators */}
            <div className="space-y-6">
              {[
                { icon: Shield, text: 'Bank-level security with 256-bit encryption' },
                { icon: Zap, text: 'Instant transfers and real-time notifications' },
                { icon: Users, text: 'Trusted by 50,000+ customers worldwide' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-blue-50">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-8">
          {[
            { label: 'Active Users', value: '50K+' },
            { label: 'Transactions', value: '1M+' },
            { label: 'Uptime', value: '99.9%' },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-blue-200">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-900">SecureBank</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-zinc-900 mb-2">Welcome back</h2>
            <p className="text-zinc-600">Sign in to access your account</p>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Authentication failed</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-zinc-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched({ ...touched, email: true })}
                  placeholder="you@example.com"
                  disabled={mutation.isPending}
                  className={`w-full pl-11 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                    emailError
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-zinc-300 focus:ring-blue-500/20 focus:border-blue-500'
                  } disabled:bg-zinc-50 disabled:cursor-not-allowed`}
                />
              </div>
              {emailError && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {emailError}
                </motion.p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-zinc-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched({ ...touched, password: true })}
                  placeholder="Enter your password"
                  disabled={mutation.isPending}
                  className={`w-full pl-11 pr-11 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                    passwordError
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-zinc-300 focus:ring-blue-500/20 focus:border-blue-500'
                  } disabled:bg-zinc-50 disabled:cursor-not-allowed`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordError && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {passwordError}
                </motion.p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={mutation.isPending || !isValid}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 group"
            >
              {mutation.isPending ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-zinc-200" />
            <span className="text-sm text-zinc-500">or</span>
            <div className="flex-1 h-px bg-zinc-200" />
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-zinc-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                Create account
              </Link>
            </p>
          </div>

          {/* Trust Badge */}
          <div className="mt-8 pt-8 border-t border-zinc-200">
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
              <Shield className="w-4 h-4" />
              <span>Protected by 256-bit SSL encryption</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
