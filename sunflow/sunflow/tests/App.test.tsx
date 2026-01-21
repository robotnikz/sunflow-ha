import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import * as api from '../services/api';

// Mock the entire API module so we do not perform real network requests.
vi.mock('../services/api');

describe('SunFlow App Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the loading screen on startup', async () => {
    // Resolve promises (or resolve slowly) to observe the initial state
    (api.getConfig as any).mockResolvedValue({}); 
    (api.getSystemInfo as any).mockResolvedValue({});

    render(<App />);
    
    // Check for text that appears only in the loading state
    expect(await screen.findByText(/Connecting to Fronius Inverter/i)).toBeInTheDocument();
  });

  it('loads the dashboard when configuration is present', async () => {
    // Define test data that the API should return
    const mockConfig = { 
        inverterIp: '192.168.0.50', 
        currency: 'EUR', 
        systemStartDate: '2023-01-01' 
    };

    const mockRealtimeData = {
        power: { pv: 2500, load: 500, grid: -2000, battery: 0 },
        battery: { soc: 85, state: 'idle' },
        energy: { today: { production: 15, consumption: 5 } },
        autonomy: 100,
        selfConsumption: 20
    };

    // Wire mocks
    (api.getConfig as any).mockResolvedValue(mockConfig);
    (api.getSystemInfo as any).mockResolvedValue({ version: '1.0.0', updateAvailable: false });
    (api.getRealtimeData as any).mockResolvedValue(mockRealtimeData);
    
    // Empty chart dummies so nothing crashes
    (api.getHistory as any).mockResolvedValue({ chart: [], stats: { production: 0, consumption: 0, imported: 0, exported: 0, costSaved: 0, earnings: 0 } });
    (api.getRoiData as any).mockResolvedValue({ totalInvested: 0, roiPercent: 0 });
    (api.getForecast as any).mockResolvedValue({ forecasts: [] });

    render(<App />);

    // Wait until the title "SunFlow" appears (loading finished)
    await waitFor(() => {
        expect(screen.getByText(/SunFlow/i)).toBeInTheDocument();
    });

    // Verify the Settings button is rendered (part of the dashboard)
    expect(screen.getByTitle(/Settings/i)).toBeInTheDocument();
  });
});