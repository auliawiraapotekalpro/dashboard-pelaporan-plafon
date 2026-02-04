
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
      alert('Silakan lengkapi data penjadwalan.');
      return;
    }
    onUpdateReport({ ...report, status: ReportStatus.ON_PROGRESS, updatedAt: new Date().toLocaleString() }, 'SCHEDULED');
    alert('Penjadwalan Berhasil!');
  };

  const handleFinishAction = (report: LeakReport) => {
    onUpdateReport({ ...report, status: ReportStatus.COMPLETED, completionDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }), updatedAt: new Date().toLocaleString() }, 'COMPLETED');
    alert('Tiket Selesai!');
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
          <button onClick={onLogout} className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10 transition font-bold text-[10px] uppercase tracking-widest">Logout</button>
        </div>
      </header>

      <main className="flex-1 w-full p-4 flex flex-col gap-4">
        <div className="flex justify-center">
          <div className="bg-white p-1 rounded-full shadow-sm flex gap-1 border border-slate-200">
            {(['ALL', 'PENDING', 'SCHEDULED', 'FINISHED'] as AdminFilter[]).map((item) => (
              <button key={item} onClick={() => setFilter(item)} className={`px-8 py-1.5 rounded-full text-[10px] font-black tracking-widest transition-all ${filter === item ? 'bg-[#1e293b] text-white' : 'text-slate-400 hover:bg-slate-50'}`}>{item}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto h-full">
            <table className="w-full border-collapse min-w-[2400px]">
              <thead className="sticky top-0 z-10 bg-[#f8fafc] text-[#94a3b8] text-[9px] font-black uppercase tracking-widest text-left">
                <tr>
                  <th className="px-4 py-5 border-b border-slate-100 w-24">ID TIKET</th>
                  <th className="px-4 py-5 border-b border-slate-100 w-32">STATUS</th>
                  <th className="px-4 py-5 border-b border-slate-100 w-32 text-center">TGL LAPOR</th>
                  <th className="px-4 py-5 border-b border-slate-100 w-48">TOKO</th>
                  <th className="px-4 py-5 border-b border-slate-100 w-[500px]">INDIKATOR</th>
                  <th className="px-4 py-5 border-b border-slate-100 w-24 text-center">RESIKO</th>
                  <th className="px-4 py-5 border-b border-slate-100 w-[400px]">DAMPAK BISNIS</th>
                  <th className="px-4 py-5 border-b border-slate-100 w-[600px]">REKOMENDASI</th>
                  <th className="px-4 py-5 border-b border-slate-100 w-48">FOTO DRIVE</th>
                  <th className="px-4 py-5 border-b border-slate-100 w-40">DEPT</th>
                  <th className="px-4 py-5 border-b border-slate-100 w-32">PIC</th>
                  <th className="px-4 py-5 border-b border-slate-100 w-32">RENCANA</th>
                  <th className="px-4 py-5 border-b border-slate-100 w-32">TARGET</th>
                  <th className="px-4 py-5 border-b border-slate-100 w-48">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredReports.map((report) => {
                  const photoUrls = getPhotoUrls(report.photoUrls);
                  return (
                    <tr key={report.id} className="hover:bg-slate-50/30 transition group align-top">
                      <td className="px-4 py-6 font-black text-[#5850ec] text-xs pt-8">{report.id}</td>
                      <td className="px-4 py-6 pt-8">
                        <div className={`px-2 py-1 rounded-full border text-[9px] font-black tracking-widest text-center ${report.status === ReportStatus.PENDING ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{report.status}</div>
                      </td>
                      <td className="px-4 py-6 text-[10px] font-bold text-slate-400 text-center pt-8">{report.date}</td>
                      <td className="px-4 py-6 font-black text-slate-800 text-xs uppercase leading-tight pt-8">{report.tokoName}</td>
                      
                      {/* Kolom Indikator - Dibuat menyamping dengan lebar yang cukup */}
                      <td className="px-4 py-6 text-[11px] text-slate-600 leading-relaxed pt-8 text-justify pr-6">
                        {report.indicator}
                      </td>

                      <td className="px-4 py-6 text-center pt-8">
                         <div className={`inline-block px-2 py-1 rounded border text-[9px] font-black tracking-widest ${report.riskLevel.includes('P1') ? 'bg-red-50 text-red-500 border-red-100' : 'bg-blue-50 text-blue-500 border-blue-100'}`}>
                           {report.riskLevel.split(' - ')[0]}<br/>
                           <span className="text-[7px] opacity-70">{report.riskLevel.split(' - ')[1]}</span>
                         </div>
                      </td>

                      {/* Kolom Dampak Bisnis - Dibuat menyamping agar tidak menumpuk */}
                      <td className="px-4 py-6 text-[10px] text-slate-400 italic leading-snug pt-8 text-justify pr-6">
                        {report.businessImpact}
                      </td>

                      <td className="px-4 py-6 text-[10px] font-semibold text-slate-700 leading-relaxed whitespace-pre-line text-justify pr-8 pt-8 overflow-y-auto max-h-[160px] custom-scrollbar">
                        {report.recommendation}
                      </td>
                      
                      <td className="px-4 py-6 pt-8">
                         <div className="flex flex-wrap gap-1">
                            {photoUrls.length > 0 ? photoUrls.map((url, idx) => (
                               <button key={idx} onClick={() => window.open(url, '_blank')} className="flex items-center gap-1 px-3 py-1.5 bg-[#5850ec] text-white rounded-lg hover:bg-indigo-700 transition text-[9px] font-black tracking-widest uppercase">
                                  FOTO {idx + 1}
                               </button>
                            )) : <span className="text-slate-300 font-bold text-[9px] italic">No Photos</span>}
                         </div>
                      </td>

                      <td className="px-4 py-6 pt-8">
                         <select value={report.department === '-' ? '' : report.department} onChange={(e) => handleInlineChange(report.id, { department: e.target.value, pic: user.name.split(' (')[0] })} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-[10px] font-bold cursor-pointer outline-none">
                            <option value="">-- Dept --</option>
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                         </select>
                      </td>
                      <td className="px-4 py-6 font-black text-indigo-700 text-[10px] text-center uppercase tracking-tighter pt-10">{report.pic !== '-' ? report.pic : '-'}</td>
                      <td className="px-4 py-6 pt-8"><input type="date" value={report.plannedDate === '-' ? '' : report.plannedDate} onChange={(e) => handleInlineChange(report.id, { plannedDate: e.target.value })} className="bg-white border border-slate-200 p-2 rounded-xl text-[10px] font-bold w-full outline-none"/></td>
                      <td className="px-4 py-6 pt-8"><input type="date" value={report.targetDate === '-' ? '' : report.targetDate} onChange={(e) => handleInlineChange(report.id, { targetDate: e.target.value })} className="bg-white border border-slate-200 p-2 rounded-xl text-[10px] font-bold w-full outline-none"/></td>
                      <td className="px-4 py-6 pt-8">
                         <div className="flex gap-1.5">
                            <button disabled={report.status !== ReportStatus.PENDING} onClick={() => handleSubmitAction(report)} className={`px-3 py-2 rounded-xl font-black text-[9px] tracking-widest ${report.status === ReportStatus.PENDING ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}>SUBMIT</button>
                            <button disabled={report.status === ReportStatus.COMPLETED} onClick={() => handleFinishAction(report)} className="px-3 py-2 bg-green-600 text-white rounded-xl font-black text-[9px] shadow-md tracking-widest">DONE</button>
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
