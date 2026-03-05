import {
  collection,
  collectionGroup,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';
import { toSafeDocId } from './idUtils';
export { db };

const toSafeError = (error) => {
  if (!error) return 'unknown';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return 'unknown';
};

const PDF_DOCUMENT_TYPES = new Set([
  'paymentReceipt',
  'nextInvoice',
  'quotation',
  'performerInvoice',
  'statement',
]);

const toSafePdfDocumentType = (documentType) => {
  const next = String(documentType || '').trim();
  if (!PDF_DOCUMENT_TYPES.has(next)) {
    throw new Error(`Unsupported PDF document type: ${next || 'unknown'}`);
  }
  return next;
};

const toPdfTemplateDocRef = (tenantId, documentType) =>
  doc(
    db,
    'tenants',
    tenantId,
    'settings',
    'pdfTemplates',
    'templates',
    toSafePdfDocumentType(documentType),
  );

export const upsertBackendDoc = async (collectionName, docId, payload) => {
  try {
    await setDoc(doc(db, collectionName, docId), { ...payload, updatedAt: serverTimestamp() }, { merge: true });
    return { ok: true };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] upsert failed ${collectionName}/${docId}: ${message}`);
    return { ok: false, error: message };
  }
};

export const deleteBackendDoc = async (collectionName, docId) => {
  try {
    await setDoc(doc(db, collectionName, docId), { deletedAt: serverTimestamp() }, { merge: true });
    return { ok: true };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] delete failed ${collectionName}/${docId}: ${message}`);
    return { ok: false, error: message };
  }
};

export const getBackendTenantDocs = async (collectionName, tenantId) => {
  if (collectionName === 'tenantUsers') return fetchTenantUsersMap(tenantId);
  if (collectionName === 'userControlPrefs') return fetchTenantUserControlMap(tenantId);
  return { ok: false, error: 'Unsupported tenant collection mapping.', rows: [] };
};

export const upsertTenantUserMap = async (tenantId, uid, payload) => {
  try {
    await setDoc(
      doc(db, 'tenants', tenantId, 'users', uid),
      {
        ...payload,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return { ok: true };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] tenant user upsert failed tenants/${tenantId}/users/${uid}: ${message}`);
    return { ok: false, error: message };
  }
};

export const deleteTenantUserMap = async (tenantId, uid, deletedBy) => {
  try {
    await setDoc(doc(db, 'tenants', tenantId, 'users', uid), {
      deletedAt: serverTimestamp(),
      deletedBy,
    }, { merge: true });
    return { ok: true };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] tenant user delete failed tenants/${tenantId}/users/${uid}: ${message}`);
    return { ok: false, error: message };
  }
};

export const fetchTenantUsersMap = async (tenantId) => {
  try {
    const snap = await getDocs(collection(db, 'tenants', tenantId, 'users'));
    const rows = snap.docs.map((item) => {
      const data = item.data() || {};
      const storedUid = String(data.uid || '').trim();
      return {
        ...data,
        uid: item.id,
        legacyUid: storedUid && storedUid !== item.id ? storedUid : '',
      };
    });
    return { ok: true, rows };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] tenant users read failed tenants/${tenantId}/users: ${message}`);
    return { ok: false, error: message, rows: [] };
  }
};

export const upsertTenantUserControlMap = async (tenantId, uid, payload) => {
  try {
    await setDoc(doc(db, 'tenants', tenantId, 'userControlPrefs', uid), {
      ...payload,
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] userControl upsert failed tenants/${tenantId}/userControlPrefs/${uid}: ${message}`);
    return { ok: false, error: message };
  }
};

export const fetchTenantUserControlMap = async (tenantId) => {
  try {
    const snap = await getDocs(collection(db, 'tenants', tenantId, 'userControlPrefs'));
    const rows = snap.docs.map((item) => ({ uid: item.id, ...item.data() }));
    return { ok: true, rows };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] userControl read failed tenants/${tenantId}/userControlPrefs: ${message}`);
    return { ok: false, error: message, rows: [] };
  }
};

export const fetchTenantPortals = async (tenantId) => {
  try {
    const [portalSnap, txSnap] = await Promise.all([
      getDocs(collection(db, 'tenants', tenantId, 'portals')),
      getDocs(collection(db, 'tenants', tenantId, 'portalTransactions')),
    ]);

    const balanceByPortal = {};
    txSnap.docs.forEach((item) => {
      const tx = item.data();
      const portalId = String(tx?.portalId || '');
      if (!portalId || tx?.deletedAt) return;

      const displayId = String(tx?.displayTransactionId || '');
      const isLoanMirrorEntry =
        !!tx?.personId &&
        (tx?.entityType === 'loanPerson' || tx?.type === 'disbursement' || tx?.type === 'repayment' || displayId.endsWith('-P'));
      if (tx?.affectsPortalBalance === false || isLoanMirrorEntry) return;

      const amount = Number(tx?.amount || 0);
      if (!Number.isFinite(amount)) return;
      balanceByPortal[portalId] = (balanceByPortal[portalId] || 0) + amount;
    });

    const rows = portalSnap.docs.map((item) => {
      const data = item.data();
      const computedBalance = balanceByPortal[item.id];
      const storedBalanceRaw = data?.balance ?? data?.Balance ?? 0;
      const storedBalance = Number(storedBalanceRaw);
      const balance = Number.isFinite(computedBalance)
        ? computedBalance
        : (Number.isFinite(storedBalance) ? storedBalance : 0);
      return {
        id: item.id,
        ...data,
        balance,
        balanceType: balance < 0 ? 'negative' : 'positive',
      };
    });
    return { ok: true, rows };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] portals read failed tenants/${tenantId}/portals: ${message}`);
    return { ok: false, error: message, rows: [] };
  }
};

