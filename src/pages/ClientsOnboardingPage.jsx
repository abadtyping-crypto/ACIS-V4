import { useEffect, useState } from 'react';
import PageShell from '../components/layout/PageShell';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';
import CompanyRegistrationForm from '../components/onboarding/CompanyRegistrationForm';
import IndividualRegistrationForm from '../components/onboarding/IndividualRegistrationForm';
import DependentRegistrationForm from '../components/onboarding/DependentRegistrationForm';
import ClientLiveListSection from '../components/onboarding/ClientLiveListSection';

const ClientsOnboardingPage = () => {
    const { tenantId } = useTenant();
    const { user } = useAuth();
    const [activeType, setActiveType] = useState(null); // 'company', 'individual', 'dependent'
    const [flash, setFlash] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (!flash) return undefined;
        const timer = setTimeout(() => setFlash(null), 15000);
        return () => clearTimeout(timer);
    }, [flash]);

    const handleSuccess = (created) => {
        setActiveType(null);
        setRefreshKey((prev) => prev + 1);
        setFlash({
            message: `Created ${created?.displayClientId || 'new entry'} successfully.`,
            detail: `${created?.tradeName || created?.fullName || 'Client'} • ${String(created?.type || '').toUpperCase()}`,
        });
    };

    return (
        <PageShell
            title="Clients Onboarding"
            subtitle="Register companies, individuals, or dependents with zero friction."
            icon={UserPlus}
        >
            <div className="mx-auto max-w-4xl space-y-6 pb-20">
                {flash ? (
                    <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="font-bold">{flash.message}</p>
                                <p className="mt-0.5 text-xs">{flash.detail}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFlash(null)}
                                className="rounded-lg border border-emerald-300 px-2 py-1 text-xs font-bold hover:bg-emerald-100"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                ) : null}

                {!activeType ? (
                    <>
                        <section className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-[var(--c-text)]">Client Registration</h2>
                            <p className="text-sm text-[var(--c-muted)]">Select a client type to begin the onboarding process.</p>

                            <div className="mt-8 grid gap-4 sm:grid-cols-3">
                                {[
                                    { id: 'company', label: 'Company', icon: '/company.png' },
                                    { id: 'individual', label: 'Individual', icon: '/individual.png' },
                                    { id: 'dependent', label: 'Dependent', icon: '/dependent.png' }
                                ].map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => setActiveType(type.id)}
                                        className="group flex flex-col items-center gap-4 rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] p-6 transition hover:border-[var(--c-accent)] hover:bg-[var(--c-accent)]/5"
                                    >
                                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-[var(--c-surface)] shadow-sm transition group-hover:scale-110">
                                            <img src={type.icon} alt={type.label} className="h-full w-full object-cover" />
                                        </div>
                                        <span className="text-sm font-bold text-[var(--c-text)]">{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <ClientLiveListSection
                            tenantId={tenantId}
                            user={user}
                            refreshKey={refreshKey}
                        />
                    </>
                ) : (
                    <div className="space-y-6">
                        <button
                            onClick={() => setActiveType(null)}
                            className="flex items-center gap-2 text-xs font-bold text-[var(--c-muted)] hover:text-[var(--c-accent)] transition"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Selection
                        </button>

                        <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6 shadow-sm">
                            {activeType === 'company' && (
                                <CompanyRegistrationForm
                                    activeType={activeType}
                                    tenantId={tenantId}
                                    user={user}
                                    onCancel={() => setActiveType(null)}
                                    onSuccess={handleSuccess}
                                />
                            )}

                            {activeType === 'individual' && (
                                <IndividualRegistrationForm
                                    activeType={activeType}
                                    tenantId={tenantId}
                                    user={user}
                                    onCancel={() => setActiveType(null)}
                                    onSuccess={handleSuccess}
                                />
                            )}

                            {activeType === 'dependent' && (
                                <DependentRegistrationForm
                                    activeType={activeType}
                                    tenantId={tenantId}
                                    user={user}
                                    onCancel={() => setActiveType(null)}
                                    onSuccess={handleSuccess}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </PageShell>
    );
};

export default ClientsOnboardingPage;
