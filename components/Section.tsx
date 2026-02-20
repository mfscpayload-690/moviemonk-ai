import React from 'react';

interface SectionProps {
    title: string;
    icon?: string;
    children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, children }) => (
    <div className="section-panel glass-panel p-6 md:p-8 rounded-2xl animate-slide-up">
        <h2 className="section-heading text-xl md:text-2xl font-bold mb-5 text-white flex items-center gap-3">
            {icon && <span className="section-icon">{icon}</span>}
            <span className="section-accent-bar" />
            {title}
        </h2>
        {children}
    </div>
);

export default Section;
