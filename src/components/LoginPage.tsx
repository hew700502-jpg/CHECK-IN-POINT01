import { useState } from 'react';
import { Home, Lock, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onLogin: (adminId: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminId.trim() || !password.trim()) {
      setError('Please enter both Admin ID and password.');
      return;
    }

    setLoading(true);
    setError('');

    // Hardcoded credentials for authentication
    const validId = '739007';
    const validPassword = 'Hew001101@';

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    if (adminId === validId && password === validPassword) {
      setLoading(false);
      onLogin(adminId);
    } else {
      setLoading(false);
      setError('Invalid Admin ID or password.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Home size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">HomestayManager</h1>
                <p className="text-xs text-blue-100">Check-in & Invoicing System</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="px-6 py-8 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Admin Login</h2>
              <p className="text-sm text-gray-500">Sign in with your credentials to continue</p>
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin ID</label>
              <input
                type="text"
                value={adminId}
                onChange={e => setAdminId(e.target.value)}
                placeholder="Enter your Admin ID"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
