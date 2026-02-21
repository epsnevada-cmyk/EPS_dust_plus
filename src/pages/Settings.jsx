import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, ExternalLink, Info, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const queryClient = useQueryClient();
  const [folderId, setFolderId] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => base44.entities.AppSettings.filter({ setting_key: "app_settings" }),
  });

  useEffect(() => {
    if (settings[0]?.google_drive_folder_id) {
      setFolderId(settings[0].google_drive_folder_id);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings[0]) {
        await base44.entities.AppSettings.update(settings[0].id, {
          google_drive_folder_id: folderId,
          setting_key: "app_settings",
        });
      } else {
        await base44.entities.AppSettings.create({
          google_drive_folder_id: folderId,
          setting_key: "app_settings",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved!");
    } catch (error) {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Settings</h1>
        <p className="text-sm text-stone-500 mt-1">Configure Google Drive integration</p>
      </div>

      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.71 3.5L1.15 15l3.89 6.73 6.56-11.5L7.71 3.5zm7.73 11.5l-3.89 6.73L19.17 21l3.54-6.13-7.27-12.59L11.44 15zm.63-11.5L12.18 9l3.89 6.73L19.96 9l-3.89-6.73z"/>
              </svg>
            </div>
            Google Drive Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              PDFs of your inspections will be automatically saved to the specified Google Drive folder when you create or update an inspection.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="folder_id">Google Drive Folder ID</Label>
            <Input
              id="folder_id"
              placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-stone-500 flex items-start gap-2 mt-2">
              <Info className="w-3 h-3 mt-0.5 shrink-0" />
              <span>
                To find your folder ID: Open the folder in Google Drive, copy the ID from the URL after <code className="bg-stone-100 px-1 rounded">/folders/</code>
                <br />
                Example URL: drive.google.com/drive/folders/<strong>1a2b3c4d5e6f7g8h9i0j</strong>
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[var(--brand)] hover:bg-[var(--brand-light)] gap-2"
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Settings
                </>
              )}
            </Button>
            {folderId && (
              <a
                href={`https://drive.google.com/drive/folders/${folderId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Open Folder <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {settings[0] && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-800">
                Google Drive is connected and configured
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}