import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const EMIRATE_CODES = {
    'Dubai': 'DUB',
    'Abu Dhabi': 'AUH',
    'Sharjah': 'SHJ',
    'Ajman': 'AJM',
    'Umm Al Quwain': 'UAQ',
    'Ras Al Khaimah': 'RAK',
    'Fujairah': 'FUJ'
};

/**
 * Generates a unique Tenant UID based on user rules.
 * Format: [EmirateCode][DDMMYY][HHMMSS][LicenseNumber]
 */
const generateTenantUID = (emirate, licenseNumber) => {
    const code = EMIRATE_CODES[emirate] || 'UAE';

    // Get current date and time in local timezone
    const now = new Date();

    // Format DDMMYY
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);

    // Format HHMMSS
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    // Clean license number (remove spaces, special chars)
    const cleanLicense = String(licenseNumber).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    return `${code}${dd}${mm}${yy}${hh}${min}${ss}${cleanLicense}`;
};

/**
 * Registers a new tenant in Firestore
 * @param {Object} tenantData 
 */
export const registerNewTenant = async (tenantData) => {
    try {
        const uid = generateTenantUID(tenantData.emirate, tenantData.licenseNumber);

        const payload = {
            id: uid, // Store the generated ID inside the document too
            ...tenantData,
            status: 'Active',
            createdAt: serverTimestamp(),
            // Ensure array or specific structures if needed later
        };

        const docRef = doc(db, 'tenants', uid);
        await setDoc(docRef, payload);

        return { success: true, uid };
    } catch (error) {
        console.error("Error registering tenant:", error);
        throw error;
    }
};
