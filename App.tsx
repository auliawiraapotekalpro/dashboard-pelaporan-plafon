
import React, { useState, useEffect } from 'react';
import { User, LeakReport } from './types';
import LoginPage from './components/LoginPage';
import TokoDashboard from './components/TokoDashboard';
import AdminDashboard from './components/AdminDashboard';

const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzml9XVsvhST-y448PlWEzGU_hRPpc3OpzJ8NBmoRfVMd-m67EexpuL8ngr1c3rwjBhpQ/exec";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<LeakReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllData = async () => {
    if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL.includes("YOUR_ID_HERE")) {
      setIsLoading(false);
      return;
    }

    try {
      const [resTickets, resUsers] = await Promise.all([
        fetch(`${GAS_WEB_APP_URL}?sheet=Ticket`, { mode: 'cors' }),
        fetch(`${GAS_WEB_APP_URL}?sheet=Users`, { mode: 'cors' })
      ]);

      const tickets = await resTickets.json();
      const usersRaw = await resUsers.json();
      
      const users = Array.isArray(usersRaw) ? usersRaw.map((u: any) => ({
        ...u,
        name: u.name || u.id 
      })) : [];

      setReports(Array.isArray(tickets) ? tickets : []);
      setDbUsers(users);
    } catch (error) {
      console.error("Gagal sinkronisasi data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (selectedUser: User) => {
    setUser(selectedUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleAddReport = async (newReport: LeakReport) => {
    // Update local state immediately for better responsive UI
    setReports(prev => [newReport, ...prev]);

    try {
      // Menggunakan mode: 'cors' dengan text/plain adalah 'simple request' yang tidak memicu preflight OPTIONS,
      // namun memungkinkan browser mengikuti redirect (302) dari Google Apps Script dengan lebih stabil dibanding 'no-cors'.
      const response = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        mode: 'cors', 
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ 
          action: 'add', 
          data: newReport,
          emailType: 'NEW' 
        })
      });
      
      // Jika request berhasil dikirim
      if (response.ok) {
        // Beri waktu sejenak agar GAS memproses file Drive sebelum refresh data
        setTimeout(fetchAllData, 5000);
      }
    } catch (e) {
      // Jika terjadi error network (seperti 'Failed to fetch')
      console.error("Gagal simpan tiket:", e);
      // Tetap panggil fetchAllData setelah delay untuk memastikan sinkronisasi
      setTimeout(fetchAllData, 8000);
    }
  };

  const handleUpdateReport = async (updatedReport: LeakReport, emailType?: string) => {
    setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));

    try {
      await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ 
          action: 'update', 
          data: updatedReport,
          emailType: emailType 
        })
      });
      setTimeout(fetchAllData, 2000);
    } catch (e) {
      console.error("Gagal update tiket:", e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f3f7fa]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-opacity-25 border-r-indigo-600 mb-4"></div>
        <p className="text-slate-500 font-bold animate-pulse text-xs tracking-widest uppercase text-center">
          Menghubungkan ke Cloud Maintenance...<br/>
          <span className="text-[10px] opacity-50 font-normal">Sistem Email Otomatis Sedang Disiapkan</span>
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} dbUsers={dbUsers} />;
  }

  const isAdmin = user.role && user.role.toUpperCase().includes('ADMIN');

  return (
    <div className="min-h-screen bg-[#f3f7fa]">
      {!isAdmin ? (
        <TokoDashboard 
          user={user} 
          reports={reports.filter(r => r.tokoId === user.id)}
          onAddReport={handleAddReport}
          onLogout={handleLogout} 
        />
      ) : (
        <AdminDashboard 
          user={user} 
          reports={reports}
          onUpdateReport={handleUpdateReport}
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
};

export default App;
