import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  Mail,
  FileText,
  Send,
  Copy,
  Check,
  MessageSquare,
  Zap,
  ChevronRight,
  Brain,
  TrendingUp,
  Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

/* ─── Types ─────────────────────────────────────────────────────────────── */
type Tab = 'copilot' | 'email' | 'summarizer';
type Msg = { role: 'user' | 'assistant'; content: string };

/* ─── Quick‑prompt chips ──────────────────────────────────────────────────*/
const QUICK_PROMPTS = [
  { icon: '💡', label: 'Price Objections', text: 'How should I handle price objections during contract negotiation?' },
  { icon: '📋', label: 'BANT Checklist',   text: 'Give me a BANT lead qualification framework checklist for tech sales.' },
  { icon: '🚀', label: 'Close Strategy',   text: 'What are the top 3 closing techniques for enterprise B2B deals?' },
];

/* ─── Tab metadata ────────────────────────────────────────────────────────*/
const TABS: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'copilot',    label: 'Copilot Chat', icon: MessageSquare, desc: 'Real-time sales strategy' },
  { id: 'email',      label: 'Email Writer',  icon: Mail,          desc: 'AI-crafted outreach'     },
  { id: 'summarizer', label: 'Summarizer',    icon: FileText,      desc: 'Meeting intel extraction' },
];

