import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Mail, 
  Shield, 
  UserPlus, 
  Check, 
  X, 
  Clock, 
  Copy, 
  CheckCircle,
  AlertCircle
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

interface InvitationSession {
  _id: string;
  teamId: { _id: string; name: string };
  role: string;
  invitedBy: { name: string; email: string };
  token: string;
  expiresAt: string;
}

export const Teams = () => {
  const { success, error, info } = useToast();
  const { user: currentUser } = useAuthStore();

  const [teams, setTeams] = useState<TeamSession[]>([]);
  const [invitations, setInvitations] = useState<InvitationSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamSession | null>(null);

  // Form states
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Member' | 'SalesManager' | 'SalesRep'>('SalesRep');
  
  // Display invitation code dialog state
  const [generatedInvite, setGeneratedInvite] = useState<any | null>(null);
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

  const fetchInvitations = async () => {
    try {
      const response = await api.get('/teams/invitations');
      setInvitations(response.data.invitations || []);
    } catch {
      // Silently ignore — user may not have any invitations
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchInvitations();
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

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !inviteEmail.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await api.post('/teams/invite', {
        email: inviteEmail,
        teamId: selectedTeam._id,
        role: inviteRole,
      });

      setGeneratedInvite(response.data.invitation);
      success('Invitation token generated.');
      setInviteEmail('');
      setInviteRole('SalesRep');
      setIsInviteModalOpen(false);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to generate invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptInvite = async (token: string) => {
    try {
      await api.post(`/teams/invitations/${token}/accept`);
      success('Successfully joined the team!');
      setInvitations(invitations.filter(i => i.token !== token));
      fetchTeams();
    } catch (err: any) {
      error('Failed to accept invitation.');
    }
  };

  const handleDeclineInvite = async (token: string) => {
    try {
      await api.post(`/teams/invitations/${token}/decline`);
      success('Invitation declined.');
      setInvitations(invitations.filter(i => i.token !== token));
    } catch (err: any) {
      error('Failed to decline invitation.');
    }
  };

  const copyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/accept-invite?token=${token}`;
    navigator.clipboard.writeText(inviteUrl);
    success('Invitation URL copied to clipboard.');
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-brand-textPrimary">Teams & Collaborators</h1>
          <p className="text-xs text-brand-textSecondary mt-0.5">Manage permissions, invite Sales Managers, and configure departments.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Team
        </Button>
      </div>

      {/* Grid: Pending Invites (Alert banner style if present) */}
      <AnimatePresence>
        {invitations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-3"
          >
            <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 animate-pulse" /> Pending Invites ({invitations.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invitations.map((invite) => (
                <Card key={invite._id} className="border-brand-primary/20 bg-brand-primary/5">
                  <CardBody className="flex items-center justify-between p-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-brand-textSecondary">
                        Invited by <strong className="text-slate-800">{invite.invitedBy.name}</strong> to join:
                      </span>
                      <span className="font-bold text-sm text-brand-textPrimary">{invite.teamId.name}</span>
                      <span className="text-[10px] text-brand-primary font-semibold uppercase mt-0.5">
                        Target Role: {invite.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleAcceptInvite(invite.token)}
                        className="p-1.5 bg-brand-primary text-white hover:bg-brand-secondary rounded-lg smooth-shadow transition-colors"
                        title="Accept Invite"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeclineInvite(invite.token)}
                        className="p-1.5 bg-white border border-brand-border text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg smooth-shadow transition-colors"
                        title="Decline Invite"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated invitation token display */}
      {generatedInvite && (
        <Card className="border-green-200 bg-green-50/10">
          <CardBody className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-slate-800">Invite Code Created successfully!</span>
                <p className="text-xs text-slate-500">
                  Send this code or link to <strong className="text-slate-800">{generatedInvite.email}</strong>. They must login to accept it.
                </p>
                <div className="mt-2 flex items-center gap-2 font-mono text-[10px] bg-slate-900 text-slate-200 p-2 rounded-lg w-fit select-all">
                  <span>URL link: {window.location.origin}/accept-invite?token={generatedInvite.token}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end md:self-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copyInviteLink(generatedInvite.token)}
              >
                <Copy className="w-3.5 h-3.5 mr-2" />
                Copy Link
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setGeneratedInvite(null)}
              >
                Dismiss
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

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
              <p className="text-xs">Create a team above to start collaborating with other managers.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map((team) => (
              <Card key={team._id} hoverable>
                <CardHeader className="bg-slate-50/50 flex items-center justify-between py-4">
                  <div className="flex flex-col gap-0.5">
                    <h4 className="font-bold text-brand-textPrimary">{team.name}</h4>
                    <span className="text-[10px] text-brand-textSecondary">Owner: {team.ownerId.name}</span>
                  </div>
                  {/* Action invite triggers */}
                  {(team.ownerId._id === currentUser?.id || team.members.some(m => m.userId?._id === currentUser?.id && m.role === 'Admin')) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="py-1 px-2.5" 
                      onClick={() => {
                        setSelectedTeam(team);
                        setIsInviteModalOpen(true);
                      }}
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1 text-brand-primary" />
                      Invite
                    </Button>
                  )}
                </CardHeader>
                <CardBody className="flex flex-col gap-3.5">
                  <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-widest">Active Members ({team.members.length})</span>
                  
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                    {team.members.map((member, idx) => {
                      if (!member.userId) return null;
                      return (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-brand-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-brand-primary uppercase">
                              {member.userId.name.substring(0, 2)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-xs leading-none text-brand-textPrimary">{member.userId.name}</span>
                              <span className="text-[10px] text-brand-textSecondary">{member.userId.email}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="bg-slate-200 border border-slate-300 text-slate-600 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                              {member.userId.role}
                            </span>
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border 
                              ${member.role === 'Admin' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-100 text-slate-500 border-slate-200'}
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
            ))}
          </div>
        )}
      </div>

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

      {/* Modal: Invite Collaborator */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsInviteModalOpen(false);
                setSelectedTeam(null);
              }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-sm w-full overflow-hidden smooth-shadow border border-brand-border z-10"
            >
              <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-brand-textPrimary">Invite Member to {selectedTeam?.name}</h3>
                <button 
                  onClick={() => {
                    setIsInviteModalOpen(false);
                    setSelectedTeam(null);
                  }} 
                  className="text-brand-textSecondary hover:text-brand-textPrimary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSendInvite}>
                <div className="p-6 flex flex-col gap-4">
                  <Input 
                    label="Email Address" 
                    type="email"
                    placeholder="member@company.com" 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required 
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-brand-textPrimary select-none">Workspace Permission Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e: any) => setInviteRole(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg outline-none transition-all duration-200 text-brand-textPrimary focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    >
                      <option value="SalesRep">Sales Representative (SalesRep)</option>
                      <option value="SalesManager">Sales Manager</option>
                      <option value="Admin">Administrator (Admin)</option>
                    </select>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-brand-border bg-slate-50/50 flex items-center justify-end gap-2.5">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsInviteModalOpen(false);
                      setSelectedTeam(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" isLoading={isSubmitting}>Generate Invite</Button>
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
