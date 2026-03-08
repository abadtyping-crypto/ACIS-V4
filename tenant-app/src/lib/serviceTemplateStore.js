import {
    collection,
    deleteDoc,
    doc,
    getDocs,
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
        const [servicesSnap, legacySnap] = await Promise.all([
            getDocs(collection(db, 'tenants', tenantId, 'services')),
            getDocs(collection(db, 'tenants', tenantId, 'serviceTemplates')),
        ]);
        const byId = {};
        servicesSnap.docs.forEach((item) => {
            byId[item.id] = { id: item.id, ...item.data() };
        });
        legacySnap.docs.forEach((item) => {
            if (!byId[item.id]) byId[item.id] = { id: item.id, ...item.data() };
        });
        const rows = Object.values(byId);
        return { ok: true, rows };
    } catch (error) {
        const message = toSafeError(error);
        console.warn(`[serviceTemplateStore] read failed tenants/${tenantId}/services: ${message}`);
        return { ok: false, error: message, rows: [] };
    }
};

/**
 * Upserts a service template.
 */
export const upsertServiceTemplate = async (tenantId, templateId, payload) => {
    try {
        if (!tenantId || !templateId) return { ok: false, error: 'Missing tenantId or templateId' };
        await setDoc(doc(db, 'tenants', tenantId, 'services', templateId), {
            ...payload,
        }, { merge: true });
        return { ok: true };
    } catch (error) {
        const message = toSafeError(error);
        console.warn(`[serviceTemplateStore] upsert failed tenants/${tenantId}/services/${templateId}: ${message}`);
        return { ok: false, error: message };
    }
};

/**
 * Deletes a service template.
 */
export const deleteServiceTemplate = async (tenantId, templateId) => {
    try {
        if (!tenantId || !templateId) return { ok: false, error: 'Missing tenantId or templateId' };
        await deleteDoc(doc(db, 'tenants', tenantId, 'services', templateId));
        return { ok: true };
    } catch (error) {
        const message = toSafeError(error);
        console.warn(`[serviceTemplateStore] delete failed tenants/${tenantId}/services/${templateId}: ${message}`);
        return { ok: false, error: message };
    }
};
