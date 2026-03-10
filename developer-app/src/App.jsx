import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileBadge2,
  Globe,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { signInWithGoogle, checkDeveloperAccess, auth } from './lib/firebase';
import { DashboardPage } from './pages/DashboardPage';
import { TenantManagementPage } from './pages/TenantManagementPage';
import { TicketManagementPage } from './pages/TicketManagementPage';

const serviceCards = [
  {
    title: 'Visa and Immigration Typing',
    desc: 'Complete and accurate preparation of visa and immigration-related applications and supporting forms.',
    icon: FileBadge2,
  },
  {
    title: 'Trade License and Company Documents',
    desc: 'Business setup, renewal, and amendments support for company-related documentation and compliance.',
    icon: Building2,
  },
  {
    title: 'Attestation and Government Clearance',
    desc: 'Structured processing for notarization, attestation, ministry approvals, and official document clearances.',
    icon: BadgeCheck,
  },
  {
    title: 'Client Follow-up and Status Desk',
    desc: 'Consistent follow-up, submission updates, and practical guidance from intake through final delivery.',
    icon: Users,
  },
];

const processSteps = [
  {
    title: 'Document Intake',
    desc: 'We collect files, verify mandatory fields, and prevent errors before submission.',
  },
  {
    title: 'Submission & Tracking',
    desc: 'Applications are filed through the correct UAE channels and monitored until completion.',
  },
  {
    title: 'Review & Delivery',
    desc: 'Completed documents are reviewed and delivered with clear next-step support.',
  },
];

