
import { InverterData, SystemConfig, HistoryData, TimeRange, Tariff, Expense, RoiData, SystemInfo, ForecastData, BatteryHealthData, SimulationDataPoint, AwattarComparisonResponse, AwattarComparePeriod } from '../types';

// IMPORTANT (Home Assistant Ingress):
// Use *relative* URLs so requests stay under the ingress path.
// Absolute paths like `/api/...` would hit Home Assistant Core instead.
const API_BASE = '';

const apiUrl = (path: string): string => {
  const p = path.startsWith('/') ? path.slice(1) : path;
  const base = API_BASE ? API_BASE.replace(/\/+$/, '') + '/' : '';
  return `${base}${p}`;
};

const ADMIN_TOKEN_STORAGE_KEY = 'sunflow_admin_token';

export const getAdminToken = (): string | null => {
  try {
    if (typeof window === 'undefined') return null;
    const t = window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    if (!t) return null;
    const trimmed = t.trim();
    return trimmed ? trimmed : null;
  } catch {
    return null;
  }
};

export const setAdminToken = (token: string | null): void => {
  try {
    if (typeof window === 'undefined') return;
    const trimmed = (token ?? '').trim();
    if (!trimmed) {
      window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, trimmed);
  } catch {
    // ignore
  }
};

const withAuthHeaders = (headers?: HeadersInit): HeadersInit | undefined => {
  const token = getAdminToken();
  if (!token) return headers;
  const h = new Headers(headers);
  if (!h.has('Authorization')) h.set('Authorization', `Bearer ${token}`);
  return h;
};

const apiFetch = (path: string, init?: RequestInit): Promise<Response> => {
  return fetch(apiUrl(path), {
    ...init,
    headers: withAuthHeaders(init?.headers),
  });
};

export const getRealtimeData = async (): Promise<InverterData> => {
  const res = await apiFetch('api/data');
  if (!res.ok) throw new Error("API call failed");
  return res.json();
};

export const getHistory = async (range: TimeRange, startDate?: string, endDate?: string, offset: number = 0): Promise<HistoryData> => {
  let url = apiUrl(`api/history?range=${range}&offset=${offset}`);
  if (range === 'custom' && startDate && endDate) {
    url += `&start=${startDate}&end=${endDate}`;
  }
  
  const res = await fetch(url, { headers: withAuthHeaders() });
  if (!res.ok) throw new Error("History call failed");
  return res.json();
};

export const getRoiData = async (): Promise<RoiData> => {
  const res = await apiFetch('api/roi');
  if (!res.ok) throw new Error("ROI data call failed");
  return res.json();
};

export const getBatteryHealth = async (): Promise<BatteryHealthData> => {
  const res = await apiFetch('api/battery-health');
  if (!res.ok) throw new Error("Battery Health data call failed");
  return res.json();
};

export const getSimulationData = async (): Promise<SimulationDataPoint[]> => {
  const res = await apiFetch('api/simulation-data');
    if (!res.ok) throw new Error("Simulation data call failed");
    return res.json();
};

export const getConfig = async (): Promise<SystemConfig> => {
  const res = await apiFetch('api/config');
  if (!res.ok) throw new Error("API call failed");
  return res.json();
};

export const saveConfig = async (config: SystemConfig): Promise<void> => {
  const res = await apiFetch('api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) {
    try {
      const j = await res.json();
      if (j?.error) throw new Error(String(j.error));
    } catch (e) {
      if (e instanceof Error) throw e;
    }
    throw new Error(`Failed to save settings (HTTP ${res.status})`);
  }
};

export const getSystemInfo = async (): Promise<SystemInfo> => {
  const res = await apiFetch('api/info');
  if (!res.ok) throw new Error("Failed to fetch system info");
  return res.json();
};

// --- Forecast API ---
export const getForecast = async (): Promise<ForecastData> => {
  const res = await apiFetch('api/forecast');
    if (!res.ok) throw new Error("Failed to fetch forecast");
    return res.json();
};

export const testNotification = async (): Promise<void> => {
  const res = await apiFetch('api/test-notification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error('Failed to send test notification');
};

// --- Tariff API ---

export const getTariffs = async (): Promise<Tariff[]> => {
  const res = await apiFetch('api/tariffs');
  if (!res.ok) throw new Error("Failed to fetch tariffs");
  return res.json();
};

export const addTariff = async (tariff: Tariff): Promise<void> => {
  const res = await apiFetch('api/tariffs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tariff)
  });
  if (!res.ok) throw new Error("Failed to add tariff");
};

export const deleteTariff = async (id: number): Promise<void> => {
  const res = await apiFetch(`api/tariffs/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error("Failed to delete tariff");
};

// --- Expenses API ---

export const getExpenses = async (): Promise<Expense[]> => {
  const res = await apiFetch('api/expenses');
  if (!res.ok) throw new Error("Failed to fetch expenses");
  return res.json();
};

export const addExpense = async (expense: Expense): Promise<void> => {
  const res = await apiFetch('api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense)
  });
  if (!res.ok) throw new Error("Failed to add expense");
};

export const deleteExpense = async (id: number): Promise<void> => {
  const res = await apiFetch(`api/expenses/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error("Failed to delete expense");
};

// --- Data Import API ---

export interface CsvPreview {
    headers: string[];
    preview: any[]; // Array of rows
}

export const previewCsv = async (file: File): Promise<CsvPreview> => {
    const formData = new FormData();
    formData.append('file', file);
    
  const res = await apiFetch('api/preview-csv', {
        method: 'POST',
        body: formData
    });
    
    if (!res.ok) throw new Error("CSV Preview Failed");
    return res.json();
};

export const importCsv = async (file: File, mapping: any): Promise<{success: boolean, imported: number, failed: number}> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));
    
  const res = await apiFetch('api/import-csv', {
        method: 'POST',
        body: formData
    });
    
    if (!res.ok) throw new Error("CSV Import Failed");
    return res.json();
};

// --- Dynamic Tariff Comparison (aWATTar) ---

export interface AwattarComparisonParams {
  period?: AwattarComparePeriod;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  country?: 'DE' | 'AT';
  surchargeCt?: number;
  vatPercent?: number;
}

export const getAwattarComparison = async (params: AwattarComparisonParams = {}): Promise<AwattarComparisonResponse> => {
  const qs = new URLSearchParams();
  if (params.period) qs.set('period', params.period);
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.country) qs.set('country', params.country);
  if (params.surchargeCt !== undefined) qs.set('surchargeCt', String(params.surchargeCt));
  if (params.vatPercent !== undefined) qs.set('vatPercent', String(params.vatPercent));

  const res = await apiFetch(`api/dynamic-pricing/awattar/compare?${qs.toString()}`);
  if (!res.ok) {
    let msg = 'Failed to fetch aWATTar comparison';
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  return res.json();
};

