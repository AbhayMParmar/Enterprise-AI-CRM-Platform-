import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PricingSection } from '../components/subscription/PricingSection';
import { Logo } from '../components/common/Logo';
import ThemeToggle from '../components/common/ThemeToggle';

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] text-slate-900 dark:text-white flex flex-col transition-colors duration-200">
      {/* Header Bar */}
      <header className="border-b border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Logo size="sm" onClick={() => navigate('/')} />
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Pricing Section */}
      <main className="flex-1">
        <PricingSection showTitle={true} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-zinc-800 py-6 bg-white dark:bg-[#09090B] text-center text-xs text-slate-500 dark:text-zinc-500 transition-colors">
        &copy; {new Date().getFullYear()} Enterprise AI CRM Platform. All payments secured by Razorpay.
      </footer>
    </div>
  );
};

export default PricingPage;
