import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestPasswordReset } from '../lib/backendStore';
import { Eye, EyeOff, Lock, User, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

const LoginPage = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, tenantId: sessionTenantId, loginWithUid } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  useEffect(() => {
    if (isAuthenticated && sessionTenantId === tenantId) {
      navigate(`/t/${tenantId}/dashboard`, { replace: true });
    }
  }, [isAuthenticated, sessionTenantId, tenantId, navigate]);

  const onLogin = async (e) => {
    e?.preventDefault();
    const normalizedUid = String(username || '').trim().toLowerCase();
    if (!normalizedUid) {
      setErrorMessage('Please enter your username.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    // Using username as uid for the current development auth flow
    const result = await loginWithUid(tenantId, normalizedUid, password);
    setLoading(false);

    if (!result.ok) {
      setErrorMessage(result.error || 'Login failed.');
      return;
    }

    navigate(`/t/${tenantId}/dashboard`, { replace: true });
  };

  const onForgotPassword = async (e) => {
    e?.preventDefault();
    const email = String(resetEmail || '').trim();
    if (!email) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setResetMessage('');

    const result = await requestPasswordReset(email);
    setLoading(false);

    if (!result.ok) {
      setErrorMessage(result.error);
    } else {
      setResetMessage('Reset link dispatched! Please check your email inbox.');
      setResetEmail('');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--c-background)] px-4">
      {/* Background Decorative Elements */}
      <div className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--c-accent)]/20 blur-[120px]" />
      <div className="absolute right-0 top-0 -z-10 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[100px]" />
      <div className="absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-[100px]" />

      <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="rounded-3xl border border-white/10 bg-[var(--c-surface)]/80 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--c-accent)] to-blue-600 shadow-lg shadow-[var(--c-accent)]/30">
              <img
                src="/logo.png"
                alt="ACIS Logo"
                className="h-10 w-10 object-contain invert brightness-0 filter"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[var(--c-text)]">Welcome Back</h1>
            <p className="mt-2 text-sm font-medium text-[var(--c-muted)]">
              Sign in to tenant workspace <span className="font-bold text-[var(--c-accent)]">{tenantId}</span>
            </p>
          </div>

          {forgotPasswordMode ? (
            <div className="animate-in slide-in-from-right fade-in duration-500">
              <button
                onClick={() => {
                  setForgotPasswordMode(false);
                  setErrorMessage('');
                  setResetMessage('');
                }}
                className="mb-4 flex items-center gap-2 text-sm font-bold text-[var(--c-muted)] hover:text-[var(--c-text)] transition"
              >
                <ArrowLeft size={16} /> Back to Sign In
              </button>
              <form onSubmit={onForgotPassword} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Recovery Email</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--c-muted)]">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)]/50 py-3.5 pl-11 pr-4 text-sm font-semibold text-[var(--c-text)] shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:bg-[var(--c-surface)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-center text-sm font-bold text-rose-500">
                    {errorMessage}
                  </div>
                )}
                {resetMessage && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-500">
                    <CheckCircle2 className="shrink-0" size={18} />
                    {resetMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`relative w-full overflow-hidden rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition-all ${loading ? 'bg-slate-500 opacity-80 cursor-not-allowed' : 'bg-[var(--c-accent)] hover:opacity-90 shadow-[var(--c-accent)]/25 hover:shadow-[var(--c-accent)]/40 hover:-translate-y-0.5'
                    }`}
                >
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Dispatching...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </div>
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={onLogin} className="space-y-5 animate-in slide-in-from-left fade-in duration-500">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Username</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--c-muted)]">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)]/50 py-3.5 pl-11 pr-4 text-sm font-semibold text-[var(--c-text)] shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:bg-[var(--c-surface)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Password</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--c-muted)]">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)]/50 py-3.5 pl-11 pr-12 text-sm font-semibold text-[var(--c-text)] shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:bg-[var(--c-surface)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-[var(--c-muted)] hover:text-[var(--c-text)] transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex cursor-pointer items-center gap-2">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-4 w-4 rounded border border-[var(--c-border)] bg-[var(--c-panel)] transition peer-checked:border-[var(--c-accent)] peer-checked:bg-[var(--c-accent)]" />
                    <svg className="absolute h-3 w-3 scale-0 text-white transition peer-checked:scale-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-[var(--c-muted)] hover:text-[var(--c-text)] transition">Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordMode(true);
                    setErrorMessage('');
                    setResetMessage('');
                  }}
                  className="text-sm font-bold text-[var(--c-accent)] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-center text-sm font-bold text-rose-500 animate-in slide-in-from-top-2">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`relative w-full overflow-hidden rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition-all ${loading ? 'bg-slate-500 opacity-80 cursor-not-allowed' : 'bg-[var(--c-accent)] hover:opacity-90 shadow-[var(--c-accent)]/25 hover:shadow-[var(--c-accent)]/40 hover:-translate-y-0.5'
                  }`}
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </div>
              </button>
            </form>
          )}        </div>

        <p className="mt-8 text-center text-xs font-semibold text-[var(--c-muted)]">
          &copy; {new Date().getFullYear()} ACIS Ajman. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
