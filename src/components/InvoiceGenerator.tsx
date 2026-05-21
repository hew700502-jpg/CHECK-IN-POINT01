import { useState } from 'react';
import { supabase, CheckIn, Unit } from '../lib/supabase';

interface InvoiceGeneratorProps {
  checkIns: (CheckIn & { unit?: Unit })[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function InvoiceGenerator({ checkIns, onSuccess, onCancel }: InvoiceGeneratorProps) {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [monthYear, setMonthYear] = useState(defaultMonth);
  const [unitFees, setUnitFees] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    const units = [...new Set(checkIns.map(c => c.unit_id))];
    units.forEach(uid => {
      const unit = checkIns.find(c => c.unit_id === uid)?.unit;
      init[uid] = unit?.cleaning_fee?.toString() ?? '0';
    });
    return init;
  });
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    const units = [...new Set(checkIns.map(c => c.unit_id))];
    units.forEach(uid => { init[uid] = true; });
    return init;
  });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

const monthlyCheckIns = checkIns.filter(c =>
  c.check_in_date.slice(0, 7) === monthYear
);

// Group selected month check-ins by unit
const unitGroups = monthlyCheckIns.reduce((acc, c) => {
  if (!acc[c.unit_id]) acc[c.unit_id] = [];
  acc[c.unit_id].push(c);
  return acc;
}, {} as Record<string, typeof monthlyCheckIns>);

  const selectedUnits = Object.entries(unitGroups)
    .filter(([uid]) => selected[uid])
    .map(([uid, items]) => ({ uid, items, unit: items[0].unit }));

  const total = selectedUnits.reduce((sum, { uid }) => sum + (parseFloat(unitFees[uid]) || 0) * unitGroups[uid].length, 0);

  const handleGenerate = async () => {
    if (selectedUnits.length === 0) {
      setError('Select at least one unit to generate invoices.');
      return;
    }
    setLoading(true);
    setError('');

    const invoiceRecords: any[] = [];
    let idx = 1;
    selectedUnits.forEach(({ uid, items }) => {
      const fee = parseFloat(unitFees[uid]) || 0;
      items.forEach(c => {
        invoiceRecords.push({
          invoice_number: `INV-${monthYear.replace('-', '')}-${String(idx++).padStart(3, '0')}-${Date.now().toString().slice(-4)}`,
          check_in_id: c.id,
          cleaning_fee: fee,
          issued_date: new Date().toISOString().split('T')[0],
          month_year: monthYear,
          notes: notes.trim(),
        });
      });
    });

    const { error: err } = await supabase.from('invoices').insert(invoiceRecords);
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    onSuccess();
  };

  const formatDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Billing Month</label>
          <input
            type="month"
            value={monthYear}
            onChange={e => setMonthYear(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional note on all invoices"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Select Units & Set Cleaning Fees</label>
          <button
            type="button"
            onClick={() => {
              const allSelected = selectedUnits.length === Object.keys(unitGroups).length;
              const next: Record<string, boolean> = {};
              Object.keys(unitGroups).forEach(uid => { next[uid] = !allSelected; });
              setSelected(next);
            }}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {selectedUnits.length === Object.keys(unitGroups).length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {Object.keys(unitGroups).length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-400 text-center">No check-ins available for this period.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2 text-left w-8"></th>
                  <th className="px-3 py-2 text-left">Unit</th>
                  <th className="px-3 py-2 text-left">Guests</th>
                  <th className="px-3 py-2 text-left">Count</th>
                  <th className="px-3 py-2 text-right">Fee Per Guest (RM)</th>
                  <th className="px-3 py-2 text-right">Total (RM)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(unitGroups).map(([uid, items]) => {
                  const fee = parseFloat(unitFees[uid]) || 0;
                  const subtotal = fee * items.length;
                  return (
                    <tr key={uid} className={selected[uid] ? 'bg-blue-50/30' : 'opacity-50'}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={!!selected[uid]}
                          onChange={e => setSelected(s => ({ ...s, [uid]: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-900">{items[0].unit?.name}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">
                        {items.map(i => i.guest_name).join(', ')}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{items.length}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={unitFees[uid] ?? '0'}
                          onChange={e => setUnitFees(f => ({ ...f, [uid]: e.target.value }))}
                          disabled={!selected[uid]}
                          className="w-24 border border-gray-200 rounded px-2 py-1 text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">RM {subtotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
        <span className="text-sm font-medium text-gray-600">{selectedUnits.reduce((sum, u) => sum + u.items.length, 0)} guest(s) across {selectedUnits.length} unit(s)</span>
        <span className="text-base font-bold text-gray-900">Total: RM {total.toFixed(2)}</span>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || selectedUnits.length === 0}
          className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Generating...' : `Generate Invoices`}
        </button>
      </div>
    </div>
  );
}
