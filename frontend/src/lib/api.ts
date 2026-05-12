// ============================================================
// lib/api.ts - Cliente HTTP centralizado
// ============================================================
import axios, { AxiosInstance, AxiosResponse } from 'axios';

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
      (response: AxiosResponse) => response.data.data ?? response.data,
      async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
          original._retry = true;
          try {
            const refreshToken = localStorage.getItem('refresh_token');
            const userId = localStorage.getItem('user_id');
            if (refreshToken && userId) {
              const res = await this.client.post('/auth/refresh', {
                user_id: userId,
                refresh_token: refreshToken,
              });
              this.setToken(res.data.access_token);
              original.headers.Authorization = `Bearer ${res.data.access_token}`;
              return this.client(original);
            }
          } catch {
            this.logout();
          }
        }
        return Promise.reject(error.response?.data || error);
      },
    );
  }

  getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);
  setToken = (token: string) => localStorage.setItem('access_token', token);
  logout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  // ── Auth
  auth = {
    login: (data: { email: string; password: string; tenant_slug: string }) =>
      this.client.post('/auth/login', data),
    register: (data: any) => this.client.post('/auth/register', data),
    me: () => this.client.get('/auth/me'),
    logout: () => this.client.post('/auth/logout'),
  };

  // ── Patients
  patients = {
    list: (params?: { page?: number; limit?: number; search?: string }) =>
      this.client.get('/patients', { params }),
    get: (id: string) => this.client.get(`/patients/${id}`),
    create: (data: any) => this.client.post('/patients', data),
    update: (id: string, data: any) => this.client.patch(`/patients/${id}`, data),
    timeline: (id: string) => this.client.get(`/patients/${id}/timeline`),
    preRegistration: {
      get: (token: string) => this.client.get(`/patients/pre-registration/${token}`),
      complete: (token: string, data: any) =>
        this.client.post(`/patients/pre-registration/${token}`, data),
    },
  };

  // ── Appointments
  appointments = {
    byDate: (date: string, doctorId?: string) =>
      this.client.get('/appointments/by-date', { params: { date, doctorId } }),
    byRange: (startDate: string, endDate: string, doctorId?: string) =>
      this.client.get('/appointments/range', { params: { startDate, endDate, doctorId } }),
    availableSlots: (doctorId: string, date: string) =>
      this.client.get('/appointments/slots', { params: { doctorId, date } }),
    create: (data: any) => this.client.post('/appointments', data),
    updateStatus: (id: string, status: string, notes?: string) =>
      this.client.patch(`/appointments/${id}/status`, { status, notes }),
    reschedule: (id: string, scheduledAt: string) =>
      this.client.patch(`/appointments/${id}/reschedule`, { scheduled_at: scheduledAt }),
    cancel: (id: string, reason?: string) =>
      this.client.patch(`/appointments/${id}/status`, { status: 'cancelled', notes: reason }),
  };

  // ── Medical Records
  medicalRecords = {
    list: (patientId: string) => this.client.get(`/medical-records/patient/${patientId}`),
    get: (id: string) => this.client.get(`/medical-records/${id}`),
    create: (data: any) => this.client.post('/medical-records', data),
    update: (id: string, data: any) => this.client.patch(`/medical-records/${id}`, data),
    createDocument: (recordId: string, data: any) =>
      this.client.post(`/medical-records/${recordId}/documents`, data),
  };

  // ── Financial
  financial = {
    transactions: (params?: any) => this.client.get('/financial/transactions', { params }),
    summary: (startDate?: string, endDate?: string) =>
      this.client.get('/financial/summary', { params: { startDate, endDate } }),
    create: (data: any) => this.client.post('/financial/transactions', data),
    markPaid: (id: string, paymentMethod: string) =>
      this.client.patch(`/financial/transactions/${id}/pay`, { payment_method: paymentMethod }),
    monthlyChart: (year: string) => this.client.get('/financial/chart/monthly', { params: { year } }),
    commissions: (doctorId: string, month: string) =>
      this.client.get(`/financial/commissions/${doctorId}`, { params: { month } }),
    categories: () => this.client.get('/financial/categories'),
  };

  // ── WhatsApp
  whatsapp = {
    templates: () => this.client.get('/whatsapp/templates'),
    updateTemplate: (id: string, message: string) =>
      this.client.patch(`/whatsapp/templates/${id}`, { message }),
    conversations: (page?: number) => this.client.get('/whatsapp/conversations', { params: { page } }),
    sendManual: (data: { phone: string; message: string; patient_id?: string }) =>
      this.client.post('/whatsapp/send', data),
    triggerRecovery: () => this.client.post('/whatsapp/recovery'),
  };

  // ── Dashboard
  dashboard = {
    executive: () => this.client.get('/dashboard'),
  };

  // ── Users
  users = {
    list: () => this.client.get('/users'),
    get: (id: string) => this.client.get(`/users/${id}`),
    create: (data: any) => this.client.post('/users', data),
    update: (id: string, data: any) => this.client.patch(`/users/${id}`, data),
    toggleActive: (id: string) => this.client.patch(`/users/${id}/toggle-active`),
  };

  // ── Rooms
  rooms = {
    list: () => this.client.get('/rooms'),
    create: (data: any) => this.client.post('/rooms', data),
  };
}

export const api = new ApiClient();
export default api;
