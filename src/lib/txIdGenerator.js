import { getTenantSettingDoc, incrementTransactionSequence, getTransactionSequence, ensureTransactionSequenceStart } from './backendStore';
export { toSafeDocId } from './idUtils';

/**
 * Generates a display transaction ID based on tenant customization.
 * @param {string} tenantId
 * @param {string} type - 'POR' | 'EXP' | 'LON' | 'LOAN' | 'TRF'
 * @returns {Promise<string>} - The formatted display ID.
 */
export const generateDisplayTxId = async (tenantId, type) => {
    // 1. Fetch tenant customization settings
    const settingsRes = await getTenantSettingDoc(tenantId, 'transactionIdRules');
    const rules = settingsRes.ok && settingsRes.data ? settingsRes.data[type] || {} : {};

    // 2. Determine sequence key and increment
    const seqKey = `last${type}Seq`;
    const sequenceStart = Number(rules.sequenceStart);
    if (Number.isFinite(sequenceStart) && sequenceStart > 0) {
        const current = await getTransactionSequence(tenantId, seqKey);
        if (current < sequenceStart) {
            await ensureTransactionSequenceStart(tenantId, seqKey, sequenceStart);
        }
    }
    const seq = await incrementTransactionSequence(tenantId, seqKey);

    // 3. Fallback defaults if no rules exist
    const prefix = rules.prefix || type;
    const skipDate = rules.skipDate === true;
    const padding = Number(rules.padding) || 4;

    // 4. Format Date (DDMMYYYY)
    let datePart = '';
    if (!skipDate) {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        datePart = `${y}${m}${d}`;
    }

    // 5. Format Sequence with padding
    const seqPart = String(seq).padStart(padding, '0');

    // 6. Assemble
    // For LOAN, the default format is "LOAN0001" (no date/hyphen)
    if (type === 'LOAN') {
        return `${prefix}${seqPart}`;
    }

    // Others use Hyphens by default: POR-DDMMYYYY-0001
    const parts = [prefix];
    if (datePart) parts.push(datePart);
    parts.push(seqPart);

    return parts.join('');
};
