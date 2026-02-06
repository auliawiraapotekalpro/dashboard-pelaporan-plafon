
import React, { useState, useEffect } from 'react';
import { User, LeakReport } from './types';
import LoginPage from './components/LoginPage';
import TokoDashboard from './components/TokoDashboard';
import AdminDashboard from './components/AdminDashboard';

/**
 * DAFTAR URL APP SCRIPT (FAILOVER SYSTEM)
 * Menggunakan URL yang diberikan oleh pengguna.
 */
const GAS_WEB_APP_URLS = [
  "https://script.google.com/macros/s/AKfycbwX8a08ZQgCX5aAZTutNmoJ2sHFZxTSHq82YpYpQqZOpSFlCWkJ3a-iGkyEYHuUoco6gA/exec",
  "https://script.google.com/macros/s/AKfycbzAjQqJbboHIZ5kMuTMZ-LDjO34c0q76RLfsNT4ZP51OGArHpjJxEYbRPM1o4WYT6o/exec",
  "https://script.google.com/macros/s/AKfycbzg8p2x5QzkNp4mN3Azyr70aV7ebOwXJrcrX_ZkLrHDSEPRBhLj9fusVeJJdOr-GQlWPA/exec",
]; 

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<LeakReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWithFailover = async (queryParam: string = "", options: RequestInit = {}): Promise<Response> => {
    let lastError: any = null;

    for (let i = 0; i < GAS_WEB_APP_URLS.length; i++) {
      const baseUrl = GAS_WEB_APP_URLS[i];
      if (!baseUrl) continue;

      const fullUrl = queryParam ? `${baseUrl}${queryParam}` : baseUrl;
      
      try {
        const response = await fetch(fullUrl, options);
        
        if (response.ok) {
          const clonedResponse = response.clone();
          const contentType = response.headers.get("content-type");
          
          if (contentType && contentType.includes("application/json")) {
            const result = await clonedResponse.json();
            if (result && result.status === "error") {
              console.warn(`API Index ${i} gagal secara internal: ${result.message}`);
              continue; 
            }
          }
          return response;
        }
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("Semua URL App Script gagal diakses.");
  };

  const fetchAllData = async () => {
    if (GAS_WEB_APP_URLS.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      const resTickets = await fetchWithFailover("?sheet=Ticket", { mode: 'cors' });
      const tickets = await resTickets.json();

      const resUsers = await fetchWithFailover("?sheet=Users", { mode: 'cors' });
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
    setReports(prev => [newReport, ...prev]);
    try {
      await fetchWithFailover("", {
        method: 'POST',
        mode: 'cors', 
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'add', data: newReport, emailType: 'NEW' })
      });
      setTimeout(fetchAllData, 3000);
    } catch (e) {
      alert("Gagal mengirim laporan. Cek koneksi atau limit email.");
    }
  };

  const handleUpdateReport = async (updatedReport: LeakReport, emailType?: string) => {
    setReports(prev => prev.map(r => 
      String(r.id).trim().toUpperCase() === String(updatedReport.id).trim().toUpperCase() ? updatedReport : r
    ));

    try {
      await fetchWithFailover("", {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'update', data: updatedReport, emailType: emailType })
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
        <p className="text-slate-500 font-bold animate-pulse text-xs tracking-widest uppercase">Sinkronisasi Cloud...</p>
      </div>
    );
  }

  if (!user) return <LoginPage onLogin={handleLogin} dbUsers={dbUsers} />;

  const isAdmin = user.role && user.role.toUpperCase().includes('ADMIN');
  const myReports = !isAdmin 
    ? reports.filter(r => String(r.tokoId).trim().toLowerCase() === String(user.id).trim().toLowerCase())
    : reports;

  return (
    <div className="min-h-screen bg-[#f3f7fa]">
      {!isAdmin ? (
        <TokoDashboard user={user} reports={myReports} onAddReport={handleAddReport} onLogout={handleLogout} />
      ) : (
        <AdminDashboard user={user} reports={reports} onUpdateReport={handleUpdateReport} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;
