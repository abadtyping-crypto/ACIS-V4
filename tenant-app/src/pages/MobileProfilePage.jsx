import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import { useTheme } from '../context/ThemeContext';
import UserControlCenterSection from '../components/settings/UserControlCenterSection';
import {
  MOBILE_ICON_STYLES,
  MOBILE_WALLPAPERS,
  readMobileAppearance,
  saveMobileAppearance,
} from '../lib/mobileAppearance';

const MobileProfilePage = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [appearance, setAppearance] = useState(() => readMobileAppearance());
  const selectedWallpaperLabel = useMemo(
    () => MOBILE_WALLPAPERS.find((item) => item.id === appearance.wallpaper)?.label || 'Aurora',
    [appearance.wallpaper],
  );
  const selectedIconStyleLabel = useMemo(
    () => MOBILE_ICON_STYLES.find((item) => item.id === appearance.iconStyle)?.label || 'Glass',
    [appearance.iconStyle],
  );

  const updateAppearance = (patch) => {
    const next = saveMobileAppearance({ ...appearance, ...patch });
    setAppearance(next);
  };

  return (
    <PageShell title="Profile" subtitle="Mobile profile keeps essential controls and user access management.">
      <section className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
        <p className="text-sm font-semibold text-[var(--c-text)]">Theme</p>
        <p className="mt-1 text-xs text-[var(--c-muted)]">Choose default device theme behavior.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`rounded-lg px-3 py-2 text-xs font-semibold ${
              theme === 'light' ? 'bg-[var(--c-accent)] text-white' : 'bg-[var(--c-panel)] text-[var(--c-muted)]'
            }`}
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`rounded-lg px-3 py-2 text-xs font-semibold ${
              theme === 'dark' ? 'bg-[var(--c-accent)] text-white' : 'bg-[var(--c-panel)] text-[var(--c-muted)]'
            }`}
          >
            Dark
          </button>
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`rounded-lg px-3 py-2 text-xs font-semibold ${
              theme === 'system' ? 'bg-[var(--c-accent)] text-white' : 'bg-[var(--c-panel)] text-[var(--c-muted)]'
            }`}
          >
            System
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--c-muted)]">Current resolved theme: {resolvedTheme}</p>
      </section>

      <section className="mt-3 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
        <p className="text-sm font-semibold text-[var(--c-text)]">Mobile Appearance</p>
        <p className="mt-1 text-xs text-[var(--c-muted)]">Customize mobile-only wallpaper gradient and icon style.</p>

        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-muted)]">Wallpaper</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {MOBILE_WALLPAPERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => updateAppearance({ wallpaper: item.id })}
                className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                  appearance.wallpaper === item.id
                    ? 'bg-[var(--c-accent)] text-white'
                    : 'bg-[var(--c-panel)] text-[var(--c-muted)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--c-muted)]">Selected wallpaper: {selectedWallpaperLabel}</p>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-muted)]">Icon Style</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {MOBILE_ICON_STYLES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => updateAppearance({ iconStyle: item.id })}
                className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                  appearance.iconStyle === item.id
                    ? 'bg-[var(--c-accent)] text-white'
                    : 'bg-[var(--c-panel)] text-[var(--c-muted)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--c-muted)]">Selected icon style: {selectedIconStyleLabel}</p>
        </div>
      </section>

      <section className="mt-3 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
        <p className="text-sm font-semibold text-[var(--c-text)]">Edit Profile</p>
        <p className="mt-1 text-xs text-[var(--c-muted)]">Open edit page to update profile details.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate(`/t/${tenantId}/profile/edit`)}
            className="rounded-xl bg-[var(--c-accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            Open Edit Page
          </button>
          <button
            type="button"
            onClick={() => navigate(`/t/${tenantId}/settings`)}
            className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-2 text-sm font-semibold text-[var(--c-text)]"
          >
            Open Full Settings
          </button>
        </div>
      </section>

      <section className="mt-3 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
        <p className="text-sm font-semibold text-[var(--c-text)]">User Control</p>
        <p className="mt-1 text-xs text-[var(--c-muted)]">Manage function access and notification rules.</p>
        <div className="mt-3">
          <UserControlCenterSection />
        </div>
      </section>
    </PageShell>
  );
};

export default MobileProfilePage;
