// ============================================================
// lib/api-extensions.ts
// Extensões adicionais para o cliente API
// Cole no final do api.ts existente ou importe aqui
// ============================================================

// Adicionar ao objeto api existente:

// medicalRecords já existente — adicionar métodos:
// api.medicalRecords.sign = (id) => client.patch(`/medical-records/${id}/sign`)
// api.medicalRecords.searchCid10 = (q) => client.get('/medical-records/cid10/search', { params: { q } })
// api.medicalRecords.getDocumentTemplates = (type) => client.get('/medical-records/templates/documents', { params: { type } })
// api.medicalRecords.createDocument = (recordId, data) => client.post(`/medical-records/${recordId}/documents`, data)

// tenants (novo):
// api.tenants = {
//   getMe: () => client.get('/tenants/me'),
//   update: (data) => client.patch('/tenants/me', data),
//   configureWhatsapp: (data) => client.post('/tenants/me/whatsapp', data),
//   getStats: () => client.get('/tenants/me/stats'),
//   exportPatientData: (patientId) => client.get(`/tenants/patients/${patientId}/export`),
//   anonymizePatient: (patientId) => client.post(`/tenants/patients/${patientId}/anonymize`),
// }

// ============================================================
// lib/api.ts COMPLETO E ATUALIZADO
// ============================================================
import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.client.interceptors.response.use(
      (res) => res.data?.data ?? res.data,
      async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
          original._retry = true;
          try {
            const rt = localStorage.getItem('refresh_token');
            const uid = localStorage.getItem('user_id');
            if (rt && uid) {
              const res = await this.client.post('/auth/refresh', { user_id: uid, refresh_token: rt });
              this.setToken(res.data.access_token);
              original.headers.Authorization = `Bearer ${res.data.access_token}`;
              return this.client(original);
            }
          } catch { this.logout(); }
        }
        return Promise.reject(error.response?.data || error);
      },
    );
  }

  getToken = () => typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  setToken = (t: string) => localStorage.setItem('access_token', t);
  logout = () => { localStorage.clear(); window.location.href = '/login'; };

  auth = {
    login: (d: any) => this.client.post('/auth/login', d),
    register: (d: any) => this.client.post('/auth/register', d),
    me: () => this.client.get('/auth/me'),
    logout: () => this.client.post('/auth/logout'),
    refresh: (d: any) => this.client.post('/auth/refresh', d),
  };

  patients = {
    list: (p?: any) => this.client.get('/patients', { params: p }),
    get: (id: string) => this.client.get(`/patients/${id}`),
    create: (d: any) => this.client.post('/patients', d),
    update: (id: string, d: any) => this.client.patch(`/patients/${id}`, d),
    timeline: (id: string) => this.client.get(`/patients/${id}/timeline`),
    preRegistration: {
      get: (token: string) => this.client.get(`/patients/pre-registration/${token}`),
      complete: (token: string, d: any) => this.client.post(`/patients/pre-registration/${token}`, d),
    },
  };

  appointments = {
    byDate: (date: string, doctorId?: string) =>
      this.client.get('/appointments/by-date', { params: { date, doctorId } }),
    byRange: (startDate: string, endDate: string, doctorId?: string) =>
      this.client.get('/appointments/range', { params: { startDate, endDate, doctorId } }),
    availableSlots: (doctorId: string, date: string) =>
      this.client.get('/appointments/slots', { params: { doctorId, date } }),
    create: (d: any) => this.client.post('/appointments', d),
    updateStatus: (id: string, status: string, notes?: string) =>
      this.client.patch(`/appointments/${id}/status`, { status, notes }),
    reschedule: (id: string, scheduled_at: string) =>
      this.client.patch(`/appointments/${id}/reschedule`, { scheduled_at }),
    cancel: (id: string, reason?: string) =>
      this.client.patch(`/appointments/${id}/status`, { status: 'cancelled', notes: reason }),
  };

  medicalRecords = {
    list: (patientId: string) => this.client.get(`/medical-records/patient/${patientId}`),
    get: (id: string) => this.client.get(`/medical-records/${id}`),
    create: (d: any) => this.client.post('/medical-records', d),
    update: (id: string, d: any) => this.client.patch(`/medical-records/${id}`, d),
    sign: (id: string) => this.client.patch(`/medical-records/${id}/sign`),
    searchCid10: (q: string) => this.client.get('/medical-records/cid10/search', { params: { q } }),
    myStats: () => this.client.get('/medical-records/doctor/stats'),
    createDocument: (recordId: string, d: any) =>
      this.client.post(`/medical-records/${recordId}/documents`, d),
    getDocuments: (patientId: string) =>
      this.client.get(`/medical-records/patient/${patientId}/documents`),
    getDocumentTemplates: (type?: string) =>
      this.client.get('/medical-records/templates/documents', { params: { type } }),
    signDocument: (docId: string) =>
      this.client.patch(`/medical-records/documents/${docId}/sign`),
  };

  financial = {
    transactions: (p?: any) => this.client.get('/financial/transactions', { params: p }),
    summary: (startDate?: string, endDate?: string) =>
      this.client.get('/financial/summary', { params: { startDate, endDate } }),
    create: (d: any) => this.client.post('/financial/transactions', d),
    markPaid: (id: string, paymentMethod: string) =>
      this.client.patch(`/financial/transactions/${id}/pay`, { payment_method: paymentMethod }),
    monthlyChart: (year: string) =>
      this.client.get('/financial/chart/monthly', { params: { year } }),
    commissions: (doctorId: string, month: string) =>
      this.client.get(`/financial/commissions/${doctorId}`, { params: { month } }),
    categories: () => this.client.get('/financial/categories'),
  };

  whatsapp = {
    templates: () => this.client.get('/whatsapp/templates'),
    updateTemplate: (id: string, message: string) =>
      this.client.patch(`/whatsapp/templates/${id}`, { message }),
    conversations: (page?: number) =>
      this.client.get('/whatsapp/conversations', { params: { page } }),
    sendManual: (d: any) => this.client.post('/whatsapp/send', d),
    triggerRecovery: () => this.client.post('/whatsapp/recovery'),
    sendConfirmation: (appointmentId: string) =>
      this.client.post(`/whatsapp/confirmation/${appointmentId}`),
  };

  dashboard = {
    executive: () => this.client.get('/dashboard'),
  };

  users = {
    list: () => this.client.get('/users'),
    doctors: () => this.client.get('/users/doctors'),
    get: (id: string) => this.client.get(`/users/${id}`),
    create: (d: any) => this.client.post('/users', d),
    update: (id: string, d: any) => this.client.patch(`/users/${id}`, d),
    toggleActive: (id: string) => this.client.patch(`/users/${id}/toggle-active`),
    changePassword: (id: string, password: string) =>
      this.client.patch(`/users/${id}/password`, { password }),
    getSchedule: (id: string) => this.client.get(`/users/${id}/schedule`),
    upsertSchedule: (id: string, schedule: any[]) =>
      this.client.post(`/users/${id}/schedule`, { schedule }),
  };

  tenants = {
    getMe: () => this.client.get('/tenants/me'),
    update: (d: any) => this.client.patch('/tenants/me', d),
    configureWhatsapp: (d: any) => this.client.post('/tenants/me/whatsapp', d),
    getStats: () => this.client.get('/tenants/me/stats'),
    exportPatientData: (patientId: string) =>
      this.client.get(`/tenants/patients/${patientId}/export`),
    anonymizePatient: (patientId: string) =>
      this.client.post(`/tenants/patients/${patientId}/anonymize`),
  };

  rooms = {
    list: () => this.client.get('/rooms'),
    create: (d: any) => this.client.post('/rooms', d),
  };
}

export const api = new ApiClient();
export default api;
