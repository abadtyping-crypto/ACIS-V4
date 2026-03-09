import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_TENANT_ID, findTenantById } from '../config/tenants';
import { requestPasswordReset } from '../lib/backendStore';
import { Eye, EyeOff, Lock, User, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { getRuntimePlatform, PLATFORM_ELECTRON } from '../lib/runtimePlatform';

const LoginPage = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, tenantId: sessionTenantId, loginWithUid } = useAuth();
  const tenant = findTenantById(tenantId) || findTenantById(DEFAULT_TENANT_ID);
  const tenantLogoUrl = tenant?.logoUrl || '/logo.png';
  const tenantName = tenant?.name || 'ACIS Ajman';
  const runtimePlatform = getRuntimePlatform();
  const isElectronPlatform = runtimePlatform === PLATFORM_ELECTRON;
  const hasNativeTitleBar = typeof window !== 'undefined' && Boolean(window.electron?.windowControls);

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

    const result = await requestPasswordReset(tenantId, email);
    setLoading(false);

    if (!result.ok) {
      setErrorMessage(result.error);
    } else {
      setResetMessage('Reset link dispatched! Please check your email inbox.');
      setResetEmail('');
    }
  };

  const renderAuthForm = () => (
    <>
      {forgotPasswordMode ? (
        <div className="animate-in slide-in-from-right fade-in duration-500">
          <button
            onClick={() => {
              setForgotPasswordMode(false);
              setErrorMessage('');
              setResetMessage('');
            }}
            className="mb-4 flex items-center gap-2 text-sm font-bold text-[var(--c-muted)] transition hover:text-[var(--c-text)]"
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

            {errorMessage ? (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-center text-sm font-bold text-rose-500">
                {errorMessage}
              </div>
            ) : null}
            {resetMessage ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-500">
                <CheckCircle2 className="shrink-0" size={18} />
                {resetMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className={`relative w-full overflow-hidden rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition-all ${
                loading
                  ? 'cursor-not-allowed bg-slate-500 opacity-80'
                  : 'bg-[var(--c-accent)] shadow-[var(--c-accent)]/25 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[var(--c-accent)]/40'
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
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-[var(--c-muted)] transition hover:text-[var(--c-text)]"
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
              <span className="text-sm font-semibold text-[var(--c-muted)] transition hover:text-[var(--c-text)]">Remember me</span>
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

          {errorMessage ? (
            <div className="animate-in slide-in-from-top-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-center text-sm font-bold text-rose-500">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className={`relative w-full overflow-hidden rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition-all ${
              loading
                ? 'cursor-not-allowed bg-slate-500 opacity-80'
                : 'bg-[var(--c-accent)] shadow-[var(--c-accent)]/25 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[var(--c-accent)]/40'
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

          <p className="text-center text-xs font-semibold text-[var(--c-muted)]">
            Sign in using username or email.
          </p>
        </form>
      )}
    </>
  );

  return (
    <div
      className="relative flex items-center justify-center overflow-hidden bg-[var(--c-background)] px-3 py-3 sm:px-4"
      style={{ height: hasNativeTitleBar ? 'calc(100dvh - 2.25rem)' : '100dvh' }}
    >
      <div className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--c-accent)]/20 blur-[120px]" />
      <div className="absolute right-0 top-0 -z-10 h-[420px] w-[420px] rounded-full bg-blue-500/10 blur-[100px]" />
      <div className="absolute bottom-0 left-0 -z-10 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[100px]" />

      {isElectronPlatform ? (
        <div className="grid h-full w-full overflow-hidden rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/85 shadow-2xl backdrop-blur-xl md:grid-cols-[1.1fr_0.9fr]">
          <section className="relative h-full overflow-hidden border-r border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-accent)_12%,var(--c-surface))] p-8 md:p-10">
            <div className="absolute -right-16 top-10 h-64 w-64 rounded-full bg-[var(--c-accent)]/15 blur-3xl" />
            <div className="absolute bottom-4 left-0 h-56 w-56 rounded-full bg-[var(--c-accent-2)]/20 blur-3xl" />
            <div className="relative z-10 flex h-full flex-col">
              <div>
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 p-2 shadow-sm">
                <img src={tenantLogoUrl} alt={`${tenantName} Logo`} className="h-full w-full rounded-xl object-contain" />
              </div>
              <h1 className="text-4xl font-black tracking-tight text-[var(--c-text)]">ACIS Workspace</h1>
              <p className="mt-3 max-w-md text-sm font-medium leading-6 text-[var(--c-muted)]">
                Dedicated desktop sign-in for <span className="font-bold text-[var(--c-accent)]">{tenantName}</span>. Built for secure, fast daily operations.
              </p>
              </div>
              <div className="mt-auto rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/85 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--c-muted)]">Desktop Mode</p>
              <p className="mt-2 text-sm font-semibold text-[var(--c-text)]">Window-optimized layout, keyboard-friendly auth, and tenant-isolated access.</p>
              </div>
            </div>
          </section>

          <section className="flex h-full flex-col justify-center overflow-auto px-5 py-5 sm:px-8 lg:px-10">
            <div className="mx-auto w-full max-w-[420px]">
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 p-1.5 shadow-sm md:hidden">
                  <img src={tenantLogoUrl} alt={`${tenantName} Logo`} className="h-full w-full rounded-xl object-contain" />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-[var(--c-text)]">Sign In</h2>
                <p className="mt-2 text-sm font-medium text-[var(--c-muted)]">
                  Continue to <span className="font-bold text-[var(--c-accent)]">{tenantName}</span>
                </p>
              </div>
              {renderAuthForm()}
              <p className="mt-6 text-center text-xs font-semibold text-[var(--c-muted)]">
                &copy; {new Date().getFullYear()} {tenantName}. All rights reserved.
              </p>
            </div>
          </section>
        </div>
      ) : (
        <div className="w-full max-w-[420px] max-h-full overflow-auto scrollbar-hide animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="rounded-3xl border border-white/10 bg-[var(--c-surface)]/80 px-5 py-5 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="mb-6 flex flex-col items-center text-center sm:mb-8">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 p-1.5 shadow-sm">
                <img
                  src={tenantLogoUrl}
                  alt={`${tenantName} Logo`}
                  className="h-full w-full rounded-xl object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-[var(--c-text)]">Welcome Back</h1>
              <p className="mt-2 text-sm font-medium text-[var(--c-muted)]">
                Sign in to <span className="font-bold text-[var(--c-accent)]">{tenantName}</span> workspace
              </p>
            </div>
            {renderAuthForm()}
          </div>
          <p className="mt-4 text-center text-xs font-semibold text-[var(--c-muted)] sm:mt-8">
            &copy; {new Date().getFullYear()} {tenantName}. All rights reserved.
          </p>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
