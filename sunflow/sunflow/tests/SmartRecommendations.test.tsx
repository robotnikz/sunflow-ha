
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SmartRecommendations from '../components/SmartRecommendations';
import { Appliance } from '../types';

describe('SmartRecommendations Logic', () => {
  // Freeze time to avoid flakiness around midnight in CI (forecast logic is "remaining today").
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockAppliances: Appliance[] = [
    { id: 'washing', name: 'Washing Machine', watts: 2000, kwhEstimate: 1.0, iconName: 'shirt', color: 'text-blue-400' },
    { id: 'phone', name: 'Phone Charger', watts: 15, kwhEstimate: 0.02, iconName: 'smartphone', color: 'text-gray-400' }
  ];

  // Base props helper
  const defaultProps = {
    forecast: null,
    solcastRateLimited: false,
    todayProduction: 10,
    isDay: true,
    batteryCapacity: 10,
    appliances: mockAppliances,
    hasSolcastKey: false
  };

  it('does NOT recommend an appliance when there is no surplus', () => {
    render(<SmartRecommendations 
        {...defaultProps}
        power={{ grid: 500, battery: 0, pv: 500, load: 1000 }} // Grid Import (Positive)
        soc={50}
    />);
    
    expect(screen.getByText(/No surplus available/i)).toBeInTheDocument();
    expect(screen.queryByText('Washing Machine')).not.toBeInTheDocument();
  });

  it('recommends an appliance when enough grid export is available', () => {
    render(<SmartRecommendations 
        {...defaultProps}
        power={{ grid: -2500, battery: 0, pv: 3000, load: 500 }} // 2500W Export
        soc={80} // Battery almost full
    />);
    
    // Header should show "Smart Usage"
    expect(screen.getByText(/Smart Usage/i)).toBeInTheDocument();
    // Washing machine (2000W) fits into 2500W export
    expect(screen.getByText('Washing Machine')).toBeInTheDocument();
  });

  it('blocks recommendation in "Battery Priority" mode (low SoC, no forecast)', () => {
    render(<SmartRecommendations 
        {...defaultProps}
        power={{ grid: -2500, battery: 0, pv: 3000, load: 500 }} 
        soc={20} // Battery low!
        // hasSolcastKey=false triggert Fallback-Logik
    />);

    // Should not recommend because SoC < 80% (fallback logic) and no forecast key
    // Logic: if !hasAnyForecastData -> if soc > 80 allow divert.
    expect(screen.queryByText('Washing Machine')).not.toBeInTheDocument();
    expect(screen.getByText(/Battery Priority/i)).toBeInTheDocument();
  });

  it('allows recommendation at low SoC WHEN forecast is extremely positive', () => {
    render(<SmartRecommendations 
        {...defaultProps}
        hasSolcastKey={true}
        forecast={{ forecasts: [{ period_end: new Date(Date.now() + 3600000).toISOString(), pv_estimate: 50 }] }} // Huge forecast
        power={{ grid: -2500, battery: 0, pv: 3000, load: 500 }}
        soc={20} 
    />);

    // Logic: forecastRemainingKwh > kwhToFill
    // 50 kW forecast >> 8 kWh needed to fill => safe.
    expect(screen.getByText('Washing Machine')).toBeInTheDocument();
    expect(screen.getByText(/Battery Safe/i)).toBeInTheDocument();
  });
});
