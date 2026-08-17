import React from 'react';

interface SectionContainerProps {
  children: React.ReactNode;
  maxHeight?: string; // e.g. "max-h-[520px]" or "max-h-[580px]"
  className?: string;
  scrollbarColor?: 'purple' | 'pink' | 'yellow' | 'cyan' | 'indigo' | 'emerald';
}

export const SectionContainer: React.FC<SectionContainerProps> = ({
  children,
  maxHeight = 'max-h-[520px]',
  className = '',
  scrollbarColor = 'purple'
}) => {
  const scrollbarClasses = {
    purple: 'scrollbar-thumb-purple-600/40',
    pink: 'scrollbar-thumb-pink-500/40',
    yellow: 'scrollbar-thumb-yellow-500/40',
    cyan: 'scrollbar-thumb-cyan-500/40',
    indigo: 'scrollbar-thumb-indigo-500/40',
    emerald: 'scrollbar-thumb-emerald-500/40'
  }[scrollbarColor];

  return (
    <div className={`w-full ${maxHeight} overflow-y-auto pr-1.5 sm:pr-2 scrollbar-thin ${scrollbarClasses} scrollbar-track-black/30 transition-all ${className}`}>
      {children}
    </div>
  );
};

export default SectionContainer;
