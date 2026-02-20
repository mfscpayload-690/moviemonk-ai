import React from 'react';

interface SectionProps {
    title: string;
    children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
    <div className="glass-panel p-6 rounded-2xl animate-slide-up">
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-white border-b border-white/5 pb-3 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></span>
            {title}
        </h2>
        {children}
    </div>
);

export default Section;
