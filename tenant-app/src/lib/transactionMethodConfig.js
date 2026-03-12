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

export const TX_METHOD_LABELS = TRANSACTION_METHODS.reduce((acc, item) => {
  acc[item.id] = item.label;
  return acc;
}, {});

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
