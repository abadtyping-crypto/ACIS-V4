import { upsertTenantSyncEvent } from './backendStore';
const SYNC_EVENTS_KEY = 'acis_sync_events_v1';

const readStore = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SYNC_EVENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStore = (events) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SYNC_EVENTS_KEY, JSON.stringify(events));
};

const toIsoNow = () => new Date().toISOString();

const toEventId = (tenantId, entityType, entityId) =>
  `se_${tenantId}_${entityType}_${entityId}_${Date.now().toString(36)}`;

export const createSyncEvent = async (payload) => {
  const tenantId = String(payload?.tenantId || '').trim();
  const eventType = String(payload?.eventType || '').trim();
  const entityType = String(payload?.entityType || '').trim();
  const entityId = String(payload?.entityId || '').trim();
  const createdBy = String(payload?.createdBy || '').trim();
  const changedFields = Array.isArray(payload?.changedFields)
    ? payload.changedFields.filter(Boolean).map((item) => String(item))
    : [];

  if (!tenantId || !eventType || !entityType || !entityId || !createdBy) {
    throw new Error('Missing required sync event fields.');
  }

  const event = {
    eventId: toEventId(tenantId, entityType, entityId),
    tenantId,
    eventType,
    entityType,
    entityId,
    changedFields,
    createdAt: toIsoNow(),
    createdBy,
    syncStatus: 'pending',
  };

  const events = readStore();
  events.unshift(event);
  writeStore(events);

  const backendResult = await upsertTenantSyncEvent(tenantId, event.eventId, event);
  return {
    ...event,
    backendSynced: backendResult.ok === true,
    backendError: backendResult.ok ? null : backendResult.error,
  };
};

export const getSyncEventsByTenant = (tenantId) => {
  const events = readStore();
  return events.filter((item) => item.tenantId === tenantId);
};
