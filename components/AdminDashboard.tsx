
import React, { useState } from 'react';
import { User, LeakReport, ReportStatus } from '../types';

interface AdminDashboardProps {
  user: User;
  reports: LeakReport[];
  onUpdateReport: (report: LeakReport, emailType?: string) => void;
  onLogout: () => void;
}

type AdminFilter = 'ALL' | 'PENDING' | 'SCHEDULED' | 'FINISHED';

const DEPARTMENTS = ['GA', 'SITEDEV'];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, reports, onUpdateReport, onLogout }) => {
  const [filter, setFilter] = useState<AdminFilter>('ALL');
  const [showDoneModal, setShowDoneModal] = useState(false);
  const [selectedReportForDone, setSelectedReportForDone] = useState<LeakReport | null>(null);
  const [workReportText, setWorkReportText] = useState('');

  const parseRecommendations = (text: string | undefined) => {
    if (!text || text === '-') return [];
    return text.split('\n').filter(line => line.trim().length > 0);
  };

  const handleInlineChange = (id: string, updates: Partial<LeakReport>) => {
    const reportToUpdate = reports.find(r => String(r.id).trim().toUpperCase() === String(id).trim().toUpperCase());
    if (reportToUpdate) {
      let finalUpdates = { ...updates };
      if (updates.department === 'GA') {
        finalUpdates.pic = 'BRAM';
      } else if (updates.department === 'SITEDEV') {
        finalUpdates.pic = 'MADA';
      }
      onUpdateReport({ ...reportToUpdate, ...finalUpdates });
    }
  };

  const getPhotoUrls = (photoData: any): string[] => {
    if (Array.isArray(photoData)) return photoData;
    if (typeof photoData === 'string') {
      try {
        if (photoData.startsWith('[')) return JSON.parse(photoData);
      } catch (e) {}
      return [photoData];
    }
    return [];
  };

  const handleSubmitAction = (report: LeakReport) => {
    if (!report.department || report.department === '-' || !report.plannedDate || report.plannedDate === '-' || !report.targetDate || report.targetDate === '-') {
      alert('Lengkapi Departemen, Rencana, dan Target sebelum Submit.');
      return;
    }
    onUpdateReport({ ...report, status: ReportStatus.ON_PROGRESS, updatedAt: new Date().toISOString() }, 'SCHEDULED');
    alert('Tiket Berhasil Di-Schedule / Submit!');
  };

  const handleEditSchedule = (report: LeakReport) => {
    if (!report.department || report.department === '-' || !report.plannedDate || report.plannedDate === '-' || !report.targetDate || report.targetDate === '-') {
      alert('Lengkapi Departemen, Rencana, dan Target sebelum melakukan perubahan jadwal.');
      return;
    }
    onUpdateReport({ ...report, updatedAt: new Date().toISOString() }, 'SCHEDULED');
    alert('Jadwal pengerjaan berhasil diperbarui!');
  };

  const openDoneModal = (report: LeakReport) => {
    if (report.status === ReportStatus.PENDING) {
      alert('Mohon klik SUBMIT terlebih dahulu untuk menjadwalkan sebelum menyelesaikan pengerjaan.');
      return;
    }
    setSelectedReportForDone(report);
    setWorkReportText('');
    setShowDoneModal(true);
  };

  const handleConfirmFinish = () => {
    if (!workReportText.trim() || workReportText.trim().length < 10) {
      alert('Berita Acara wajib diisi (minimal 10 karakter) untuk menjelaskan detail pengerjaan!');
      return;
    }
    if (selectedReportForDone) {
      onUpdateReport({ 
        ...selectedReportForDone, 
        status: ReportStatus.COMPLETED, 
        beritaAcara: workReportText, 
        completionDate: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      }, 'COMPLETED');
      
      setShowDoneModal(false);
      setSelectedReportForDone(null);
      alert('Tiket Berhasil Diselesaikan!');
    }
  };

  const filteredReports = reports.filter(r => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return r.status === ReportStatus.PENDING;
    if (filter === 'SCHEDULED') return r.status === ReportStatus.ON_PROGRESS;
    if (filter === 'FINISHED') return r.status === ReportStatus.COMPLETED;
    return true;
  });

  const formatToInputDate = (dateStr: string | undefined) => {
    if (!dateStr || dateStr === '-' || dateStr === 'undefined') return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch { return ''; }
  };

  return (
    <div className="h-screen w-screen bg-[#f3f7fa] flex flex-col text-slate-700 overflow-hidden">
      <header className="bg-[#5850ec] text-white px-8 py-4 flex justify-between items-center shadow-lg shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard Pelaporan Kebocoran Plafon</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
             <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest leading-none mb-1">ADMINISTRATOR</p>
             <p className="text-sm font-black uppercase tracking-wider">{user.name}</p>
          </div>
          <button onClick={onLogout} className="px-6 py-2 rounded-xl border-2 border-white/30 hover:bg-white/10 transition font-black text-[10px] uppercase tracking-widest">LOGOUT</button>
        </div>
      </header>

      <div className="flex justify-center py-6 bg-white/50 border-b border-slate-200 shrink-0 z-20">
        <div className="bg-white p-1 rounded-full shadow-lg flex gap-1 border border-slate-200 min-w-[600px]">
          {(['ALL', 'PENDING', 'SCHEDULED', 'FINISHED'] as AdminFilter[]).map((item) => (
            <button 
              key={item} 
              onClick={() => setFilter(item)} 
              className={`flex-1 py-3 rounded-full text-[10px] font-black tracking-widest transition-all ${filter === item ? 'bg-[#1e293b] text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 w-full overflow-hidden flex flex-col p-6">
        <div className="flex-1 bg-white rounded-[1.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1 scrollbar-custom">
            <table className="w-full border-collapse min-w-[3800px]">
              <thead className="sticky top-0 z-10 bg-[#f8fafc] text-[#94a3b8] text-[10px] font-black uppercase tracking-widest text-left shadow-sm">
                <tr>
                  <th className="px-6 py-6 border-b border-slate-100">ID TIKET</th>
                  <th className="px-6 py-6 border-b border-slate-100">STATUS</th>
                  <th className="px-6 py-6 border-b border-slate-100">TGL LAPOR</th>
                  <th className="px-6 py-6 border-b border-slate-100">TOKO</th>
                  <th className="px-6 py-6 border-b border-slate-100 w-[450px]">INDIKATOR</th>
                  <th className="px-6 py-6 border-b border-slate-100 text-center">RESIKO</th>
                  <th className="px-6 py-6 border-b border-slate-100 w-[350px]">DAMPAK BISNIS</th>
                  <th className="px-6 py-6 border-b border-slate-100 w-[550px]">REKOMENDASI</th>
                  <th className="px-6 py-6 border-b border-slate-100 text-center">FOTO DRIVE</th>
                  <th className="px-6 py-6 border-b border-slate-100">DEPT</th>
                  <th className="px-6 py-6 border-b border-slate-100 text-center">PIC</th>
                  <th className="px-6 py-6 border-b border-slate-100">RENCANA</th>
                  <th className="px-6 py-6 border-b border-slate-100">TARGET</th>
                  <th className="px-6 py-6 border-b border-slate-100">AKSI</th>
                  <th className="px-6 py-6 border-b border-slate-100 w-[450px]">BERITA ACARA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredReports.map((report) => {
                  const photoUrls = getPhotoUrls(report.photoUrls);
                  const riskParts = (report.riskLevel || '').split(' - ');
                  const isPending = report.status === ReportStatus.PENDING;
                  const isCompleted = report.status === ReportStatus.COMPLETED;
                  const recList = parseRecommendations(report.recommendation);

                  return (
                    <tr key={report.id} className="hover:bg-slate-50/50 transition align-top">
                      <td className="px-6 py-10 font-black text-[#5850ec] text-sm">{report.id}</td>
                      <td className="px-6 py-10">
                        <div className={`px-4 py-2 rounded-full border text-[9px] font-black tracking-widest text-center flex items-center justify-center gap-1.5 ${report.status === ReportStatus.PENDING ? 'bg-orange-50 text-orange-600 border-orange-100' : report.status === ReportStatus.ON_PROGRESS ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                          {report.status}
                        </div>
                      </td>
                      <td className="px-6 py-10 text-[11px] font-bold text-slate-400 break-all w-[180px]">{report.date}</td>
                      <td className="px-6 py-10 font-black text-slate-800 text-xs uppercase leading-tight w-[200px]">{report.tokoName}</td>
                      <td className="px-6 py-10 text-[12px] text-slate-500 font-medium leading-relaxed pr-8">{report.indicator}</td>
                      <td className="px-6 py-10 text-center">
                         <div className={`inline-block px-4 py-2 rounded-lg border text-[10px] font-black tracking-widest uppercase ${
                           (report.riskLevel || '').includes('P1') ? 'bg-red-50 text-red-500 border-red-100' : 
                           (report.riskLevel || '').includes('P2') ? 'bg-blue-50 text-blue-500 border-blue-100' : 
                           'bg-blue-50 text-blue-500 border-blue-100'
                         }`}>
                           <div className="flex flex-col">
                             <span>{riskParts[0]}</span>
                             <span className="text-[8px] opacity-70">{riskParts[1]}</span>
                           </div>
                         </div>
                      </td>
                      <td className="px-6 py-10 text-[12px] text-slate-400 italic font-medium leading-relaxed pr-8">{report.businessImpact}</td>
                      <td className="px-6 py-10">
                         <div className="space-y-2.5 max-w-[500px]">
                            {recList.length > 0 ? recList.map((item, i) => {
                              const [t, ...d] = item.split(':');
                              return (
                                <div key={i} className="flex gap-2.5 items-start">
                                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0 mt-2" />
                                  <p className="text-[11px] leading-relaxed text-slate-600">
                                    <span className="font-black text-slate-800 uppercase text-[10px] tracking-tight">{t}:</span> {d.join(':')}
                                  </p>
                                </div>
                              );
                            }) : '-'}
                         </div>
                      </td>
                      <td className="px-6 py-10 text-center">
                         <div className="flex flex-col gap-2 min-w-[120px] items-center">
                            {photoUrls.length > 0 ? photoUrls.slice(0, 3).map((url, idx) => (
                               <button key={idx} onClick={() => window.open(url, '_blank')} className="px-4 py-2 bg-[#5850ec] text-white rounded-lg hover:bg-indigo-700 transition text-[9px] font-black uppercase flex items-center justify-center gap-2 w-full">
                                  FOTO {idx + 1}
                               </button>
                            )) : <span className="text-slate-300 font-bold text-[9px] italic">No Photo</span>}
                         </div>
                      </td>
                      <td className="px-6 py-10">
                         <select 
                          disabled={isCompleted}
                          value={report.department === '-' || !report.department ? '' : report.department} 
                          onChange={(e) => handleInlineChange(report.id, { department: e.target.value })} 
                          className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-[11px] font-black outline-none focus:border-indigo-500 transition h-12"
                         >
                            <option value="">-- Dept --</option>
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                         </select>
                      </td>
                      <td className="px-6 py-10 font-black text-indigo-700 text-[11px] text-center pt-14 uppercase">{report.pic && report.pic !== '-' ? report.pic : '-'}</td>
                      <td className="px-6 py-10">
                        <input 
                          disabled={isCompleted} 
                          type="date" 
                          value={formatToInputDate(report.plannedDate)} 
                          onChange={(e) => handleInlineChange(report.id, { plannedDate: e.target.value })} 
                          className="bg-white border border-slate-200 p-3 rounded-xl text-[11px] font-medium w-full outline-none h-12 focus:border-indigo-500"
                        />
                      </td>
                      <td className="px-6 py-10">
                        <input 
                          disabled={isCompleted} 
                          type="date" 
                          value={formatToInputDate(report.targetDate)} 
                          onChange={(e) => handleInlineChange(report.id, { targetDate: e.target.value })} 
                          className="bg-white border border-slate-200 p-3 rounded-xl text-[11px] font-medium w-full outline-none h-12 focus:border-indigo-500"
                        />
                      </td>
                      <td className="px-6 py-10">
                         <div className="flex gap-2 min-w-[280px]">
                            <button 
                              disabled={isCompleted}
                              className={`px-5 py-2.5 rounded-xl font-black text-[10px] tracking-widest uppercase transition shadow-lg ${isCompleted ? 'bg-slate-100 text-slate-300 shadow-none' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-100'}`}
                              onClick={() => handleEditSchedule(report)}
                            >
                              EDIT
                            </button>
                            <button 
                              disabled={!isPending} 
                              onClick={() => handleSubmitAction(report)} 
                              className={`px-5 py-2.5 rounded-xl font-black text-[10px] tracking-widest uppercase transition ${isPending ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100' : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'}`}
                            >
                              SUBMIT
                            </button>
                            <button 
                              disabled={isCompleted} 
                              onClick={() => openDoneModal(report)} 
                              className={`px-5 py-2.5 rounded-xl font-black text-[10px] tracking-widest uppercase transition ${isCompleted ? 'bg-slate-100 text-slate-300 shadow-none' : isPending ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-100'}`}
                            >
                              DONE
                            </button>
                         </div>
                      </td>
                      <td className="px-6 py-10">
                         <div className="text-[11px] font-medium text-slate-500 italic max-w-[400px] leading-relaxed break-words">
                           {report.beritaAcara && report.beritaAcara !== '-' ? report.beritaAcara : '-'}
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

      {showDoneModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-200">
             <div className="bg-green-600 p-8 text-white">
                <div className="flex items-center justify-between mb-2">
                   <h3 className="font-black text-lg tracking-widest uppercase">Konfirmasi Penyelesaian</h3>
                   <button onClick={() => setShowDoneModal(false)} className="hover:bg-white/20 p-2 rounded-full transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Tiket: {selectedReportForDone?.id} - {selectedReportForDone?.tokoName}</p>
             </div>
             
             <div className="p-10 space-y-8">
                <div className="space-y-4">
                   <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">Berita Acara / Laporan Hasil Pekerjaan <span className="text-red-500">*</span></label>
                   <textarea 
                     autoFocus
                     value={workReportText}
                     onChange={(e) => setWorkReportText(e.target.value)}
                     placeholder="Contoh: Telah dilakukan penggantian material plafon seluas 2m2, penutupan kebocoran atap dengan sealant, dan pengecekan kelistrikan area terdampak. Kondisi saat ini aman."
                     className="w-full h-52 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-6 text-sm font-medium text-slate-600 focus:border-green-500 focus:bg-white outline-none transition resize-none leading-relaxed"
                   />
                </div>

                <div className="flex gap-4">
                   <button onClick={() => setShowDoneModal(false)} className="flex-1 font-black py-4 rounded-2xl border-2 border-slate-100 text-slate-400 hover:bg-slate-50 transition uppercase tracking-widest text-[11px]">Batal</button>
                   <button disabled={!workReportText.trim() || workReportText.trim().length < 10} onClick={handleConfirmFinish} className={`flex-[2] font-black py-4 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-[11px] ${(!workReportText.trim() || workReportText.trim().length < 10) ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' : 'bg-green-600 hover:bg-green-700 text-white shadow-green-100'}`}>Selesaikan Tiket</button>
                </div>
             </div>
          </div>
        </div>
      )}
      <style>{`
        .scrollbar-custom::-webkit-scrollbar { width: 10px; height: 10px; }
        .scrollbar-custom::-webkit-scrollbar-track { background: #f1f5f9; }
        .scrollbar-custom::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
