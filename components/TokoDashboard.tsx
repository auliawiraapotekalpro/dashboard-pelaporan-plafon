
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
        <div className="bg-white p-1 rounded-2xl shadow-sm flex gap-1 border border-slate-200">
          <button onClick={() => setActiveTab('FORM')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'FORM' ? 'bg-[#5850ec] text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
            Isi Laporan
          </button>
          <button onClick={() => setActiveTab('MONITORING')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'MONITORING' ? 'bg-[#5850ec] text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
            Monitoring Tiket
          </button>
        </div>
      </div>

      <main className="flex-1 w-full p-4 lg:p-6">
        {activeTab === 'FORM' ? (
          <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="p-8 border-b border-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Formulir Pelaporan</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Identitas</h3>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Toko</label>
                    <div className="bg-slate-100 border border-slate-200 p-3 rounded-xl text-slate-600 font-semibold text-xs">{user.name}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tanggal</label>
                    <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="w-full bg-white border border-slate-200 p-3 rounded-xl text-slate-700 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"/>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Indikator</h3>
                  <select required value={selectedIndicator} onChange={(e) => setSelectedIndicator(e.target.value)} className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs outline-none cursor-pointer">
                    <option value="">-- Pilih --</option>
                    {Object.keys(INDICATOR_MAP).map(key => <option key={key} value={key}>{key}</option>)}
                  </select>
                  {currentLogic && (
                    <div className="space-y-3">
                      <div className="p-3 bg-white rounded-xl border border-indigo-50">
                        <label className="block text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Resiko</label>
                        <p className={`font-black text-xs ${currentLogic.risk.includes('P1') ? 'text-red-600' : 'text-blue-600'}`}>{currentLogic.risk}</p>
                      </div>
                      <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                        <label className="block text-[9px] font-bold text-indigo-600 uppercase tracking-widest">Saran</label>
                        <p className="text-[10px] text-indigo-700 font-bold italic leading-relaxed whitespace-pre-line">{currentLogic.recommendation}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Lampiran</h3>
                  <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-white hover:border-indigo-400 cursor-pointer">
                    <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase text-center">Klik / Upload Foto</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {photos.map((src, idx) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-slate-200 relative group">
                        <img src={src} className="w-full h-full object-cover" alt="Preview" />
                        <button type="button" onClick={() => setPhotos(photos.filter((_, i) => i !== idx))} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg opacity-0 group-hover:opacity-100">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button type="submit" disabled={!selectedIndicator || isSubmitting} className="w-full py-4 rounded-2xl font-black text-xs tracking-widest bg-[#5850ec] text-white hover:bg-indigo-700 shadow-md">
                {isSubmitting ? "MEMPROSES..." : "KIRIM LAPORAN"}
              </button>
            </form>
          </div>
        ) : (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[1800px]">
                    <thead className="bg-[#f8fafc] text-[#94a3b8] text-[9px] font-black uppercase tracking-widest text-left">
                      <tr>
                        <th className="px-4 py-4 border-b border-slate-100 w-24">ID TIKET</th>
                        <th className="px-4 py-4 border-b border-slate-100 w-32">STATUS</th>
                        <th className="px-4 py-4 border-b border-slate-100 w-32 text-center">TGL LAPOR</th>
                        <th className="px-4 py-4 border-b border-slate-100 w-48">TOKO</th>
                        <th className="px-4 py-4 border-b border-slate-100 w-64">INDIKATOR</th>
                        <th className="px-4 py-4 border-b border-slate-100 w-24 text-center">RESIKO</th>
                        <th className="px-4 py-4 border-b border-slate-100 w-48">DAMPAK BISNIS</th>
                        <th className="px-4 py-4 border-b border-slate-100">REKOMENDASI</th>
                        <th className="px-4 py-4 border-b border-slate-100 w-48">FOTO DRIVE</th>
                        <th className="px-4 py-4 border-b border-slate-100 w-24 text-center">DEPT</th>
                        <th className="px-4 py-4 border-b border-slate-100 w-32 text-center">PIC</th>
                        <th className="px-4 py-4 border-b border-slate-100 w-32 text-center">RENCANA</th>
                        <th className="px-4 py-4 border-b border-slate-100 w-32 text-center">TARGET</th>
                        <th className="px-4 py-4 border-b border-slate-100 w-32 text-center">SELESAI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {reports.map((report) => {
                        const photoUrls = getPhotoUrls(report.photoUrls);
                        return (
                          <tr key={report.id} className="hover:bg-slate-50/30 transition duration-150">
                            <td className="px-4 py-4 font-bold text-[#5850ec] text-xs">{report.id}</td>
                            <td className="px-4 py-4">
                              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border w-fit ${report.status === ReportStatus.PENDING ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
                                 <div className={`w-1.5 h-1.5 rounded-full ${report.status === ReportStatus.PENDING ? 'bg-orange-400' : 'bg-green-400'}`}></div>
                                 <span className={`text-[9px] font-black uppercase tracking-wider ${report.status === ReportStatus.PENDING ? 'text-orange-600' : 'text-green-600'}`}>{report.status}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-[10px] font-bold text-slate-400 text-center">{report.date}</td>
                            <td className="px-4 py-4 font-black text-slate-800 text-xs leading-tight uppercase">{report.tokoName}</td>
                            <td className="px-4 py-4 text-[11px] text-slate-500 leading-relaxed">{report.indicator}</td>
                            <td className="px-4 py-4 text-center">
                               <div className={`inline-block px-2 py-1 rounded border text-[9px] font-black tracking-tighter ${report.riskLevel.includes('P1') ? 'bg-red-50 text-red-500 border-red-100' : 'bg-blue-50 text-blue-500 border-blue-100'}`}>
                                  {report.riskLevel.split(' - ')[0]}
                               </div>
                            </td>
                            <td className="px-4 py-4 text-[10px] text-slate-400 italic leading-snug">{report.businessImpact}</td>
                            <td className="px-4 py-4">
                               <div className="text-[10px] font-semibold text-slate-700 leading-relaxed whitespace-pre-line text-justify pr-4">
                                  {report.recommendation}
                               </div>
                            </td>
                            <td className="px-4 py-4">
                               <div className="flex flex-wrap gap-1.5">
                                  {photoUrls.length > 0 ? photoUrls.map((url, idx) => (
                                     <button 
                                        key={idx}
                                        onClick={() => window.open(url, '_blank')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5850ec] text-white rounded-lg hover:bg-indigo-700 transition text-[9px] font-black uppercase tracking-wider"
                                     >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                        FOTO {idx + 1}
                                     </button>
                                  )) : <span className="text-slate-300 font-bold text-[9px] italic">No Photos</span>}
                               </div>
                            </td>
                            <td className="px-4 py-4 text-[10px] text-center font-bold text-slate-300 italic">{report.department || '-'}</td>
                            <td className="px-4 py-4 text-[10px] text-center font-bold text-slate-300 italic">{report.pic || '-'}</td>
                            <td className="px-4 py-4 text-[10px] text-center font-bold text-slate-300 italic">{report.plannedDate || '-'}</td>
                            <td className="px-4 py-4 text-[10px] text-center font-bold text-slate-300 italic">{report.targetDate || '-'}</td>
                            <td className="px-4 py-4 text-[10px] text-center font-black text-green-500 italic">{report.completionDate || '-'}</td>
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
    </div>
  );
};

export default TokoDashboard;
