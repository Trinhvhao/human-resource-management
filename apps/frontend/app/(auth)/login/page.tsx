'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Shield, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getDefaultRouteForRole } from '@/utils/permissions';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });

      // Get user from store after successful login
      const user = useAuthStore.getState().user;

      // Role-based redirect
      if (user?.role) {
        const defaultRoute = getDefaultRouteForRole(user.role);
        router.push(defaultRoute);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      // Error can be ApiError object with message property
      const errorMessage = err?.message || err?.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (type: 'admin' | 'hr' | 'employee') => {
    if (type === 'admin') {
      setEmail('admin@company.com');
      setPassword('Password123!');
    } else if (type === 'hr') {
      setEmail('hr.manager@company.com');
      setPassword('Password123!');
    } else {
      // Get first employee user
      setEmail('emp001@company.com');
      setPassword('Password123!');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-brandBlue via-[#001a4d] to-[#002870] flex items-center justify-center p-4">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brandLightBlue/10 rounded-full blur-[120px] animate-float" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-[20%] right-[-5%] w-[40%] h-[60%] bg-secondary/20 rounded-full blur-[100px] animate-float" style={{ animationDuration: '10s' }}></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-[#002563]/50 rounded-full blur-[120px] animate-float" style={{ animationDuration: '12s' }}></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>

      <div className="w-full max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden md:block space-y-8"
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-gradient-to-br from-secondary to-brandRed rounded-2xl flex items-center justify-center shadow-2xl shadow-secondary/30">
              <Shield className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                <span className="text-secondary">HRMS</span> Pro
              </h1>
              <p className="text-brandLightBlue/70 text-sm">Quản lý nhân sự thông minh</p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Chào mừng bạn <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-brandRed to-brandLightBlue">
                đến với HRMS
              </span>
            </h2>
            <p className="text-brandLightBlue/80 text-lg leading-relaxed">
              Giải pháp quản lý nhân sự toàn diện, giúp doanh nghiệp tự động hóa 100% quy trình HR.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            {[
              'Quản lý nhân viên dễ dàng',
              'Chấm công tự động chính xác',
              'Tính lương nhanh chóng',
              'Báo cáo chi tiết real-time'
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-3 text-white/90"
              >
                <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center">
                  <CheckCircle2 size={14} className="text-secondary" />
                </div>
                <span className="text-brandLightBlue/90">{feature}</span>
              </motion.div>
            ))}
          </div>

          {/* Trust Badge */}
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
            <Sparkles className="text-secondary w-6 h-6" />
            <div>
              <p className="text-white font-semibold">200+ Doanh nghiệp tin dùng</p>
              <p className="text-brandLightBlue/70 text-sm">Được đánh giá 4.9/5 ⭐</p>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20">
            {/* Mobile Logo */}
            <div className="md:hidden flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary to-brandRed rounded-xl flex items-center justify-center">
                <Shield className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">
                  <span className="text-secondary">HRMS</span> Pro
                </h1>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-primary mb-2">Đăng nhập</h2>
              <p className="text-slate-500">Vui lòng nhập thông tin để tiếp tục</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg"
              >
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@company.com"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-brandBlue focus:bg-white transition-all text-primary placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-brandBlue focus:bg-white transition-all text-primary placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-brandBlue focus:ring-2 focus:ring-brandBlue/20"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                    Ghi nhớ tôi
                  </span>
                </label>
                <button
                  type="button"
                  className="text-sm text-secondary hover:text-brandRed transition-colors font-medium"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-secondary to-brandRed text-white font-semibold py-4 rounded-xl hover:shadow-lg hover:shadow-secondary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500">hoặc sử dụng tài khoản demo</span>
              </div>
            </div>

            {/* Demo Accounts */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => fillDemoAccount('admin')}
                  className="px-4 py-3 border-2 border-brandBlue/20 text-brandBlue rounded-xl hover:bg-brandBlue/5 hover:border-brandBlue transition-all font-medium text-sm flex items-center justify-center gap-2"
                >
                  <Shield size={16} />
                  <span>Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount('hr')}
                  className="px-4 py-3 border-2 border-secondary/20 text-secondary rounded-xl hover:bg-secondary/5 hover:border-secondary transition-all font-medium text-sm flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} />
                  <span>HR Manager</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => fillDemoAccount('employee')}
                className="w-full px-4 py-3 border-2 border-green-500/20 text-green-600 rounded-xl hover:bg-green-50 hover:border-green-500 transition-all font-medium text-sm flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} />
                <span>Employee</span>
              </button>
            </div>

            {/* Account Info */}
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs font-semibold text-blue-900 mb-2">📋 Thông tin tài khoản demo:</p>
              <div className="space-y-1 text-xs text-blue-700">
                <p>• <strong>Admin:</strong> admin@company.com</p>
                <p>• <strong>HR Manager:</strong> hr.manager@company.com</p>
                <p>• <strong>Employee:</strong> emp001@company.com</p>
                <p className="mt-2 pt-2 border-t border-blue-200">
                  🔑 <strong>Password:</strong> Password123!
                </p>
              </div>
            </div>

            {/* Footer Note */}
            <p className="text-center text-xs text-slate-400 mt-6">
              Bằng việc đăng nhập, bạn đồng ý với{' '}
              <a href="#" className="text-brandBlue hover:underline">Điều khoản sử dụng</a>
              {' '}và{' '}
              <a href="#" className="text-brandBlue hover:underline">Chính sách bảo mật</a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
