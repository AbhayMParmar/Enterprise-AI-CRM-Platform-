import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Building2, 
  User, 
  X, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import KanbanBoard, { DealItem, DealStage } from '../components/sales/KanbanBoard';

export const Deals = () => {
  const { success, error } = useToast();
  const { user: currentUser } = useAuthStore();

  const [deals, setDeals] = useState<DealItem[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [assignedFilter, setAssignedFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Create Deal Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<DealItem | null>(null);

  // Form fields
  const [newTitle, setNewTitle] = useState('');
  const [newCustomer, setNewCustomer] = useState('');
  const [newValue, setNewValue] = useState('10000');
  const [newStage, setNewStage] = useState<DealStage>('Lead');
  const [newCloseDate, setNewCloseDate] = useState('');
  const [newAssignedTo, setNewAssignedTo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDeals = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/deals', {
        params: {
          search: searchTerm || undefined,
          stage: stageFilter !== 'All' ? stageFilter : undefined,
          assignedTo: assignedFilter !== 'All' ? assignedFilter : undefined,
        },
      });

      const mapped: DealItem[] = response.data.deals.map((d: any) => ({
        id: d._id,
        title: d.title,
        value: d.value,
        stage: d.stage,
        probability: d.probability,
        customer: d.customer ? { id: d.customer._id, name: d.customer.name, company: d.customer.company, email: d.customer.email } : undefined,
        assignedTo: d.assignedTo ? { id: d.assignedTo._id, name: d.assignedTo.name, avatar: d.assignedTo.avatar, role: d.assignedTo.role } : undefined,
      }));

      setDeals(mapped);
    } catch (err: any) {
      error('Failed to load deals list.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [custRes, userRes] = await Promise.all([
        api.get('/customers'),
        api.get('/users'),
      ]);
      setCustomers(custRes.data.customers);
      setTeamMembers(userRes.data.users);
    } catch (err) {
      console.warn('Failed to fetch customers/users catalog');
    }
  };

  useEffect(() => {
    fetchDeals();
  }, [searchTerm, stageFilter, assignedFilter]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const handleStageChange = async (dealId: string, newStage: DealStage) => {
    // Optimistic UI update
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
    );

    try {
      await api.patch(`/deals/${dealId}/stage`, { stage: newStage });
      success(`Moved deal stage to ${newStage}.`);
    } catch (err: any) {
      error('Failed to update deal stage.');
      fetchDeals(); // Revert on error
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newCustomer) {
      error('Deal Title and Associated Customer are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/deals', {
        title: newTitle,
        customer: newCustomer,
        value: parseFloat(newValue) || 0,
        stage: newStage,
        expectedCloseDate: newCloseDate || undefined,
        assignedTo: newAssignedTo || undefined,
      });

      success('Deal created successfully.');
      setIsCreateModalOpen(false);

      // Reset form
      setNewTitle('');
      setNewCustomer('');
      setNewValue('10000');
      setNewStage('Lead');
      setNewCloseDate('');
      setNewAssignedTo('');

      fetchDeals();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create deal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      await api.delete(`/deals/${dealId}`);
      success('Deal deleted successfully.');
      setDeals((prev) => prev.filter((d) => d.id !== dealId));
      if (selectedDeal?.id === dealId) setSelectedDeal(null);
    } catch (err: any) {
      error(err.response?.data?.message || 'Unauthorized. Delete failed.');
    }
  };

  // Aggregated pipeline metrics
  const totalClosedWon = deals.filter((d) => d.stage === 'Won').reduce((acc, d) => acc + d.value, 0);
  const activePipelineValue = deals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost').reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-textPrimary">Deals & Sales Pipeline</h1>
          <p className="text-xs text-brand-textSecondary mt-0.5">Track opportunities, drag-and-drop stages, and manage close probabilities.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-brand-border">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'kanban' ? 'bg-white text-brand-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'list' ? 'bg-white text-brand-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Deal
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50/30 border-blue-100">
          <CardBody className="p-3 sm:p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] sm:text-xs font-semibold text-blue-700 truncate">Active Pipeline Value</span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 truncate">${activePipelineValue.toLocaleString()}</h3>
            </div>
            <div className="p-2 sm:p-2.5 bg-blue-600 text-white rounded-xl flex-shrink-0 ml-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50/30 border-emerald-100">
          <CardBody className="p-3 sm:p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] sm:text-xs font-semibold text-emerald-700 truncate">Closed Won Revenue</span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 truncate">${totalClosedWon.toLocaleString()}</h3>
            </div>
            <div className="p-2 sm:p-2.5 bg-emerald-600 text-white rounded-xl flex-shrink-0 ml-2">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardBody>
        </Card>

        <Card className="bg-slate-50 border-brand-border">
          <CardBody className="p-3 sm:p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-600 truncate">Total Opportunities</span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 truncate">{deals.length} Deals</h3>
            </div>
            <div className="p-2 sm:p-2.5 bg-slate-200 text-slate-700 rounded-xl flex-shrink-0 ml-2">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardBody className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-textSecondary" />
            <input
              type="text"
              placeholder="Search deals by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm outline-none focus:border-brand-primary/60 focus:ring-1 focus:ring-brand-primary/30 w-full transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
              <span className="text-brand-textSecondary font-semibold flex items-center gap-1.5 flex-shrink-0">
                <Filter className="w-3.5 h-3.5" /> Stage:
              </span>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-1.5 sm:py-2 bg-brand-bg border border-brand-border rounded-lg outline-none cursor-pointer text-brand-textPrimary text-xs focus:ring-1 focus:ring-brand-primary appearance-none"
              >
                <option value="All">All Stages</option>
                <option value="Lead">Lead</option>
                <option value="Contacted">Contacted</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Won">Closed Won</option>
                <option value="Lost">Closed Lost</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
              <span className="text-brand-textSecondary font-semibold flex-shrink-0">Rep:</span>
              <select
                value={assignedFilter}
                onChange={(e) => setAssignedFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-1.5 sm:py-2 bg-brand-bg border border-brand-border rounded-lg outline-none cursor-pointer text-brand-textPrimary text-xs focus:ring-1 focus:ring-brand-primary appearance-none"
              >
                <option value="All">All Reps</option>
                {teamMembers.map((m) => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Main View: Kanban vs Table */}
      {viewMode === 'kanban' ? (
        <KanbanBoard
          deals={deals}
          onStageChange={handleStageChange}
          onSelectDeal={(d) => setSelectedDeal(d)}
          isLoading={isLoading}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-brand-border text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">
                  <th className="px-6 py-4">Deal Title</th>
                  <th className="px-6 py-4">Customer Company</th>
                  <th className="px-6 py-4">Stage</th>
                  <th className="px-6 py-4">Probability</th>
                  <th className="px-6 py-4">Value ($)</th>
                  <th className="px-6 py-4">Assigned Rep</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-sm">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-200 rounded animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 rounded animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-200 rounded animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-200 rounded animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-200 rounded animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 rounded animate-pulse" /></td>
                      <td className="px-6 py-4 text-right"><div className="h-4 w-10 bg-slate-200 rounded animate-pulse ml-auto" /></td>
                    </tr>
                  ))
                ) : deals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-brand-textSecondary italic">
                      <div className="max-w-xs mx-auto flex flex-col items-center gap-2">
                        <AlertCircle className="w-8 h-8 text-brand-primary/40" />
                        <p className="text-sm font-semibold">No deals found in pipeline</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  deals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-brand-textPrimary">{deal.title}</td>
                      <td className="px-6 py-4 text-slate-600">{deal.customer?.company || deal.customer?.name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 border border-slate-200">
                          {deal.stage}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-brand-primary">{deal.probability}%</td>
                      <td className="px-6 py-4 font-bold text-slate-900">${deal.value.toLocaleString()}</td>
                      <td className="px-6 py-4">{deal.assignedTo?.name || 'Unassigned'}</td>
                      <td className="px-6 py-4 text-right">
                        {(currentUser?.role === 'SuperAdmin' || currentUser?.role === 'Admin' || currentUser?.role === 'SalesManager') && (
                          <button
                            onClick={() => handleDeleteDeal(deal.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal: Create Deal */}
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
              className="bg-white rounded-2xl max-w-lg w-full overflow-hidden smooth-shadow border border-brand-border z-10"
            >
              <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-brand-textPrimary">Create Sales Opportunity</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-brand-textSecondary hover:text-brand-textPrimary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateDeal}>
                <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                  <Input
                    label="Deal Opportunity Title"
                    placeholder="e.g. Enterprise Cloud Migration Contract"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-brand-textPrimary select-none">Associated Customer</label>
                    <select
                      value={newCustomer}
                      onChange={(e) => setNewCustomer(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg outline-none text-brand-textPrimary focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    >
                      <option value="">Select Customer Contact...</option>
                      {customers.map((c) => (
                        <option key={c._id} value={c._id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Deal Value ($)"
                      type="number"
                      placeholder="25000"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      required
                    />

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-brand-textPrimary select-none">Initial Stage</label>
                      <select
                        value={newStage}
                        onChange={(e) => setNewStage(e.target.value as DealStage)}
                        className="w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg outline-none text-brand-textPrimary focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      >
                        <option value="Lead">Lead In (10%)</option>
                        <option value="Contacted">Contacted (25%)</option>
                        <option value="Proposal">Proposal Sent (50%)</option>
                        <option value="Negotiation">Negotiation (75%)</option>
                        <option value="Won">Closed Won (100%)</option>
                        <option value="Lost">Closed Lost (0%)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Expected Close Date"
                      type="date"
                      value={newCloseDate}
                      onChange={(e) => setNewCloseDate(e.target.value)}
                    />

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-brand-textPrimary select-none">Assign Sales Rep</label>
                      <select
                        value={newAssignedTo}
                        onChange={(e) => setNewAssignedTo(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg outline-none text-brand-textPrimary focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      >
                        <option value="">Unassigned</option>
                        {teamMembers.map((m) => (
                          <option key={m._id} value={m._id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-brand-border bg-slate-50/50 flex items-center justify-end gap-2.5">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" isLoading={isSubmitting}>Create Deal</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Deals;
