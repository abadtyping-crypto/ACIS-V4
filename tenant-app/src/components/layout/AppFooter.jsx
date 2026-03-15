import { useTenant } from '../../context/useTenant';
import { useTenantBrandingLogos } from '../../hooks/useTenantBrandingLogos';

const AppFooter = ({ tenantName, tenantLogoUrl }) => {
  const { tenantId } = useTenant();
  const year = new Date().getFullYear();
  const { footerLogoUrl } = useTenantBrandingLogos(tenantId, tenantLogoUrl);
  const logoSrc = footerLogoUrl || tenantLogoUrl || '/logo.png';
  const logoAlt = tenantName || 'Tenant';

  return (
    <footer className="desktop-footer glass border-t border-[var(--c-border)] px-8 py-3">
      <div className="flex items-center gap-3">
        <img
          src={logoSrc}
          alt={logoAlt}
          className="h-7 w-7 rounded-lg border border-[var(--glass-border)] bg-[color:color-mix(in_srgb,var(--c-surface)_88%,transparent)] object-cover shadow-sm"
        />
        <p className="text-xs text-[var(--c-muted)]">
          {tenantName} Admin Workspace • {year}
        </p>
      </div>
    </footer>
  );
};

export default AppFooter;
