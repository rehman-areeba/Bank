import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Clock,
  CreditCard,
} from 'lucide-react';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

const extractError = (err: any): string => {
  if (err?.message && !err.response) return err.message;
  const d = err?.response?.data;
  if (d?.errors?.length) return d.errors.map((e: any) => e.message).join(', ');
  return d?.detail || d?.message || d?.title || 'Registration failed. Please try again.';
};

const passwordRequirements = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p: string) => /[\W_]/.test(p) },
];

export const RegisterPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const mutation = useMutation({
    mutationFn: () => authService.register({ fullName, email, password, confirmPassword }),
    onSuccess: (data) => {
      login(data.token, data.user);
    },
    onError: (err: any) => {
      setError(extractError(err));
    },
  });

  const validateFullName = (name: string) => {
    if (!name.trim()) return 'Full name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    return '';
  };

  const validateEmail = (email: string) => {
    if (!email) return 'Email is required';
    if (!email.includes('@')) return 'Please enter a valid email';
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) return 'Password is required';
    const failedReqs = passwordRequirements.filter((req) => !req.test(password));
    if (failedReqs.length > 0) return 'Password does not meet requirements';
    return '';
  };

  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== password) return 'Passwords do not match';
    return '';
  };

  const fullNameError = touched.fullName ? validateFullName(fullName) : '';
  const emailError = touched.email ? validateEmail(email) : '';
  const passwordError = touched.password ? validatePassword(password) : '';
  const confirmPasswordError = touched.confirmPassword ? validateConfirmPassword(confirmPassword) : '';

  const isValid =
    !fullNameError &&
    !emailError &&
    !passwordError &&
    !confirmPasswordError &&
    fullName &&
    email &&
    password &&
    confirmPassword;

  const passwordStrength = passwordRequirements.filter((req) => req.test(password)).length;
  const strengthColor =
    passwordStrength <= 2 ? 'bg-red-500' : passwordStrength <= 3 ? 'bg-amber-500' : 'bg-emerald-500';
  const strengthLabel =
    passwordStrength <= 2 ? 'Weak' : passwordStrength <= 3 ? 'Medium' : 'Strong';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });

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
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-12 flex-col justify-between relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
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
              Start your financial journey today
            </h1>
            <p className="text-xl text-purple-100 mb-12">
              Join thousands of users who trust us with their financial future.
            </p>

            {/* Features */}
            <div className="space-y-6">
              {[
                {
                  icon: Clock,
                  title: 'Quick Setup',
                  desc: 'Get started in less than 2 minutes',
                },
                {
                  icon: CreditCard,
                  title: 'Multiple Accounts',
                  desc: 'Savings, checking, and business accounts',
                },
                {
                  icon: TrendingUp,
                  title: 'Smart Analytics',
                  desc: 'Track spending and manage budgets',
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-white mb-1">{item.title}</div>
                    <div className="text-sm text-purple-100">{item.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Testimonial */}
        <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-5 h-5 text-yellow-300 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            ))}
          </div>
          <p className="text-white mb-3">
            "SecureBank has transformed how I manage my finances. The interface is intuitive and the
            security features give me peace of mind."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-white">Sarah Johnson</div>
              <div className="text-sm text-purple-200">Business Owner</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-900">SecureBank</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-zinc-900 mb-2">Create your account</h2>
            <p className="text-zinc-600">Start managing your finances smarter</p>
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
                <p className="text-sm font-medium text-red-900">Registration failed</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name Field */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-zinc-700 mb-2">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={() => setTouched({ ...touched, fullName: true })}
                  placeholder="John Doe"
                  disabled={mutation.isPending}
                  className={`w-full pl-11 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                    fullNameError
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-zinc-300 focus:ring-blue-500/20 focus:border-blue-500'
                  } disabled:bg-zinc-50 disabled:cursor-not-allowed`}
                />
              </div>
              {fullNameError && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {fullNameError}
                </motion.p>
              )}
            </div>

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
                  placeholder="Create a strong password"
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

              {/* Password Strength Indicator */}
              {password && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strengthColor} transition-all duration-300`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-zinc-600">{strengthLabel}</span>
                  </div>

                  {/* Password Requirements */}
                  <div className="space-y-1">
                    {passwordRequirements.map((req, i) => {
                      const met = req.test(password);
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          {met ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-zinc-300" />
                          )}
                          <span className={met ? 'text-emerald-700' : 'text-zinc-500'}>
                            {req.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-zinc-700 mb-2"
              >
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setTouched({ ...touched, confirmPassword: true })}
                  placeholder="Re-enter your password"
                  disabled={mutation.isPending}
                  className={`w-full pl-11 pr-11 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                    confirmPasswordError
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-zinc-300 focus:ring-blue-500/20 focus:border-blue-500'
                  } disabled:bg-zinc-50 disabled:cursor-not-allowed`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {confirmPasswordError && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {confirmPasswordError}
                </motion.p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={mutation.isPending || !isValid}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 group"
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
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Terms */}
          <p className="mt-4 text-xs text-center text-zinc-500">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-indigo-600 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-indigo-600 hover:underline">
              Privacy Policy
            </a>
          </p>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-zinc-200" />
            <span className="text-sm text-zinc-500">or</span>
            <div className="flex-1 h-px bg-zinc-200" />
          </div>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-zinc-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Trust Badge */}
          <div className="mt-8 pt-8 border-t border-zinc-200">
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
              <Shield className="w-4 h-4" />
              <span>Your data is protected with bank-level security</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