export const upsertTenantPortal = async (tenantId, portalId, payload) => {
  try {
    const nextPayload = { ...(payload || {}) };

    if (nextPayload.Balance !== undefined && nextPayload.balance === undefined) {
      nextPayload.balance = nextPayload.Balance;
    }

    if (nextPayload.balance !== undefined) {
      const numericBalance = Number(nextPayload.balance);
      nextPayload.balance = Number.isFinite(numericBalance) ? numericBalance : 0;
      nextPayload.balanceType = nextPayload.balance < 0 ? 'negative' : 'positive';
    } else if (nextPayload.balanceType !== undefined) {
      const rawType = String(nextPayload.balanceType || '').toLowerCase();
      nextPayload.balanceType = rawType === 'negative' ? 'negative' : 'positive';
    }

    if (nextPayload.Balance !== undefined) {
      nextPayload.Balance = deleteField();
    }

    await setDoc(doc(db, 'tenants', tenantId, 'portals', portalId), {
      ...nextPayload,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { ok: true };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] portal upsert failed tenants/${tenantId}/portals/${portalId}: ${message}`);
    return { ok: false, error: message };
  }
};

export const deleteTenantPortal = async (tenantId, portalId, deletedBy) => {
  try {
    await setDoc(doc(db, 'tenants', tenantId, 'portals', portalId), {
      deletedAt: serverTimestamp(),
      deletedBy,
    }, { merge: true });
    return { ok: true };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] portal delete failed tenants/${tenantId}/portals/${portalId}: ${message}`);
    return { ok: false, error: message };
  }
};

export const fetchLoanPersons = async (tenantId) => {
  try {
    const snap = await getDocs(collection(db, 'tenants', tenantId, 'loanPersons'));
    const rows = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
    return { ok: true, rows };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] loanPersons read failed tenants/${tenantId}/loanPersons: ${message}`);
    return { ok: false, error: message, rows: [] };
  }
};

export const upsertLoanPerson = async (tenantId, personId, payload) => {
  try {
    await setDoc(doc(db, 'tenants', tenantId, 'loanPersons', personId), {
      ...payload,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { ok: true };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] loanPerson upsert failed tenants/${tenantId}/loanPersons/${personId}: ${message}`);
    return { ok: false, error: message };
  }
};

export const deleteLoanPerson = async (tenantId, personId, deletedBy) => {
  try {
    await setDoc(doc(db, 'tenants', tenantId, 'loanPersons', personId), {
      deletedAt: serverTimestamp(),
      deletedBy,
    }, { merge: true });
    return { ok: true };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] loan person delete failed tenants/${tenantId}/loanPersons/${personId}: ${message}`);
    return { ok: false, error: message };
  }
};

export const upsertTenantTransaction = async (tenantId, txId, payload) => {
  try {
    await setDoc(doc(db, 'tenants', tenantId, 'transactions', txId), {
      ...payload,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { ok: true };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] transaction upsert failed tenants/${tenantId}/transactions/${txId}: ${message}`);
    return { ok: false, error: message };
  }
};

export const upsertTenantPortalTransaction = async (tenantId, txId, payload) => {
  try {
    await setDoc(doc(db, 'tenants', tenantId, 'portalTransactions', txId), {
      ...payload,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { ok: true };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] portalTransaction upsert failed tenants/${tenantId}/portalTransactions/${txId}: ${message}`);
    return { ok: false, error: message };
  }
};

export const upsertTenantNotification = async (tenantId, notificationId, payload) => {
  try {
    await setDoc(doc(db, 'tenants', tenantId, 'notifications', notificationId), {
      ...payload,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { ok: true };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] notification upsert failed tenants/${tenantId}/notifications/${notificationId}: ${message}`);
    return { ok: false, error: message };
  }
};

export const markTenantNotificationRead = async (tenantId, notificationId, uid) => {
  try {
    if (!tenantId || !notificationId || !uid) {
      return { ok: false, error: 'Missing tenantId, notificationId or uid.' };
    }
    await updateDoc(doc(db, 'tenants', tenantId, 'notifications', notificationId), {
      [`readByUid.${uid}`]: true,
      [`readAtByUid.${uid}`]: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] notification mark read failed tenants/${tenantId}/notifications/${notificationId}: ${message}`);
    return { ok: false, error: message };
  }
};

export const fetchRecentTransactions = async (tenantId, limitCount = 10) => {
  try {
    const q = query(
      collection(db, 'tenants', tenantId, 'portalTransactions'),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    const rows = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
    return { ok: true, rows };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] recent transactions read failed: ${message}`);
    return { ok: false, error: message, rows: [] };
  }
};

export const fetchPortalTransactions = async (tenantId, portalId, startDate, endDate) => {
  try {
    const q = query(
      collection(db, 'tenants', tenantId, 'portalTransactions'),
      where('portalId', '==', portalId),
    );

    const snap = await getDocs(q);
    let rows = snap.docs
      .map(item => ({ id: item.id, ...item.data() }))
      .filter((item) => !item?.deletedAt);

    // Sort robustly even if some records do not have `date`.
    rows.sort((a, b) => {
      const aMillis = toDateMillis(a?.date || a?.createdAt || a?.updatedAt);
      const bMillis = toDateMillis(b?.date || b?.createdAt || b?.updatedAt);
      return bMillis - aMillis;
    });

    if (startDate) {
      const start = new Date(startDate).getTime();
      rows = rows.filter((r) => toDateMillis(r?.date || r?.createdAt || r?.updatedAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate).getTime();
      rows = rows.filter((r) => toDateMillis(r?.date || r?.createdAt || r?.updatedAt) <= end);
    }

    return { ok: true, rows };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] portal transactions read failed: ${message}`);
    return { ok: false, error: message, rows: [] };
  }
};

export const upsertTenantSyncEvent = async (tenantId, eventId, payload) => {
  try {
    await setDoc(doc(db, 'tenants', tenantId, 'syncEvents', eventId), {
      ...payload,
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] syncEvent upsert failed tenants/${tenantId}/syncEvents/${eventId}: ${message}`);
    return { ok: false, error: message };
  }
};

