
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ScenarioPlanner from '../components/ScenarioPlanner';
import * as api from '../services/api';
import React from 'react';

vi.mock('../services/api');

// Mock Recharts
vi.mock('recharts', async (importOriginal) => {
    const mod = await importOriginal<any>();
    return {
        ...mod,
        ResponsiveContainer: ({ children }: any) => <div style={{ width: 500, height: 300 }}>{children}</div>
    };
});

describe('ScenarioPlanner Component', () => {
    const mockConfig = { inverterIp: '1.2.3.4', currency: 'EUR', batteryCapacity: 10, systemCapacity: 5 };
    const mockSimData = [
        { t: 1672563600000, p: 1000, l: 500 },
        { t: 1672567200000, p: 2000, l: 600 }
    ];

    beforeEach(() => {
        (api.getSimulationData as any).mockResolvedValue([]);
        (api.getTariffs as any).mockResolvedValue([]);
    });

    it('opens the modal when clicking the trigger button', async () => {
        render(<ScenarioPlanner config={mockConfig} />);
        
        // Click button to open modal
        const trigger = screen.getByText(/Scenario Planner/i);
        fireEvent.click(trigger);
        
        expect(screen.getByText(/Upgrade Simulator/i)).toBeInTheDocument();
        
        // Wait for the internal API call to avoid "act" warning
        await waitFor(() => expect(api.getSimulationData).toHaveBeenCalled());
    });

    it('loads data when opening', async () => {
        (api.getSimulationData as any).mockResolvedValue(mockSimData);
        (api.getTariffs as any).mockResolvedValue([]);

        render(<ScenarioPlanner config={mockConfig} />);
        
        const trigger = screen.getByText(/Scenario Planner/i);
        fireEvent.click(trigger);

        expect(screen.getByText(/Loading historical data/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(api.getSimulationData).toHaveBeenCalled();
        });

        // Wait until loading is finished to avoid "act" warning
        await waitFor(() => {
            expect(screen.queryByText(/Loading historical data/i)).not.toBeInTheDocument();
        });
    });

    it('computes scenario when data is available', async () => {
        (api.getSimulationData as any).mockResolvedValue(mockSimData);
        (api.getTariffs as any).mockResolvedValue([]);

        render(<ScenarioPlanner config={mockConfig} />);
        fireEvent.click(screen.getByText(/Scenario Planner/i));

        await waitFor(() => {
            expect(screen.queryByText(/Loading historical data/i)).not.toBeInTheDocument();
        });
    });
});
