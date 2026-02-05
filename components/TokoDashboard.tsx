
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
    impact: "Operasional berhenti sebagian/total, risiko cedera manusia, kerugian stok masif.",
    urgency: "HIGH",
    recommendation: "Sterilisasi Area: Segera pasang pembatas (kursi/meja/tali) radius 2-3 meter dari titik plafon roboh. Jangan biarkan pasien atau staf melintas.\nSafety Shutdown: Jika air mengalir di dekat panel listrik, lampu, atau stopkontak, matikan MCB area tersebut segera. Jangan tunggu teknisi.\nEvakuasi Cold Chain: Jika bocor terjadi di dekat kulkas vaksin/obat, segera pindahkan unit atau pindahkan isi obat ke chiller lain yang aman. Stok obat mahal adalah prioritas utama.\nBuka Jalur Darurat: Jika akses masuk terhambat plafon roboh, arahkan alur masuk pelanggan lewat pintu samping atau buat counter darurat di area yang aman.\nTadah & Buang: Gunakan ember atau bak sampah besar untuk menampung kucuran air. Wajib dikosongkan secara berkala agar tidak tumpah dan membanjiri lantai."
  },
  "Bocor deras di area gudang/belakang, plafon melandai (tunggu roboh), air masuk ke area penjualan tapi belum mengenai stok.": {
    risk: "P2 - HIGH",
    impact: "Operasional terganggu, risiko kerusakan aset bangunan meningkat jika dibiarkan >24 jam.",
    urgency: "MEDIUM",
    recommendation: "Relokasi Stok: Pindahkan barang-barang di rak yang berada di bawah titik bocor. Geser minimal 1-2 meter ke area kering. Tutup rak dengan plastik/terpal jika tidak memungkinkan dipindah.\nMarking Area: Beri tanda pada lantai (misal: lakban) di batas rembesan air agar staf tidak terpeleset (slippery floor hazard).\nDokumentasi Live: Minta tim toko rekam video durasi 15 detik saat hujan deras untuk memperlihatkan debit air. Ini sangat membantu Sitedev menentukan kapasitas talang yang dibutuhkan.\nPembersihan Berkala: Segera pel lantai yang lembab atau terkena tetesan air agar tidak berlumut atau berbau."
  },
  "Rembesan air ( spotting), plafon berjamur, bocor hanya saat hujan sangat deras, area non-vital (toilet/parkir).": {
    risk: "P3 - MEDIUM",
    impact: "Estetika buruk, kenyamanan pelanggan terganggu, tapi bisnis tetap jalan.",
    urgency: "LOW",
    recommendation: "Marking Spot: Gunakan pensil/pulpen untuk melingkari batas bercak air di plafon dan tulis tanggalnya. Jika besok lingkaran itu meluas, berarti risiko naik ke P2.\nVentilasi: Jika area terasa lembab karena rembesan, pastikan AC tetap nyala atau gunakan exhaust fan untuk mencegah pertumbuhan jamur yang bisa merusak kualitas udara di apotek.\nCover Up: Jika bercak air terlihat kotor di area depan, tutup sementara dengan informasi/poster promosi agar tidak terlihat kumuh oleh pelanggan, selama tidak membahayakan."
  }
};

