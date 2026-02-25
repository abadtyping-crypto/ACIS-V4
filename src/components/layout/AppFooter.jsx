const AppFooter = ({ tenantName }) => {
  const year = new Date().getFullYear();

  return (
    <footer className="desktop-footer glass border-t border-[var(--c-border)] px-8 py-3">
      <div className="flex items-center gap-3">
        <img
          src="/logo.png"
          alt="ACIS Ajman"
          className="h-7 w-7 rounded-lg border border-white/70 bg-white object-cover shadow-sm"
        />
        <p className="text-xs text-[var(--c-muted)]">
          {tenantName} Admin Workspace • {year}
        </p>
      </div>
    </footer>
  );
};

export default AppFooter;