export const upsertTenantSettingDoc = async (tenantId, settingDocId, payload) => {
  try {
    await setDoc(
      doc(db, 'tenants', tenantId, 'settings', settingDocId),
      {
        ...payload,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return { ok: true };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] settings upsert failed tenants/${tenantId}/settings/${settingDocId}: ${message}`);
    return { ok: false, error: message };
  }
};

export const getTenantSettingDoc = async (tenantId, settingDocId) => {
  try {
    const snap = await getDoc(doc(db, 'tenants', tenantId, 'settings', settingDocId));
    return {
      ok: true,
      data: snap.exists() ? snap.data() : null,
    };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] settings read failed tenants/${tenantId}/settings/${settingDocId}: ${message}`);
    return { ok: false, error: message, data: null };
  }
};

export const fetchTenantPdfTemplates = async (tenantId) => {
  try {
    const snap = await getDocs(collection(db, 'tenants', tenantId, 'settings', 'pdfTemplates', 'templates'));
    const rows = snap.docs.map((item) => ({ documentType: item.id, ...item.data() }));
    const byType = rows.reduce((acc, row) => {
      acc[row.documentType] = row;
      return acc;
    }, {});
    return { ok: true, rows, byType };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] pdfTemplates read failed tenants/${tenantId}/settings/pdfTemplates/templates: ${message}`);
    return { ok: false, error: message, rows: [], byType: {} };
  }
};

export const upsertTenantPdfTemplate = async (tenantId, documentType, payload) => {
  try {
    const ref = toPdfTemplateDocRef(tenantId, documentType);
    await setDoc(
      ref,
      {
        ...payload,
        documentType: toSafePdfDocumentType(documentType),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return { ok: true };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] pdfTemplate upsert failed tenants/${tenantId}/settings/pdfTemplates/templates/${documentType}: ${message}`);
    return { ok: false, error: message };
  }
};

export const deleteTenantPdfTemplate = async (tenantId, documentType) => {
  try {
    const ref = toPdfTemplateDocRef(tenantId, documentType);
    await deleteDoc(ref);
    return { ok: true };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] pdfTemplate delete failed tenants/${tenantId}/settings/pdfTemplates/templates/${documentType}: ${message}`);
    return { ok: false, error: message };
  }
};

export const getTenantUserByUid = async (tenantId, uid) => {
  try {
    const snap = await getDoc(doc(db, 'tenants', tenantId, 'users', uid));
    return {
      ok: true,
      data: snap.exists() ? { uid: snap.id, ...snap.data() } : null,
    };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] user read failed tenants/${tenantId}/users/${uid}: ${message}`);
    return { ok: false, error: message, data: null };
  }
};