const TokoDashboard: React.FC<TokoDashboardProps> = ({ user, reports, onAddReport, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('FORM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [photos, setPhotos] = useState<string[]>([]);

  const currentLogic = selectedIndicator ? INDICATOR_MAP[selectedIndicator] : null;

  const parseRecommendations = (text: string) => {
    if (!text || text === '-') return [];
    return text.split('\n').filter(line => line.trim().length > 0);
  };

  const formatDate = (dateStr: any) => {
    if (!dateStr || dateStr === '-' || dateStr === 'undefined' || dateStr === 'null' || dateStr === '') return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return String(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(date);
    } catch (e) { return String(dateStr); }
  };

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

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIndicator || isSubmitting || photos.length === 0) return;
    setIsSubmitting(true);

    const newReport: LeakReport = {
      id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      tokoId: user.id,
      tokoName: user.name,
      date: new Date(reportDate).toISOString(),
      location: "Berdasarkan Indikator",
      description: selectedIndicator,
      indicator: selectedIndicator,
      riskLevel: currentLogic?.risk || '',
      businessImpact: currentLogic?.impact || '',
      recommendation: currentLogic?.recommendation || '',
      urgency: currentLogic?.urgency || 'MEDIUM',
      status: ReportStatus.PENDING,
      photoUrls: photos,
      updatedAt: new Date().toISOString(),
      department: '-',
      pic: '-',
      plannedDate: '-',
      targetDate: '-',
      completionDate: '-',
      beritaAcara: '-'
    };

    try {
      await onAddReport(newReport);
      setIsSubmitting(false);
      setActiveTab('MONITORING');
      setSelectedIndicator('');
      setPhotos([]);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      alert("Gagal mengirim laporan.");
    }
  };

  const getPhotoUrls = (photoData: any): string[] => {
    if (Array.isArray(photoData)) return photoData;
    if (typeof photoData === 'string') {
      try { if (photoData.startsWith('[')) return JSON.parse(photoData); } catch (e) {}
      return [photoData];
    }
    return [];
  };

  return (
    <div className="h-screen w-screen bg-[#f3f7fa] flex flex-col text-slate-700 overflow-hidden">
      <header className="bg-[#5850ec] text-white px-8 py-4 flex justify-between items-center shadow-lg shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard Pelapor Toko</h1>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-xl transition font-medium text-xs uppercase tracking-widest">
          Logout
        </button>
      </header>

      <div className="flex justify-center py-4 bg-white/50 border-b border-slate-200 shrink-0 z-20">
        <div className="bg-white p-1 rounded-full shadow-md flex gap-1 border border-slate-200">
          <button onClick={() => setActiveTab('FORM')} className={`px-8 py-2 rounded-full text-[10px] font-black tracking-widest transition-all ${activeTab === 'FORM' ? 'bg-[#5850ec] text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
            Isi Laporan
          </button>
          <button onClick={() => setActiveTab('MONITORING')} className={`px-8 py-2 rounded-full text-[10px] font-black tracking-widest transition-all ${activeTab === 'MONITORING' ? 'bg-[#5850ec] text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
            Monitoring Tiket
          </button>
        </div>
      </div>

      <main className="flex-1 w-full overflow-hidden p-4">
        {activeTab === 'FORM' ? (
          <div className="h-full overflow-y-auto pb-10">
            <form onSubmit={handleSubmit} className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
               <div className="bg-white rounded-[2rem] shadow-lg p-6 border border-slate-100 flex flex-col gap-4">
                  <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-sm">1</span>
                    Identitas
                  </h3>
                  <div className="bg-slate-50 p-4 rounded-xl text-xs font-bold text-slate-500 uppercase">{user.name}</div>
                  <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
               </div>

               <div className="bg-white rounded-[2rem] shadow-lg p-6 border border-slate-100 flex flex-col gap-4">
                  <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm">2</span>
                    Masalah
                  </h3>
                  <select value={selectedIndicator} onChange={(e) => setSelectedIndicator(e.target.value)} className="w-full bg-white border border-slate-200 p-4 rounded-xl text-[10px] font-bold outline-none h-14">
                      <option value="">-- Pilih Indikator --</option>
                      {Object.keys(INDICATOR_MAP).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                  {currentLogic && (
                    <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                        <p className="text-[9px] font-black text-indigo-500 uppercase mb-1">Resiko & Dampak</p>
                        <p className="text-xs font-black text-indigo-800 mb-1">{currentLogic.risk}</p>
                        <p className="text-[10px] text-indigo-600 italic font-medium leading-relaxed">{currentLogic.impact}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2">Rekomendasi Tindakan :</p>
                        {parseRecommendations(currentLogic.recommendation).map((rec, i) => {
                          const [title, ...desc] = rec.split(':');
                          return (
                            <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 items-start">
                              <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[10px] shrink-0 mt-0.5 shadow-sm">
                                {i + 1}
                              </div>
                              <div>
                                <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{title}</p>
                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{desc.join(':')}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
               </div>

               <div className="bg-white rounded-[2rem] shadow-lg p-6 border border-slate-100 flex flex-col gap-4">
                  <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm">3</span>
                    Foto
                  </h3>
                  <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:border-indigo-400 transition cursor-pointer bg-slate-50">
                    <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812-1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Klik Upload</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {photos.map((src, idx) => (
                      <div key={idx} className="aspect-video rounded-xl overflow-hidden relative group">
                        <img src={src} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removePhoto(idx)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition">×</button>
                      </div>
                    ))}
                  </div>
               </div>
               <button type="submit" disabled={!selectedIndicator || isSubmitting || photos.length === 0} className={`md:col-span-3 py-4 rounded-2xl font-black text-xs tracking-widest uppercase transition ${!selectedIndicator || isSubmitting || photos.length === 0 ? 'bg-indigo-200 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100'}`}>
                {isSubmitting ? "MENGIRIM..." : "SUBMIT LAPORAN"}
               </button>
            </form>
          </div>
        ) : (
          <div className="h-full bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in duration-300">
             <div className="overflow-auto flex-1 scrollbar-custom">
                <table className="w-full border-collapse min-w-[3800px]">
                  <thead className="sticky top-0 z-10 bg-[#f8fafc] text-[#94a3b8] text-[9px] font-black uppercase tracking-widest text-left shadow-sm">
                    <tr>
                      <th className="px-6 py-4 border-b">ID TIKET</th>
                      <th className="px-6 py-4 border-b">STATUS</th>
                      <th className="px-6 py-4 border-b">TGL LAPOR</th>
                      <th className="px-6 py-4 border-b">NAMA TOKO</th>
                      <th className="px-6 py-4 border-b w-[400px]">INDIKATOR</th>
                      <th className="px-6 py-4 border-b">RESIKO</th>
                      <th className="px-6 py-4 border-b w-[300px]">DAMPAK BISNIS</th>
                      <th className="px-6 py-4 border-b w-[500px]">REKOMENDASI</th>
                      <th className="px-6 py-4 border-b text-center">FOTO DRIVE</th>
                      <th className="px-6 py-4 border-b">DEPARTEMEN</th>
                      <th className="px-6 py-4 border-b">PIC</th>
                      <th className="px-6 py-4 border-b">RENCANA</th>
                      <th className="px-6 py-4 border-b">TARGET</th>
                      <th className="px-6 py-4 border-b">TGL SELESAI</th>
                      <th className="px-6 py-4 border-b w-[400px]">BERITA ACARA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {reports.length === 0 ? (
                      <tr>
                        <td colSpan={15} className="px-6 py-20 text-center text-slate-300 font-bold italic uppercase tracking-widest">
                           Belum ada tiket yang dilaporkan.
                        </td>
                      </tr>
                    ) : (
                      reports.map((report) => {
                        const photoUrls = getPhotoUrls(report.photoUrls);
                        const recList = parseRecommendations(report.recommendation);
                        return (
                          <tr key={report.id} className="hover:bg-slate-50/50 transition align-top">
                            <td className="px-6 py-6 font-black text-[#5850ec] text-xs">{report.id}</td>
                            <td className="px-6 py-6">
                              <div className={`px-3 py-1 rounded-full border text-[8px] font-black uppercase inline-block ${report.status === ReportStatus.PENDING ? 'bg-orange-50 text-orange-600 border-orange-100' : report.status === ReportStatus.ON_PROGRESS ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-green-50 text-green-500 border-green-100'}`}>
                                {report.status}
                              </div>
                            </td>
                            <td className="px-6 py-6 text-[10px] font-bold text-slate-400">{formatDate(report.date)}</td>
                            <td className="px-6 py-6 font-black text-slate-800 text-xs uppercase leading-tight">{report.tokoName}</td>
                            <td className="px-6 py-6 text-[10px] font-semibold text-slate-600 max-w-[300px] leading-relaxed">{report.indicator}</td>
                            <td className="px-6 py-6">
                              <div className={`px-3 py-1 rounded text-[9px] font-black tracking-widest border ${
                                (report.riskLevel || '').includes('P1') ? 'bg-red-50 text-red-600 border-red-100' : 
                                (report.riskLevel || '').includes('P2') ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                                'bg-blue-50 text-blue-600 border-blue-100'
                              }`}>
                                {(report.riskLevel || '').split(' - ')[0]}
                              </div>
                            </td>
                            <td className="px-6 py-6 text-[10px] text-slate-400 italic font-medium leading-relaxed pr-6">{report.businessImpact || '-'}</td>
                            <td className="px-6 py-6">
                              <div className="space-y-2 max-w-[450px]">
                                {recList.length > 0 ? recList.map((item, i) => {
                                  const [t, ...d] = item.split(':');
                                  return (
                                    <div key={i} className="flex gap-2 items-start">
                                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0 mt-1.5" />
                                      <p className="text-[10px] leading-relaxed text-slate-600">
                                        <span className="font-black text-slate-800 uppercase text-[9px]">{t}:</span> {d.join(':')}
                                      </p>
                                    </div>
                                  );
                                }) : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-6 text-center">
                              <div className="flex flex-col gap-1.5 min-w-[100px] items-center">
                                {photoUrls.length > 0 ? photoUrls.map((url, idx) => (
                                  <button key={idx} onClick={() => window.open(url, '_blank')} className="px-3 py-1.5 bg-[#5850ec] text-white rounded-lg hover:bg-indigo-700 transition text-[8px] font-black uppercase flex items-center justify-center gap-1.5 w-full">
                                    FOTO {idx + 1}
                                  </button>
                                )) : <span className="text-slate-300 font-bold text-[8px] italic">No Photo</span>}
                              </div>
                            </td>
                            <td className="px-6 py-6 text-xs font-black text-slate-800 uppercase">{report.department || '-'}</td>
                            <td className="px-6 py-6 text-xs font-black text-slate-800 uppercase">{report.pic || '-'}</td>
                            <td className="px-6 py-6 text-[10px] font-black text-indigo-500 whitespace-nowrap">{formatDate(report.plannedDate)}</td>
                            <td className="px-6 py-6 text-[10px] font-black text-orange-500 whitespace-nowrap">{formatDate(report.targetDate)}</td>
                            <td className="px-6 py-6 text-[10px] font-black text-green-500 whitespace-nowrap">{formatDate(report.completionDate)}</td>
                            <td className="px-6 py-6">
                               <div className="text-[10px] font-medium text-slate-500 italic max-w-[350px] leading-relaxed break-words">
                                {report.beritaAcara || '-'}
                               </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        )}
      </main>
      <style>{`
        .scrollbar-custom::-webkit-scrollbar { width: 8px; height: 8px; }
        .scrollbar-custom::-webkit-scrollbar-track { background: #f1f5f9; }
        .scrollbar-custom::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default TokoDashboard;
