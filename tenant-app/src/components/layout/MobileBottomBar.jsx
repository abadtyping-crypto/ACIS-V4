import { NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  BellIcon,
  HomeIcon,
  LauncherIcon,
  PortalIcon,
  StarIcon,
} from '../icons/AppIcons';

const MobileBottomBar = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.55rem+env(safe-area-inset-bottom))] pt-2.5 lg:hidden">
      <div className="mobile-glass-panel mobile-bottom-3d mx-auto flex max-w-md items-center justify-between gap-1 rounded-3xl border border-[var(--c-border)] px-2.5 py-2">
        <NavLink
          to={`/t/${tenantId}/dashboard`}
          className={({ isActive }) =>
            `mobile-icon-only flex min-h-12 min-w-14 flex-1 items-center justify-center rounded-xl text-lg transition ${
              isActive ? 'text-[var(--c-accent)] icon-active' : 'text-[var(--c-muted)]'
            }`
          }
          aria-label="Home"
          title="Home"
        >
          <HomeIcon className="h-6 w-6" />
        </NavLink>

        <NavLink
          to={`/t/${tenantId}/notifications`}
          className={({ isActive }) =>
            `mobile-icon-only flex min-h-12 min-w-14 flex-1 items-center justify-center rounded-xl text-lg transition ${
              isActive ? 'text-[var(--c-accent)] icon-active' : 'text-[var(--c-muted)]'
            }`
          }
          aria-label="Notifications"
          title="Notifications"
        >
          <BellIcon className="h-6 w-6" />
        </NavLink>

        <button
          type="button"
          onClick={() => navigate(`/t/${tenantId}/search`)}
          className="menu-launcher-btn relative -mt-4 inline-flex h-15 w-15 items-center justify-center rounded-2xl border border-[var(--c-border)] text-xl"
          aria-label="Menu"
          title="Menu"
        >
          <LauncherIcon className="h-7 w-7" />
        </button>

        <NavLink
          to={`/t/${tenantId}/portal-management/new`}
          className={({ isActive }) =>
            `mobile-icon-only flex min-h-12 min-w-14 flex-1 items-center justify-center rounded-xl text-lg transition ${
              isActive ? 'text-[var(--c-accent)] icon-active' : 'text-[var(--c-muted)]'
            }`
          }
          aria-label="Create Portal"
          title="Create Portal"
        >
          <PortalIcon className="h-6 w-6" />
        </NavLink>

        <NavLink
          to={`/t/${tenantId}/favorites`}
          className={({ isActive }) =>
            `mobile-icon-only flex min-h-12 min-w-14 flex-1 items-center justify-center rounded-xl text-lg transition ${
              isActive ? 'text-[var(--c-accent)] icon-active' : 'text-[var(--c-muted)]'
            }`
          }
          aria-label="Favorites"
          title="Favorites"
        >
          <StarIcon className="h-6 w-6" />
        </NavLink>

        <button
          type="button"
          onClick={() => navigate(`/t/${tenantId}/chat-help`)}
          className="chat-agent-fab inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--c-border)]"
          aria-label="Chat Agent"
          title="Chat Agent"
        >
          <img src="/boticon.png" alt="Chat Agent" className="chat-agent-avatar h-full w-full rounded-full object-cover" />
          <span className="chat-agent-spark" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomBar;
