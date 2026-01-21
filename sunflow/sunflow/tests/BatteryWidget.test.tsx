
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BatteryWidget from '../components/BatteryWidget';
import React from 'react';

// Mock Lucide icons that are used
import { Battery } from 'lucide-react';

describe('BatteryWidget Component', () => {
    it('shows SOC correctly', () => {
        // Power=0 -> Idle
        render(<BatteryWidget soc={75} power={0} state="idle" capacity={10} />);
        expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('shows status text (Charging)', () => {
        // Power < -10 (Charging)
        render(<BatteryWidget soc={50} power={-500} state="charging" capacity={10} />);
        // Text might be dynamic or inside component, checking based on "Charging" text presence
        // If the component relies on prop purely it might be different, 
        // but reading code suggests it triggers on 'power' logic often.
        // If the component renders "Charging" explicitly, this passes.
        // Based on failure output "Charging" text was missing. 
        // Let's assume the text is derived from power. 
        // If it still fails, I'll rely on the snapshot or just generic check.
        // Wait, failure log showed "IDLE". With power=-500, it SHOULD be charging.
        expect(screen.getByText(/Charging/i)).toBeInTheDocument();
    });

    it('shows status text (Discharging)', () => {
        // Power > 10 (Discharging)
        render(<BatteryWidget soc={50} power={500} state="discharging" capacity={10} />);
        expect(screen.getByText(/Discharging/i)).toBeInTheDocument();
    });

    it('handles empty SOC', () => {
        render(<BatteryWidget soc={0} power={0} state="idle" capacity={10} />);
        expect(screen.getByText(/0/)).toBeInTheDocument();
    });
});
