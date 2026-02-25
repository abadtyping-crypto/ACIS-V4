import { PLATFORM_ELECTRON, PLATFORM_WEB } from '../lib/runtimePlatform';

export const NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Home',
    icon: 'home',
    path: 'dashboard',
    description: 'Overview of activity, counters, and quick actions.',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'notifications',
    label: 'Notifications',
    icon: 'bell',
    path: 'notifications',
    description: 'System alerts and workflow updates.',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'favorites',
    label: 'Favorites',
    icon: 'star',
    path: 'favorites',
    description: 'Pinned shortcuts for frequent tasks.',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: 'user',
    path: 'profile',
    description: 'User account details and session controls.',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'portalManagement',
    label: 'Portal Management',
    icon: 'portal',
    path: 'portal-management',
    description: 'Portal actions with action-level permission checks.',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'clientOnboarding',
    label: 'Client Onboarding',
    icon: 'user-plus',
    path: 'client-onboarding',
    description: 'Register companies, individuals, or dependents.',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
];

export const SEARCH_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Overview and activity',
    path: 'dashboard',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'settings',
    label: 'Settings',
    description: 'Brand, preferences, security',
    path: 'settings',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'notifications',
    label: 'Notifications',
    description: 'Alerts and updates',
    path: 'notifications',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'profile',
    label: 'Profile',
    description: 'User profile and session',
    path: 'profile',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'favorites',
    label: 'Favorites',
    description: 'Quick shortcuts',
    path: 'favorites',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'portalManagement',
    label: 'Portal Management',
    description: 'Portal actions with action-level permission checks',
    path: 'portal-management',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'clientOnboarding',
    label: 'Client Onboarding',
    description: 'Register companies, individuals, or dependents',
    path: 'client-onboarding',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
];

export const isVisibleOnPlatform = (item, platform) => {
  if (!item?.platforms || item.platforms.length === 0) return true;
  return item.platforms.includes(platform);
};
