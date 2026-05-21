'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (mode === 'login') {
      const err = await signIn(email, password);
      if (err) setError(err);
      else router.push('/');
    } else {
      const err = await signUp(email, password);
      if (err) setError(err);
      else setSuccess('Đăng ký thành công! Kiểm tra email để xác nhận.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">🇯🇵 Nihongo App</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          {mode === 'login' ? 'Đăng nhập để đồng bộ dữ liệu' : 'Tạo tài khoản mới'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu (6+ ký tự)"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          {success && <p className="text-xs text-emerald-500 text-center">{success}</p>}

          <button type="submit" className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl shadow">
            {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </form>

        <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); }}
          className="w-full mt-4 text-sm text-indigo-500 text-center">
          {mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
        </button>
      </div>
    </div>
  );
}
