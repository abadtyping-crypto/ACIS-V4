import {
  Bell,
  CircleUserRound,
  House,
  HandCoins,
  Info,
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

export const HomeIcon = withIcon(House, 'h-5 w-5');
export const BellIcon = withIcon(Bell, 'h-5 w-5');
export const StarIcon = withIcon(Star, 'h-5 w-5');
export const UserIcon = withIcon(CircleUserRound, 'h-5 w-5');
export const SearchIcon = withIcon(Search, 'h-5 w-5');
export const InfoIcon = withIcon(Info, 'h-4 w-4');
export const SettingsIcon = withIcon(Settings, 'h-5 w-5');
export const PortalIcon = withIcon(WalletCards, 'h-5 w-5');
export const PaymentIcon = withIcon(HandCoins, 'h-5 w-5');
export const UserPlusIcon = withIcon(UserPlus, 'h-5 w-5');
export const RecycleBinIcon = withIcon(Trash2, 'h-5 w-5');
