
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../components/Dashboard';
import * as api from '../services/api';
import React from 'react';

vi.mock('../services/api');
// Mock Recharts responsive container to avoid size warnings in JSDOM
vi.mock('recharts', async (importOriginal) => {
    const mod = await importOriginal<any>();
    return {
        ...mod,
        ResponsiveContainer: ({ children }: any) => <div style={{ width: 500, height: 300 }}>{children}</div>
    };
});

describe('Dashboard Component', () => {
  const mockConfig = { inverterIp: '1.2.3.4', currency: 'EUR', appliances: [] };
  const mockData = {
      power: { pv: 5000, load: 1000, grid: -4000, battery: 0 },
      battery: { soc: 100, state: 'idle' as const },
      energy: { today: { production: 20, consumption: 5 } },
      autonomy: 100,
      selfConsumption: 20
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (api.getHistory as any).mockResolvedValue({ chart: [], stats: { production: 0, consumption: 0, imported: 0, exported: 0, costSaved: 0, earnings: 0 } });
    (api.getRoiData as any).mockResolvedValue({ totalInvested: 1000, totalReturned: 100, netValue: -900, roiPercent: 10, breakEvenDate: null, expenses: [] });
    (api.getForecast as any).mockResolvedValue({ forecasts: [] });
    (api.getBatteryHealth as any).mockResolvedValue({ dataPoints: [], totalCycles: 0 });
    (api.getAwattarComparison as any).mockResolvedValue({
      provider: 'awattar',
      country: 'DE',
      postalCode: '',
      period: 'month',
      range: { from: '2026-01-01T00:00:00', to: '2026-02-01T00:00:00' },
      assumptions: { marketPriceUnit: 'Eur/MWh', marketToKwhFactor: 1 / 1000, surchargeCt: 0, vatPercent: 0 },
      coverage: { hoursWithEnergy: 0, hoursWithPrices: 0, hoursUsed: 0 },
      totals: {
        fixed: { importCost: 0, exportRevenue: 0, net: 0 },
        dynamic: { importCost: 0, exportRevenue: 0, net: 0 },
        delta: { net: 0 }
      },
      seriesDaily: []
    });
  });

  it('shows skeleton loader while history is loading', async () => {
    // Keep getHistory pending (never resolves) to force the loading state
    (api.getHistory as any).mockReturnValue(new Promise(() => {}));

    render(<Dashboard data={mockData} config={mockConfig} error={null} refreshTrigger={0} />);
    
    // PowerFlow is part of already-available data, so it should be visible
    expect(screen.getByText(/Live Power Flow/i)).toBeInTheDocument();
    
    // Charts wait for history -> skeleton should be present.
    await waitFor(() => {
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  it('shows widget contents correctly when data is loaded', async () => {
    render(<Dashboard data={mockData} config={mockConfig} error={null} refreshTrigger={0} />);

    await waitFor(() => {
        expect(screen.getByText(/Return on Investment/i)).toBeInTheDocument();
    });

    // Verify live data (5000W PV) is rendered (PowerFlow or stats)
    // PowerFlow renders "5000 W"
    expect(screen.getByText('5000 W')).toBeInTheDocument();
  });

  it('shows error message at the top when error prop is set', async () => {
    render(<Dashboard data={mockData} config={mockConfig} error="Connection Lost" refreshTrigger={0} />);
    await waitFor(() => {
      expect(screen.getByText('Connection Lost')).toBeInTheDocument();
    });
  });
});
