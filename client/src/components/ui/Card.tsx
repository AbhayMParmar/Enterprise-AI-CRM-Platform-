import React, { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, hoverable = false, className = '', ...props }) => {
  return (
    <div
      className={`bg-brand-surface border border-brand-border rounded-xl smooth-shadow transition-all duration-200 
        ${hoverable ? 'hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300' : ''} 
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }> = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-5 py-4 border-b border-brand-border flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardBody: React.FC<HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }> = ({ children, className = '', ...props }) => {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }> = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-5 py-4 border-t border-brand-border bg-slate-50/50 rounded-b-xl ${className}`} {...props}>
      {children}
    </div>
  );
};
