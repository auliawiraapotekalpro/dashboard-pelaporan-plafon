
import React, { useState } from 'react';
import { User, LeakReport, ReportStatus } from '../types';

interface AdminDashboardProps {
  user: User;
  reports: LeakReport[];
  onUpdateReport: (report: LeakReport, emailType?: string) => void;
  onLogout: () => void;
}

type AdminFilter = 'ALL' | 'PENDING' | 'SCHEDULED' | 'FINISHED';

const DEPARTMENTS = ['SITEDEV', 'GA', 'HENDRI', 'SEPTIAN', 'AREA MANAGER'];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, reports, onUpdateReport, onLogout }) => {
  const [filter, setFilter] = useState<AdminFilter>('ALL');

  const handleInlineChange = (id: string, updates: Partial<LeakReport>) => {
    const reportToUpdate = reports.find(r => r.id === id);
    if (reportToUpdate) {
      onUpdateReport({ ...reportToUpdate, ...updates });
    }
  };

  const getPhotoUrls = (photoData: string[] | string): string[] => {
    let urls: string[] = [];
    try {
      if (Array.isArray(photoData)) {
        urls = photoData;
      } else if (typeof photoData === 'string') {
        if (photoData.startsWith('[') || photoData.startsWith('["')) {
          urls = JSON.parse(photoData);
        } else if (photoData !== '-' && photoData !== '') {
          urls = [photoData];
        }
      }
    } catch (e) {
      if (typeof photoData === 'string' && photoData !== '-' && photoData !== '') {
        urls = [photoData];
      }
    }
    return urls.filter(u => u && (u.startsWith('http') || u.startsWith('data:')));
  };

  const handleSubmitAction = (report: LeakReport) => {
    if (report.department === '-' || report.plannedDate === '-' || report.targetDate === '-') {
      alert('Silakan lengkapi data sebelum Submit.');
      return;
    }
    onUpdateReport({ ...report, status: ReportStatus.ON_PROGRESS, updatedAt: new Date().toLocaleString() }, 'SCHEDULED');
    alert('Jadwal Perbaikan di-Submit!');
  };

  const handleFinishAction = (report: LeakReport) => {
    onUpdateReport({ ...report, status: ReportStatus.COMPLETED, completionDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }), updatedAt: new Date().toLocaleString() }, 'COMPLETED');
    alert('Tiket SELESAI!');
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
          <button onClick={onLogout} className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10 transition font-bold text-xs uppercase tracking-widest">Logout</button>
        </div>
      </header>

      <main className="flex-1 w-full p-6 flex flex-col gap-6">
        <div className="flex justify-center shrink-0">
          <div className="bg-white p-1.5 rounded-[2rem] shadow-sm flex gap-2 border border-slate-200">
            {(['ALL', 'PENDING', 'SCHEDULED', 'FINISHED'] as AdminFilter[]).map((item) => (
              <button key={item} onClick={() => setFilter(item)} className={`px-8 py-2.5 rounded-full text-[11px] font-black tracking-widest transition-all ${filter === item ? 'bg-[#1e293b] text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>{item}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
          <div className="overflow-x-auto overflow-y-auto scrollbar-hide">
            <table className="w-full border-collapse min-w-[3200px]">
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
                {filteredReports.map((report) => {
                  const photoUrls = getPhotoUrls(report.photoUrls);
                  return (
                    <tr key={report.id} className="hover:bg-slate-50/50 transition group">
                      <td className="px-6 py-8 font-black text-[#5850ec] text-sm">{report.id}</td>
                      <td className="px-6 py-8">
                        <div className={`px-4 py-2 rounded-xl border w-fit font-black text-[10px] tracking-widest ${report.status === ReportStatus.PENDING ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>{report.status}</div>
                      </td>
                      <td className="px-6 py-8 text-sm font-bold text-slate-500">{report.date}</td>
                      <td className="px-6 py-8 font-black text-slate-800 text-sm whitespace-nowrap">{report.tokoName}</td>
                      <td className="px-6 py-8 text-sm text-slate-600 max-w-[350px] leading-relaxed">{report.indicator}</td>
                      <td className="px-6 py-8">
                         <div className="px-3 py-2 rounded-xl border text-center font-black text-[10px] bg-red-50 text-red-600 uppercase tracking-widest">{report.riskLevel.split(' - ')[0]}</div>
                      </td>
                      <td className="px-6 py-8 text-[11px] text-slate-400 italic max-w-[250px] leading-relaxed">{report.businessImpact}</td>
                      <td className="px-6 py-8 min-w-[650px] max-w-[850px] text-[10px] font-black text-slate-700 leading-relaxed whitespace-pre-line overflow-y-auto max-h-[160px] custom-scrollbar pr-2">{report.recommendation}</td>
                      
                      <td className="px-6 py-8">
                         <div className="flex flex-wrap gap-2 min-w-[160px]">
                            {photoUrls.length > 0 ? photoUrls.map((url, idx) => (
                               <button 
                                  key={idx}
                                  onClick={() => window.open(url, '_blank')}
                                  className="flex items-center gap-2 px-4 py-2.5 bg-[#5850ec] text-white rounded-xl hover:bg-indigo-700 transition shadow-md whitespace-nowrap"
                               >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                  <span className="text-[10px] font-black tracking-widest uppercase">Foto {idx + 1}</span>
                               </button>
                            )) : <span className="text-slate-300 font-bold text-xs">No Photos</span>}
                         </div>
                      </td>

                      <td className="px-6 py-8">
                         <select value={report.department === '-' ? '' : report.department} onChange={(e) => handleInlineChange(report.id, { department: e.target.value, pic: user.name.split(' (')[0] })} className="w-full bg-white border-2 border-slate-100 p-4 rounded-2xl font-black text-xs cursor-pointer appearance-none">
                            <option value="">-- Pilih --</option>
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                         </select>
                      </td>
                      <td className="px-6 py-8 font-black text-indigo-700 text-xs text-center">{report.pic !== '-' ? report.pic : user.name.split(' (')[0]}</td>
                      <td className="px-6 py-8"><input type="date" value={report.plannedDate === '-' ? '' : report.plannedDate} onChange={(e) => handleInlineChange(report.id, { plannedDate: e.target.value })} className="bg-white border-2 border-slate-100 p-4 rounded-2xl text-xs w-full font-bold"/></td>
                      <td className="px-6 py-8"><input type="date" value={report.targetDate === '-' ? '' : report.targetDate} onChange={(e) => handleInlineChange(report.id, { targetDate: e.target.value })} className="bg-white border-2 border-slate-100 p-4 rounded-2xl text-xs w-full font-bold"/></td>
                      <td className="px-6 py-8">
                         <div className="flex gap-2 min-w-[200px]">
                            <button disabled={report.status !== ReportStatus.PENDING} onClick={() => handleSubmitAction(report)} className={`px-4 py-3 rounded-2xl font-black text-[10px] tracking-widest ${report.status === ReportStatus.PENDING ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}>SUBMIT</button>
                            <button disabled={report.status === ReportStatus.COMPLETED} onClick={() => handleFinishAction(report)} className="px-4 py-3 bg-green-600 text-white rounded-2xl font-black text-[10px] shadow-lg tracking-widest">SELESAI</button>
                         </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