export const getTenantUserControlByUid = async (tenantId, uid) => {
  try {
    const snap = await getDoc(doc(db, 'tenants', tenantId, 'userControlPrefs', uid));
    return {
      ok: true,
      data: snap.exists() ? { uid: snap.id, ...snap.data() } : null,
    };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] userControl read failed tenants/${tenantId}/userControlPrefs/${uid}: ${message}`);
    return { ok: false, error: message, data: null };
  }
};

/**
 * Transaction Sequence Management
 * Stores counters in tenants/{tenantId}/settings/sequences
 */

export const getTransactionSequence = async (tenantId, typeKey) => {
  try {
    const snap = await getDoc(doc(db, 'tenants', tenantId, 'settings', 'sequences'));
    if (!snap.exists()) return 0;
    return snap.data()[typeKey] || 0;
  } catch (error) {
    console.warn(`[backendStore] failed to fetch sequence for ${typeKey}:`, error);
    return 0;
  }
};

export const incrementTransactionSequence = async (tenantId, typeKey) => {
  try {
    const ref = doc(db, 'tenants', tenantId, 'settings', 'sequences');
    const snap = await getDoc(ref);
    const current = (snap.exists() ? snap.data()[typeKey] : 0) || 0;
    const next = current + 1;
    await setDoc(ref, { [typeKey]: next, updatedAt: serverTimestamp() }, { merge: true });
    return next;
  } catch (error) {
    console.warn(`[backendStore] failed to increment sequence for ${typeKey}:`, error);
    return null;
  }
};

export const ensureTransactionSequenceStart = async (tenantId, typeKey, sequenceStart) => {
  try {
    const startValue = Number(sequenceStart);
    if (!Number.isFinite(startValue) || startValue <= 0) return;
    const ref = doc(db, 'tenants', tenantId, 'settings', 'sequences');
    const snap = await getDoc(ref);
    const current = (snap.exists() ? snap.data()[typeKey] : 0) || 0;
    if (current >= startValue) return;
    await setDoc(ref, { [typeKey]: startValue - 1, updatedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.warn(`[backendStore] failed to ensure sequence start for ${typeKey}:`, error);
  }
};

/**
 * Executes an internal transfer between two portals.
 * Records two transactions (debit/credit) and an optional expense transaction for any fee.
 */
export const executeInternalTransfer = async (tenantId, { fromPortalId, toPortalId, amount, fee, description, category, createdBy, displayTxId }) => {
  try {
    const transferAmount = Math.abs(Number(amount || 0));
    const transferFee = Math.max(0, Number(fee || 0));
    if (!fromPortalId || !toPortalId) {
      throw new Error('Source and destination portals are required.');
    }
    if (fromPortalId === toPortalId) {
      throw new Error('Source and destination portals must be different.');
    }
    if (!Number.isFinite(transferAmount) || transferAmount <= 0) {
      throw new Error('Transfer amount must be greater than zero.');
    }

    const portalRes = await fetchTenantPortals(tenantId);
    if (!portalRes.ok) throw new Error(portalRes.error || 'Failed to load portal balances.');
    const fromPortal = portalRes.rows.find((item) => item.id === fromPortalId);
    const toPortal = portalRes.rows.find((item) => item.id === toPortalId);
    if (!fromPortal || !toPortal) {
      throw new Error('Selected portal not found.');
    }
    const availableBalance = Number(fromPortal.balance || 0);
    if (availableBalance < transferAmount + transferFee) {
      throw new Error(`Insufficient funds in ${fromPortal.name || 'source portal'}.`);
    }

    const batchId = `trf_${Date.now()}`;
    const debitId = toSafeDocId(`${displayTxId}-D`, 'portal_tx');
    const creditId = toSafeDocId(`${displayTxId}-C`, 'portal_tx');

    // 1. Debit from Source
    const debitRes = await upsertTenantPortalTransaction(tenantId, debitId, {
      portalId: fromPortalId,
      displayTransactionId: displayTxId,
      amount: -transferAmount,
      type: 'Internal Transfer',
      category: category || 'Transfer',
      description: `Transfer to ${toPortalId}${description ? `: ${description}` : ''}`,
      date: new Date().toISOString(),
      transferTarget: toPortalId,
      batchId,
      createdBy,
    });
    if (!debitRes.ok) throw new Error(`Debit failed: ${debitRes.error}`);

    // 2. Credit to Destination
    const creditRes = await upsertTenantPortalTransaction(tenantId, creditId, {
      portalId: toPortalId,
      displayTransactionId: displayTxId,
      amount: transferAmount,
      type: 'Internal Transfer',
      category: category || 'Transfer',
      description: `Transfer from ${fromPortalId}${description ? `: ${description}` : ''}`,
      date: new Date().toISOString(),
      transferSource: fromPortalId,
      batchId,
      createdBy,
    });
    if (!creditRes.ok) throw new Error(`Credit failed: ${creditRes.error}`);

    // 3. Handle Fee (Operation Expense)
    if (transferFee > 0) {
      const feeId = toSafeDocId(`${displayTxId}-FEE`, 'portal_tx');
      const feeRes = await upsertTenantPortalTransaction(tenantId, feeId, {
        portalId: fromPortalId, // Fee is usually charged to the source
        displayTransactionId: `${displayTxId}-FEE`,
        amount: -transferFee,
        type: 'Operation Expenses',
        category: 'Transfer Fee',
        description: `Fee for transfer ${displayTxId} to ${toPortalId}`,
        date: new Date().toISOString(),
        batchId,
        createdBy,
      });
      if (!feeRes.ok) console.warn(`[backendStore] Transfer fee recording failed: ${feeRes.error}`);
    }

    return { ok: true, batchId };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] internal transfer failed: ${message}`);
    return { ok: false, error: message };
  }
};

/**
 * Executes a Loan Transaction (Disbursement or Repayment).
 * Records transaction for both Portal and Loan Person.
 */
