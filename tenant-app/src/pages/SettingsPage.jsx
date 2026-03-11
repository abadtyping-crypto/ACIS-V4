import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Settings,
  Building2,
  SlidersHorizontal,
  FileText,
  LayoutTemplate,
  Library,
  Users,
  ShieldAlert,
  Mail,
  Mailbox,
  ShieldCheck,
  Hash,
  Bell,
} from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import NotificationSettingsSection from '../components/settings/NotificationSettingsSection';
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
import useIsDesktopLayout from '../hooks/useIsDesktopLayout';

const SETTINGS_SECTIONS = [
  { key: 'brand', label: 'Brand Details', icon: Building2 },
  { key: 'notifications', label: 'Notification Settings', icon: Bell },
  { key: 'pdfStudio', label: 'PDF Studio', icon: FileText },
  { key: 'svcTemplates', label: 'Application Templates', icon: LayoutTemplate },
  { key: 'appIconLibrary', label: 'Applications Icon Library', icon: Library },
  { key: 'users', label: 'User Management', icon: Users },
  { key: 'control', label: 'User Control Center', icon: ShieldAlert },
  { key: 'mail', label: 'Mail Configuration', icon: Mail },
  { key: 'mailTemplates', label: 'Email Templates', icon: Mailbox },
  { key: 'security', label: 'Security', icon: ShieldCheck },
  { key: 'counters', label: 'ID Rules & Counters', icon: Hash },
];

const TAB_ALIAS_MAP = {
  preferences: 'notifications',
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
  const isDesktop = useIsDesktopLayout();
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState(() => {
    const requestedTab = searchParams.get('tab');
    if (!requestedTab) return 'brand';
    const nextSection = TAB_ALIAS_MAP[requestedTab] || requestedTab;
    return SETTINGS_SECTIONS.some((s) => s.key === nextSection) ? nextSection : 'brand';
  });

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (!requestedTab) return;
    const nextSection = TAB_ALIAS_MAP[requestedTab] || requestedTab;
    const exists = SETTINGS_SECTIONS.some((section) => section.key === nextSection);
    if (exists && activeSection !== nextSection) setActiveSection(nextSection);
  }, [searchParams, activeSection]);

  const sectionContent = useMemo(() => {
    if (!isDesktop) return <UserControlCenterSection />;
    if (activeSection === 'brand') return <BrandDetailsSection />;
    if (activeSection === 'notifications') return <NotificationSettingsSection />;
    if (activeSection === 'pdfStudio') return <PdfCustomizationStudioSection />;
    if (activeSection === 'svcTemplates') return <ServiceTemplateSection />;
    if (activeSection === 'appIconLibrary') return <ApplicationIconLibrarySection />;
    if (activeSection === 'users') return <UserCustomizationSection />;
    if (activeSection === 'control') return <UserControlCenterSection />;
    if (activeSection === 'mail') return <MailConfigurationSection />;
    if (activeSection === 'mailTemplates') return <EmailTemplateSection />;
    if (activeSection === 'counters') return <IDRulesSection />;
    return <SecuritySection />;
  }, [activeSection, isDesktop]);

  return (
    <div style={isDesktop ? { '--c-accent': tenant.brandColor } : undefined}>
      <PageShell
        title={`${tenant.name} Settings`}
        subtitle={isDesktop
          ? `Tenant-scoped configuration for branding, preferences, and security. Currency: ${tenant.currency}`
          : 'Mobile access: User control only.'}
        icon={Settings}
      >
        {!isDesktop ? (
          <div className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-4">
            {sectionContent}
          </div>
        ) : (
        <div className="grid h-full lg:grid-cols-[auto_1fr] sm:gap-4 overflow-hidden">
          <aside 
            className="group/sidebar sticky top-4 z-20 h-fit w-[64px] hover:w-[260px] rounded-2xl border border-(--c-border) bg-(--c-surface) p-2 shadow-sm transition-all duration-300 ease-in-out hidden lg:block"
          >
            <div className="mb-2 flex items-center gap-3 px-3 py-1">
              <Settings className="h-4 w-4 shrink-0 text-(--c-accent)" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-(--c-muted) opacity-0 group-hover/sidebar:opacity-100 transition-all duration-300 whitespace-nowrap overflow-hidden">
                Settings
              </p>
            </div>
            <div className="grid gap-1">
              {SETTINGS_SECTIONS.map((section) => (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => setActiveSection(section.key)}
                  className={`group relative mx-auto flex w-10 items-center justify-center gap-0 rounded-xl px-0 py-2.5 text-left text-sm font-bold transition-all duration-300 group-hover/sidebar:w-full group-hover/sidebar:justify-start group-hover/sidebar:gap-3 group-hover/sidebar:px-3 overflow-hidden ${
                    activeSection === section.key
                      ? 'bg-(--c-panel) text-(--c-text) ring-1 ring-(--c-accent)/20 shadow-sm'
                      : 'text-(--c-muted) hover:bg-(--c-panel) hover:text-(--c-text)'
                  }`}
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                    <section.icon 
                      className={`h-5 w-5 transition-colors ${
                        activeSection === section.key
                          ? 'text-(--c-accent)'
                          : 'text-(--c-muted) group-hover:text-(--c-text)'
                      }`} 
                      strokeWidth={2.2}
                    />
                  </div>
                  <span className="hidden whitespace-nowrap group-hover/sidebar:inline">
                    {section.label}
                  </span>
                  
                  {/* Tooltip for collapsed state */}
                  <div className="absolute left-full ml-3 hidden group-hover/sidebar:hidden group-hover:block rounded-lg bg-(--c-surface) border border-(--c-border) px-3 py-2 text-xs font-bold text-(--c-text) shadow-2xl z-50 whitespace-nowrap ring-1 ring-black/5">
                    {section.label}
                  </div>
                </button>
              ))}
            </div>
          </aside>
          
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="mb-3 lg:hidden">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--c-muted)]">
                Quick Section
                <select
                  value={activeSection}
                  onChange={(event) => setActiveSection(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-(--c-border) bg-(--c-panel) px-3 py-2 text-sm text-(--c-text) outline-none ring-1 ring-(--c-border)"
                >
                  {SETTINGS_SECTIONS.map((section) => (
                    <option key={section.key} value={section.key}>
                      {section.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            
            <div 
              key={activeSection}
              className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              {sectionContent}
            </div>
          </div>
        </div>
        )}
      </PageShell>
    </div>
  );
};

export default SettingsPage;
