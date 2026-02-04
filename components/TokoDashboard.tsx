
import React, { useState } from 'react';
import { User, LeakReport, ReportStatus } from '../types';

interface TokoDashboardProps {
  user: User;
  reports: LeakReport[];
  onAddReport: (report: LeakReport) => void;
  onLogout: () => void;
}

type Tab = 'FORM' | 'MONITORING';

interface IndicatorData {
  risk: string;
  impact: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
}

const INDICATOR_MAP: Record<string, IndicatorData> = {
  "Plafon roboh di area publik/apoteker, kabel terbakar, atau bocor tepat di atas stok obat mahal/kulkas vaksin.": {
    risk: "P1 - CRITICAL",
    impact: "Operasional berhenti sebagian/total, risiko cadera manusia, kerugian stok masif.",
    urgency: "HIGH",
    recommendation: "• Sterilisasi Area: Segera pasang pembatas (kursi/meja/tali) radius 2-3 meter dari titik plafon roboh. Jangan biarkan pasien atau staf melintas.\n• Safety Shutdown: Jika air mengalir di dekat panel listrik, lampu, atau stopkontak, matikan MCB area tersebut segera. Jangan tunggu teknisi.\n• Evakuasi Cold Chain: Jika bocor terjadi di dekat kulkas vaksin/obat, segera pindahkan unit atau pindahkan isi obat ke chiller lain yang aman. Stok obat mahal adalah prioritas utama.\n• Buka Jalur Darurat: Jika akses masuk terhambat plafon roboh, arahkan alur masuk pelanggan lewat pintu samping atau buat counter darurat di area yang aman."
  },
  "Bocor deras di area gudang/belakang, plafon melandai (tunggu roboh), air masuk ke area penjualan tapi belum mengenai stok.": {
    risk: "P2 - HIGH",
    impact: "Operasional terganggu, risiko kerusakan aset bangunan meningkat jika dibiarkan >24 jam.",
    urgency: "MEDIUM",
    recommendation: "• Tadah & Buang: Gunakan ember atau bak sampah besar untuk menampung kucuran air. Wajib dikosongkan secara berkala agar tidak tumpah dan membanjiri lantai.\n• Relokasi Stok: Pindahkan barang-barang di rak yang berada di bawah titik bocor. Geser minimal 1-2 meter ke area kering. Tutup rak dengan plastik/terpal jika tidak memungkinkan dipindah.\n• Marking Area: Beri tanda pada lantai (misal: lakban) di batas rembesan air agar staf tidak terpeleset (slippery floor hazard).\n• Dokumentasi Live: Minta tim toko rekam video durasi 15 detik saat hujan deras untuk memperlihatkan debit air. Ini sangat membantu Sitedev menentukan kapasitas talang yang dibutuhkan."
  },
  "Rembesan air ( spotting), plafon berjamur, bocor hanya saat hujan sangat deras, area non-vital (toilet/parkir).": {
    risk: "P3 - MEDIUM",
    impact: "Estetika buruk, kenyamanan pelanggan terganggu, tapi bisnis tetap jalan.",
    urgency: "LOW",
    recommendation: "• Pembersihan Berkala: Segera pel lantai yang lembab atau terkena tetesan air agar tidak berlumut atau berbau.\n• Marking Spot: Gunakan pensil/pulpen untuk melingkari batas bercak air di plafon dan tulis tanggalnya. Jika besok lingkaran itu meluas, berarti risiko naik ke P2.\n• Ventilasi: Jika area terasa lembab karena rembesan, pastikan AC tetap nyala atau gunakan exhaust fan untuk mencegah pertumbuhan jamur yang bisa merusak kualitas udara di apotek.\n• Cover Up: Jika bercak air terlihat kotor di area depan, tutup sementara dengan informasi/poster promosi agar tidak terlihat kumuh oleh pelanggan, selama tidak membahayakan."
  }
};

