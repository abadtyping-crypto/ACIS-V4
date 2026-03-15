import {
  BellIcon,
  CalendarIcon,
  ExpenseIcon,
  HomeIcon,
  InvoiceIcon,
  PortalIcon,
  QuotationIcon,
  ReceiptIcon,
  SettingsIcon,
  TasksIcon,
  UserPlusIcon,
} from '../components/icons/AppIcons';
import { DEFAULT_PORTAL_ICON } from './transactionMethodConfig';

const TOPIC_ICON_MAP = {
  settings: SettingsIcon,
  users: UserPlusIcon,
  finance: PortalIcon,
  documents: QuotationIcon,
  default: BellIcon,
};

const PAGE_KEY_ICON_MAP = {
  dashboard: HomeIcon,
  settings: SettingsIcon,
  clientOnboarding: UserPlusIcon,
  dailyTransactions: ReceiptIcon,
  tasksTracking: TasksIcon,
  quotations: QuotationIcon,
  proformaInvoices: InvoiceIcon,
  receivePayments: ReceiptIcon,
  invoiceManagement: InvoiceIcon,
  operationExpenses: ExpenseIcon,
  portalManagement: PortalIcon,
  documentCalendar: CalendarIcon,
};

export const resolveNotificationPrimaryVisual = (item = {}) => {
  if (item.entityType === 'portal') {
    return {
      kind: 'image',
      src: item.entityMeta?.iconUrl || DEFAULT_PORTAL_ICON,
      fallbackSrc: DEFAULT_PORTAL_ICON,
      alt: item.entityMeta?.name || 'Portal',
    };
  }

  const Icon =
    PAGE_KEY_ICON_MAP[String(item.pageKey || '').trim()] ||
    TOPIC_ICON_MAP[String(item.topic || '').trim()] ||
    TOPIC_ICON_MAP.default;

  return {
    kind: 'icon',
    Icon,
  };
};

