import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export const LogoIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <div className={`relative ${className} shrink-0 rounded-xl overflow-hidden shadow-md transition-transform duration-200 hover:scale-105 select-none`}>
    <svg viewBox="0 0 512 512" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
        <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#93C5FD" />
        </linearGradient>
        <linearGradient id="glowRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#A5B4FC" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {/* Sleek Gradient Rounded Squircle */}
      <rect width="512" height="512" rx="140" fill="url(#logoBgGrad)" />
      <rect x="12" y="12" width="488" height="488" rx="128" fill="none" stroke="url(#glowRing)" strokeWidth="8" />

      {/* Modern Professional AI Crown & Neural Diamond Icon */}
      <path d="M256 96L368 176V336L256 416L144 336V176L256 96Z" fill="#FFFFFF" fillOpacity="0.15" stroke="#FFFFFF" strokeWidth="12" strokeLinejoin="round" />
      <path d="M256 140L336 200V312L256 372L176 312V200L256 140Z" fill="url(#sparkGrad)" fillOpacity="0.95" />
      <path d="M256 180L296 220V292L256 332L216 292V220L256 180Z" fill="url(#logoBgGrad)" />
      
      {/* Central Glowing AI Spark */}
      <circle cx="256" cy="256" r="24" fill="#FFFFFF" />
      <circle cx="256" cy="256" r="14" fill="#2563EB" />
      <circle cx="256" cy="256" r="6" fill="#FFFFFF" />
    </svg>
  </div>
);

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  onClick,
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  const textSizeMap = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <LogoIcon className={sizeMap[size]} />

      {showText && (
        <div className="flex flex-col leading-none">
          <div className={`font-black tracking-tight ${textSizeMap[size]} flex items-center gap-1.5`}>
            <span className="text-slate-900 dark:text-white">AI CRM</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800 tracking-wider">
              PRO
            </span>
          </div>
          {size !== 'sm' && (
            <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-400 tracking-wider mt-1">
              Enterprise Sales Platform
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
