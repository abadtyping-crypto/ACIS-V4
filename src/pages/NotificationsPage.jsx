import PageShell from '../components/layout/PageShell';

const notifications = [
  { id: 1, title: 'Invoice approved', detail: 'INV-10034 has been approved by manager.' },
  { id: 2, title: 'User invited', detail: 'Invitation sent to staff@domain.com.' },
  { id: 3, title: 'Reminder', detail: 'TRN details are pending update.' },
];

const NotificationsPage = () => {
  return (
    <PageShell title="Notifications" subtitle="System alerts and operational updates.">
      <div className="space-y-2">
        {notifications.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4"
          >
            <p className="text-sm font-bold text-[var(--c-text)]">{item.title}</p>
            <p className="mt-1 text-sm text-[var(--c-muted)]">{item.detail}</p>
          </article>
        ))}
      </div>
    </PageShell>
  );
};

export default NotificationsPage;

