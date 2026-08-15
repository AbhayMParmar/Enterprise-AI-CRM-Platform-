import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export const LogoIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <div className={`relative ${className} shrink-0 rounded-xl overflow-hidden shadow-xs transition-transform duration-200 hover:scale-105 select-none`}>
    <svg viewBox="0 0 512 512" className="w-full h-full">
      <defs>
        <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
        <linearGradient id="logoGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="128" fill="url(#logoBg)" />
      <rect x="16" y="16" width="480" height="480" rx="116" fill="none" stroke="#FFFFFF" strokeWidth="6" strokeOpacity="0.25" />
      <path d="M 256 96 L 384 176 L 320 216 L 256 176 L 192 216 L 128 176 Z" fill="url(#logoGlow)" opacity="0.95" />
      <path d="M 128 196 L 192 236 L 192 336 L 128 296 Z" fill="#93C5FD" opacity="0.90" />
      <path d="M 384 196 L 384 296 L 320 336 L 320 236 Z" fill="#60A5FA" opacity="0.90" />
      <polygon points="256,200 304,232 304,296 256,328 208,296 208,232" fill="#FFFFFF" opacity="0.98" />
      <polygon points="256,220 286,264 256,308 226,264" fill="url(#logoBg)" />
      <circle cx="256" cy="264" r="9" fill="#FFFFFF" />
      <path d="M 208 316 L 256 348 L 304 316 L 256 416 Z" fill="url(#logoGlow)" opacity="0.95" />
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
          <div className={`font-black tracking-tight text-slate-900 dark:text-white ${textSizeMap[size]} flex items-center gap-1.5`}>
            <span>AI CRM</span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-600 text-white tracking-wider shadow-2xs">
              ENTERPRISE
            </span>
          </div>
          {size !== 'sm' && (
            <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mt-1">
              Sales &amp; AI Platform
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
