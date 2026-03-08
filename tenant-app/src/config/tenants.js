export const TENANTS = [
  {
    id: 'acis',
    name: 'ACISAjman',
    brandColor: '#0074e8',
    locale: 'en-AE',
    currency: 'AED',
    logoUrl: '/logo.png',
  },
  {
    id: 'testTenants',
    name: 'Test Tenants',
    brandColor: '#0074e8',
    locale: 'en-AE',
    currency: 'AED',
    logoUrl: '/logo.png',
  },
  {
    id: 'nexus',
    name: 'Nexus Advisory',
    brandColor: '#0ea5e9',
    locale: 'en-AE',
    currency: 'AED',
    logoUrl: '/logo.png',
  },
  {
    id: 'orbit',
    name: 'Orbit Corporate',
    brandColor: '#14b8a6',
    locale: 'en-GB',
    currency: 'GBP',
    logoUrl: '/logo.png',
  },
];

export const DEFAULT_TENANT_ID = 'acis';

export const findTenantById = (tenantId) => TENANTS.find((tenant) => tenant.id === tenantId) || null;
