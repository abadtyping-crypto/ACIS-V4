import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Settings } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import PreferenceSection from '../components/settings/PreferenceSection';
import BrandDetailsSection from '../components/settings/BrandDetailsSection';
import SecuritySection from '../components/settings/SecuritySection';
import UserControlCenterSection from '../components/settings/UserControlCenterSection';
import UserCustomizationSection from '../components/settings/UserCustomizationSection';
import IDRulesSection from '../components/settings/IDRulesSection';
import PdfCustomizationStudioSection from '../components/settings/PdfCustomizationStudioSection';
import MailConfigurationSection from '../components/settings/MailConfigurationSection';
import ApplicationIconLibrarySection from '../components/settings/ApplicationIconLibrarySection';
import ServiceTemplateSection from '../components/settings/ServiceTemplateSection';
import EmailTemplateSection from '../components/settings/EmailTemplateSection';
import { useTenant } from '../context/TenantContext';

const SETTINGS_SECTIONS = [
  { key: 'brand', label: 'Brand Details' },
  { key: 'preferences', label: 'Preferences' },
  { key: 'pdfStudio', label: 'PDF Studio' },
  { key: 'svcTemplates', label: 'Application Templates' },
  { key: 'appIconLibrary', label: 'Applications Icon Library' },
  { key: 'users', label: 'User Management' },
  { key: 'control', label: 'User Control Center' },
  { key: 'mail', label: 'Mail Configuration' },
  { key: 'mailTemplates', label: 'Email Templates' },
  { key: 'security', label: 'Security' },
  { key: 'counters', label: 'ID Rules & Counters' },
];

const TAB_ALIAS_MAP = {
  services: 'svcTemplates',
  serviceTemplates: 'svcTemplates',
  svcTemplates: 'svcTemplates',
  applicationTemplates: 'svcTemplates',
  appIcons: 'appIconLibrary',
  appIconLibrary: 'appIconLibrary',
  idRules: 'counters',
  counters: 'counters',
};

const SettingsPage = () => {
  const { tenant } = useTenant();
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState('brand');

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (!requestedTab) return;
    const nextSection = TAB_ALIAS_MAP[requestedTab] || requestedTab;
    const exists = SETTINGS_SECTIONS.some((section) => section.key === nextSection);
    if (exists) setActiveSection(nextSection);
  }, [searchParams]);

  const sectionContent = useMemo(() => {
    if (activeSection === 'brand') return <BrandDetailsSection />;
    if (activeSection === 'preferences') return <PreferenceSection />;
    if (activeSection === 'pdfStudio') return <PdfCustomizationStudioSection />;
    if (activeSection === 'svcTemplates') return <ServiceTemplateSection />;
    if (activeSection === 'appIconLibrary') return <ApplicationIconLibrarySection />;
    if (activeSection === 'users') return <UserCustomizationSection />;
    if (activeSection === 'control') return <UserControlCenterSection />;
    if (activeSection === 'mail') return <MailConfigurationSection />;
    if (activeSection === 'mailTemplates') return <EmailTemplateSection />;
    if (activeSection === 'counters') return <IDRulesSection />;
    return <SecuritySection />;
  }, [activeSection]);

  return (
    <div style={{ '--c-accent': tenant.brandColor }}>
      <PageShell
        title={`${tenant.name} Settings`}
        subtitle={`Tenant-scoped configuration for branding, preferences, and security. Currency: ${tenant.currency}`}
        icon={Settings}
      >
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-3">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--c-muted)]">
              Settings Menu
            </p>
            <div className="grid gap-1">
              {SETTINGS_SECTIONS.map((section) => (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => setActiveSection(section.key)}
                  className={`rounded-xl px-3 py-2 text-left text-sm font-semibold ${activeSection === section.key
                    ? 'bg-[var(--c-panel)] text-[var(--c-text)] ring-1 ring-[var(--c-ring)]'
                    : 'text-[var(--c-muted)] hover:bg-[var(--c-panel)] hover:text-[var(--c-text)]'
                    }`}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </aside>
          <div>
            <div className="mb-3 lg:hidden">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--c-muted)]">
                Quick Section
                <select
                  value={activeSection}
                  onChange={(event) => setActiveSection(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-sm text-[var(--c-text)] outline-none"
                >
                  {SETTINGS_SECTIONS.map((section) => (
                    <option key={section.key} value={section.key}>
                      {section.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {sectionContent}
          </div>
        </div>
      </PageShell>
    </div>
  );
};

export default SettingsPage;
