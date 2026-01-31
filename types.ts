
export enum ReportStatus {
  PENDING = 'PENDING',
  ON_PROGRESS = 'ON_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

/**
 * Fix: Added UserRole enum to resolve 'no exported member' error in constants.tsx
 */
export enum UserRole {
  TOKO = 'TOKO',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;      // ID Unik (Misal: toko-1)
  /**
   * Fix: Added name property to resolve missing property errors in constants.tsx, TokoDashboard.tsx, and AdminDashboard.tsx
   */
  name: string;    // Nama Toko / User
  password?: string;
  role: string;    // OUTLET, PELAPOR, ADMIN
  email?: string;
}

export interface LeakReport {
  id: string;
  tokoId: string;
  tokoName: string;
  date: string;
  location: string;
  description: string;
  indicator: string;
  riskLevel: string;
  businessImpact: string;
  recommendation: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  status: ReportStatus;
  photoUrls: string[];
  updatedAt: string;
  department?: string;
  pic?: string;
  plannedDate?: string;
  targetDate?: string;
  completionDate?: string;
}
