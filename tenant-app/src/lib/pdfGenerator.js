import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { resolvePdfTemplateForRenderer } from './pdfTemplateRenderer';
import { fetchTenantPdfTemplates, getTenantSettingDoc } from './backendStore';

/**
 * Centered PDF generation utility.
 */
export const generateTenantPdf = async ({
    tenantId,
    documentType,
    data, // { txId, date, amount, recipientName, description, items: [] }
    save = true,
    returnBase64 = false,
    filename,
}) => {
    try {
        // 1. Fetch active template
        const templatesRes = await fetchTenantPdfTemplates(tenantId);
        if (!templatesRes.ok) throw new Error('Failed to fetch templates.');

        const { template } = resolvePdfTemplateForRenderer({
            documentType,
            templateDoc: templatesRes.byType[documentType],
        });

        // 1.5 Fetch Branding Settings to get Header/Footer logos
        const brandRes = await getTenantSettingDoc(tenantId, 'branding');
        const branding = brandRes.ok && brandRes.data ? brandRes.data : {};
        const logoLibrary = Array.isArray(branding.logoLibrary) ? branding.logoLibrary : [];
        const logoUsage = branding.logoUsage || {};
        
        const headerLogoSlot = logoLibrary.find(s => s.slotId === logoUsage.header);
        const footerLogoSlot = logoLibrary.find(s => s.slotId === logoUsage.footer);
        const docLogoSlot = logoLibrary.find(s => s.slotId === logoUsage[documentType]);
        
        const headerImageUrl = headerLogoSlot?.url;
        const footerImageUrl = footerLogoSlot?.url;
        const docLogoUrl = docLogoSlot?.url || template.logoUrl;

        // 2. Initialize jsPDF
        const format = template.paperSize === 'A4' ? 'a4' : 'letter';
        const doc = new jsPDF({
            orientation: template.orientation,
            unit: 'pt',
            format,
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margins = template.margins;

        // 3. Helper: Colors
        const applyColor = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return [r, g, b];
        };

        // 4. Background
        doc.setFillColor(...applyColor(template.backgroundColor));
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        if (template.backgroundType === 'gradient') {
            // Basic gradient simulation for jspdf (horizontal for now)
            const start = applyColor(template.gradientStart);
            const end = applyColor(template.gradientEnd);
            const steps = 50;
            const rectHeight = pageHeight / steps;
            for (let i = 0; i < steps; i++) {
                const r = Math.round(start[0] + (end[0] - start[0]) * (i / steps));
                const g = Math.round(start[1] + (end[1] - start[1]) * (i / steps));
                const b = Math.round(start[2] + (end[2] - start[2]) * (i / steps));
                doc.setFillColor(r, g, b);
                doc.rect(0, i * rectHeight, pageWidth, rectHeight + 1, 'F');
            }
        }

        // 5. Header Section
        let cursorY = margins.top;

        // Header
        const headerHeight = 100;
        
        if (headerImageUrl) {
            try {
                // Render custom header image spanning the width
                doc.addImage(headerImageUrl, 'PNG', margins.left, 20, pageWidth - margins.left - margins.right, headerHeight - 20, undefined, 'FAST');
            } catch (e) {
                console.warn('Header Image failed to load:', e);
            }
        } else {
            // Fallback Header Background
            doc.setFillColor(...applyColor(template.headerBackground));
            doc.rect(0, 0, pageWidth, headerHeight, 'F');

            // Fallback Logo
            if (docLogoUrl) {
                try {
                    doc.addImage(docLogoUrl, 'PNG', 40, 20, 60, 60, undefined, 'FAST');
                } catch (e) {
                    console.warn('Logo failed to load:', e);
                }
            }

            // Fallback Header Text
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text(template.titleText || 'DOCUMENT', pageWidth - margins.right, 45, { align: 'right' });

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const headerLines = doc.splitTextToSize(template.headerText || '', 200);
            doc.text(headerLines, pageWidth - margins.right, 65, { align: 'right' });
        }

        cursorY = headerHeight + margins.top;

        // 6. Content Body
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`TX ID: ${data.txId || 'N/A'}`, margins.left, cursorY);
        doc.text(`Date: ${data.date || new Date().toLocaleDateString()}`, pageWidth - margins.right, cursorY, { align: 'right' });

        cursorY += 40;

        doc.setFontSize(16);
        doc.text(`Recipient: ${data.recipientName || 'Valued Client'}`, margins.left, cursorY);

        cursorY += 30;

        // Description/Items Table
        const tableData = data.items?.length > 0
            ? data.items.map(i => [i.name, i.qty, i.price, i.total])
            : [[data.description || 'Transaction details', '1', data.amount, data.amount]];

        autoTable(doc, {
            startY: cursorY,
            head: [['Description', 'Qty', 'Unit Price', 'Total']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: applyColor(template.accentColor), textColor: [255, 255, 255] },
            margin: { left: margins.left, right: margins.right },
            styles: { fontSize: 10, cellPadding: template.rowPadding / 2 },
        });

        cursorY = (doc.lastAutoTable?.finalY || cursorY) + 30;

        // Summary
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total Amount: AED ${data.amount}`, pageWidth - margins.right, cursorY, { align: 'right' });

        // QR Code Placeholder
        if (template.qrEnabled) {
            cursorY += 20;
            doc.setDrawColor(...applyColor(template.accentColor));
            doc.rect(pageWidth - margins.right - 80, cursorY, 80, 80);
            doc.setFontSize(8);
            doc.text('SCAN QR', pageWidth - margins.right - 40, cursorY + 45, { align: 'center' });
        }

        // 7. Footer
        const footerY = pageHeight - margins.bottom;
        
        if (footerImageUrl) {
             try {
                 // Render custom footer image spanning the width
                 doc.addImage(footerImageUrl, 'PNG', margins.left, footerY - 40, pageWidth - margins.left - margins.right, 50, undefined, 'FAST');
             } catch (e) {
                 console.warn('Footer Image failed to load:', e);
             }
        } else {
            doc.setFontSize(9);
            doc.setTextColor(120, 120, 120);
            
            const footerLines = doc.splitTextToSize(template.footerText || '', pageWidth - margins.left - margins.right);
            doc.text(footerLines, pageWidth / 2, footerY - 15, { align: 'center' });

            if (template.footerLink) {
                doc.setTextColor(...applyColor(template.accentColor));
                doc.text(template.footerLink, pageWidth / 2, footerY, { align: 'center' });
            }
        }

        // 8. Output
        if (save) {
            doc.save(filename || `${documentType}_${data.txId || Date.now()}.pdf`);
        }

        if (returnBase64) {
            // Remove 'data:application/pdf;filename=generated.pdf;base64,' prefix if present
            const fullUri = doc.output('datauristring');
            const base64 = fullUri.split(',')[1];
            return { ok: true, doc, base64 };
        }

        return { ok: true, doc };
    } catch (error) {
        console.error('PDF Generation failed:', error);
        return { ok: false, error: error.message };
    }
};