const TokoDashboard: React.FC<TokoDashboardProps> = ({ user, reports, onAddReport, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('FORM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedIndicator, setSelectedIndicator] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [photos, setPhotos] = useState<string[]>([]);

  const currentLogic = selectedIndicator ? INDICATOR_MAP[selectedIndicator] : null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setPhotos(prev => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIndicator || isSubmitting) return;

    setIsSubmitting(true);

    const newReport: LeakReport = {
      id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      tokoId: user.id,
      tokoName: user.name,
      date: new Date(reportDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      location: "Berdasarkan Indikator",
      description: selectedIndicator,
      indicator: selectedIndicator,
      riskLevel: currentLogic?.risk || '',
      businessImpact: currentLogic?.impact || '',
      recommendation: currentLogic?.recommendation || '',
      urgency: currentLogic?.urgency || 'MEDIUM',
      status: ReportStatus.PENDING,
      photoUrls: photos.length > 0 ? photos : [],
      updatedAt: new Date().toLocaleString(),
      department: '-',
      pic: '-',
      plannedDate: '-',
      targetDate: '-',
      completionDate: '-'
    };

    try {
      await onAddReport(newReport);
      setTimeout(() => {
        setIsSubmitting(false);
        setActiveTab('MONITORING');
        setSelectedIndicator('');
        setPhotos([]);
      }, 1500);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      alert("Gagal mengirim laporan. Silakan coba lagi.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f7fa] flex flex-col text-slate-700">
      <header className="bg-[#5850ec] text-white px-8 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard Pelaporan Kebocoran Plafon</h1>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-xl transition font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Logout
        </button>
      </header>

      <div className="flex justify-center mt-6">
        <div className="bg-white p-1.5 rounded-2xl shadow-sm flex gap-1 border border-slate-200">
          <button onClick={() => setActiveTab('FORM')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'FORM' ? 'bg-[#5850ec] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
            Isi Laporan
          </button>
          <button onClick={() => setActiveTab('MONITORING')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'MONITORING' ? 'bg-[#5850ec] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
            Monitoring Tiket
          </button>
        </div>
      </div>

      <main className="flex-1 w-full p-6">
        {activeTab === 'FORM' ? (
          <div className="max-w-7xl mx-auto bg-white rounded-[2.5rem] shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-10 border-b border-slate-50">
              <h2 className="text-2xl font-bold text-slate-800">Formulir Pelaporan Kebocoran Plafon</h2>
              <p className="text-slate-400 mt-1">Lengkapi data laporan Anda secara bertahap.</p>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-6">
                  <h3 className="font-bold text-slate-700">Identitas</h3>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Nama Toko</label>
                    <div className="w-full bg-slate-100 border border-slate-200 p-4 rounded-2xl text-slate-600 font-semibold text-sm">{user.name}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Tanggal Pelaporan</label>
                    <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"/>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-6">
                  <h3 className="font-bold text-slate-700">Indikator Masalah</h3>
                  <select required value={selectedIndicator} onChange={(e) => setSelectedIndicator(e.target.value)} className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer">
                    <option value="">-- Pilih Indikator --</option>
                    {Object.keys(INDICATOR_MAP).map(key => <option key={key} value={key}>{key}</option>)}
                  </select>
                  {currentLogic && (
                    <div className="space-y-4">
                      <div className="p-4 bg-white rounded-2xl border border-indigo-100">
                        <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-1 tracking-widest">Level Resiko</label>
                        <p className={`font-bold ${currentLogic.risk.includes('P1') ? 'text-red-600' : currentLogic.risk.includes('P2') ? 'text-orange-600' : 'text-blue-600'}`}>{currentLogic.risk}</p>
                      </div>
                      <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-200">
                        <label className="block text-[10px] font-bold text-indigo-600 uppercase mb-1 tracking-widest">Rekomendasi Tindakan</label>
                        <p className="text-[10px] text-indigo-700 font-bold italic whitespace-pre-line leading-relaxed">{currentLogic.recommendation}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-6">
                  <h3 className="font-bold text-slate-700">Upload Foto</h3>
                  <div className="relative border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 bg-white hover:border-indigo-400 transition cursor-pointer group">
                    <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <p className="text-xs font-bold text-slate-400 uppercase text-center">Klik atau Drag Foto ke Sini</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {photos.map((src, idx) => (
                      <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-slate-200 relative group">
                        <img src={src} className="w-full h-full object-cover" alt="Preview" />
                        <button type="button" onClick={() => setPhotos(photos.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button type="submit" disabled={!selectedIndicator || isSubmitting} className={`w-full py-5 rounded-3xl font-bold text-sm tracking-widest flex items-center justify-center gap-3 transition ${!selectedIndicator || isSubmitting ? 'bg-indigo-200 text-white cursor-not-allowed' : 'bg-[#5850ec] text-white hover:bg-indigo-700 shadow-lg'}`}>
                {isSubmitting ? "MENGIRIM LAPORAN..." : "SUBMIT LAPORAN"}
              </button>
            </form>
          </div>
        ) : (
          <div className="w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto scrollbar-hide">
                  <table className="w-full border-collapse min-w-[3000px]">
                    <thead className="bg-[#f8fafc] text-[#94a3b8] text-[10px] font-black uppercase tracking-widest text-left">
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
                        <th className="px-6 py-5 border-b border-slate-100">DEPARTEMEN</th>
                        <th className="px-6 py-5 border-b border-slate-100">PIC</th>
                        <th className="px-6 py-5 border-b border-slate-100">RENCANA TGL</th>
                        <th className="px-6 py-5 border-b border-slate-100">TARGET SELESAI</th>
                        <th className="px-6 py-5 border-b border-slate-100">TGL SELESAI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {reports.map((report) => {
                        const photoUrls = getPhotoUrls(report.photoUrls);
                        return (
                          <tr key={report.id} className="hover:bg-slate-50/50 transition duration-150">
                            <td className="px-6 py-6 font-bold text-[#5850ec] text-sm whitespace-nowrap">{report.id}</td>
                            <td className="px-6 py-6">
                              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border w-fit ${report.status === ReportStatus.PENDING ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
                                 <span className={`text-[10px] font-black uppercase tracking-wider ${report.status === ReportStatus.PENDING ? 'text-orange-600' : 'text-green-600'}`}>{report.status}</span>
                              </div>
                            </td>
                            <td className="px-6 py-6 text-sm font-semibold text-slate-500">{report.date}</td>
                            <td className="px-6 py-6 font-black text-slate-800 text-sm max-w-[200px] leading-tight">{report.tokoName}</td>
                            <td className="px-6 py-6 text-sm text-slate-600 max-w-[350px] leading-relaxed line-clamp-3">{report.indicator}</td>
                            <td className="px-6 py-6 text-center">
                               <div className={`px-2 py-1.5 rounded-lg border ${report.riskLevel.includes('P1') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                  <p className="text-[9px] font-black uppercase">{report.riskLevel.split(' - ')[0]}</p>
                               </div>
                            </td>
                            <td className="px-6 py-6 text-[11px] text-slate-400 italic font-medium max-w-[250px]">{report.businessImpact}</td>
                            <td className="px-6 py-6 min-w-[650px] max-w-[850px]">
                               <div className="text-[10px] font-bold text-slate-700 leading-relaxed whitespace-pre-line max-h-[160px] overflow-y-auto custom-scrollbar pr-2">
                                  {report.recommendation}
                               </div>
                            </td>
                            <td className="px-6 py-6">
                               <div className="flex flex-wrap gap-2 min-w-[150px]">
                                  {photoUrls.length > 0 ? photoUrls.map((url, idx) => (
                                     <button 
                                        key={idx}
                                        onClick={() => window.open(url, '_blank')}
                                        className="flex items-center gap-2 px-3 py-2 bg-[#5850ec] text-white rounded-xl hover:bg-indigo-700 transition shadow-sm whitespace-nowrap"
                                     >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                        <span className="text-[9px] font-black tracking-widest uppercase">Foto {idx + 1}</span>
                                     </button>
                                  )) : <span className="text-slate-300 font-bold text-[10px]">No Photo</span>}
                               </div>
                            </td>
                            <td className="px-6 py-6 text-sm text-center font-bold text-slate-700">{report.department || '-'}</td>
                            <td className="px-6 py-6 text-sm text-center font-bold text-slate-700">{report.pic || '-'}</td>
                            <td className="px-6 py-6 text-sm text-center font-bold text-slate-700">{report.plannedDate || '-'}</td>
                            <td className="px-6 py-6 text-sm text-center font-bold text-slate-700">{report.targetDate || '-'}</td>
                            <td className="px-6 py-6 text-sm text-center font-black text-green-500">{report.completionDate || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default TokoDashboard;
