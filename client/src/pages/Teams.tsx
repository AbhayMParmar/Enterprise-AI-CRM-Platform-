import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  X, 
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

interface TeamMember {
  userId: { _id: string; name: string; email: string; avatar?: string; role: string };
  role: 'Admin' | 'Member';
}

interface TeamSession {
  _id: string;
  name: string;
  ownerId: { _id: string; name: string; email: string; avatar?: string };
  members: TeamMember[];
}

export const Teams = () => {
  const { success, error } = useToast();
  const { user: currentUser } = useAuthStore();

  const [teams, setTeams] = useState<TeamSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Team Detail Popup Modal State
  const [selectedTeam, setSelectedTeam] = useState<TeamSession | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states
  const [newTeamName, setNewTeamName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/teams');
      setTeams(response.data.teams || []);
    } catch {
      // Silently ignore — auth may not be ready yet on first render
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post('/teams', { name: newTeamName });
      success('Team created successfully.');
      setIsCreateModalOpen(false);
      setNewTeamName('');
      fetchTeams();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create team.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-brand-textPrimary">Teams & Collaborators</h1>
          <p className="text-xs text-brand-textSecondary mt-0.5">Manage teams and corporate department structures.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Team
        </Button>
      </div>

      {/* Teams Grid */}
      <div>
        <h3 className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider mb-3">Your Corporate Teams</h3>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card><CardBody className="h-44 bg-slate-100 animate-pulse-slow" /></Card>
            <Card><CardBody className="h-44 bg-slate-100 animate-pulse-slow" /></Card>
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-brand-border smooth-shadow text-brand-textSecondary">
            <div className="max-w-xs mx-auto flex flex-col items-center gap-2">
              <Users className="w-10 h-10 text-brand-primary/40" />
              <p className="text-sm font-semibold">No active teams found</p>
              <p className="text-xs">Create a team above to start collaborating with team members.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map((team) => (
              <div key={team._id} onClick={() => { if (window.innerWidth < 768) setSelectedTeam(team); }} className="sm:cursor-default cursor-pointer">
                <Card hoverable>
                  <CardHeader className="bg-slate-50/50 dark:bg-zinc-800/50 flex items-center justify-between py-4">
                    <div className="flex flex-col gap-0.5">
                      <h4 className="font-bold text-brand-textPrimary dark:text-white">{team.name}</h4>
                      <span className="text-[10px] text-brand-textSecondary dark:text-zinc-400">Owner: {team.ownerId?.name || 'N/A'}</span>
                    </div>
                  </CardHeader>
                  <CardBody className="flex flex-col gap-3.5">
                    <span className="text-[10px] font-bold text-brand-textSecondary dark:text-zinc-400 uppercase tracking-widest">Active Members ({team.members.length})</span>
                    
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                      {team.members.map((member, idx) => {
                        if (!member.userId) return null;
                        return (
                          <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-zinc-800/70 border border-slate-100 dark:border-zinc-700/60 rounded-lg">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-brand-primary uppercase">
                                {member.userId.name ? member.userId.name.substring(0, 2) : 'U'}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-xs leading-none text-brand-textPrimary dark:text-white">{member.userId.name}</span>
                                <span className="text-[10px] text-brand-textSecondary dark:text-zinc-400">{member.userId.email}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="bg-slate-200 dark:bg-zinc-700 border border-slate-300 dark:border-zinc-600 text-slate-600 dark:text-zinc-200 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                                {member.userId.role}
                              </span>
                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border 
                                ${member.role === 'Admin' ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-300 border-amber-100 dark:border-amber-800' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'}
                              `}>
                                {member.role}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardBody>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Team Detail Popup Container (Mobile Bottom Sheet Modal) ────────────────────────── */}
      {selectedTeam && (
        <div className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center p-3 z-[9999] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121212] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-zinc-800 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-5 duration-250">
            {/* Top Center Drag Pill Indicator Handle (Clickable Close Trigger) */}
            <div className="pt-3 pb-2 flex justify-center border-b border-slate-100 dark:border-zinc-800/80">
              <button
                type="button"
                onClick={() => setSelectedTeam(null)}
                title="Close Modal"
                className="w-14 h-1.5 bg-slate-300 dark:bg-zinc-700 hover:bg-slate-400 dark:hover:bg-zinc-600 rounded-full transition-colors cursor-pointer"
              />
            </div>

            {/* Header Title Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-[#121212]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {selectedTeam.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Corporate Department &amp; Collaborators</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800">
                  {selectedTeam.members?.length || 0} Members
                </span>
              </div>
            </div>

            {/* Modal Body — Vertically Stacked Data Layout */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs">
              {/* Team Owner Box */}
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/70 rounded-2xl border border-slate-100 dark:border-zinc-800/80 flex flex-col">
                <span className="text-slate-400 dark:text-zinc-500 font-bold text-[10px] uppercase tracking-wider">Team Owner / Lead</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm mt-1">
                  {selectedTeam.ownerId?.name || 'Super Admin'}
                </span>
                <span className="font-semibold text-slate-500 dark:text-zinc-400 text-[11px] mt-0.5">
                  {selectedTeam.ownerId?.email || 'N/A'}
                </span>
              </div>

              {/* Members List */}
              <div className="space-y-2 bg-slate-50/70 dark:bg-zinc-900/40 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800/60 flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Active Team Members ({selectedTeam.members?.length})</span>
                {selectedTeam.members?.map((member, idx) => {
                  if (!member.userId) return null;
                  return (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-white dark:bg-zinc-800/80 border border-slate-100 dark:border-zinc-700/60 rounded-xl">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-xs font-bold uppercase flex-shrink-0">
                          {member.userId.name ? member.userId.name.substring(0, 2) : 'U'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">{member.userId.name}</span>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">{member.userId.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <span className="bg-slate-100 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border border-slate-200 dark:border-zinc-600">
                          {member.userId.role}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Team */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-sm w-full overflow-hidden smooth-shadow border border-brand-border z-10"
            >
              <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-brand-textPrimary">Create Corporate Team</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-brand-textSecondary hover:text-brand-textPrimary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateTeam}>
                <div className="p-6">
                  <Input 
                    label="Team Name" 
                    placeholder="e.g. Enterprise Sales APAC" 
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    required 
                  />
                </div>
                <div className="px-6 py-4 border-t border-brand-border bg-slate-50/50 flex items-center justify-end gap-2.5">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" isLoading={isSubmitting}>Confirm</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Teams;

