import React, { InputHTMLAttributes, forwardRef, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = '', ...props }, ref) => {
    const inputBorderClass = error 
      ? 'border-red-500 focus:ring-red-500/30 focus:border-red-500' 
      : 'border-brand-border focus:ring-brand-primary/20 focus:border-brand-primary';

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-brand-textPrimary select-none">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-brand-textSecondary pointer-events-none select-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full px-3 py-2 text-sm bg-white border rounded-lg outline-none transition-all duration-200 placeholder-slate-400 text-brand-textPrimary disabled:bg-slate-50 disabled:text-slate-400
              ${leftIcon ? 'pl-9' : ''} 
              ${rightIcon ? 'pr-9' : ''} 
              ${inputBorderClass} 
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-brand-textSecondary">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <span className="text-xs font-medium text-red-500">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
