import { useState } from 'react';
import { supabase, Unit } from '../lib/supabase';

interface UnitFormProps {
  initialData?: Unit;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function UnitForm({ initialData, onSuccess, onCancel }: UnitFormProps) {
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    cleaning_fee: initialData?.cleaning_fee?.toString() ?? '0',
    description: initialData?.description ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Unit name is required.'); return; }
    const fee = parseFloat(form.cleaning_fee);
    if (isNaN(fee) || fee < 0) { setError('Cleaning fee must be a valid positive number.'); return; }

    setLoading(true);
    setError('');
    const payload = {
      name: form.name.trim(),
      cleaning_fee: fee,
      description: form.description.trim(),
    };

    if (initialData) {
      const { error: err } = await supabase.from('units').update(payload).eq('id', initialData.id);
      if (err) { setError(err.message); setLoading(false); return; }
    } else {
      const { error: err } = await supabase.from('units').insert(payload);
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Unit Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Unit A, Room 101"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Default Cleaning Fee (RM)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={form.cleaning_fee}
          onChange={e => setForm(f => ({ ...f, cleaning_fee: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input
          type="text"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Optional unit description"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          {loading ? 'Saving...' : initialData ? 'Update Unit' : 'Add Unit'}
        </button>
      </div>
    </form>
  );
}