const leadership = [
  {
    name: 'Abad Ali',
    title: 'Founder & CEO',
    phone: '+971 50 170 0797',
    email: 'abadali@abadtyping.com',
  },
  {
    name: 'Samyan Siththeek',
    title: 'Managing Officer',
    phone: '+971 54 320 4200',
    email: 'admin@abadtyping.com',
  },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-shell text-stone-900">
      <div className="grain-overlay" aria-hidden="true" />
      <header className="sticky top-0 z-40 border-b border-[#e7e2d8] bg-[#fffcf6]/90 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0d5f63] text-white shadow-sm">
              <span className="font-black">AC</span>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0d5f63]">Abad Typing</p>
              <p className="text-xs font-bold text-stone-500">Ajman Typing Centre</p>
            </div>
          </div>
          <div className="hidden items-center gap-6 text-sm font-bold text-stone-700 md:flex">
            <a href="#home" className="hover:text-[#0d5f63]">Home</a>
            <a href="#about" className="hover:text-[#0d5f63]">About</a>
            <a href="#functions" className="hover:text-[#0d5f63]">Functions</a>
            <a href="#contact" className="hover:text-[#0d5f63]">Contact</a>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 rounded-full border border-[#d2cbc0] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-stone-700 transition hover:border-[#0d5f63] hover:text-[#0d5f63]"
          >
            <Lock className="h-3.5 w-3.5" />
            Developer Portal
          </button>
        </nav>
      </header>

      <main>
        <section id="home" className="relative overflow-hidden px-4 pb-16 pt-14 md:px-8 md:pt-20">
          <div className="hero-orb hero-orb-a" aria-hidden="true" />
          <div className="hero-orb hero-orb-b" aria-hidden="true" />
          <div className="mx-auto grid w-full max-w-7xl gap-8 md:grid-cols-[1.1fr_0.9fr] md:gap-12">
            <div className="space-y-7 animate-rise">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#cfbf9f] bg-[#f8e8c7] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#705612]">
                <Clock3 className="h-3.5 w-3.5" />
                Fast typing and clearance workflows
              </p>
              <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
                Abad Commercial Information Services
                <span className="block text-[#0d5f63]">Trusted UAE Documents Clearance Since 2015</span>
              </h1>
              <p className="max-w-2xl text-base font-semibold leading-relaxed text-stone-600 md:text-lg">
                Abad Typing helps individuals and businesses complete UAE document processing and clearance with speed, professionalism, and clear communication.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://wa.me/971551012119"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#0d5f63] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#0d5f63]/20 transition hover:-translate-y-0.5"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Business
                </a>
                <a
                  href="https://abadtyping.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#cfc7bb] bg-white px-6 py-3 text-sm font-black text-stone-800 transition hover:border-[#0d5f63] hover:text-[#0d5f63]"
                >
                  Visit Website
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="animate-rise-delayed rounded-3xl border border-[#e6dfd2] bg-white/85 p-6 shadow-xl shadow-[#302b240d] backdrop-blur">
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-[#0d5f63]">At a glance</h2>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-[#e9e3d8] bg-[#fffaf0] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">Established</p>
                  <p className="mt-1 text-lg font-black">2015</p>
                </div>
                <div className="rounded-2xl border border-[#e9e3d8] bg-[#f6fffd] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">Support</p>
                  <p className="mt-1 text-lg font-black">Individuals and Business Clients</p>
                </div>
                <div className="rounded-2xl border border-[#e9e3d8] bg-[#fffaf0] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">Location</p>
                  <p className="mt-1 text-lg font-black">Al Rashidiya 2, Ajman</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="mx-auto w-full max-w-7xl px-4 py-14 md:px-8 md:py-20">
          <div className="grid gap-8 rounded-[2rem] border border-[#ddd4c5] bg-white p-6 shadow-sm md:grid-cols-2 md:p-10">
            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0d5f63]">About us</p>
              <h2 className="text-3xl font-black leading-tight md:text-4xl">Built for day-to-day typing centre realities</h2>
              <p className="text-sm font-semibold leading-relaxed text-stone-600 md:text-base">
                Abad Commercial Information Services (Abad Typing) is a UAE-based document clearance agent. Since 2015, we have focused on practical service delivery, accurate submissions, and dependable support for clients across routine and specialized document workflows.
              </p>
            </div>
            <div className="grid gap-3 text-sm font-bold">
              <div className="rounded-2xl border border-[#e7e1d3] bg-[#f7fffd] p-4">
                <ShieldCheck className="mb-2 h-5 w-5 text-[#0d5f63]" />
                Compliance-first checks before processing
              </div>
              <div className="rounded-2xl border border-[#e7e1d3] bg-[#fffaf3] p-4">
                <CheckCircle2 className="mb-2 h-5 w-5 text-[#8c6c1f]" />
                Transparent workflow and clearer client communication
              </div>
              <div className="rounded-2xl border border-[#e7e1d3] bg-[#f7fffd] p-4">
                <Clock3 className="mb-2 h-5 w-5 text-[#0d5f63]" />
                Faster turnaround with process discipline
              </div>
            </div>
          </div>
        </section>

        <section id="functions" className="mx-auto w-full max-w-7xl px-4 pb-14 md:px-8 md:pb-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0d5f63]">Our functions</p>
              <h2 className="mt-2 text-3xl font-black md:text-4xl">Core Service Blocks</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {serviceCards.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="group rounded-3xl border border-[#dfd6c8] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#0d5f63] text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-black">{item.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-stone-600">{item.desc}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-14 md:px-8 md:pb-20">
          <div className="rounded-[2rem] border border-[#ddd3c3] bg-[#fffaf1] p-6 md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8c6c1f]">How we work</p>
            <h2 className="mt-2 text-3xl font-black md:text-4xl">Simple, dependable process</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {processSteps.map((step, idx) => (
                <div key={step.title} className="rounded-2xl border border-[#e6dcc9] bg-white p-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8c6c1f]">Step {idx + 1}</p>
                  <h3 className="mt-2 text-lg font-black">{step.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-stone-600">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-14 md:px-8 md:pb-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0d5f63]">Leadership</p>
              <h2 className="mt-2 text-3xl font-black md:text-4xl">Key Personnel</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {leadership.map((member) => (
              <article key={member.email} className="rounded-3xl border border-[#dfd6c8] bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black">{member.name}</h3>
                <p className="mt-1 text-sm font-bold text-[#0d5f63]">{member.title}</p>
                <div className="mt-4 space-y-2 text-sm font-semibold text-stone-700">
                  <a href={`tel:${member.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-[#0d5f63]">
                    <Phone className="h-4 w-4" />
                    {member.phone}
                  </a>
                  <a href={`mailto:${member.email}`} className="flex items-center gap-2 hover:text-[#0d5f63]">
                    <Mail className="h-4 w-4" />
                    {member.email}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" className="border-t border-[#e6ded2] bg-[#f9f4ea] px-4 py-14 md:px-8">
          <div className="mx-auto mb-6 w-full max-w-7xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0d5f63]">Digital Presence</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <a href="https://www.facebook.com/abadtyping" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#d9cfbe] bg-white px-4 py-2 text-sm font-bold hover:border-[#0d5f63]">
                <Globe className="h-4 w-4 text-[#0d5f63]" />
                Facebook
              </a>
              <a href="https://www.instagram.com/abadtyping/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#d9cfbe] bg-white px-4 py-2 text-sm font-bold hover:border-[#0d5f63]">
                <Globe className="h-4 w-4 text-[#0d5f63]" />
                Instagram
              </a>
            </div>
          </div>
          <div className="mx-auto grid w-full max-w-7xl gap-4 md:grid-cols-4">
            <a href="tel:+971551012119" className="rounded-2xl border border-[#d9cfbe] bg-white p-5 text-center transition hover:border-[#0d5f63]">
              <Phone className="mx-auto mb-2 h-5 w-5 text-[#0d5f63]" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">Business</p>
              <p className="mt-1 text-sm font-black">+971 55 101 2119</p>
            </a>
            <a href="https://wa.me/971551012119" target="_blank" rel="noreferrer" className="rounded-2xl border border-[#d9cfbe] bg-white p-5 text-center transition hover:border-[#0d5f63]">
              <MessageCircle className="mx-auto mb-2 h-5 w-5 text-[#0d5f63]" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">WhatsApp</p>
              <p className="mt-1 text-sm font-black">+971 55 101 2119</p>
            </a>
            <a href="mailto:info@abadtyping.com" className="rounded-2xl border border-[#d9cfbe] bg-white p-5 text-center transition hover:border-[#0d5f63]">
              <Mail className="mx-auto mb-2 h-5 w-5 text-[#0d5f63]" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">Email</p>
              <p className="mt-1 text-sm font-black">info@abadtyping.com</p>
            </a>
            <a href="https://maps.app.goo.gl/N18juGGC9Y9K1YQX6" target="_blank" rel="noreferrer" className="rounded-2xl border border-[#d9cfbe] bg-white p-5 text-center transition hover:border-[#0d5f63]">
              <MapPin className="mx-auto mb-2 h-5 w-5 text-[#0d5f63]" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">Location</p>
              <p className="mt-1 text-sm font-black">Shop 01, Ammar Bin Yasir Street, Al Rashidiya 2, Ajman, UAE</p>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    setStatusText('Waiting for Google Login...');
    try {
      const user = await signInWithGoogle();
      setStatusText('Verifying Developer Clearance...');
      const access = await checkDeveloperAccess(user.uid);

      if (access.granted) {
        setStatusText('Access Granted. Redirecting...');
        localStorage.setItem('acisDevUser', JSON.stringify(access.data));
        navigate('/dashboard');
      } else {
        await auth.signOut();
        setError(access.reason || 'Access denied.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
      setStatusText('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fffcf6] p-4">
      <div className="w-full max-w-md space-y-8 rounded-[2rem] border border-[#e4dbcd] bg-white p-8 text-center shadow-xl md:p-12">
        {isLoading ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center space-y-4 rounded-[2rem] bg-white/90 backdrop-blur-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-[#0d5f63]" />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-600">{statusText}</p>
          </div>
        ) : null}

        <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f7f7]">
          <UserCheck className="h-8 w-8 text-[#0d5f63]" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-stone-900">Developer Portal</h2>
          <p className="mt-2 text-sm font-semibold text-stone-500">Secure access for ACIS developers.</p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs font-bold text-rose-600">
            {error}
          </div>
        ) : null}

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="relative flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-stone-200 bg-white px-6 py-4 font-black text-stone-700 transition hover:border-[#0d5f63] hover:bg-[#f5fffe] disabled:opacity-50"
        >
          <svg className="absolute left-6 h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            <path fill="none" d="M1 1h22v22H1z" />
          </svg>
          <span className="ml-4">Continue with Google</span>
        </button>

        <div className="pt-2">
          <button onClick={() => navigate('/')} className="mx-auto flex items-center gap-1 text-xs font-black uppercase tracking-[0.14em] text-stone-500 transition hover:text-stone-800">
            <ArrowRight className="h-3 w-3 rotate-180" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/tenants" element={<TenantManagementPage />} />
      <Route path="/tickets" element={<TicketManagementPage />} />
    </Routes>
  );
}

export default App;