export const executeLoanTransaction = async (tenantId, { personId, portalId, amount, type, description, displayTxId, createdBy }) => {
  try {
    const txnAmount = Math.abs(Number(amount || 0));
    if (!personId || !portalId) throw new Error('Loan person and portal are required.');
    if (!Number.isFinite(txnAmount) || txnAmount <= 0) throw new Error('Amount must be greater than zero.');

    if (type === 'disbursement') {
      const portalRes = await fetchTenantPortals(tenantId);
      if (!portalRes.ok) throw new Error(portalRes.error || 'Failed to load portal balances.');
      const sourcePortal = portalRes.rows.find((item) => item.id === portalId);
      if (!sourcePortal) throw new Error('Selected portal not found.');
      if (Number(sourcePortal.balance || 0) < txnAmount) {
        throw new Error(`Insufficient funds in ${sourcePortal.name || 'selected portal'}.`);
      }
    }

    const batchId = `loan_${Date.now()}`;
    const date = new Date().toISOString();
    const portalTxId = toSafeDocId(displayTxId, 'portal_tx');

    // 1. Record for Portal
    const portalTxRes = await upsertTenantPortalTransaction(tenantId, portalTxId, {
      portalId,
      displayTransactionId: displayTxId,
      amount: type === 'disbursement' ? -txnAmount : txnAmount,
      type: type === 'disbursement' ? 'Loan Disbursement' : 'Loan Repayment',
      description: `${type === 'disbursement' ? 'Loan to' : 'Repayment from'} ${personId}${description ? `: ${description}` : ''}`,
      date,
      entityId: personId,
      entityType: 'loanPerson',
      batchId,
      createdBy,
    });
    if (!portalTxRes.ok) throw new Error(`Portal entry failed: ${portalTxRes.error}`);

    // 2. Record for Loan Person (History)
    const personTxRes = await upsertTenantPortalTransaction(tenantId, toSafeDocId(`${displayTxId}-P`, 'portal_tx'), {
      personId,
      portalId,
      displayTransactionId: `${displayTxId}-P`,
      amount: txnAmount, // We keep the positive amount representing the loan/repayment value for the person
      type,   // 'disbursement' or 'repayment'
      affectsPortalBalance: false,
      date,
      batchId,
      createdBy,
    });
    if (!personTxRes.ok) throw new Error(`Person entry failed: ${personTxRes.error}`);

    return { ok: true, batchId };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] loan transaction failed: ${message}`);
    return { ok: false, error: message };
  }
};

/**
 * Recycle Bin Logic
 */

export const fetchDeletedEntities = async (tenantId, domain) => {
  try {
    const path = `tenants/${tenantId}/${domain}`;
    const q = query(collection(db, path), where('deletedAt', '!=', null));
    const snap = await getDocs(q);
    return { ok: true, rows: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) };
  } catch (error) {
    return { ok: false, error: toSafeError(error) };
  }
};

export const restoreEntity = async (tenantId, domain, entityId) => {
  try {
    const ref = doc(db, 'tenants', tenantId, domain, entityId);
    await updateDoc(ref, {
      deletedAt: deleteField(),
      deletedBy: deleteField(),
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toSafeError(error) };
  }
};

export const permanentlyDeleteEntity = async (tenantId, domain, entityId) => {
  try {
    const ref = doc(db, 'tenants', tenantId, domain, entityId);
    await deleteDoc(ref);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toSafeError(error) };
  }
};


export const generateDisplayClientId = async (tenantId, type) => {
  // type: 'company' | 'individual' | 'dependent'
  const isDependent = type === 'dependent';
  const sequenceKey = isDependent ? 'lastDependentSeq' : 'lastClientSeq';
  const ruleKey = isDependent ? 'DPID' : 'CLID';

  // Fetch customizable rules
  const settingsRes = await getTenantSettingDoc(tenantId, 'transactionIdRules');
  const rules = settingsRes.ok && settingsRes.data ? settingsRes.data[ruleKey] || {} : {};

  const prefix = rules.prefix || ruleKey;
  const padding = Number(rules.padding) || 4;

  const seq = await incrementClientSequence(tenantId, sequenceKey);
  return `${prefix}${String(seq).padStart(padding, '0')}`;
};

export const checkTradeLicenseDuplicate = async (tenantId, licenseNumber) => {
  const q = query(collection(db, 'tenants', tenantId, 'clients'), where('tradeLicenseNumber', '==', licenseNumber));
  const snap = await getDocs(q);
  return !snap.empty;
};

export const checkIndividualDuplicate = async (tenantId, identityInput) => {
  const rootClientsRef = collection(db, 'tenants', tenantId, 'clients');
  const dependentsRef = collectionGroup(db, 'dependents');

  if (typeof identityInput === 'string') {
    const [rootSnap, depSnap] = await Promise.all([
      getDocs(query(rootClientsRef, where('emiratesId', '==', identityInput))),
      getDocs(query(dependentsRef, where('tenantId', '==', tenantId))),
    ]);
    const depExists = depSnap.docs.some((item) => String(item.data()?.emiratesId || '') === String(identityInput));
    return !rootSnap.empty || depExists;
  }

  const method = String(identityInput?.method || 'emiratesId');
  const emiratesId = String(identityInput?.emiratesId || '').replace(/-/g, '').trim();
  const passportNumber = String(identityInput?.passportNumber || '').toUpperCase().trim();
  const fullName = String(identityInput?.fullName || '').toUpperCase().trim();

  if (method === 'emiratesId') {
    const [rootSnap, depSnap] = await Promise.all([
      getDocs(query(rootClientsRef, where('emiratesId', '==', emiratesId))),
      getDocs(query(dependentsRef, where('tenantId', '==', tenantId))),
    ]);
    const depExists = depSnap.docs.some((item) => String(item.data()?.emiratesId || '') === emiratesId);
    return !rootSnap.empty || depExists;
  }

  const [rootSnap, depSnap] = await Promise.all([
    getDocs(rootClientsRef),
    getDocs(query(dependentsRef, where('tenantId', '==', tenantId))),
  ]);
  const allDocs = [...rootSnap.docs, ...depSnap.docs];
  return allDocs.some((item) => {
    const data = item.data() || {};
    if (data.deletedAt) return false;
    const existingPassport = String(data.passportNumber || '').toUpperCase().trim();
    const existingName = String(data.fullName || '').toUpperCase().trim();
    return existingPassport === passportNumber && existingName === fullName;
  });
};
export const searchClients = async (tenantId, queryStr) => {
  try {
    const clientsRef = collection(db, 'tenants', tenantId, 'clients');
    const q = query(clientsRef, where('status', '==', 'active'));
    const snap = await getDocs(q);
    const results = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(c =>
        (c.fullName && c.fullName.toUpperCase().includes(queryStr.toUpperCase())) ||
        (c.tradeName && c.tradeName.toUpperCase().includes(queryStr.toUpperCase())) ||
        (c.emiratesId && c.emiratesId.includes(queryStr)) ||
        (c.tradeLicenseNumber && c.tradeLicenseNumber.includes(queryStr))
      );
    return { ok: true, rows: results.slice(0, 10) };
  } catch (error) {
    return { ok: false, error: toSafeError(error) };
  }
};

export const fetchTenantTransactions = async (tenantId) => {
  try {
    const snap = await getDocs(collection(db, 'tenants', tenantId, 'transactions'));
    const rows = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
    return { ok: true, rows };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] transactions read failed tenants/${tenantId}/transactions: ${message}`);
    return { ok: false, error: message, rows: [] };
  }
};

