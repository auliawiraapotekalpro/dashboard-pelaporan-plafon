
import React, { useState } from 'react';
import { User, LeakReport, ReportStatus } from '../types';

interface AdminDashboardProps {
  user: User;
  reports: LeakReport[];
  onUpdateReport: (report: LeakReport, emailType?: string) => void;
  onLogout: () => void;
}

type AdminFilter = 'ALL' | 'PENDING' | 'SCHEDULED' | 'FINISHED';

const DEPARTMENTS = [
  'SITEDEV',
  'GA',
  'HENDRI',
  'SEPTIAN',
  'AREA MANAGER'
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, reports, onUpdateReport, onLogout }) => {
  const [filter, setFilter] = useState<AdminFilter>('ALL');

  const handleInlineChange = (id: string, updates: Partial<LeakReport>) => {
    const reportToUpdate = reports.find(r => r.id === id);
    if (reportToUpdate) {
      onUpdateReport({ ...reportToUpdate, ...updates });
    }
  };

  const handleOpenPhoto = (photoUrls: string[] | string) => {
    let urls: string[] = [];
    try {
      if (Array.isArray(photoUrls)) {
        urls = photoUrls;
      } else if (typeof photoUrls === 'string') {
        if (photoUrls.startsWith('[')) {
          urls = JSON.parse(photoUrls);
        } else if (photoUrls !== '-' && photoUrls !== '') {
          urls = [photoUrls];
        }
      }
    } catch (e) {
      if (typeof photoUrls === 'string' && photoUrls !== '-' && photoUrls !== '') {
        urls = [photoUrls];
      }
    }

    const validUrl = urls.find(u => u && u.startsWith('http'));
    if (validUrl) {
      window.open(validUrl, '_blank');
    } else {
      alert("Foto sedang diproses atau tidak tersedia di Drive.");
    }
  };

  const handleSubmitAction = (report: LeakReport) => {
    // Basic validation
    if (report.department === '-' || report.plannedDate === '-' || report.targetDate === '-') {
      alert('Silakan lengkapi Departement, Rencana Tgl, dan Target Selesai sebelum Submit.');
      return;
    }

    onUpdateReport({ 
      ...report, 
      status: ReportStatus.ON_PROGRESS,
      updatedAt: new Date().toLocaleString()
    }, 'SCHEDULED'); // Kirim pemicu email SCHEDULED
    alert('Rencana Perbaikan Berhasil di-Submit ke Toko!');
  };

  const handleFinishAction = (report: LeakReport) => {
    onUpdateReport({ 
      ...report, 
      status: ReportStatus.COMPLETED,
      completionDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      updatedAt: new Date().toLocaleString()
    }, 'COMPLETED'); // Kirim pemicu email COMPLETED
    alert('Tiket ditandai sebagai SELESAI!');
  };

  const filteredReports = reports.filter(r => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return r.status === ReportStatus.PENDING;
    if (filter === 'SCHEDULED') return r.status === ReportStatus.ON_PROGRESS;
    if (filter === 'FINISHED') return r.status === ReportStatus.COMPLETED;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f3f7fa] flex flex-col text-slate-700">
      {/* Header */}
      <header className="bg-[#5850ec] text-white px-8 py-4 flex justify-between items-center shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard Pelaporan Kebocoran Plafon</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
             <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Administrator</p>
             <p className="text-sm font-black">{user.name}</p>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-xl transition font-medium border border-white/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full p-6 flex flex-col gap-6">
        {/* Filters */}
        <div className="flex justify-center shrink-0">
          <div className="bg-white p-1.5 rounded-[2rem] shadow-sm flex gap-2 border border-slate-200">
            {(['ALL', 'PENDING', 'SCHEDULED', 'FINISHED'] as AdminFilter[]).map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`px-8 py-2.5 rounded-full text-[11px] font-black tracking-widest transition-all duration-300 ${filter === item ? 'bg-[#1e293b] text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Monitoring Table Card */}
        <div className="flex-1 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
          <div className="overflow-x-auto overflow-y-auto scrollbar-hide">
            <table className="w-full border-collapse min-w-[2600px]">
              <thead className="sticky top-0 z-10 bg-[#f8fafc] text-[#94a3b8] text-[10px] font-black uppercase tracking-widest text-left">
                <tr>
                  <th className="px-6 py-5 border-b border-slate-100">ID TIKET</th>
                  <th className="px-6 py-5 border-b border-slate-100">STATUS</th>
                  <th className="px-6 py-5 border-b border-slate-100">TGL LAPOR</th>
                  <th className="px-6 py-5 border-b border-slate-100">TOKO</th>
                  <th className="px-6 py-5 border-b border-slate-100">INDIKATOR</th>
                  <th className="px-6 py-5 border-b border-slate-100">RESIKO</th>
                  <th className="px-6 py-5 border-b border-slate-100">DAMPAK BISNIS</th>
                  <th className="px-6 py-5 border-b border-slate-100">REKOMENDASI</th>
                  <th className="px-6 py-5 border-b border-slate-100">FOTO DRIVE</th>
                  <th className="px-6 py-5 border-b border-slate-100">DEPARTEMENT</th>
                  <th className="px-6 py-5 border-b border-slate-100">PIC (AUTO)</th>
                  <th className="px-6 py-5 border-b border-slate-100">RENCANA TGL</th>
                  <th className="px-6 py-5 border-b border-slate-100">TARGET SELESAI</th>
                  <th className="px-6 py-5 border-b border-slate-100">AKSI ADMIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/50 transition duration-150 group">
                    <td className="px-6 py-8 font-black text-[#5850ec] text-sm whitespace-nowrap">{report.id}</td>
                    <td className="px-6 py-8">
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border w-fit font-black text-[10px] tracking-widest ${report.status === ReportStatus.PENDING ? 'bg-orange-50 border-orange-100 text-orange-600' : report.status === ReportStatus.ON_PROGRESS ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
                         <span className={`w-2 h-2 rounded-full ${report.status === ReportStatus.PENDING ? 'bg-orange-500' : report.status === ReportStatus.ON_PROGRESS ? 'bg-blue-500' : 'bg-green-500'} animate-pulse`}></span>
                         {report.status}
                      </div>
                    </td>
                    <td className="px-6 py-8 text-sm font-bold text-slate-500 whitespace-nowrap">{report.date}</td>
                    <td className="px-6 py-8 font-black text-slate-800 text-sm max-w-[200px] leading-tight whitespace-nowrap">{report.tokoName}</td>
                    <td className="px-6 py-8 text-sm text-slate-600 max-w-[350px] leading-relaxed">{report.indicator}</td>
                    <td className="px-6 py-8">
                       <div className={`px-3 py-2 rounded-xl border text-center min-w-[100px] ${report.riskLevel.includes('P1') ? 'bg-red-50 border-red-100 text-red-600' : report.riskLevel.includes('P2') ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                          <p className="text-[10px] font-black uppercase">{report.riskLevel.split(' - ')[0]}</p>
                          <p className="text-[9px] font-bold opacity-80 uppercase">{report.riskLevel.split(' - ')[1]}</p>
                       </div>
                    </td>
                    <td className="px-6 py-8 text-[11px] text-slate-400 italic font-medium max-w-[250px] leading-relaxed">
                       {report.businessImpact}
                    </td>
                    <td className="px-6 py-8 text-sm font-black text-slate-700 max-w-[300px] leading-relaxed">
                       {report.recommendation}
                    </td>
                    <td className="px-6 py-8">
                       <button 
                          onClick={() => handleOpenPhoto(report.photoUrls)}
                          className="flex items-center gap-2 px-5 py-3 bg-[#5850ec] text-white rounded-2xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 whitespace-nowrap"
                       >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          <span className="text-[11px] font-black tracking-widest uppercase">Cek Drive</span>
                       </button>
                    </td>

                    <td className="px-6 py-8">
                       <div className="relative min-w-[220px]">
                          <select 
                            value={report.department === '-' ? '' : report.department}
                            onChange={(e) => handleInlineChange(report.id, { department: e.target.value, pic: user.name.split(' (')[0] })}
                            className="w-full bg-white border-2 border-slate-100 p-4 rounded-2xl font-black text-indigo-600 text-xs focus:border-indigo-500 outline-none appearance-none transition cursor-pointer"
                          >
                             <option value="">-- Pilih --</option>
                             {DEPARTMENTS.map(dept => (
                               <option key={dept} value={dept}>{dept}</option>
                             ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </div>
                       </div>
                    </td>

                    <td className="px-6 py-8">
                       <div className="bg-indigo-50 border border-indigo-100 px-6 py-4 rounded-2xl flex items-center gap-3 min-w-[150px]">
                          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          <span className="text-xs font-black text-indigo-700 uppercase">
                            {report.pic !== '-' ? report.pic : user.name.split(' (')[0]}
                          </span>
                       </div>
                    </td>

                    <td className="px-6 py-8">
                       <input 
                         type="date"
                         value={report.plannedDate === '-' ? '' : report.plannedDate}
                         onChange={(e) => handleInlineChange(report.id, { plannedDate: e.target.value })}
                         className="bg-white border-2 border-slate-100 p-4 rounded-2xl font-black text-slate-600 text-xs focus:border-indigo-500 outline-none transition w-full min-w-[160px]"
                       />
                    </td>

                    <td className="px-6 py-8">
                       <input 
                         type="date"
                         value={report.targetDate === '-' ? '' : report.targetDate}
                         onChange={(e) => handleInlineChange(report.id, { targetDate: e.target.value })}
                         className="bg-white border-2 border-slate-100 p-4 rounded-2xl font-black text-slate-600 text-xs focus:border-indigo-500 outline-none transition w-full min-w-[160px]"
                       />
                    </td>

                    <td className="px-6 py-8">
                       <div className="flex items-center gap-3 min-w-[320px]">
                          <button 
                            disabled={report.status !== ReportStatus.PENDING}
                            onClick={() => handleSubmitAction(report)}
                            className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-[10px] tracking-widest transition shadow-lg ${report.status === ReportStatus.PENDING ? 'bg-[#2563eb] text-white hover:bg-blue-700 shadow-blue-100' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                          >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                             SUBMIT
                          </button>
                          <button className="flex items-center gap-2 bg-white border-2 border-slate-100 text-[#5850ec] px-6 py-4 rounded-2xl font-black text-[10px] tracking-widest hover:bg-slate-50 transition">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                             EDIT
                          </button>
                          <button 
                            disabled={report.status === ReportStatus.COMPLETED}
                            onClick={() => handleFinishAction(report)}
                            className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-[10px] tracking-widest transition shadow-lg ${report.status !== ReportStatus.COMPLETED ? 'bg-[#059669] text-white hover:bg-green-700 shadow-green-100' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                          >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             SELESAI
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
