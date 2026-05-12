// ============================================================
// types/index.ts — Tipos TypeScript globais completos
// ============================================================

export type UserRole = 'admin' | 'doctor' | 'receptionist' | 'financial';
export type AppointmentStatus =
  | 'scheduled' | 'confirmed' | 'waiting'
  | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type TransactionType   = 'income' | 'expense';
export type TransactionStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type Gender            = 'male' | 'female' | 'other' | 'not_informed';
export type DocumentType      = 'prescription' | 'certificate' | 'referral' | 'exam_request' | 'other';
export type WhatsappTemplateType = 'confirmation' | 'reminder' | 'followup' | 'recovery' | 'delay' | 'nps';

// ── Entities
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  cnpj?: string;
  email: string;
  phone?: string;
  logo_url?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  subscription_plan: 'starter' | 'professional' | 'enterprise';
  subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled';
  whatsapp_provider?: string;
  whatsapp_phone_number?: string;
  trial_ends_at?: string;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  tenant_id: string;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  specialty?: string;
  crm?: string;
  commission_percentage?: number;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
}

export interface Patient {
  id: string;
  tenant_id: string;
  full_name: string;
  email?: string;
  phone: string;
  whatsapp?: string;
  cpf?: string;
  date_of_birth?: string;
  gender: Gender;
  blood_type?: string;
  allergies?: string;
  notes?: string;
  insurance_name?: string;
  insurance_number?: string;
  insurance_plan?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  pre_registration_token?: string;
  pre_registration_completed?: boolean;
  last_appointment_at?: string;
  is_active: boolean;
  created_at: string;
  // computed
  total_appointments?: number;
}

export interface Appointment {
  id: string;
  tenant_id: string;
  patient_id: string;
  doctor_id: string;
  room_id?: string;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  appointment_type?: string;
  reason?: string;
  notes?: string;
  price?: number;
  payment_method?: string;
  is_paid: boolean;
  insurance_name?: string;
  insurance_auth_code?: string;
  confirmation_sent_at?: string;
  reminder_sent_at?: string;
  followup_sent_at?: string;
  cancelled_at?: string;
  cancelled_reason?: string;
  created_at: string;
  // joins
  patient_name?: string;
  patient_phone?: string;
  patient_whatsapp?: string;
  doctor_name?: string;
  doctor_specialty?: string;
  room_name?: string;
}

export interface VitalSigns {
  weight?: number;
  height?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  temperature?: number;
  oxygen_saturation?: number;
  blood_glucose?: number;
  respiratory_rate?: number;
}

export interface MedicalRecord {
  id: string;
  tenant_id: string;
  patient_id: string;
  appointment_id?: string;
  doctor_id: string;
  anamnesis?: string;
  physical_exam?: string;
  evolution?: string;
  diagnosis?: string;
  cid10_codes?: string[];
  treatment_plan?: string;
  observations?: string;
  vital_signs?: VitalSigns;
  is_signed: boolean;
  signed_at?: string;
  created_at: string;
  updated_at: string;
  // joins
  doctor_name?: string;
  doctor_specialty?: string;
  doctor_crm?: string;
  patient_name?: string;
  blood_type?: string;
  allergies?: string;
  appointment_date?: string;
  appointment_type?: string;
  documents?: MedicalDocument[];
  attachments?: Attachment[];
  // counts
  total_documents?: number;
  total_attachments?: number;
}

export interface MedicalDocument {
  id: string;
  type: DocumentType;
  title: string;
  content?: string;
  file_url?: string;
  is_signed: boolean;
  created_at: string;
  doctor_name?: string;
}

export interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  mime_type?: string;
  description?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  tenant_id: string;
  type: TransactionType;
  description: string;
  amount: number;
  status: TransactionStatus;
  due_date?: string;
  paid_at?: string;
  payment_method?: string;
  is_commission: boolean;
  commission_percentage?: number;
  notes?: string;
  created_at: string;
  // joins
  patient_name?: string;
  doctor_name?: string;
  category_name?: string;
  category_color?: string;
}

export interface WhatsappTemplate {
  id: string;
  tenant_id: string;
  type: WhatsappTemplateType;
  name: string;
  message: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsappMessage {
  id: string;
  tenant_id: string;
  patient_id?: string;
  appointment_id?: string;
  type: WhatsappTemplateType;
  phone_to: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  external_message_id?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  error_message?: string;
  created_at: string;
  // joins
  patient_name?: string;
  patient_phone?: string;
}

export interface Room {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface WorkingHour {
  id: string;
  doctor_id: string;
  day_of_week: number; // 0=Dom ... 6=Sáb
  start_time: string;  // "08:00"
  end_time: string;    // "18:00"
  slot_duration: number;
  is_active: boolean;
}

export interface Cid10 {
  code: string;
  description: string;
  category?: string;
}

// ── API responses
export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

export interface DashboardData {
  today: {
    total: number;
    completed: number;
    pending: number;
    no_show: number;
    cancelled: number;
  };
  month: {
    revenue: number;
    new_patients: number;
  };
  top_doctors: Array<{
    full_name: string;
    specialty?: string;
    total_appointments: number;
    revenue: number;
  }>;
  no_show_rate: number;
  recent_patients: Patient[];
  upcoming_appointments: Appointment[];
}

export interface CashFlowSummary {
  total_income: string;
  total_expense: string;
  pending_income: string;
  pending_expense: string;
  overdue_income: string;
  balance: number;
}

export interface MonthlyChartData {
  month: string;
  income: number;
  expense: number;
}
