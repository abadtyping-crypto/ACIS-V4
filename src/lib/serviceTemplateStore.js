import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    serverTimestamp,
    setDoc,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

const toSafeError = (error) => {
    if (!error) return 'unknown';
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    return 'unknown';
};

/**
 * Fetches all service templates for a tenant.
 * Templates include: name, govCharge, clientCharge, iconUrl, etc.
 */
export const fetchServiceTemplates = async (tenantId) => {
    try {
        if (!tenantId) return { ok: false, error: 'Missing tenantId', rows: [] };
        const snap = await getDocs(collection(db, 'tenants', tenantId, 'serviceTemplates'));
        const rows = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
        return { ok: true, rows };
    } catch (error) {
        const message = toSafeError(error);
        console.warn(`[serviceTemplateStore] read failed tenants/${tenantId}/serviceTemplates: ${message}`);
        return { ok: false, error: message, rows: [] };
    }
};

/**
 * Upserts a service template.
 */
export const upsertServiceTemplate = async (tenantId, templateId, payload) => {
    try {
        if (!tenantId || !templateId) return { ok: false, error: 'Missing tenantId or templateId' };
        await setDoc(doc(db, 'tenants', tenantId, 'serviceTemplates', templateId), {
            ...payload,
            updatedAt: serverTimestamp(),
        }, { merge: true });
        return { ok: true };
    } catch (error) {
        const message = toSafeError(error);
        console.warn(`[serviceTemplateStore] upsert failed tenants/${tenantId}/serviceTemplates/${templateId}: ${message}`);
        return { ok: false, error: message };
    }
};

/**
 * Deletes a service template.
 */
export const deleteServiceTemplate = async (tenantId, templateId) => {
    try {
        if (!tenantId || !templateId) return { ok: false, error: 'Missing tenantId or templateId' };
        await deleteDoc(doc(db, 'tenants', tenantId, 'serviceTemplates', templateId));
        return { ok: true };
    } catch (error) {
        const message = toSafeError(error);
        console.warn(`[serviceTemplateStore] delete failed tenants/${tenantId}/serviceTemplates/${templateId}: ${message}`);
        return { ok: false, error: message };
    }
};
