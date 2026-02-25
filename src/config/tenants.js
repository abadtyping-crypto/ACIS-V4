export const TENANTS = [
  {
    id: 'testTenants',
    name: 'Test Tenants',
    brandColor: '#0074e8',
    locale: 'en-AE',
    currency: 'AED',
  },
  {
    id: 'acis',
    name: 'ACIS Ajman',
    brandColor: '#0074e8',
    locale: 'en-AE',
    currency: 'AED',
  },
  {
    id: 'nexus',
    name: 'Nexus Advisory',
    brandColor: '#0ea5e9',
    locale: 'en-AE',
    currency: 'AED',
  },
  {
    id: 'orbit',
    name: 'Orbit Corporate',
    brandColor: '#14b8a6',
    locale: 'en-GB',
    currency: 'GBP',
  },
];

export const DEFAULT_TENANT_ID = TENANTS[0].id;

export const findTenantById = (tenantId) => TENANTS.find((tenant) => tenant.id === tenantId) || null;
