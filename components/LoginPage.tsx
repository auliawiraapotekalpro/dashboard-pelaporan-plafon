
import React, { useState } from 'react';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
  dbUsers: User[];
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, dbUsers }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Mengurutkan user berdasarkan ID (nama toko) secara alfabetis
  const sortedUsers = [...dbUsers].sort((a, b) => a.id.localeCompare(b.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userInDb = dbUsers.find(u => u.id === selectedUserId);
    
    if (!userInDb) {
      setError('Silakan pilih akun terlebih dahulu');
      return;
    }

    if (password === userInDb.password) {
      onLogin(userInDb);
    } else {
      setError('Password salah. Silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f3f7fa]">
      <div className="flex flex-col items-center mb-8 text-center max-w-sm">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 leading-tight">Dashboard Pelaporan Kebocoran Plafon</h1>
      </div>

      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl p-10 border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pilih Toko / User</label>
            <div className="relative">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-2xl focus:ring-indigo-500 focus:border-indigo-500 block p-4 appearance-none cursor-pointer font-bold"
              >
                <option value="">-- PILIH AKUN --</option>
                {sortedUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.id} ({user.role})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-2xl focus:ring-indigo-500 focus:border-indigo-500 block p-4 font-mono"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 text-[10px] p-3 rounded-xl font-bold flex items-center gap-2 border border-red-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-4 rounded-2xl transition duration-200 shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs"
          >
            Masuk Sekarang
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
