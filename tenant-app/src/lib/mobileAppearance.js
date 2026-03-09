export const MOBILE_APPEARANCE_STORAGE_KEY = 'acis_mobile_appearance_v1';
export const MOBILE_APPEARANCE_EVENT = 'acis-mobile-appearance-change';

export const MOBILE_WALLPAPERS = [
  { id: 'aurora', label: 'Aurora' },
  { id: 'midnight', label: 'Midnight' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'sunrise', label: 'Sunrise' },
];

export const MOBILE_ICON_STYLES = [
  { id: 'glass', label: 'Glass' },
  { id: 'filled', label: 'Filled' },
  { id: 'minimal', label: 'Minimal' },
];

const defaultAppearance = {
  wallpaper: 'aurora',
  iconStyle: 'glass',
};

const sanitizeWallpaper = (value) => {
  const candidate = String(value || '').trim().toLowerCase();
  return MOBILE_WALLPAPERS.some((item) => item.id === candidate) ? candidate : defaultAppearance.wallpaper;
};

const sanitizeIconStyle = (value) => {
  const candidate = String(value || '').trim().toLowerCase();
  return MOBILE_ICON_STYLES.some((item) => item.id === candidate) ? candidate : defaultAppearance.iconStyle;
};

export const readMobileAppearance = () => {
  if (typeof window === 'undefined') return defaultAppearance;
  try {
    const raw = window.localStorage.getItem(MOBILE_APPEARANCE_STORAGE_KEY);
    if (!raw) return defaultAppearance;
    const parsed = JSON.parse(raw);
    return {
      wallpaper: sanitizeWallpaper(parsed?.wallpaper),
      iconStyle: sanitizeIconStyle(parsed?.iconStyle),
    };
  } catch {
    return defaultAppearance;
  }
};

export const saveMobileAppearance = (nextAppearance) => {
  if (typeof window === 'undefined') return defaultAppearance;
  const normalized = {
    wallpaper: sanitizeWallpaper(nextAppearance?.wallpaper),
    iconStyle: sanitizeIconStyle(nextAppearance?.iconStyle),
  };
  window.localStorage.setItem(MOBILE_APPEARANCE_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(MOBILE_APPEARANCE_EVENT, { detail: normalized }));
  return normalized;
};

