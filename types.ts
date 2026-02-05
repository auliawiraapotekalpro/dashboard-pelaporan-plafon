
export enum ReportStatus {
  PENDING = 'PENDING',
  ON_PROGRESS = 'ON_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

export enum UserRole {
  TOKO = 'TOKO',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  password?: string;
  role: string;
  email?: string;
  amName?: string;
  amEmail?: string;
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
  beritaAcara?: string; 
}
