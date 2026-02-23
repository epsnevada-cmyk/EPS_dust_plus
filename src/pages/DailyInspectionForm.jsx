import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import DailyHeader from "../components/inspection/DailyHeader";
import EntryRow from "../components/inspection/EntryRow";

export default function DailyInspectionForm() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectIdParam = urlParams.get("projectId");
  const inspectionIdParam = urlParams.get("inspectionId");

  const queryClient = useQueryClient();

  const [selectedProjectId, setSelectedProjectId] = useState(projectIdParam || "");
  const [dailyForm, setDailyForm] = useState({
    date: new Date().toISOString().split("T")[0],
    completed_by: "",
    dust_sign_posted: "",
    dust_permit_on_site: "",
    trucks_running: "",
    trucks_running_count: null,
  });
  const [entries, setEntries] = useState([createBlankEntry()]);
  const [saving, setSaving] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-created_date"),
  });

  // Load existing inspection if editing
  const { data: existingInspection } = useQuery({
    queryKey: ["inspection", inspectionIdParam],
    queryFn: () => base44.entities.DailyInspection.filter({ id: inspectionIdParam }),
    enabled: !!inspectionIdParam,
  });

  const { data: existingEntries } = useQuery({
    queryKey: ["entries", inspectionIdParam],
    queryFn: () => base44.entities.InspectionEntry.filter({ daily_inspection_id: inspectionIdParam }),
    enabled: !!inspectionIdParam,
  });

  useEffect(() => {
    if (existingInspection?.[0]) {
      const insp = existingInspection[0];
      setSelectedProjectId(insp.project_id);
      setDailyForm({
        date: insp.date || "",
        completed_by: insp.completed_by || "",
        dust_sign_posted: insp.dust_sign_posted || "",
        dust_permit_on_site: insp.dust_permit_on_site || "",
        trucks_running: insp.trucks_running || "",
        trucks_running_count: insp.trucks_running_count,
      });
    }
  }, [existingInspection]);

  useEffect(() => {
    if (existingEntries?.length > 0) {
      setEntries(existingEntries.map((e) => ({
        id: e.id,
        time: e.time || "",
        temp_wind_speed_dir: e.temp_wind_speed_dir || "",
        soil_condition: e.soil_condition || "",
        dust_emissions: e.dust_emissions || "",
        trackout_on_street: e.trackout_on_street || "",
        curbs_and_sidewalks: e.curbs_and_sidewalks || "",
        trackout_control_device_effective: e.trackout_control_device_effective || "",
        notes_action_taken: e.notes_action_taken || "",
      })));
    }
  }, [existingEntries]);

  // Pre-fill from project
  useEffect(() => {
    if (selectedProjectId && projects.length > 0) {
      const project = projects.find((p) => p.id === selectedProjectId);
      if (project && !inspectionIdParam) {
        setDailyForm((prev) => ({
          ...prev,
          completed_by: prev.completed_by || project.completed_by || "",
        }));
      }
    }
  }, [selectedProjectId, projects, inspectionIdParam]);

  function createBlankEntry() {
    return {
      time: "",
      temp_wind_speed_dir: "",
      soil_condition: "",
      dust_emissions: "",
      trackout_on_street: "",
      curbs_and_sidewalks: "",
      trackout_control_device_effective: "",
      notes_action_taken: "",
    };
  }

  const addEntry = () => setEntries([...entries, createBlankEntry()]);

  const updateEntry = (index, updated) => {
    const copy = [...entries];
    copy[index] = updated;
    setEntries(copy);
  };

  const deleteEntry = (index) => {
    if (entries.length === 1) return;
    setEntries(entries.filter((_, i) => i !== index));
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const handleSave = async () => {
    if (!selectedProjectId) {
      toast.error("Please select a project");
      return;
    }
    if (!dailyForm.date) {
      toast.error("Please enter a date");
      return;
    }

    setSaving(true);

    const inspectionData = {
      project_id: selectedProjectId,
      project_name: selectedProject?.project_name || "",
      dust_permit_number: selectedProject?.dust_permit_number || "",
      ...dailyForm,
    };

    let inspectionId = inspectionIdParam;

    if (inspectionIdParam) {
      await base44.entities.DailyInspection.update(inspectionIdParam, inspectionData);
      // Delete old entries
      if (existingEntries) {
        for (const entry of existingEntries) {
          await base44.entities.InspectionEntry.delete(entry.id);
        }
      }
    } else {
      const created = await base44.entities.DailyInspection.create(inspectionData);
      inspectionId = created.id;
    }

    // Create entries
    const entryRecords = entries
      .filter((e) => e.time)
      .map((e) => ({
        daily_inspection_id: inspectionId,
        time: e.time,
        temp_wind_speed_dir: e.temp_wind_speed_dir,
        soil_condition: e.soil_condition,
        dust_emissions: e.dust_emissions,
        trackout_on_street: e.trackout_on_street,
        curbs_and_sidewalks: e.curbs_and_sidewalks,
        trackout_control_device_effective: e.trackout_control_device_effective,
        notes_action_taken: e.notes_action_taken,
      }));

    if (entryRecords.length > 0) {
      await base44.entities.InspectionEntry.bulkCreate(entryRecords);
    }

    queryClient.invalidateQueries({ queryKey: ["inspections"] });
    queryClient.invalidateQueries({ queryKey: ["all-inspections"] });
    
    // Save to Google Drive
    try {
      await base44.functions.invoke('saveInspectionToDrive', { inspectionId });
      toast.success("Inspection saved and uploaded to Google Drive!");
    } catch (driveError) {
      toast.success("Inspection saved! (Google Drive upload failed - check settings)");
    }
    
    setSaving(false);
    window.location.href = createPageUrl("Inspections") + `?projectId=${selectedProjectId}`;
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl("Projects")}>
          <Button variant="ghost" size="icon" className="text-stone-500">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            {inspectionIdParam ? "Edit Inspection" : "New Daily Inspection"}
          </h1>
          <p className="text-sm text-stone-500">Dust Control Monitor Record</p>
        </div>
      </div>

      {/* Project Selector */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 sm:p-6 mb-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Project *</Label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select a project..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedProject && (
            <div className="space-y-2">
              <Label>Dust Permit Number</Label>
              <div className="h-10 flex items-center px-3 bg-stone-50 rounded-lg border border-stone-200 text-sm text-stone-700">
                {selectedProject.dust_permit_number || "—"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Daily Details */}
      <div className="mb-4">
        <DailyHeader form={dailyForm} setForm={setDailyForm} />
      </div>

      {/* Inspection Entries */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">Inspection Entries</h2>
          <Button variant="outline" onClick={addEntry} className="gap-2 text-sm border-stone-300">
            <Plus className="w-4 h-4" /> Add Entry
          </Button>
        </div>
        {entries.map((entry, i) => (
          <EntryRow key={i} entry={entry} index={i} onChange={updateEntry} onDelete={deleteEntry} />
        ))}
      </div>

      {/* Save */}
      <div className="flex justify-end gap-3 pb-8">
        <Link to={createPageUrl("Projects")}>
          <Button variant="outline" className="border-stone-300">Cancel</Button>
        </Link>
        <Button onClick={handleSave} disabled={saving} className="bg-[#FD700] hover:bg-[#FFB700] text-black font-semibold gap-2 px-8">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Inspection
        </Button>
      </div>
    </div>
  );
}