export const fetchTenantNotifications = async (tenantId) => {
  try {
    const snap = await getDocs(collection(db, 'tenants', tenantId, 'notifications'));
    const rows = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
    return { ok: true, rows };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] notifications read failed tenants/${tenantId}/notifications: ${message}`);
    return { ok: false, error: message, rows: [] };
  }
};

const toDateMillis = (value) => {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const addUserLookupEntry = (lookup, key, user) => {
  const normalized = String(key || '').trim();
  if (!normalized) return;
  if (!lookup[normalized]) lookup[normalized] = user;
  const lowered = normalized.toLowerCase();
  if (!lookup[lowered]) lookup[lowered] = user;
};

const findTenantUser = (lookup, item) => {
  const createdByUser = item?.createdByUser;
  const candidates = [
    item?.createdBy,
    item?.createdByUid,
    item?.createdByEmail,
    item?.createdByUserEmail,
    typeof createdByUser === 'string' ? createdByUser : '',
    createdByUser?.uid,
    createdByUser?.email,
  ];

  for (const candidate of candidates) {
    const normalized = String(candidate || '').trim();
    if (!normalized) continue;
    if (lookup[normalized]) return lookup[normalized];
    const lowered = normalized.toLowerCase();
    if (lookup[lowered]) return lookup[lowered];
  }

  return null;
};

export const fetchTenantClients = async (tenantId) => {
  try {
    const [clientsSnap, dependentSnap, usersRes] = await Promise.all([
      getDocs(collection(db, 'tenants', tenantId, 'clients')),
      getDocs(query(collectionGroup(db, 'dependents'), where('tenantId', '==', tenantId))),
      fetchTenantUsersMap(tenantId),
    ]);

    const usersByUid = {};
    const userLookup = {};
    if (usersRes.ok) {
      (usersRes.rows || []).forEach((item) => {
        if (!item?.uid) return;
        usersByUid[item.uid] = item;
        if (item.legacyUid && !usersByUid[item.legacyUid]) {
          usersByUid[item.legacyUid] = item;
        }
        // Also index by email to allow direct lookup if createdBy is an email
        if (item.email && !usersByUid[item.email]) {
          usersByUid[item.email] = item;
        }
        addUserLookupEntry(userLookup, item.uid, item);
        addUserLookupEntry(userLookup, item.legacyUid, item);
        addUserLookupEntry(userLookup, item.email, item);
      });
    }

    const rootRows = clientsSnap.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .filter((item) => !item.deletedAt && String(item.type || '').toLowerCase() !== 'dependent');

    const dependentRows = dependentSnap.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .filter((item) => !item.deletedAt);

    const rows = [...rootRows, ...dependentRows]
      .map((item) => {
        const resolvedUser = findTenantUser(userLookup, item);
        if (!resolvedUser) return item;

        return {
          ...item,
          createdByUser: {
            uid: resolvedUser.uid,
            displayName: resolvedUser.displayName || '',
            email: resolvedUser.email || '',
            photoURL: resolvedUser.photoURL || '/avatar.png',
            role: resolvedUser.role || '',
          },
          createdByDisplayName: resolvedUser.displayName || item.createdByDisplayName || resolvedUser.email || '',
          createdByEmail: item.createdByEmail || resolvedUser.email || '',
        };
      })
      .sort((a, b) => toDateMillis(b.createdAt) - toDateMillis(a.createdAt));

    return { ok: true, rows, usersByUid };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] clients read failed tenants/${tenantId}/clients: ${message}`);
    return { ok: false, error: message, rows: [], usersByUid: {} };
  }
};