/* ════════════════════════════════════════════════════════════════════════ */
export const AiAssistant = () => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('copilot');

  /* Copilot */
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Hello! I am your AI Sales Copilot powered by Groq LLaMA-3. How can I help you qualify leads, handle objections, or close deals today?' },
  ]);
  const [inputPrompt, setInputPrompt]     = useState('');
  const [isCopilotLoading, setCopilotLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isCopilotLoading]);

  /* Email */
  const [recipientName,      setRecipientName]      = useState('John Doe');
  const [companyName,        setCompanyName]        = useState('Acme Corp');
  const [dealValue,          setDealValue]          = useState('50000');
  const [emailType,          setEmailType]          = useState<'Cold Outreach'|'Follow-up'|'Proposal Intro'|'Objection Handler'>('Follow-up');
  const [customInstructions, setCustomInstructions] = useState('');
  const [generatedEmail,     setGeneratedEmail]     = useState('');
  const [isEmailLoading,     setEmailLoading]       = useState(false);
  const [isCopied,           setIsCopied]           = useState(false);

  /* Summarizer */
  const [rawNotes,        setRawNotes]       = useState('');
  const [summarizedOutput,setSummarizedOutput] = useState('');
  const [isSummaryLoading,setSummaryLoading]  = useState(false);

  /* ── Handlers ───────────────────────────────────────────────────────── */
  const handleSendCopilot = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const text = customText || inputPrompt;
    if (!text.trim()) return;
    setMessages(p => [...p, { role: 'user', content: text }]);
    if (!customText) setInputPrompt('');
    setCopilotLoading(true);
    try {
      const res = await api.post('/ai/copilot-chat', { prompt: text, history: messages.slice(-4) });
      setMessages(p => [...p, { role: 'assistant', content: res.data.reply }]);
    } catch {
      error('Copilot request failed.');
      setMessages(p => [...p, { role: 'assistant', content: 'Sorry, I encountered an issue reaching the Groq AI model.' }]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleGenerateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      const res = await api.post('/ai/generate-email', {
        recipientName, company: companyName,
        dealValue: parseFloat(dealValue) || 0, emailType, customPrompt: customInstructions,
      });
      setGeneratedEmail(res.data.result);
      success('AI email generated!');
    } catch { error('Failed to generate email.'); }
    finally   { setEmailLoading(false); }
  };

  const handleSummarizeNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawNotes.trim()) return;
    setSummaryLoading(true);
    try {
      const res = await api.post('/ai/summarize-notes', { notes: rawNotes });
      setSummarizedOutput(res.data.result);
      success('Notes summarized!');
    } catch { error('Failed to summarize notes.'); }
    finally   { setSummaryLoading(false); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    success('Copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div
      className="flex flex-col w-full"
      style={{ height: 'calc(100vh - 96px)', minHeight: 0 }}
    >
      {/* ══ TOP HEADER STRIP ═══════════════════════════════════════════ */}
      <div className="flex-shrink-0 mb-2 sm:mb-3">
        {/* Gradient card */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 45%, #4f46e5 100%)',
          }}
        >
          {/* Decorative blobs */}
          <div
            className="pointer-events-none absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #818cf8, transparent 70%)' }}
          />
          <div
            className="pointer-events-none absolute -bottom-6 left-10 w-24 h-24 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #38bdf8, transparent 70%)' }}
          />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3">
            {/* Left: branding */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}
              >
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-white leading-tight tracking-tight">
                  AI Sales Copilot <span className="text-blue-200">&amp; Tools</span>
                </h1>
                <p className="text-[10px] sm:text-[11px] text-blue-200 leading-tight truncate">
                  Powered by Groq LLaMA-3 · High-speed sales intelligence
                </p>
              </div>
            </div>

            {/* Right: status pills */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold text-emerald-100"
                style={{ background: 'rgba(16,185,129,0.22)', border: '1px solid rgba(52,211,153,0.35)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                LLaMA 3.3 Active
              </span>
              <span
                className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold text-blue-100"
                style={{ background: 'rgba(99,102,241,0.28)', border: '1px solid rgba(129,140,248,0.35)' }}
              >
                <Shield className="w-2.5 h-2.5" />
                Enterprise
              </span>
            </div>
          </div>

          {/* ── Tab bar ─────────────────────────────────────────────── */}
          <div
            className="relative z-10 flex items-center gap-0.5 px-3 sm:px-4 pb-2.5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}
          >
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all duration-200 whitespace-nowrap select-none mt-2"
                  style={
                    active
                      ? { background: 'rgba(255,255,255,0.95)', color: '#2563eb', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }
                      : { background: 'rgba(255,255,255,0.10)', color: 'rgba(219,234,254,0.9)', border: '1px solid rgba(255,255,255,0.14)' }
                  }
                >
                  <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══ TAB CONTENT — fills remaining height ═══════════════════════ */}
      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">

          {/* ─────────────── TAB 1: COPILOT CHAT ─────────────────────── */}
          {activeTab === 'copilot' && (
            <motion.div
              key="copilot"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="h-full flex flex-col rounded-2xl overflow-hidden"
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 24px rgba(37,99,235,0.07), 0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              {/* Chat sub-header */}
              <div
                className="flex-shrink-0 flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5"
                style={{ borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(to right, #f8faff, #fafafa)' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs font-bold text-slate-800 leading-tight">Interactive AI Sales Strategist</p>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 leading-tight">Ask anything about pipeline, objections &amp; closing</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-600 hidden xs:inline">Live</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-2 sm:py-3 flex flex-col gap-2 sm:gap-2.5 min-h-0">
                {messages.map((m, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex gap-1.5 sm:gap-2 max-w-[92%] sm:max-w-[85%] md:max-w-[78%] ${
                      m.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[8px] sm:text-[9px] font-bold flex-shrink-0 mt-0.5 ${
                        m.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                      }`}
                    >
                      {m.role === 'user' ? 'Y' : <Bot className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl text-[11px] sm:text-xs leading-relaxed break-words ${
                        m.role === 'user'
                          ? 'rounded-tr-sm text-white'
                          : 'rounded-tl-sm text-slate-700 whitespace-pre-wrap'
                      }`}
                      style={
                        m.role === 'user'
                          ? { background: 'linear-gradient(135deg, #2563eb, #4f46e5)', boxShadow: '0 2px 10px rgba(37,99,235,0.25)' }
                          : { background: '#f8fafc', border: '1px solid #e8edf5' }
                      }
                    >
                      {m.content}
                    </div>
                  </motion.div>
                ))}

                {isCopilotLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-[11px] text-slate-400"
                  >
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    </div>
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-2xl rounded-tl-sm">
                      <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick prompts + Input */}
              <div
                className="flex-shrink-0 px-3 sm:px-4 pt-2 pb-2.5 sm:pb-3 flex flex-col gap-1.5 sm:gap-2"
                style={{ borderTop: '1px solid #f1f5f9', background: 'linear-gradient(to top, #f8faff, #fff)' }}
              >
                {/* Chips */}
                <div className="flex items-center gap-1 overflow-x-auto">
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium whitespace-nowrap flex-shrink-0 mr-0.5">
                    Try:
                  </span>
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q.label}
                      type="button"
                      onClick={() => handleSendCopilot(undefined, q.text)}
                      className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-medium whitespace-nowrap flex-shrink-0 transition-all duration-150 active:scale-95"
                      style={{ background: '#f0f4ff', border: '1px solid #c7d7fd', color: '#3b5bdb' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#dce6ff')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#f0f4ff')}
                    >
                      <span>{q.icon}</span>
                      <span>{q.label}</span>
                    </button>
                  ))}
                </div>

                {/* Input row */}
                <form onSubmit={handleSendCopilot} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ask about pipeline strategy, objections, closing tactics…"
                    value={inputPrompt}
                    onChange={e => setInputPrompt(e.target.value)}
                    className="flex-1 min-w-0 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all"
                    style={{
                      background: '#fff',
                      border: '1.5px solid #e2e8f0',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#2563eb')}
                    onBlur={e  => (e.currentTarget.style.borderColor = '#e2e8f0')}
                  />
                  <button
                    type="submit"
                    disabled={isCopilotLoading || !inputPrompt.trim()}
                    className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', boxShadow: '0 2px 8px rgba(37,99,235,0.35)' }}
                  >
                    <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* ─────────────── TAB 2: EMAIL WRITER ─────────────────────── */}
          {activeTab === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="h-full grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3"
            >
              {/* Left: form */}
              <div
                className="rounded-2xl flex flex-col overflow-hidden"
                style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(37,99,235,0.07)' }}
              >
                {/* Panel header */}
                <div
                  className="flex-shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2.5"
                  style={{ borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(to right, #f8faff, #fafafa)' }}
                >
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs font-bold text-slate-800">Email Campaign Parameters</p>
                    <p className="text-[9px] sm:text-[10px] text-slate-400">Configure your AI outreach</p>
                  </div>
                </div>

                {/* Scrollable form body */}
                <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-2.5 sm:py-3">
                  <form onSubmit={handleGenerateEmail} className="flex flex-col gap-2.5 sm:gap-3">
                    {/* 2-col row for name + company */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] sm:text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Recipient</label>
                        <input
                          value={recipientName}
                          onChange={e => setRecipientName(e.target.value)}
                          placeholder="e.g. John Doe"
                          required
                          className="px-2.5 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all"
                          style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
                          onFocus={e => (e.currentTarget.style.borderColor = '#2563eb')}
                          onBlur={e  => (e.currentTarget.style.borderColor = '#e2e8f0')}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] sm:text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Company</label>
                        <input
                          value={companyName}
                          onChange={e => setCompanyName(e.target.value)}
                          placeholder="e.g. Acme Corp"
                          className="px-2.5 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all"
                          style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
                          onFocus={e => (e.currentTarget.style.borderColor = '#2563eb')}
                          onBlur={e  => (e.currentTarget.style.borderColor = '#e2e8f0')}
                        />
                      </div>
                    </div>

                    {/* 2-col row for deal value + email type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] sm:text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Deal Value ($)</label>
                        <input
                          type="number"
                          value={dealValue}
                          onChange={e => setDealValue(e.target.value)}
                          placeholder="50000"
                          className="px-2.5 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all"
                          style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
                          onFocus={e => (e.currentTarget.style.borderColor = '#2563eb')}
                          onBlur={e  => (e.currentTarget.style.borderColor = '#e2e8f0')}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] sm:text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Email Type</label>
                        <select
                          value={emailType}
                          onChange={e => setEmailType(e.target.value as any)}
                          className="px-2.5 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs text-slate-800 outline-none transition-all cursor-pointer appearance-none"
                          style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
                          onFocus={e => (e.currentTarget.style.borderColor = '#2563eb')}
                          onBlur={e  => (e.currentTarget.style.borderColor = '#e2e8f0')}
                        >
                          <option value="Cold Outreach">Cold Outreach</option>
                          <option value="Follow-up">Follow-up</option>
                          <option value="Proposal Intro">Proposal Intro</option>
                          <option value="Objection Handler">Objection Handler</option>
                        </select>
                      </div>
                    </div>

                    {/* Notes / Tone */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] sm:text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Additional Notes / Tone</label>
                      <textarea
                        rows={3}
                        value={customInstructions}
                        onChange={e => setCustomInstructions(e.target.value)}
                        placeholder="e.g. Emphasize fast ROI and 24/7 customer support…"
                        className="px-2.5 py-2 rounded-lg text-[11px] sm:text-xs text-slate-800 placeholder:text-slate-400 outline-none resize-none transition-all"
                        style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#2563eb')}
                        onBlur={e  => (e.currentTarget.style.borderColor = '#e2e8f0')}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isEmailLoading}
                      className="flex items-center justify-center gap-2 w-full py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-semibold text-white transition-all duration-200 disabled:opacity-50 active:scale-[0.98]"
                      style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}
                    >
                      {isEmailLoading ? (
                        <>
                          <Sparkles className="w-3 h-3 animate-spin" />
                          Generating…
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          Generate Email with AI
                          <ChevronRight className="w-3 h-3 opacity-70" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right: preview */}
              <div
                className="rounded-2xl flex flex-col overflow-hidden"
                style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(37,99,235,0.07)' }}
              >
                <div
                  className="flex-shrink-0 flex items-center justify-between px-3 sm:px-4 py-2.5"
                  style={{ borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(to right, #f8faff, #fafafa)' }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-xs font-bold text-slate-800">AI Generated Email Draft</p>
                      <p className="text-[9px] sm:text-[10px] text-slate-400">Ready to send</p>
                    </div>
                  </div>
                  {generatedEmail && (
                    <button
                      onClick={() => copyToClipboard(generatedEmail)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold transition-all active:scale-95"
                      style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a' }}
                    >
                      {isCopied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                      {isCopied ? 'Copied!' : 'Copy'}
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                  {generatedEmail ? (
                    <pre className="font-mono text-[10px] sm:text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {generatedEmail}
                    </pre>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                      <div
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #eff6ff, #eef2ff)' }}
                      >
                        <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500">No draft yet</p>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Configure parameters and generate your email</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─────────────── TAB 3: SUMMARIZER ───────────────────────── */}
          {activeTab === 'summarizer' && (
            <motion.div
              key="summarizer"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="h-full grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3"
            >
              {/* Left: notes input */}
              <div
                className="rounded-2xl flex flex-col overflow-hidden"
                style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(37,99,235,0.07)' }}
              >
                <div
                  className="flex-shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2.5"
                  style={{ borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(to right, #f8faff, #fafafa)' }}
                >
                  <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs font-bold text-slate-800">Raw Meeting Notes</p>
                    <p className="text-[9px] sm:text-[10px] text-slate-400">Paste unstructured call notes or transcripts</p>
                  </div>
                </div>
                <div className="flex-1 flex flex-col overflow-hidden px-3 sm:px-4 py-2.5 sm:py-3">
                  <form onSubmit={handleSummarizeNotes} className="flex-1 flex flex-col gap-2.5">
                    <textarea
                      className="flex-1 w-full px-2.5 py-2 rounded-xl text-[11px] sm:text-xs text-slate-800 placeholder:text-slate-400 outline-none resize-none transition-all leading-relaxed"
                      style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', minHeight: '120px' }}
                      placeholder="Paste raw unstructured call notes, transcript snippets, or discussion points here…"
                      value={rawNotes}
                      onChange={e => setRawNotes(e.target.value)}
                      onFocus={e => (e.currentTarget.style.borderColor = '#7c3aed')}
                      onBlur={e  => (e.currentTarget.style.borderColor = '#e2e8f0')}
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSummaryLoading}
                      className="flex items-center justify-center gap-2 w-full py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-semibold text-white transition-all duration-200 disabled:opacity-50 active:scale-[0.98] flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}
                    >
                      {isSummaryLoading ? (
                        <><Zap className="w-3 h-3 animate-spin" /> Processing…</>
                      ) : (
                        <><Zap className="w-3 h-3" /> Summarize &amp; Extract Action Items <ChevronRight className="w-3 h-3 opacity-70" /></>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right: output */}
              <div
                className="rounded-2xl flex flex-col overflow-hidden"
                style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(37,99,235,0.07)' }}
              >
                <div
                  className="flex-shrink-0 flex items-center justify-between px-3 sm:px-4 py-2.5"
                  style={{ borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(to right, #f8faff, #fafafa)' }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-xs font-bold text-slate-800">Structured Executive Summary</p>
                      <p className="text-[9px] sm:text-[10px] text-slate-400">Key insights &amp; action items</p>
                    </div>
                  </div>
                  {summarizedOutput && (
                    <button
                      onClick={() => copyToClipboard(summarizedOutput)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold transition-all active:scale-95"
                      style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a' }}
                    >
                      {isCopied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                      {isCopied ? 'Copied!' : 'Copy'}
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                  {summarizedOutput ? (
                    <pre className="font-mono text-[10px] sm:text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {summarizedOutput}
                    </pre>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                      <div
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}
                      >
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500">No summary yet</p>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Paste meeting notes to extract summary &amp; action items</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default AiAssistant;
