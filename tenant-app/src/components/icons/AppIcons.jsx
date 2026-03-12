import {
  Bell,
  CalendarDays,
  CircleDollarSign,
  CircleUserRound,
  FileSpreadsheet,
  FileText,
  House,
  Info,
  LayoutGrid,
  Library,
  ListChecks,
  ReceiptText,
  Search,
  Settings,
  Star,
  Trash2,
  UserPlus,
  WalletCards,
} from 'lucide-react';

const withIcon = (Icon, defaultClassName) => {
  const WrappedIcon = ({ className = defaultClassName, ...props }) => (
    <Icon className={className} strokeWidth={1.9} aria-hidden="true" {...props} />
  );
  WrappedIcon.displayName = `${Icon.displayName || 'Icon'}Wrapper`;
  return WrappedIcon;
};

export const HomeIcon = withIcon(House, 'h-6 w-6');
export const BellIcon = withIcon(Bell, 'h-6 w-6');
export const StarIcon = withIcon(Star, 'h-6 w-6');
export const UserIcon = withIcon(CircleUserRound, 'h-6 w-6');
export const SearchIcon = withIcon(Search, 'h-6 w-6');
export const InfoIcon = withIcon(Info, 'h-4 w-4');
export const SettingsIcon = withIcon(Settings, 'h-6 w-6');
export const LibraryIcon = withIcon(Library, 'h-6 w-6');
export const PortalIcon = withIcon(WalletCards, 'h-6 w-6');
export const UserPlusIcon = withIcon(UserPlus, 'h-6 w-6');
export const RecycleBinIcon = withIcon(Trash2, 'h-6 w-6');
export const ReceiptIcon = withIcon(ReceiptText, 'h-6 w-6');
export const TasksIcon = withIcon(ListChecks, 'h-6 w-6');
export const LauncherIcon = withIcon(LayoutGrid, 'h-6 w-6');
export const InvoiceIcon = withIcon(FileSpreadsheet, 'h-6 w-6');
export const QuotationIcon = withIcon(FileText, 'h-6 w-6');
export const ExpenseIcon = withIcon(CircleDollarSign, 'h-6 w-6');
export const CalendarIcon = withIcon(CalendarDays, 'h-6 w-6');
export const CashByHandIcon = withIcon(CircleDollarSign, 'h-6 w-6');
export const BankTransferIcon = withIcon(FileSpreadsheet, 'h-6 w-6');
export const CdmDepositIcon = withIcon(ReceiptText, 'h-6 w-6');
export const ChequeDepositIcon = withIcon(FileText, 'h-6 w-6');
export const OnlinePaymentIcon = withIcon(LayoutGrid, 'h-6 w-6');
export const CashWithdrawalsIcon = withIcon(WalletCards, 'h-6 w-6');
