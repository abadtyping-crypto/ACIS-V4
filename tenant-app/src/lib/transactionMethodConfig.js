import {
  BankTransferIcon,
  CashByHandIcon,
  CashWithdrawalsIcon,
  CdmDepositIcon,
  ChequeDepositIcon,
  OnlinePaymentIcon,
} from '../components/icons/AppIcons';

export const TRANSACTION_METHODS = [
  { id: 'cashByHand', label: 'Cash by Hand', Icon: CashByHandIcon },
  { id: 'bankTransfer', label: 'Bank Transfer', Icon: BankTransferIcon },
  { id: 'cdmDeposit', label: 'CDM Deposit', Icon: CdmDepositIcon },
  { id: 'checqueDeposit', label: 'Cheque Deposit', Icon: ChequeDepositIcon },
  { id: 'onlinePayment', label: 'Online Payment', Icon: OnlinePaymentIcon },
  { id: 'cashWithdrawals', label: 'Cash Withdrawals', Icon: CashWithdrawalsIcon },
];

export const ALLOWED_METHOD_IDS = TRANSACTION_METHODS.map((item) => item.id);

export const DEFAULT_PORTAL_CATEGORIES = [
  {
    id: 'Bank',
    label: 'Bank',
    icon: '/portals/bank.png',
    methodIds: ['bankTransfer', 'cdmDeposit', 'checqueDeposit', 'cashWithdrawals'],
  },
  {
    id: 'Card Payment',
    label: 'Card Payment',
    icon: '/portals/cardpayment.png',
    methodIds: ['onlinePayment', 'bankTransfer'],
  },
  {
    id: 'Petty Cash',
    label: 'Petty Cash',
    icon: '/portals/pettycash.png',
    methodIds: ['cashByHand', 'cashWithdrawals'],
  },
  {
    id: 'Portals',
    label: 'Portals',
    icon: '/portals/portals.png',
    methodIds: ['cashByHand', 'bankTransfer', 'onlinePayment'],
  },
  {
    id: 'Terminal',
    label: 'Terminal',
    icon: '/portals/terminal.png',
    methodIds: ['onlinePayment', 'bankTransfer'],
  },
];

export const TX_METHOD_LABELS = TRANSACTION_METHODS.reduce((acc, item) => {
  acc[item.id] = item.label;
  return acc;
}, {});

const DEFAULT_METHOD_MAP = TRANSACTION_METHODS.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {});

export const sanitizePortalEntityName = (value, fallbackPrefix) => {
  const trimmed = String(value || '').trim().replace(/\s+/g, ' ');
  if (trimmed) return trimmed;
  return fallbackPrefix;
};

export const createCustomMethodDefinition = ({ id, label, iconUrl = '' }) => ({
  id,
  label,
  iconUrl,
  isCustom: true,
  Icon: null,
});

export const createCustomCategoryDefinition = ({ id, label, iconUrl = '', methodIds = [] }) => ({
  id,
  label,
  icon: iconUrl || '/portals/portals.png',
  methodIds,
  isCustom: true,
});

export const resolvePortalCategories = (customCategories = []) => {
  const safeCustom = Array.isArray(customCategories) ? customCategories : [];
  return [...DEFAULT_PORTAL_CATEGORIES, ...safeCustom];
};

export const resolvePortalCategory = (type, customCategories = []) => {
  return resolvePortalCategories(customCategories).find((item) => item.id === type) || null;
};

export const resolvePortalMethodDefinitions = (customMethods = []) => {
  const safeCustom = Array.isArray(customMethods) ? customMethods : [];
  return [
    ...TRANSACTION_METHODS,
    ...safeCustom.map((item) => createCustomMethodDefinition(item)),
  ];
};

export const resolvePortalMethodById = (methodId, customMethods = []) => {
  const customMap = (Array.isArray(customMethods) ? customMethods : []).reduce((acc, item) => {
    if (item?.id) acc[item.id] = createCustomMethodDefinition(item);
    return acc;
  }, {});
  return customMap[methodId] || DEFAULT_METHOD_MAP[methodId] || null;
};

export const resolveCategoryMethodIds = (type, customCategories = []) => {
  const category = resolvePortalCategory(type, customCategories);
  return Array.isArray(category?.methodIds) ? category.methodIds : [];
};

export const normalizeMethodIconKey = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const METHOD_ICON_ALIASES = {
  cashByHand: ['cash_by_hand', 'cash-by-hand', 'cash by hand'],
  bankTransfer: ['bank_transfer', 'bank-transfer', 'bank transfer'],
  cdmDeposit: ['cdm_deposit', 'cdm-deposit', 'cdm deposit'],
  checqueDeposit: ['checque_deposit', 'checque-deposit', 'checque deposit', 'cheque_deposit', 'cheque-deposit', 'cheque deposit'],
  onlinePayment: ['online_payment', 'online-payment', 'online payment'],
  cashWithdrawals: ['cash_withdrawals', 'cash-withdrawals', 'cash withdrawals'],
};

export const buildMethodIconMap = (rows = []) => {
  const map = {};
  rows.forEach((row) => {
    if (!row?.iconUrl) return;
    const candidates = [row.iconId, row.iconName];
    candidates.forEach((candidate) => {
      const key = normalizeMethodIconKey(candidate);
      if (!key) return;
      map[key] = row.iconUrl;
    });
  });
  return map;
};

export const resolveMethodIconUrl = (iconMap = {}, methodId = '') => {
  const candidates = [methodId, ...(METHOD_ICON_ALIASES[methodId] || [])];
  for (const candidate of candidates) {
    const key = normalizeMethodIconKey(candidate);
    if (!key) continue;
    if (iconMap[key]) return iconMap[key];
  }
  return '';
};
