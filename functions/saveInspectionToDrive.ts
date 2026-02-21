import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { inspectionId } = await req.json();

        if (!inspectionId) {
            return Response.json({ error: 'inspectionId is required' }, { status: 400 });
        }

        // Get settings
        const settings = await base44.asServiceRole.entities.AppSettings.filter({ setting_key: 'app_settings' });
        const folderId = settings[0]?.google_drive_folder_id;

        if (!folderId) {
            return Response.json({ error: 'Google Drive folder not configured. Please set it in Settings.' }, { status: 400 });
        }

        // Get inspection data
        const inspections = await base44.asServiceRole.entities.DailyInspection.filter({ id: inspectionId });
        const inspection = inspections[0];

        if (!inspection) {
            return Response.json({ error: 'Inspection not found' }, { status: 404 });
        }

        const entries = await base44.asServiceRole.entities.InspectionEntry.filter({ daily_inspection_id: inspectionId });

        // Generate PDF
        const doc = new jsPDF();
        
        // Title
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('DUST CONTROL MONITOR RECORD', 105, 15, { align: 'center' });
        doc.text('OF DAILY DUST CONTROL INSPECTIONS AND ACTIONS', 105, 22, { align: 'center' });

        // Header info
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        doc.text(`Project Name: ${inspection.project_name || '—'}`, 20, 35);
        doc.text(`Date: ${inspection.date || '—'}`, 135, 35);
        doc.text(`Dust Permit Number: ${inspection.dust_permit_number || '—'}`, 20, 42);
        doc.text(`Completed By: ${inspection.completed_by || '—'}`, 135, 42);

        // Daily section
        doc.setFontSize(9);
        doc.text(`Daily: Dust Sign Posted: ${inspection.dust_sign_posted || '—'}`, 20, 52);
        doc.text(`Dust Permit Onsite: ${inspection.dust_permit_on_site || '—'}`, 85, 52);
        doc.text(`Soil Import/Export Trucks Running: ${inspection.soil_import_export_trucks_running || '—'}`, 145, 52);

        // Table headers
        let y = 65;
        doc.setFillColor(240, 240, 240);
        doc.rect(15, y - 5, 180, 8, 'F');
        
        doc.setFont(undefined, 'bold');
        doc.setFontSize(8);
        doc.text('Time', 18, y);
        doc.text('Temp/Wind', 35, y);
        doc.text('Soil', 60, y);
        doc.text('Dust', 78, y);
        doc.text('Track', 95, y);
        doc.text('Curbs', 112, y);
        doc.text('Device', 130, y);
        doc.text('Notes', 155, y);

        // Table rows
        doc.setFont(undefined, 'normal');
        y += 8;

        for (const entry of entries) {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }

            doc.setFontSize(7);
            doc.text(entry.time || '—', 18, y);
            doc.text((entry.temp_wind_speed_dir || '—').substring(0, 12), 35, y);
            doc.text((entry.soil_condition || '—').substring(0, 8), 60, y);
            doc.text((entry.dust_emissions || '—').substring(0, 8), 78, y);
            doc.text((entry.trackout_on_street || '—').substring(0, 8), 95, y);
            doc.text((entry.curbs_and_sidewalks || '—').substring(0, 10), 112, y);
            doc.text((entry.trackout_control_device_effective || '—').substring(0, 8), 130, y);
            
            const notes = (entry.notes_action_taken || '—').substring(0, 30);
            doc.text(notes, 155, y);
            
            y += 7;
        }

        // Footer
        doc.setFontSize(7);
        doc.text('This record must be maintained onsite for 1 year or, in the Permittee\'s files for 6 months', 20, 285);
        doc.text('beyond project completion and made available for inspection to Air Quality staff.', 20, 290);

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

        return Response.json({
            success: true,
            fileId: result.id,
            fileName: fileName,
            message: 'Inspection saved to Google Drive'
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});