import { Play as LucidePlay } from 'lucide-react';
import React from 'react';

interface PlayProps {
    rotate?: boolean;
    className?: string;
}

export function Play({ rotate = false, className = '' }: PlayProps) {
    return (
        <LucidePlay
            className={
                `${className} ${rotate ? 'animate-spin' : ''}`.trim()
            }
        />
    );
} 