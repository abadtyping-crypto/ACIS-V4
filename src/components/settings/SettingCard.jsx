const SettingCard = ({ title, description, children }) => {
  return (
    <section className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-sm sm:p-5">
      <h2 className="font-title text-xl text-[var(--c-text)]">{title}</h2>
      <p className="mt-1 text-sm text-[var(--c-muted)]">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
};

export default SettingCard;
