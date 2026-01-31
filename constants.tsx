import { User, UserRole, LeakReport, ReportStatus } from './types';

export const MOCK_USERS: User[] = [
  { id: 'toko-1', name: 'APOTEK ALPRO AKSES UI (OUTLET)', role: UserRole.TOKO },
  { id: 'toko-2', name: 'APOTEK ALPRO VILLA PERMATA (PELAPOR)', role: UserRole.TOKO },
  { id: 'toko-3', name: 'APOTEK ALPRO WAHID HASYIM (PELAPOR)', role: UserRole.TOKO },
  { id: 'toko-4', name: 'APOTEK ALPRO WALANG BARU (PELAPOR)', role: UserRole.TOKO },
  { id: 'toko-5', name: 'APOTEK ALPRO WISATA CANADIAN (PELAPOR)', role: UserRole.TOKO },
  { id: 'toko-6', name: 'APOTEK ALPRO WISATA UTAMA (PELAPOR)', role: UserRole.TOKO },
  { id: 'toko-7', name: 'APOTEK ALPRO WR SUPRATMAN (PELAPOR)', role: UserRole.TOKO },
  { id: 'toko-8', name: 'APOTEK ALPRO ZAMRUD (PELAPOR)', role: UserRole.TOKO },
  { id: 'admin-1', name: 'BRAM (ADMIN)', role: UserRole.ADMIN },
  { id: 'admin-2', name: 'PRIMA (ADMIN)', role: UserRole.ADMIN },
  { id: 'admin-3', name: 'FACHMI (ADMIN)', role: UserRole.ADMIN },
  { id: 'admin-4', name: 'TANTO (ADMIN)', role: UserRole.ADMIN },
  { id: 'admin-5', name: 'DEDE (ADMIN)', role: UserRole.ADMIN },
  { id: 'admin-6', name: 'GHOZALI (ADMIN)', role: UserRole.ADMIN },
];

export const MOCK_REPORTS: LeakReport[] = [
  {
    id: 'TKT-7714',
    tokoId: 'toko-1',
    tokoName: 'APOTEK ALPRO AKSES UI (OUTLET)',
    date: '30 Jan 2026',
    location: 'Area Kasir',
    description: 'Plafon roboh di area publik/apoteker, kabel terbakar, atau bocor tepat di atas stok obat mahal/kulkas vaksin.',
    indicator: 'Plafon roboh di area publik/apoteker, kabel terbakar, atau bocor tepat di atas stok obat mahal/kulkas vaksin.',
    riskLevel: 'P1 - CRITICAL',
    businessImpact: 'Operasional berhenti sebagian/total, risiko cedera manusia, kerugian stok masif.',
    recommendation: 'Perbaikan darurat sumber kebocoran dan penggantian total plafon yang roboh.',
    urgency: 'HIGH',
    status: ReportStatus.PENDING,
    updatedAt: '30 Jan 2026 10:00',
    photoUrls: ['https://picsum.photos/seed/leak1/1200/800'],
    department: '-',
    pic: '-',
    plannedDate: '-',
    targetDate: '-',
    completionDate: '-'
  }
];