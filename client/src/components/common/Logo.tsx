import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  const textSizeMap = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className={`relative ${sizeMap[size]} shrink-0 transition-transform hover:scale-105`}>
        <img
          src="/favicon.svg"
          alt="AI CRM Icon"
          className="w-full h-full object-contain drop-shadow-md"
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className={`font-extrabold tracking-tight text-slate-900 ${textSizeMap[size]} flex items-center gap-1`}>
            <span>AI CRM</span>
            <span className="text-blue-600 font-black">SUITE</span>
          </div>
          {size !== 'sm' && (
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Enterprise Platform
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
