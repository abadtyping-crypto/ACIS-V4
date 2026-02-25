import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_TENANT_ID, TENANTS, findTenantById } from '../config/tenants';
import { getTenantSettingDoc } from '../lib/backendStore';

const TenantContext = createContext(null);

export const TenantProvider = ({ children }) => {
  const [tenantId, setTenantId] = useState(DEFAULT_TENANT_ID);
  const [uiBrandName, setUiBrandName] = useState('');
  const baseTenant = findTenantById(tenantId) || findTenantById(DEFAULT_TENANT_ID);

  useEffect(() => {
    if (!tenantId) return;
    let active = true;

    setUiBrandName('');

    getTenantSettingDoc(tenantId, 'branding').then((result) => {
      if (!active) return;
      if (!result?.ok || !result?.data) return;
      const branding = result.data;
      const nextName = String(branding.brandName || branding.companyName || '').trim();
      setUiBrandName(nextName);
    });

    return () => {
      active = false;
    };
  }, [tenantId]);

  const tenant = useMemo(() => {
    if (!baseTenant) return null;
    const effectiveName = uiBrandName || baseTenant.name;
    return {
      ...baseTenant,
      name: effectiveName,
      defaultName: baseTenant.name,
    };
  }, [baseTenant, uiBrandName]);

  const value = useMemo(
    () => ({
      tenantId,
      tenant,
      tenants: TENANTS,
      setTenantId,
    }),
    [tenantId, tenant],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used inside TenantProvider');
  return context;
};
