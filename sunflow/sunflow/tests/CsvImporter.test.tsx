
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CsvImporter from '../components/CsvImporter';
import * as api from '../services/api';
import React from 'react';
import Papa from 'papaparse';

vi.mock('../services/api');

// Mock PapaParse
vi.mock('papaparse', () => ({
    default: {
        parse: vi.fn((file, config) => {
            // Simulate success
            if (config.complete) {
                config.complete({
                    data: [
                        ['timestamp', 'power'],
                        ['2023-01-01T10:00:00', '500']
                    ],
                    meta: { fields: ['timestamp', 'power'] }
                });
            }
        })
    }
}));

describe('CsvImporter Component', () => {
    
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('starts in the upload step', () => {
        render(<CsvImporter />);
        expect(screen.getByText(/Click to upload CSV/i)).toBeInTheDocument();
    });

    it('moves to step 2 (mapping) after selecting a file', async () => {
        const { container } = render(<CsvImporter />);
        
        // Mock API Response
        vi.mocked(api.previewCsv).mockResolvedValue({
            headers: ['timestamp', 'power'],
            preview: [['2023-01-01T10:00:00', '100']]
        });

        // Mock File with slice/text support
        const fileContent = 'timestamp,power\n2023-01-01,100';
        const file = new File([fileContent], 'test.csv', { type: 'text/csv' });
        
        // Workaround for JSDOM missing file.slice().text()
        Object.defineProperty(file, 'slice', {
            value: () => ({
                text: async () => fileContent
            }),
            writable: true
        });

        const input = container.querySelector('input[type="file"]');
        
        if (input) {
            // Simulate upload
            fireEvent.change(input, { target: { files: [file] } });
            
            // Wait for API call and state change
            await waitFor(() => {
                // Check for UI element unique to Step 2 (Mapping)
                // Note: "Configure Column Mapping" text was removed/changed. 
                // We check for one of the label fields or the "File:" indicator.
                const step2Indicator = screen.queryByText(/Timestamp \(Required\)/i);
                if (!step2Indicator) throw new Error("Step 2 not reached");
                expect(step2Indicator).toBeInTheDocument();
            });
        }
    });

    it('runs import when mapping is set', async () => {
        // Mock API Response
        vi.mocked(api.previewCsv).mockResolvedValue({
            headers: ['timestamp', 'power'],
            preview: [['2023-01-01T10:00:00', '100']]
        });
        
        // Setup
        const { container } = render(<CsvImporter onSuccess={vi.fn()} />);
        // Create file with content matching the mock
        const fileContent = 'timestamp,power\n2023-01-01T10:00:00,100';
        const file = new File([fileContent], 'test.csv', { type: 'text/csv' });
        
        // Mock slice
        Object.defineProperty(file, 'slice', {
            value: () => ({
                text: async () => fileContent
            }),
            writable: true
        });

        const input = container.querySelector('input[type="file"]');
        if(input) fireEvent.change(input, { target: { files: [file] } });
        
        await waitFor(() => {
            expect(screen.getByText(/Timestamp \(Required\)/i)).toBeInTheDocument();
        });

        // Set mapping (select Timestamp)
        const selects = screen.getAllByRole('combobox');
        
        // Ensure options are loaded (from meta fields in the mock)
        fireEvent.change(selects[0], { target: { value: 'timestamp' } }); 

        // Click Import button
        const importBtn = screen.getByRole('button', { name: /Start Import/i });
        fireEvent.click(importBtn);

        // API call check
        await waitFor(() => {
           expect(api.importCsv).toHaveBeenCalled();
        });
    });
});
