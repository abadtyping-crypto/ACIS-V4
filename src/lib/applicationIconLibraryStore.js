import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

const toSafeError = (error) => {
  if (!error) return 'unknown';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return 'unknown';
};

const toIconsCollection = (tenantId) =>
  collection(db, 'tenants', tenantId, 'IconLibrary');

const toIconDoc = (tenantId, iconId) =>
  doc(db, 'tenants', tenantId, 'IconLibrary', iconId);

export const fetchApplicationIconLibrary = async (tenantId) => {
  try {
    const snap = await getDocs(toIconsCollection(tenantId));
    const rows = snap.docs
      .map((item) => ({ iconId: item.id, ...item.data() }))
      .sort((a, b) => String(a.iconName || '').localeCompare(String(b.iconName || ''), undefined, { sensitivity: 'base' }));
    return { ok: true, rows };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[applicationIconLibraryStore] read failed tenants/${tenantId}/IconLibrary: ${message}`);
    return { ok: false, error: message, rows: [] };
  }
};

export const getApplicationIconById = async (tenantId, iconId) => {
  try {
    const snap = await getDoc(toIconDoc(tenantId, iconId));
    return { ok: true, exists: snap.exists(), data: snap.exists() ? { iconId: snap.id, ...snap.data() } : null };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[applicationIconLibraryStore] get failed tenants/${tenantId}/IconLibrary/${iconId}: ${message}`);
    return { ok: false, exists: false, error: message, data: null };
  }
};

export const upsertApplicationIcon = async (tenantId, iconId, payload, options = {}) => {
  try {
    const data = { ...payload };
    if (options.isCreate) {
      data.createdAt = serverTimestamp();
      delete data.updatedAt;
      delete data.updatedBy;
    } else {
      data.updatedAt = serverTimestamp();
    }
    await setDoc(toIconDoc(tenantId, iconId), data, { merge: true });
    return { ok: true };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[applicationIconLibraryStore] upsert failed tenants/${tenantId}/IconLibrary/${iconId}: ${message}`);
    return { ok: false, error: message };
  }
};

export const deleteApplicationIcon = async (tenantId, iconId) => {
  try {
    await deleteDoc(toIconDoc(tenantId, iconId));
    return { ok: true };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[applicationIconLibraryStore] delete failed tenants/${tenantId}/IconLibrary/${iconId}: ${message}`);
    return { ok: false, error: message };
  }
};