export const updateTenantClient = async (tenantId, clientId, payload) => {
  try {
    const rootRef = doc(db, 'tenants', tenantId, 'clients', clientId);
    const rootSnap = await getDoc(rootRef);

    const immutableKeys = new Set([
      'displayClientId',
      'openingBalance',
      'balanceType',
      'type',
      'tenantId',
      'createdAt',
      'createdBy',
    ]);
    const safePayload = {};
    Object.entries(payload || {}).forEach(([key, value]) => {
      if (immutableKeys.has(key)) return;
      if (value === undefined) return;
      safePayload[key] = value;
    });

    if (rootSnap.exists()) {
      await setDoc(
        rootRef,
        {
          ...safePayload,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      return { ok: true };
    }

    const depSnap = await getDocs(query(collectionGroup(db, 'dependents'), where('tenantId', '==', tenantId)));
    const depDoc = depSnap.docs.find((item) => String(item.data()?.displayClientId || '') === String(clientId));
    if (!depDoc) {
      return { ok: false, error: 'Client record not found.' };
    }

    await setDoc(
      depDoc.ref,
      {
        ...safePayload,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return { ok: true };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] client update failed tenants/${tenantId}/clients/${clientId}: ${message}`);
    return { ok: false, error: message };
  }
};

export const deleteTenantClientCascade = async (tenantId, clientId, deletedBy) => {
  try {
    const clientRef = doc(db, 'tenants', tenantId, 'clients', clientId);
    const clientSnap = await getDoc(clientRef);
    if (!clientSnap.exists()) {
      const depSnap = await getDocs(query(collectionGroup(db, 'dependents'), where('tenantId', '==', tenantId)));
      const depDoc = depSnap.docs.find((item) => String(item.data()?.displayClientId || '') === String(clientId));
      if (!depDoc) return { ok: false, error: 'Client record not found.' };
      await deleteDoc(depDoc.ref);
      await setDoc(
        doc(db, 'tenants', tenantId, 'syncEvents', `se_client_delete_${clientId}_${Date.now()}`),
        {
          tenantId,
          entityId: clientId,
          entityType: 'dependent',
          eventType: 'delete',
          deletedBy: deletedBy || 'unknown',
          deletedDependents: 0,
          createdAt: serverTimestamp(),
          syncStatus: 'pending',
        },
      );
      return { ok: true, deletedDependents: 0 };
    }

    const clientData = clientSnap.data() || {};
    const clientType = String(clientData.type || '').toLowerCase();

    if (clientType !== 'dependent') {
      const openingBalance = Number(clientData.openingBalance || 0);
      if (Math.abs(openingBalance) > 0.0001) {
        return { ok: false, error: 'Client balance must be zero before deletion.' };
      }

      const txSnap = await getDocs(
        query(collection(db, 'tenants', tenantId, 'transactions'), where('clientId', '==', clientId)),
      );
      const txNet = txSnap.docs.reduce((sum, item) => {
        const data = item.data();
        if (data?.deletedAt) return sum;
        const amount = Number(data?.amount || 0);
        return Number.isFinite(amount) ? sum + amount : sum;
      }, 0);
      if (Math.abs(txNet) > 0.0001) {
        return { ok: false, error: 'Client has non-zero linked transactions. Settle balance before deletion.' };
      }
    }

    let deletedDependents = 0;
    if (clientType === 'dependent') {
      await deleteDoc(clientRef);
    } else {
      const dependentSnap = await getDocs(collection(db, 'tenants', tenantId, 'clients', clientId, 'dependents'));
      await Promise.all(dependentSnap.docs.map((item) => deleteDoc(item.ref)));
      deletedDependents = dependentSnap.docs.length;
      await deleteDoc(clientRef);
    }

    await setDoc(
      doc(db, 'tenants', tenantId, 'syncEvents', `se_client_delete_${clientId}_${Date.now()}`),
      {
        tenantId,
        entityId: clientId,
        entityType: 'client',
        eventType: 'delete',
        deletedBy: deletedBy || 'unknown',
        deletedDependents,
        createdAt: serverTimestamp(),
        syncStatus: 'pending',
      },
    );

    return { ok: true, deletedDependents };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] client delete failed tenants/${tenantId}/clients/${clientId}: ${message}`);
    return { ok: false, error: message };
  }
};

export const incrementClientSequence = async (tenantId, sequenceKey) => {
  const ref = doc(db, 'tenants', tenantId, 'counters', 'clients');
  await setDoc(ref, { [sequenceKey]: increment(1) }, { merge: true });
  const snap = await getDoc(ref);
  return snap.data()[sequenceKey];
};

export const upsertClient = async (tenantId, clientId, payload) => {
  try {
    const isNew = !clientId;
    const preferredId = payload?.displayClientId ? toSafeDocId(payload.displayClientId, 'client') : '';
    const finalId = clientId || preferredId || doc(collection(db, 'temp')).id;

    const clientRef = doc(db, 'tenants', tenantId, 'clients', finalId);
    await setDoc(clientRef, {
      ...payload,
      updatedAt: serverTimestamp(),
      ...(isNew ? { createdAt: serverTimestamp() } : {}),
    }, { merge: true });

    // Write Sync Event
    await setDoc(doc(db, 'tenants', tenantId, 'syncEvents', `se_client_${finalId}_${Date.now()}`), {
      tenantId,
      entityId: finalId,
      entityType: 'client',
      eventType: isNew ? 'create' : 'update',
      changedFields: Object.keys(payload),
      createdAt: serverTimestamp(),
      createdBy: payload.createdBy || 'unknown',
      syncStatus: 'pending'
    });

    return { ok: true, id: finalId };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] client upsert failed tenants/${tenantId}/clients/${clientId}: ${message}`);
    return { ok: false, error: message };
  }
};

export const upsertDependentUnderParent = async (
  tenantId,
  parentClientId,
  dependentId,
  payload,
) => {
  try {
    if (!tenantId || !parentClientId || !dependentId) {
      return { ok: false, error: 'Missing tenantId, parentClientId, or dependentId.' };
    }

    const dependentPayload = {
      ...payload,
      parentId: parentClientId,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    // Plan path: tenants/{tenantId}/clients/{parentClientId}/dependents/{dependentId}
    await setDoc(
      doc(db, 'tenants', tenantId, 'clients', parentClientId, 'dependents', dependentId),
      dependentPayload,
      { merge: true },
    );

    await setDoc(doc(db, 'tenants', tenantId, 'syncEvents', `se_dependent_${dependentId}_${Date.now()}`), {
      tenantId,
      entityId: dependentId,
      entityType: 'dependent',
      eventType: 'create',
      changedFields: Object.keys(payload || {}),
      createdAt: serverTimestamp(),
      createdBy: payload?.createdBy || 'unknown',
      syncStatus: 'pending',
    });

    return { ok: true, id: dependentId };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] dependent upsert failed tenants/${tenantId}/clients/${parentClientId}/dependents/${dependentId}: ${message}`);
    return { ok: false, error: message };
  }
};

