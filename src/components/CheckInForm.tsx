import { useState } from 'react';
import { supabase, Unit } from '../lib/supabase';

interface CheckInFormProps {
  units: Unit[];
  initialData?: {
    id: string;
    unit_id: string;
    guest_name: string;
    check_in_date: string;
    check_out_date: string | null;
    phone_number: string;
    remark: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CheckInForm({ units, initialData, onSuccess, onCancel }: CheckInFormProps) {
  const [form, setForm] = useState({
    unit_id: initialData?.unit_id ?? (units[0]?.id ?? ''),
    guest_name: initialData?.guest_name ?? '',
    check_in_date: initialData?.check_in_date ?? new Date().toISOString().split('T')[0],
    check_out_date: initialData?.check_out_date ?? '',
    phone_number: initialData?.phone_number ?? '',
    remark: initialData?.remark ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.unit_id || !form.guest_name || !form.check_in_date) {
      setError('Unit, guest name, and check-in date are required.');
      return;
    }
    setLoading(true);
    setError('');
    const payload = {
      unit_id: form.unit_id,
      guest_name: form.guest_name.trim(),
      check_in_date: form.check_in_date,
      check_out_date: form.check_out_date || null,
      phone_number: form.phone_number.trim(),
      remark: form.remark.trim(),
    };

    if (initialData) {
      const { error: err } = await supabase.from('check_ins').update(payload).eq('id', initialData.id);
      if (err) { setError(err.message); setLoading(false); return; }
    } else {
      const { error: err } = await supabase.from('check_ins').insert(payload);
      if (err) { setError(err.message); setLoading(false); return; }
    }
    setLoading(false);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
        <select
          value={form.unit_id}
          onChange={e => setForm(f => ({ ...f, unit_id: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {units.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name *</label>
        <input
          type="text"
          value={form.guest_name}
          onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))}
          placeholder="Full name"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input
          type="tel"
          value={form.phone_number}
          onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
          placeholder="+60 12-345 6789"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Check-In Date *</label>
          <input
            type="date"
            value={form.check_in_date}
            onChange={e => setForm(f => ({ ...f, check_in_date: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Check-Out Date</label>
          <input
            type="date"
            value={form.check_out_date ?? ''}
            onChange={e => setForm(f => ({ ...f, check_out_date: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
        <textarea
          value={form.remark}
          onChange={e => setForm(f => ({ ...f, remark: e.target.value }))}
          placeholder="Additional notes about this stay..."
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : initialData ? 'Update Check-In' : 'Add Check-In'}
        </button>
      </div>
    </form>
  );
}
