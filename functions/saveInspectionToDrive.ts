import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

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
        doc.text('Record daily inspection results and corrective measures for dust control below:', leftCol, y);

        y += 8;
        doc.text(`Daily:   Dust Sign Posted: ${inspection.dust_sign_posted || '______'}`, leftCol, y);
        doc.text(`Dust Permit Onsite: ${inspection.dust_permit_on_site || '______'}`, leftCol + 65, y);
        doc.text(`Soil Import/Export Trucks Running: ${inspection.soil_import_export_trucks_running || '____'}`, leftCol + 120, y);

        // Table - matching original form structure
        y += 10;
        
        // Draw table border
        const tableX = 15;
        const tableY = y;
        const tableWidth = 180;
        
        // Table headers with borders
        doc.setFillColor(245, 245, 245);
        doc.rect(tableX, tableY, tableWidth, 10, 'FD');
        
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        
        const colWidths = [18, 28, 20, 20, 22, 22, 28, 42];
        let xPos = tableX;
        
        const headers = ['Time', 'Temp, Wind Speed & Dir.', 'Soil Condition', 'Dust Emissions', 'Trackout on Street', 'Curbs & Sidewalks', 'Trackout Control Device Effective', 'Notes, Action Taken'];
        
        headers.forEach((header, i) => {
            const centerX = xPos + colWidths[i] / 2;
            doc.text(header, centerX, tableY + 5.5, { maxWidth: colWidths[i] - 2, align: 'center' });
            xPos += colWidths[i];
        });

        // Draw vertical lines for headers
        xPos = tableX;
        colWidths.forEach(width => {
            doc.line(xPos, tableY, xPos, tableY + 10);
            xPos += width;
        });
        doc.line(tableX + tableWidth, tableY, tableX + tableWidth, tableY + 10);

        // Table rows
        doc.setFont(undefined, 'normal');
        y = tableY + 10;

        const rowHeight = 12;
        const maxRows = 14; // Space for about 14 rows

        for (let i = 0; i < Math.max(entries.length, maxRows); i++) {
            const entry = entries[i] || {};
            
            if (y > 270) {
                doc.addPage();
                y = 20;
            }

            // Draw row borders
            doc.rect(tableX, y, tableWidth, rowHeight);
            
            // Draw cell content
            xPos = tableX + 2;
            doc.setFontSize(7);
            
            // Convert time to 12-hour format
            let displayTime = '';
            if (entry.time) {
                const [hours, minutes] = entry.time.split(':');
                const hour = parseInt(hours);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                displayTime = `${hour12}:${minutes} ${ampm}`;
            }
            
            const values = [
                displayTime,
                entry.temp_wind_speed_dir || '',
                entry.soil_condition || '',
                entry.dust_emissions || '',
                entry.trackout_on_street || '',
                entry.curbs_and_sidewalks || '',
                entry.trackout_control_device_effective || '',
                entry.notes_action_taken || ''
            ];
            
            values.forEach((val, idx) => {
                if (val) {
                    doc.text(val, xPos + 1, y + 7, { maxWidth: colWidths[idx] - 4 });
                }
                // Draw vertical lines
                doc.line(xPos - 2, y, xPos - 2, y + rowHeight);
                xPos += colWidths[idx];
            });
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
        const fileName = `Inspection_${inspection.project_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unnamed'}_${inspection.date || 'NoDate'}.pdf`;
        
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

        // Send emails if emails are configured
        const emailPromises = [];
        
        if (project?.superintendent_email) {
            try {
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: project.superintendent_email,
                    subject: `Dust Control Inspection - ${inspection.project_name} - ${inspection.date}`,
                    body: `
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
                        <p>The full inspection report has been saved to Google Drive.</p>
                    `
                });
                emailPromises.push('superintendent');
            } catch (emailError) {
                // Email failed but don't block the main operation
                console.log('Failed to send superintendent email:', emailError.message);
            }
        }
        
        if (project?.inspector_email) {
            try {
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: project.inspector_email,
                    subject: `Your Inspection Copy - ${inspection.project_name} - ${inspection.date}`,
                    body: `
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
                        <p>Your inspection has been saved to Google Drive for records.</p>
                    `
                });
                emailPromises.push('inspector');
            } catch (emailError) {
                // Email failed but don't block the main operation
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