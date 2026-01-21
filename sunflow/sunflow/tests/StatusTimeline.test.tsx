
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusTimeline from '../components/StatusTimeline';
import React from 'react';

describe('StatusTimeline Component', () => {
    it('shows loading state when there is no data', () => {
        // @ts-expect-error Testing null prop handling
        render(<StatusTimeline history={null} />);
        expect(screen.getByText(/Waiting for data logs/i)).toBeInTheDocument();
    });

    it('renders timeline bars', () => {
        const mockHistory = [
            { timestamp: '2023-01-01 10:00:00', status: 1, soc: 50 },
            { timestamp: '2023-01-01 11:00:00', status: 2, soc: 60 }, // Error
        ];

        const { container } = render(<StatusTimeline history={mockHistory} />);
        
        // Look for status texts that appear in the rendered SVG/HTML.
        // Snapshot showed: "Flawless", "Running", "Active", "Error"
        expect(screen.getAllByText(/Running/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Error/i).length).toBeGreaterThan(0);
        
        expect(container.firstChild).not.toBeNull();
    });
});
