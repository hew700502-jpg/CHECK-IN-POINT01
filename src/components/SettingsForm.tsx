import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface SettingsFormProps {
  initialData?: {
    company_name: string;
    bank_name: string;
    account_holder: string;
    account_number: string;
    invoice_remark: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SettingsForm({ initialData, onSuccess, onCancel }: SettingsFormProps) {
  const [form, setForm] = useState({
    company_name: initialData?.company_name ?? 'CHECK IN POINT RESOURCES',
    bank_name: initialData?.bank_name ?? '',
    account_holder: initialData?.account_holder ?? '',
    account_number: initialData?.account_number ?? '',
    invoice_remark: initialData?.invoice_remark ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim()) {
      setError('Company name is required.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      company_name: form.company_name.trim(),
      bank_name: form.bank_name.trim(),
      account_holder: form.account_holder.trim(),
      account_number: form.account_number.trim(),
      invoice_remark: form.invoice_remark.trim(),
      updated_at: new Date().toISOString(),
    };

    const { error: err } = await supabase
      .from('company_settings')
      .update(payload)
      .gt('id', '00000000-0000-0000-0000-000000000000');

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess('Settings saved successfully!');
    setTimeout(() => {
      onSuccess();
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm">
          {success}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
        <input
          type="text"
          value={form.company_name}
          onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-3">Bank Details</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
          <input
            type="text"
            value={form.bank_name}
            onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))}
            placeholder="e.g., Maybank, CIMB, Public Bank"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
          <input
            type="text"
            value={form.account_holder}
            onChange={e => setForm(f => ({ ...f, account_holder: e.target.value }))}
            placeholder="Full name of account holder"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
          <input
            type="text"
            value={form.account_number}
            onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))}
            placeholder="Bank account number"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Remark/Terms</label>
        <textarea
          value={form.invoice_remark}
          onChange={e => setForm(f => ({ ...f, invoice_remark: e.target.value }))}
          placeholder="e.g., Payment terms, thank you message, etc."
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
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}
