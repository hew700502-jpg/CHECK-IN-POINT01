import { useState, useEffect, useCallback } from 'react';
import { Home, Users, FileText, Plus, CreditCard as Edit2, Trash2, Phone, Calendar, Building2, FileOutput, Search, ChevronDown, AlertCircle, Printer, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { supabase, Unit, CheckIn, Invoice } from './lib/supabase';
import Modal from './components/Modal';
import CheckInForm from './components/CheckInForm';
import UnitForm from './components/UnitForm';
import InvoiceGenerator from './components/InvoiceGenerator';
import InvoicePrint from './components/InvoicePrint';
import LoginPage from './components/LoginPage';
import SettingsForm from './components/SettingsForm';

type Tab = 'checkins' | 'invoices' | 'units' | 'settings';

function StatusBadge({ checkIn }: { checkIn: CheckIn }) {
  const today = new Date().toISOString().split('T')[0];
  const isCheckedOut = checkIn.check_out_date && checkIn.check_out_date <= today;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      isCheckedOut ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700'
    }`}>
      {isCheckedOut ? 'Checked Out' : 'Active'}
    </span>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('auth_session') === 'true';
  });
  const [adminId, setAdminId] = useState(() => {
    return localStorage.getItem('admin_id') || '';
  });

  const [tab, setTab] = useState<Tab>('checkins');
  const [units, setUnits] = useState<Unit[]>([]);
  const [checkIns, setCheckIns] = useState<(CheckIn & { unit?: Unit })[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [editingCheckIn, setEditingCheckIn] = useState<CheckIn | null>(null);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [showInvoiceGenerator, setShowInvoiceGenerator] = useState(false);
  const [viewingInvoiceMonth, setViewingInvoiceMonth] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'checkin' | 'unit' | 'invoice-group'; id: string; label: string } | null>(null);

const [checkInSearch, setCheckInSearch] = useState('');
const [checkInUnit, setCheckInUnit] = useState('');
const [checkInMonth, setCheckInMonth] = useState(
  new Date().toISOString().slice(0, 7)
);
const [invoiceMonth, setInvoiceMonth] = useState('');
const [companySettings, setCompanySettings] = useState<any>(null);
  const [showSettingsForm, setShowSettingsForm] = useState(false);

  const handleLogin = (id: string) => {
    setAdminId(id);
    setIsAuthenticated(true);
    localStorage.setItem('auth_session', 'true');
    localStorage.setItem('admin_id', id);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminId('');
    localStorage.removeItem('auth_session');
    localStorage.removeItem('admin_id');
    setTab('checkins');
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: u }, { data: c }, { data: inv }, { data: settings }] = await Promise.all([
      supabase.from('units').select('*').order('name'),
      supabase.from('check_ins').select('*, unit:units(*)').order('check_in_date', { ascending: false }),
      supabase.from('invoices').select('*, check_in:check_ins(*, unit:units(*))').order('issued_date', { ascending: false }),
      supabase.from('company_settings').select('*').limit(1),
    ]);
    setUnits(u ?? []);
    setCheckIns((c as (CheckIn & { unit?: Unit })[]) ?? []);
    setInvoices((inv as Invoice[]) ?? []);
    setCompanySettings(settings?.[0] ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const formatDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatMonth = (my: string) => {
    const [year, month] = my.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });
  };

  const handleDeleteCheckIn = async (id: string) => {
    await supabase.from('check_ins').delete().eq('id', id);
    setDeleteConfirm(null);
    fetchAll();
  };

  const handleDeleteUnit = async (id: string) => {
    await supabase.from('units').delete().eq('id', id);
    setDeleteConfirm(null);
    fetchAll();
  };

  const handleDeleteInvoiceGroup = async (monthYear: string) => {
    await supabase.from('invoices').delete().eq('month_year', monthYear);
    setDeleteConfirm(null);
    fetchAll();
  };

 const filteredCheckIns = checkIns.filter(c => {
  const matchSearch = !checkInSearch ||
    c.guest_name.toLowerCase().includes(checkInSearch.toLowerCase()) ||
    c.phone_number.includes(checkInSearch);

  const matchUnit = !checkInUnit || c.unit_id === checkInUnit;

  const matchMonth = c.check_in_date.slice(0, 7) === checkInMonth;

  return matchSearch && matchUnit && matchMonth;
});

  const invoiceMonths = [...new Set(invoices.map(i => i.month_year))].sort((a, b) => b.localeCompare(a));
  const filteredInvoiceMonths = invoiceMonth
    ? invoiceMonths.filter(m => m === invoiceMonth)
    : invoiceMonths;

  const viewableInvoices = viewingInvoiceMonth
    ? invoices.filter(i => i.month_year === viewingInvoiceMonth)
    : [];

  const navItems: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'checkins', label: 'Check-Ins', icon: <Users size={18} /> },
    { key: 'invoices', label: 'Invoices', icon: <FileText size={18} /> },
    { key: 'units', label: 'Units', icon: <Building2 size={18} /> },
    { key: 'settings', label: 'Settings', icon: <SettingsIcon size={18} /> },
  ];

  // Group check-ins by date
  const groupedCheckIns = filteredCheckIns.reduce((acc, checkIn) => {
    if (!acc[checkIn.check_in_date]) {
      acc[checkIn.check_in_date] = [];
    }
    acc[checkIn.check_in_date].push(checkIn);
    return acc;
  }, {} as Record<string, typeof filteredCheckIns>);

  const sortedDates = Object.keys(groupedCheckIns).sort().reverse();

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Home size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-tight">HomestayManager</h1>
                <p className="text-xs text-gray-500 leading-tight">Check-in & Invoicing</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <nav className="flex gap-1">
                {navItems.map(item => (
                  <button
                    key={item.key}
                    onClick={() => setTab(item.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tab === item.key
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {item.icon}
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                ))}
              </nav>
              <div className="pl-4 border-l border-gray-200 flex items-center gap-2">
                <span className="text-xs text-gray-500 hidden sm:inline">Admin {adminId}</span>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* CHECK-INS TAB */}
            {tab === 'checkins' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Guest Check-Ins</h2>
                   <p className="text-sm text-gray-500">
  {filteredCheckIns.length} record{filteredCheckIns.length !== 1 ? 's' : ''} this month
</p>
                  </div>
                  <button
                    onClick={() => { setEditingCheckIn(null); setShowCheckInForm(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Plus size={16} />
                    New Check-In
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name or phone..."
                      value={checkInSearch}
                      onChange={e => setCheckInSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={checkInUnit}
                      onChange={e => setCheckInUnit(e.target.value)}
                      className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">All Units</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <div>
  <input
    type="month"
    value={checkInMonth}
    onChange={e => setCheckInMonth(e.target.value)}
    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
  />
</div>
                </div>

                {filteredCheckIns.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center py-16 text-center">
                    <Users size={40} className="text-gray-300 mb-3" />
                    <p className="font-medium text-gray-500">No check-ins found</p>
                    <p className="text-sm text-gray-400 mt-1">Add your first guest check-in to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedDates.map(date => (
                      <div key={date} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                          <h3 className="font-semibold text-gray-900">
                            {new Date(date + 'T00:00:00').toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">{groupedCheckIns[date].length} check-in(s)</p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="border-b border-gray-100">
                              <tr>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Guest</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Phone</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Check-Out</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {groupedCheckIns[date].map(c => (
                                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-2.5">
                                    <div>
                                      <p className="font-medium text-gray-900 text-sm">{c.guest_name}</p>
                                      {c.remark && (
                                        <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{c.remark}</p>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                      {c.unit?.name}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 hidden sm:table-cell">
                                    {c.phone_number ? (
                                      <div className="flex items-center gap-1 text-xs text-gray-600">
                                        <Phone size={11} className="text-gray-400" />
                                        {c.phone_number}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-300">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 hidden md:table-cell">
                                    {c.check_out_date ? (
                                      <span className="text-xs text-gray-600">{formatDate(c.check_out_date)}</span>
                                    ) : (
                                      <span className="text-xs text-gray-300">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <StatusBadge checkIn={c} />
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        onClick={() => { setEditingCheckIn(c); setShowCheckInForm(true); }}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                      <button
                                        onClick={() => setDeleteConfirm({ type: 'checkin', id: c.id, label: c.guest_name })}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* INVOICES TAB */}
            {tab === 'invoices' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Invoices</h2>
                    <p className="text-sm text-gray-500">{invoices.length} total invoice{invoices.length !== 1 ? 's' : ''}</p>
                  </div>
                  <button
                    onClick={() => setShowInvoiceGenerator(true)}
                    disabled={checkIns.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileOutput size={16} />
                    Generate Invoices
                  </button>
                </div>

                <div className="flex gap-3 mb-4">
                  <div className="relative">
                    <select
                      value={invoiceMonth}
                      onChange={e => setInvoiceMonth(e.target.value)}
                      className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">All Months</option>
                      {invoiceMonths.map(m => (
                        <option key={m} value={m}>{formatMonth(m)}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {filteredInvoiceMonths.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center py-16 text-center">
                    <FileText size={40} className="text-gray-300 mb-3" />
                    <p className="font-medium text-gray-500">No invoices yet</p>
                    <p className="text-sm text-gray-400 mt-1">Generate invoices from the check-in records</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredInvoiceMonths.map(month => {
                      const monthInvoices = invoices.filter(i => i.month_year === month);
                      const monthTotal = monthInvoices.reduce((s, i) => s + Number(i.cleaning_fee), 0);
                      return (
                        <div key={month} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
                            <div>
                              <h3 className="font-semibold text-gray-900">{formatMonth(month)}</h3>
                              <p className="text-xs text-gray-500 mt-0.5">{monthInvoices.length} invoice(s)</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-gray-900">RM {monthTotal.toFixed(2)}</span>
                              <button
                                onClick={() => setViewingInvoiceMonth(month)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                              >
                                <Printer size={13} />
                                View & Print
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ type: 'invoice-group', id: month, label: formatMonth(month) })}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="border-b border-gray-100">
                                <tr>
                                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400">Invoice #</th>
                                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400">Guest</th>
                                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400">Unit</th>
                                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 hidden sm:table-cell">Check-In</th>
                                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-400">Cleaning Fee</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {monthInvoices.map(inv => (
                                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-2.5 text-xs text-gray-500 font-mono">{inv.invoice_number}</td>
                                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{inv.check_in?.guest_name}</td>
                                    <td className="px-4 py-2.5">
                                      <span className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                        {(inv.check_in as CheckIn & { unit?: Unit })?.unit?.name}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-gray-500 hidden sm:table-cell">
                                      {inv.check_in?.check_in_date ? formatDate(inv.check_in.check_in_date) : '—'}
                                    </td>
                                    <td className="px-4 py-2.5 text-sm font-semibold text-gray-900 text-right">
                                      RM {Number(inv.cleaning_fee).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* UNITS TAB */}
            {tab === 'units' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Units</h2>
                    <p className="text-sm text-gray-500">Manage your homestay units and default cleaning fees</p>
                  </div>
                  <button
                    onClick={() => { setEditingUnit(null); setShowUnitForm(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Plus size={16} />
                    Add Unit
                  </button>
                </div>

                {units.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center py-16 text-center">
                    <Building2 size={40} className="text-gray-300 mb-3" />
                    <p className="font-medium text-gray-500">No units configured</p>
                    <p className="text-sm text-gray-400 mt-1">Add your first unit to start managing check-ins</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {units.map(u => {
                      const unitCheckIns = checkIns.filter(c => c.unit_id === u.id);
                      const activeCount = unitCheckIns.filter(c => {
                        const today = new Date().toISOString().split('T')[0];
                        return !c.check_out_date || c.check_out_date > today;
                      }).length;
                      return (
                        <div key={u.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-200 hover:shadow-sm transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                                <Building2 size={18} className="text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{u.name}</h3>
                                {u.description && <p className="text-xs text-gray-400">{u.description}</p>}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => { setEditingUnit(u); setShowUnitForm(true); }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ type: 'unit', id: u.id, label: u.name })}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-400">Cleaning Fee</p>
                              <p className="font-bold text-gray-900 text-sm mt-0.5">RM {Number(u.cleaning_fee).toFixed(2)}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-400">Active Guests</p>
                              <p className="font-bold text-gray-900 text-sm mt-0.5">{activeCount}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SETTINGS TAB */}
            {tab === 'settings' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Settings</h2>
                    <p className="text-sm text-gray-500">Manage company info and invoice details</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-2xl">
                  <SettingsForm
                    initialData={companySettings}
                    onSuccess={() => fetchAll()}
                    onCancel={() => {}}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {showCheckInForm && (
        <Modal
          title={editingCheckIn ? 'Edit Check-In' : 'New Check-In'}
          onClose={() => setShowCheckInForm(false)}
        >
          <CheckInForm
            units={units}
            initialData={editingCheckIn ?? undefined}
            onSuccess={() => { setShowCheckInForm(false); fetchAll(); }}
            onCancel={() => setShowCheckInForm(false)}
          />
        </Modal>
      )}

      {showUnitForm && (
        <Modal
          title={editingUnit ? 'Edit Unit' : 'Add Unit'}
          onClose={() => setShowUnitForm(false)}
          size="sm"
        >
          <UnitForm
            initialData={editingUnit ?? undefined}
            onSuccess={() => { setShowUnitForm(false); fetchAll(); }}
            onCancel={() => setShowUnitForm(false)}
          />
        </Modal>
      )}

      {showInvoiceGenerator && (
        <Modal
          title="Generate Monthly Invoices"
          onClose={() => setShowInvoiceGenerator(false)}
          size="xl"
        >
          <InvoiceGenerator
            checkIns={checkIns}
            onSuccess={() => { setShowInvoiceGenerator(false); setTab('invoices'); fetchAll(); }}
            onCancel={() => setShowInvoiceGenerator(false)}
          />
        </Modal>
      )}

      {viewingInvoiceMonth && (
        <Modal
          title={`Invoices — ${formatMonth(viewingInvoiceMonth)}`}
          onClose={() => setViewingInvoiceMonth(null)}
          size="xl"
        >
          <InvoicePrint
            invoices={viewableInvoices}
            monthYear={viewingInvoiceMonth}
            companySettings={companySettings}
            onClose={() => setViewingInvoiceMonth(null)}
          />
        </Modal>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Confirm Delete</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-5">
              Are you sure you want to delete <span className="font-semibold">"{deleteConfirm.label}"</span>?
              {deleteConfirm.type === 'unit' && ' All associated check-ins will also be deleted.'}
              {deleteConfirm.type === 'invoice-group' && ' All invoices for this month will be deleted.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'checkin') handleDeleteCheckIn(deleteConfirm.id);
                  else if (deleteConfirm.type === 'unit') handleDeleteUnit(deleteConfirm.id);
                  else if (deleteConfirm.type === 'invoice-group') handleDeleteInvoiceGroup(deleteConfirm.id);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
