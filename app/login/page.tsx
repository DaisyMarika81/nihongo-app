'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (username === 'admin' && password === '123456') {
      localStorage.setItem('nihongo_auth', 'true');
      router.push('/');
    } else {
      setError('Sai tài khoản hoặc mật khẩu');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">🇯🇵 Nihongo App</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Đăng nhập để sử dụng</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tài khoản"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          <button type="submit" className="w-full py-3 text-white font-semibold rounded-xl shadow" style={{ background: '#6C63FF' }}>
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
}
