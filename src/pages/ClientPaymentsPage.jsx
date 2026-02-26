import { HandCoins } from 'lucide-react';
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import ClientPaymentSection from '../components/portal/ClientPaymentSection';

const ClientPaymentsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const presetClientId = searchParams.get('clientId') || '';

  const consumePresetClient = useCallback(() => {
    if (!searchParams.get('clientId')) return;
    const next = new URLSearchParams(searchParams);
    next.delete('clientId');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  return (
    <PageShell
      title="Client Payments"
      subtitle="Receive client payments, post them to portals, and review payment history."
      icon={HandCoins}
    >
      <div className="w-full space-y-6 pb-20">
        <ClientPaymentSection
          standalone
          presetClientId={presetClientId}
          onPresetConsumed={consumePresetClient}
        />
      </div>
    </PageShell>
  );
};

export default ClientPaymentsPage;
