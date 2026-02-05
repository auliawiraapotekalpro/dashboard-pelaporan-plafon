
import React, { useState, useEffect } from 'react';
import { User, LeakReport } from './types';
import LoginPage from './components/LoginPage';
import TokoDashboard from './components/TokoDashboard';
import AdminDashboard from './components/AdminDashboard';

const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyUwPGo5FrnTbTXeFNKvVhwnSA-nVVZnZ9UY1ROrRgLlK2j3iW9GmJt_HNhTx6WZbgD1A/exec";

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

      if (Array.isArray(tickets)) {
        setReports(prev => {
          const serverTicketMap = new Map(tickets.map((t: any) => [String(t.id).trim().toUpperCase(), t]));
          const localOnlyTickets = prev.filter(p => !serverTicketMap.has(String(p.id).trim().toUpperCase()));
          return [...tickets, ...localOnlyTickets];
        });
      }
      
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
    // Optimistic UI update
    setReports(prev => [newReport, ...prev]);

    try {
      const response = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        mode: 'cors', 
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ 
          action: 'add', 
          data: newReport,
          emailType: 'NEW' // Pastikan trigger email 'NEW' terkirim
        })
      });
      
      if (response.ok) {
        console.log("Laporan terkirim dan email diproses backend.");
        setTimeout(fetchAllData, 3000);
      }
    } catch (e) {
      console.error("Gagal simpan tiket ke cloud:", e);
      setTimeout(fetchAllData, 5000);
    }
  };

  const handleUpdateReport = async (updatedReport: LeakReport, emailType?: string) => {
    setReports(prev => prev.map(r => 
      String(r.id).trim().toUpperCase() === String(updatedReport.id).trim().toUpperCase() 
      ? updatedReport : r
    ));

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
          Sinkronisasi Cloud Maintenance...
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} dbUsers={dbUsers} />;
  }

  const isAdmin = user.role && user.role.toUpperCase().includes('ADMIN');
  const myReports = !isAdmin 
    ? reports.filter(r => String(r.tokoId).trim().toLowerCase() === String(user.id).trim().toLowerCase())
    : reports;

  return (
    <div className="min-h-screen bg-[#f3f7fa]">
      {!isAdmin ? (
        <TokoDashboard 
          user={user} 
          reports={myReports}
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
