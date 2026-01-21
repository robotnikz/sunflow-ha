
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsCard from '../components/StatsCard';
import { Zap } from 'lucide-react';
import React from 'react';

describe('StatsCard Component', () => {
    it('renders title and value correctly', () => {
        render(
            <StatsCard 
                title="Production" 
                value="5.0 kWh" 
                icon={<Zap size={16} />} 
                valueColor="text-yellow-400" 
            />
        );

        expect(screen.getByText('Production')).toBeInTheDocument();
        expect(screen.getByText('5.0 kWh')).toBeInTheDocument();
    });

    it('shows subtext when provided', () => {
        render(
            <StatsCard 
                title="Test" 
                value="100" 
                icon={<Zap size={16} />} 
                subValue="Details here"
            />
        );
        expect(screen.getByText('Details here')).toBeInTheDocument();
    });
});
