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
    key: 'clientOnboarding',
    label: 'Clients Onboarding',
    icon: 'user-plus',
    path: 'client-onboarding',
    description: 'Register companies, individuals, or dependents.',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'dailyTransactions',
    label: 'Daily Transactions',
    icon: 'receipt',
    path: 'daily-transactions',
    description: 'Daily transaction journal and quick posting workspace.',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'tasksTracking',
    label: "Task's & Traking",
    icon: 'tasks',
    path: 'tasks-tracking',
    description: 'Task assignment, ownership, and tracking board.',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'invoiceManagement',
    label: 'Invoice Management',
    icon: 'invoice',
    path: 'invoice-management',
    description: 'Invoice lifecycle, statuses, and controls.',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'proformaQuotation',
    label: 'Proforma / Quotation',
    icon: 'quotation',
    path: 'proforma-quotation',
    description: 'Proforma and quotation preparation workspace.',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'operationExpenses',
    label: "Opertaion Expense's",
    icon: 'expense',
    path: 'operation-expenses',
    description: 'Operational expense recording and review.',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'portalManagement',
    label: 'Portal Managment',
    icon: 'portal',
    path: 'portal-management',
    description: 'Portal actions with action-level permission checks.',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'documentCalendar',
    label: 'Document Calendar',
    icon: 'calendar',
    path: 'document-calendar',
    description: 'Calendar timeline for document due dates and events.',
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
    key: 'clientOnboarding',
    label: 'Clients Onboarding',
    description: 'Register companies, individuals, or dependents',
    path: 'client-onboarding',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'dailyTransactions',
    label: 'Daily Transactions',
    description: 'Daily transaction journal',
    path: 'daily-transactions',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'tasksTracking',
    label: "Task's & Traking",
    description: 'Task and tracking workspace',
    path: 'tasks-tracking',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'invoiceManagement',
    label: 'Invoice Management',
    description: 'Invoice lifecycle controls',
    path: 'invoice-management',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'proformaQuotation',
    label: 'Proforma / Quotation',
    description: 'Proforma and quotation module',
    path: 'proforma-quotation',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'operationExpenses',
    label: "Opertaion Expense's",
    description: 'Operation expenses module',
    path: 'operation-expenses',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'portalManagement',
    label: 'Portal Managment',
    description: 'Portal actions with action-level permission checks',
    path: 'portal-management',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
  {
    key: 'documentCalendar',
    label: 'Document Calendar',
    description: 'Document due-date calendar view',
    path: 'document-calendar',
    platforms: [PLATFORM_WEB, PLATFORM_ELECTRON],
  },
];

export const isVisibleOnPlatform = (item, platform) => {
  if (!item?.platforms || item.platforms.length === 0) return true;
  return item.platforms.includes(platform);
};
