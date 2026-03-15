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

export const DESKTOP_APPEARANCE_EVENT = 'acis-desktop-appearance-change';

export const DESKTOP_WALLPAPERS = [
  { id: 'aurora', label: 'Aurora' },
  { id: 'midnight', label: 'Midnight' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'sunrise', label: 'Sunrise' },
  { id: 'ember', label: 'Ember' },
];

const defaultDesktopAppearance = {
  mode: 'preset',
  wallpaper: 'aurora',
  customWallpaperUrl: '',
};

const sanitizeDesktopWallpaper = (value) => {
  const candidate = String(value || '').trim().toLowerCase();
  return DESKTOP_WALLPAPERS.some((item) => item.id === candidate) ? candidate : defaultDesktopAppearance.wallpaper;
};

export const readDesktopAppearance = () => {
  if (typeof window === 'undefined') return defaultDesktopAppearance;
  try {
    const raw = window.localStorage.getItem('acis_desktop_appearance_v1');
    if (!raw) return defaultDesktopAppearance;
    const parsed = JSON.parse(raw);
    return {
      mode: parsed?.mode === 'custom' ? 'custom' : 'preset',
      wallpaper: sanitizeDesktopWallpaper(parsed?.wallpaper),
      customWallpaperUrl: parsed?.customWallpaperUrl || '',
    };
  } catch {
    return defaultDesktopAppearance;
  }
};

export const saveDesktopAppearance = (nextAppearance) => {
  if (typeof window === 'undefined') return defaultDesktopAppearance;
  const normalized = {
    mode: nextAppearance?.mode === 'custom' ? 'custom' : 'preset',
    wallpaper: sanitizeDesktopWallpaper(nextAppearance?.wallpaper),
    customWallpaperUrl: nextAppearance?.customWallpaperUrl || '',
  };
  window.localStorage.setItem('acis_desktop_appearance_v1', JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent('acis-desktop-appearance-change', { detail: normalized }));
  return normalized;
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Unable to read wallpaper image.'));
  reader.readAsDataURL(file);
});

export const saveDesktopWallpaperFile = async (file) => {
  if (!file) return { ok: false, error: 'No wallpaper file selected.' };
  if (!file.type.startsWith('image/')) return { ok: false, error: 'Please select an image file.' };
  if (file.size > 2 * 1024 * 1024) return { ok: false, error: 'Wallpaper must be 2 MB or less.' };

  const hasElectronSaver = Boolean(window.electron?.desktopAppearance?.saveWallpaper);
  if (hasElectronSaver) {
    const dataUrl = await readFileAsDataUrl(file);
    const saveResult = await window.electron.desktopAppearance.saveWallpaper({
      fileName: file.name,
      dataUrl,
    });
    if (!saveResult?.ok || !saveResult?.fileUrl) {
      return { ok: false, error: saveResult?.error || 'Unable to store wallpaper file.' };
    }
    const appearance = saveDesktopAppearance({
      mode: 'custom',
      wallpaper: defaultDesktopAppearance.wallpaper,
      customWallpaperUrl: saveResult.fileUrl,
    });
    return { ok: true, appearance };
  }

  const dataUrl = await readFileAsDataUrl(file);
  if (!dataUrl.startsWith('data:image/')) {
    return { ok: false, error: 'Unable to read wallpaper image.' };
  }
  const appearance = saveDesktopAppearance({
    mode: 'custom',
    wallpaper: defaultDesktopAppearance.wallpaper,
    customWallpaperUrl: dataUrl,
  });
  return { ok: true, appearance };
};