export const requestPasswordReset = async (tenantId, email) => {
  try {
    // 1. Attempt standard Firebase Auth password reset if possible
    if (auth) {
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (authErr) {
        console.warn(`[backendStore] Firebase Native Auth reset failed:`, authErr.message);
      }
    }

    // 2. Fetch tenant mail config for SMTP fallback/notification
    const cfgRes = await fetchTenantMailConfig(tenantId);
    const cfg = cfgRes.ok && cfgRes.data ? cfgRes.data : {};

    const subject = 'Password Reset Request';
    const html = `
      <h3>Password Reset Requested</h3>
      <p>We've received a request to reset the password for ${email}.</p>
      <p>If you have Firebase Authentication enabled, you should also receive an official reset link from Google.</p>
      <p>If you don't use Firebase Auth, please contact your administrator to manually grant a new password.</p>
    `;

    const smtpSend = await trySendViaElectronSmtp({
      config: cfg,
      to: email,
      subject,
      html,
    });

    if (!smtpSend.ok && !smtpSend.skipped) {
      return { ok: false, error: smtpSend.error || 'Failed to dispatch email via SMTP.' };
    }

    if (smtpSend.skipped && !auth) {
      return { ok: false, error: 'Email service is unavailable in web version. Please use the Desktop app for password resets.' };
    }

    return { ok: true };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] Password reset request failed for ${email}: ${message}`);
    return { ok: false, error: message };
  }
};

/**
 * Sends a branded email with a PDF document attached.
 * Assumes Firebase Trigger Email extension is configured.
 */
export const sendTenantDocumentEmail = async (tenantId, email, documentType, pdfBase64, data) => {
  try {
    const cfgRes = await fetchTenantMailConfig(tenantId);
    const cfg = cfgRes.ok && cfgRes.data ? cfgRes.data : {};

    const tenantRef = doc(db, 'tenants', tenantId);
    const tenantSnap = await getDoc(tenantRef);
    const tenantName = tenantSnap.exists() ? tenantSnap.data().name : 'ACIS Platform';

    const cleanType = documentType.replace(/([A-Z])/g, ' $1').toLowerCase();
    const subject = `${tenantName} - Your ${cleanType}`;
    const html = `
      <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #444;">Hello,</h2>
        <p>Please find attached your <strong>${cleanType}</strong> for transaction <strong>${data.txId}</strong>.</p>
        <p>This document was generated and sent via <strong>${tenantName}</strong>.</p>
        <br/>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <footer style="font-size: 11px; color: #999;">
          This is an automated administrative message. Please do not reply directly to this email.
        </footer>
      </div>
    `;

    const attachments = [
      {
        filename: `${documentType}_${data.txId}.pdf`,
        content: pdfBase64,
        encoding: 'base64',
      }
    ];

    const smtpSend = await trySendViaElectronSmtp({
      config: cfg,
      to: email,
      subject,
      html,
      attachments
    });

    if (smtpSend.ok) return { ok: true };
    if (smtpSend.skipped) {
      return { ok: false, error: 'Email service (SMTP) is only available in the Desktop application.' };
    }
    return { ok: false, error: smtpSend.error || 'Failed to send document email.' };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] Email send failed for ${email}: ${message}`);
    return { ok: false, error: message };
  }
};

export const fetchTenantMailConfig = async (tenantId) => {
  return getTenantSettingDoc(tenantId, 'mailConfiguration');
};

export const upsertTenantMailConfig = async (tenantId, payload) => {
  return upsertTenantSettingDoc(tenantId, 'mailConfiguration', payload);
};

const applyTemplateTokens = (template, tokens) => {
  let output = String(template || '');
  Object.entries(tokens || {}).forEach(([key, value]) => {
    const token = `{{${key}}}`;
    output = output.split(token).join(String(value ?? ''));
  });
  return output;
};

const trySendViaElectronSmtp = async ({ config, to, subject, html, attachments }) => {
  try {
    if (typeof window === 'undefined') return { ok: false, skipped: true, reason: 'no_window' };
    const send = window?.electron?.mail?.send;
    if (typeof send !== 'function') return { ok: false, skipped: true, reason: 'not_electron' };

    const smtp = {
      host: config.smtpHost,
      port: config.smtpPort,
      user: config.smtpUser,
      pass: config.smtpPass,
      fromName: config.fromName,
      fromEmail: config.fromEmail,
      replyTo: config.replyTo,
    };

    const hasSmtp = smtp.host && smtp.port && smtp.user && smtp.pass;
    if (!hasSmtp) return { ok: false, skipped: true, reason: 'smtp_missing' };

    const res = await send({
      smtp,
      message: {
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        attachments,
      },
    });

    if (res?.ok) return { ok: true, skipped: false };
    return { ok: false, skipped: false, error: res?.error || 'SMTP send failed.' };
  } catch (error) {
    return { ok: false, skipped: false, error: toSafeError(error) };
  }
};

export const sendTenantWelcomeEmail = async (
  tenantId,
  { toEmail, clientName, clientType, displayClientId, forceSend = false },
) => {
  try {
    const cfgRes = await fetchTenantMailConfig(tenantId);
    const cfg = cfgRes.ok && cfgRes.data ? cfgRes.data : {};
    if (!forceSend && !cfg.enableWelcomeEmail) return { ok: true, skipped: true, reason: 'disabled' };

    const type = String(clientType || '').toLowerCase();
    if (!forceSend && type === 'company' && cfg.welcomeForCompany === false) {
      return { ok: true, skipped: true, reason: 'company_disabled' };
    }
    if (!forceSend && type === 'individual' && cfg.welcomeForIndividual === false) {
      return { ok: true, skipped: true, reason: 'individual_disabled' };
    }

    const email = String(toEmail || '').trim().toLowerCase();
    if (!email) return { ok: true, skipped: true, reason: 'missing_email' };

    const subjectTemplate = cfg.welcomeSubject || 'Welcome to {{tenantName}}';
    const htmlTemplate =
      cfg.welcomeHtml ||
      '<h3>Welcome {{clientName}}</h3><p>Your client ID is <strong>{{displayClientId}}</strong>.</p><p>Thank you for joining {{tenantName}}.</p>';

    const tenantSnap = await getDoc(doc(db, 'tenants', tenantId));
    const tenantName = tenantSnap.exists() ? tenantSnap.data().name || 'Our Organization' : 'Our Organization';

    const tokens = {
      tenantName,
      clientName: clientName || 'Client',
      clientType: clientType || 'client',
      displayClientId: displayClientId || '-',
      supportEmail: cfg.replyTo || cfg.fromEmail || '',
    };

    const subject = applyTemplateTokens(subjectTemplate, tokens);
    const html = applyTemplateTokens(htmlTemplate, tokens);

    const smtpSend = await trySendViaElectronSmtp({
      config: cfg,
      to: email,
      subject,
      html,
    });
    if (smtpSend.ok) return { ok: true, skipped: false, channel: 'smtp' };
    if (!smtpSend.skipped) return { ok: false, error: smtpSend.error || 'SMTP send failed.' };

    return { ok: false, skipped: true, error: 'Welcome email cannot be sent from web version. Use Desktop app.' };
  } catch (error) {
    const message = toSafeError(error);
    console.warn(`[backendStore] welcome email failed: ${message}`);
    return { ok: false, error: message };
  }
};
