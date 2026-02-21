import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';
import { Resend } from 'npm:resend@4.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        const { inspectionId } = await req.json();

        if (!inspectionId) {
            return Response.json({ error: 'inspectionId is required' }, { status: 400 });
        }

        // Get settings
        const settings = await base44.asServiceRole.entities.AppSettings.filter({ setting_key: 'app_settings' });
        let folderId = settings[0]?.google_drive_folder_id;

        if (!folderId) {
            return Response.json({ error: 'Google Drive folder not configured. Please set it in Settings.' }, { status: 400 });
        }

        // Extract folder ID from URL if full URL was provided
        if (folderId.includes('drive.google.com')) {
            const match = folderId.match(/folders\/([a-zA-Z0-9_-]+)/);
            if (match) {
                folderId = match[1];
            }
        }
        // Remove any query parameters
        folderId = folderId.split('?')[0];

        // Get inspection data
        const inspections = await base44.asServiceRole.entities.DailyInspection.filter({ id: inspectionId });
        const inspection = inspections[0];

        if (!inspection) {
            return Response.json({ error: 'Inspection not found' }, { status: 404 });
        }

        const entries = await base44.asServiceRole.entities.InspectionEntry.filter({ daily_inspection_id: inspectionId });

        // Get project for emails
        const projects = await base44.asServiceRole.entities.Project.filter({ id: inspection.project_id });
        const project = projects[0];

        // Generate PDF - matching the original form layout
        const doc = new jsPDF();
        
        // Title - centered and bold
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('DUST CONTROL MONITOR RECORD OF DAILY DUST CONTROL INSPECTIONS AND ACTIONS', 105, 15, { align: 'center' });

        // Header information - mimicking the form
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        const leftCol = 20;
        const rightCol = 115;
        let y = 30;
        
        doc.text(`Project Name: ${inspection.project_name || '___________________________'}`, leftCol, y);
        doc.text(`Date: ${inspection.date || '_______________'}`, rightCol, y);
        
        y += 8;
        doc.text(`Dust Permit Number: ${inspection.dust_permit_number || '_______________'}`, leftCol, y);
        doc.text(`Completed By: ${inspection.completed_by || '___________________________'}`, rightCol, y);

        y += 10;
        doc.setFontSize(9);

        y += 8;
        doc.text('Record daily inspection results and corrective measures for dust control below:', leftCol, y);

        // --- SUMMARY BOX (Permit & Truck Info) ---
        y += 10;
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');

        // Draw a subtle border box for the summary
        doc.setDrawColor(200, 200, 200);
        doc.rect(15, y, 180, 25);

        // Fill data from the inspection record
        doc.text(`Dust Permit Onsite: ${inspection.dust_permit_on_site || 'No'}`, 20, y + 8);
        doc.text(`Dust Sign Posted: ${inspection.dust_sign_posted || 'Yes'}`, 20, y + 16);
        doc.text(`Soil Import/Export Trucks Running: ${inspection.soil_import_export_trucks_running || '0'}`, 100, y + 8);
        doc.text(`Project: ${inspection.project_name || 'N/A'}`, 100, y + 16);

        y += 35; // Move Y down to start the table
        
        // --- TABLE CONFIGURATION ---
        const colWidths = [18, 28, 20, 20, 22, 22, 28, 42];
        const tableWidth = colWidths.reduce((a, b) => a + b, 0);
        const tableX = 15;

        // --- DRAW HEADERS ---
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        const headers = ["Time", "Temp/Wind", "Soil Cond.", "Dust Emis.", "Trackout", "Curbs/Swalk", "Control Eff.", "Notes/Action"];

        let headX = tableX;
        let headHeight = 10;

        doc.setFillColor(240, 240, 240); // Grey header background
        doc.rect(tableX, y, tableWidth, headHeight, 'F');
        doc.rect(tableX, y, tableWidth, headHeight);

        for (let i = 0; i < headers.length; i++) {
            doc.line(headX, y, headX, y + headHeight);
            doc.text(headers[i], headX + 2, y + 6.5);
            headX += colWidths[i];
        }
        doc.line(tableX + tableWidth, y, tableX + tableWidth, y + headHeight);
        y += headHeight;

        // --- DRAW ROWS ---
        doc.setFont(undefined, 'normal');
        const entryCount = Math.max(entries.length, 8); // Ensures at least 8 rows show up

        for (let i = 0; i < entryCount; i++) {
            const entry = entries[i] || {};
            if (y > 260) { doc.addPage(); y = 20; }

            doc.setFontSize(7);
            
            // Time Formatting
            let displayTime = '';
            if (entry.time) {
                const timeParts = String(entry.time).split(':');
                const hour = parseInt(timeParts[0]);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour % 12 || 12;
                displayTime = `${hour12}:${timeParts[1] || '00'} ${ampm}`;
            }
            
            // Column Mapping
            const values = [
                displayTime,
                entry.temp_wind_speed_dir || '',
                entry.soil_condition || '',
                entry.dust_emissions || '',
                entry.trackout_on_street || '',
                entry.curbs_and_sidewalks || '',
                entry.trackout_control_device_effective || '',
                entry.notes_action_taken || entry.notes || ''
            ];
            
            // Wrap Text & Calculate Height
            let maxLines = 1;
            const wrappedCells = values.map((val, idx) => {
                const lines = doc.splitTextToSize(String(val), colWidths[idx] - 4);
                maxLines = Math.max(maxLines, lines.length);
                return lines;
            });
            
            const lineHeight = 3.5;
            const rowHeight = Math.max(12, (maxLines * lineHeight) + 6);
            
            // Draw Row and Content
            doc.rect(tableX, y, tableWidth, rowHeight);
            let cellX = tableX;

            for (let idx = 0; idx < colWidths.length; idx++) {
                doc.line(cellX, y, cellX, y + rowHeight);
                const lines = wrappedCells[idx];
                if (lines) {
                    const totalTextHeight = lines.length * lineHeight;
                    let textY = y + ((rowHeight - totalTextHeight) / 2) + 2.5;
                    lines.forEach(line => {
                        if (textY < (y + rowHeight - 1)) {
                            doc.text(line, cellX + 2, textY);
                            textY += lineHeight;
                        }
                    });
                }
                cellX += colWidths[idx];
            }
            doc.line(tableX + tableWidth, y, tableX + tableWidth, y + rowHeight);
            y += rowHeight;
        }

        // Footer text
        doc.setFontSize(7);
        doc.setFont(undefined, 'italic');
        const footerY = 280;
        doc.text('This record must be maintained onsite for 1 year or, in the Permittee\'s files for 6 months beyond project completion', 20, footerY);
        doc.text('and made available for inspection to Air Quality staff.', 20, footerY + 4);
        
        doc.text(`Page __ of __`, 105, footerY + 10, { align: 'center' });

        const pdfBytes = doc.output('arraybuffer');
        const pdfBlob = new Uint8Array(pdfBytes);

        // Get Google Drive access token
        const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');

        // Upload to Google Drive
        const fileName = `${inspection.project_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unnamed'}_Dust_Inspection_${inspection.date || 'NoDate'}.pdf`;
        
        const metadata = {
            name: fileName,
            mimeType: 'application/pdf',
            parents: [folderId]
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([pdfBlob], { type: 'application/pdf' }));

        const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            body: form
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            return Response.json({ error: `Google Drive upload failed: ${errorText}` }, { status: 500 });
        }

        const result = await uploadResponse.json();

        // Send emails via Resend if configured with PDF attachment
        const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
        const emailPromises = [];
        
        // Convert PDF to base64 for attachment
        const pdfBase64 = btoa(String.fromCharCode(...pdfBlob));
        
        if (project?.superintendent_email) {
            try {
                await resend.emails.send({
                    from: 'EPS Dust+ <reports@contact.epsnv.com>',
                    to: project.superintendent_email,
                    subject: `Dust Control Inspection - ${inspection.project_name} - ${inspection.date}`,
                    html: `
                        <h2>Daily Dust Control Inspection Report</h2>
                        <p><strong>Project:</strong> ${inspection.project_name}</p>
                        <p><strong>Date:</strong> ${inspection.date}</p>
                        <p><strong>Completed By:</strong> ${inspection.completed_by || 'N/A'}</p>
                        <p><strong>Dust Permit #:</strong> ${inspection.dust_permit_number || 'N/A'}</p>
                        <hr>
                        <p><strong>Summary:</strong></p>
                        <ul>
                            <li>Dust Sign Posted: ${inspection.dust_sign_posted || 'N/A'}</li>
                            <li>Dust Permit On Site: ${inspection.dust_permit_on_site || 'N/A'}</li>
                            <li>Trucks Running: ${inspection.soil_import_export_trucks_running || 'N/A'}</li>
                            <li>Inspection Entries: ${entries.length}</li>
                        </ul>
                        <p>Please see the attached PDF for the complete inspection report.</p>
                    `,
                    attachments: [{
                        filename: fileName,
                        content: pdfBase64
                    }]
                });
                emailPromises.push('superintendent');
            } catch (emailError) {
                console.log('Failed to send superintendent email:', emailError.message);
            }
        }
        
        if (project?.inspector_email) {
            try {
                await resend.emails.send({
                    from: 'EPS Dust+ <reports@contact.epsnv.com>',
                    to: project.inspector_email,
                    subject: `Your Inspection Copy - ${inspection.project_name} - ${inspection.date}`,
                    html: `
                        <h2>Your Daily Dust Control Inspection Copy</h2>
                        <p><strong>Project:</strong> ${inspection.project_name}</p>
                        <p><strong>Date:</strong> ${inspection.date}</p>
                        <p><strong>Completed By:</strong> ${inspection.completed_by || 'N/A'}</p>
                        <hr>
                        <p><strong>Inspection Summary:</strong></p>
                        <ul>
                            <li>Dust Sign Posted: ${inspection.dust_sign_posted || 'N/A'}</li>
                            <li>Dust Permit On Site: ${inspection.dust_permit_on_site || 'N/A'}</li>
                            <li>Trucks Running: ${inspection.soil_import_export_trucks_running || 'N/A'}</li>
                            <li>Total Entries: ${entries.length}</li>
                        </ul>
                        <p>Please see the attached PDF for your complete inspection report.</p>
                    `,
                    attachments: [{
                        filename: fileName,
                        content: pdfBase64
                    }]
                });
                emailPromises.push('inspector');
            } catch (emailError) {
                console.log('Failed to send inspector email:', emailError.message);
            }
        }

        return Response.json({
            success: true,
            fileId: result.id,
            fileName: fileName,
            emailsSent: emailPromises.length,
            message: `Inspection saved to Google Drive${emailPromises.length > 0 ? ' and emails sent' : ''}`
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});