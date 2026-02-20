import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ArrowLeft, Pencil, Printer } from "lucide-react";

export default function InspectionView() {
  const urlParams = new URLSearchParams(window.location.search);
  const inspectionId = urlParams.get("id");

  const { data: inspections, isLoading: loadingInsp } = useQuery({
    queryKey: ["inspection-view", inspectionId],
    queryFn: () => base44.entities.DailyInspection.filter({ id: inspectionId }),
    enabled: !!inspectionId,
  });

  const { data: entries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ["entries-view", inspectionId],
    queryFn: () => base44.entities.InspectionEntry.filter({ daily_inspection_id: inspectionId }),
    enabled: !!inspectionId,
  });

  const inspection = inspections?.[0];

  if (loadingInsp || loadingEntries) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="text-center py-20">
        <p className="text-stone-500">Inspection not found</p>
        <Link to={createPageUrl("Inspections")}><Button className="mt-4">Back to Inspections</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("Inspections") + `?projectId=${inspection.project_id}`}>
            <Button variant="ghost" size="icon" className="text-stone-500">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Inspection Record</h1>
            <p className="text-sm text-stone-500">{inspection.project_name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 text-sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print
          </Button>
          <Link to={createPageUrl("DailyInspectionForm") + `?inspectionId=${inspection.id}`}>
            <Button className="gap-2 text-sm bg-[var(--brand)] hover:bg-[var(--brand-light)]">
              <Pencil className="w-4 h-4" /> Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Header Info */}
      <Card className="mb-4 border-stone-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[var(--brand)]">
            Dust Control Monitor Record of Daily Dust Control Inspections and Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-stone-400 text-xs mb-1">Project Name</p>
              <p className="font-medium text-stone-800">{inspection.project_name || "—"}</p>
            </div>
            <div>
              <p className="text-stone-400 text-xs mb-1">Date</p>
              <p className="font-medium text-stone-800">
                {inspection.date ? format(new Date(inspection.date), "MMM d, yyyy") : "—"}
              </p>
            </div>
            <div>
              <p className="text-stone-400 text-xs mb-1">Dust Permit #</p>
              <p className="font-medium text-stone-800">{inspection.dust_permit_number || "—"}</p>
            </div>
            <div>
              <p className="text-stone-400 text-xs mb-1">Completed By</p>
              <p className="font-medium text-stone-800">{inspection.completed_by || "—"}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-stone-100">
            <InfoBadge label="Dust Sign Posted" value={inspection.dust_sign_posted} />
            <InfoBadge label="Dust Permit On Site" value={inspection.dust_permit_on_site} />
            <InfoBadge label="Trucks Running" value={inspection.soil_import_export_trucks_running} />
          </div>
        </CardContent>
      </Card>

      {/* Entries Table */}
      <Card className="border-stone-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Inspection Entries ({entries.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-y border-stone-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500">Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500">Temp/Wind</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500">Soil</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500">Dust</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500">Trackout</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500">Curbs</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500">Device</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500">Notes</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-stone-400">No entries recorded</td></tr>
                ) : (
                  entries.map((entry, i) => (
                    <tr key={entry.id || i} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="px-4 py-3 font-medium">{entry.time || "—"}</td>
                      <td className="px-4 py-3 text-stone-600">{entry.temp_wind_speed_dir || "—"}</td>
                      <td className="px-4 py-3"><MiniChip value={entry.soil_condition} /></td>
                      <td className="px-4 py-3"><MiniChip value={entry.dust_emissions} /></td>
                      <td className="px-4 py-3"><MiniChip value={entry.trackout_on_street} /></td>
                      <td className="px-4 py-3"><MiniChip value={entry.curbs_and_sidewalks} /></td>
                      <td className="px-4 py-3"><MiniChip value={entry.trackout_control_device_effective} /></td>
                      <td className="px-4 py-3 text-stone-600 max-w-[200px] truncate">{entry.notes_action_taken || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-stone-400 mt-6 text-center">
        This record must be maintained onsite for 1 year or, in the Permittee's files for 6 months beyond project completion and made available for inspection to Air Quality staff.
      </p>
    </div>
  );
}

function InfoBadge({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center gap-2 bg-stone-50 rounded-lg px-3 py-1.5 border border-stone-100">
      <span className="text-xs text-stone-400">{label}:</span>
      <span className="text-xs font-semibold text-stone-700">{value}</span>
    </div>
  );
}

function MiniChip({ value }) {
  if (!value) return <span className="text-stone-300">—</span>;
  
  const colorMap = {
    None: "bg-green-50 text-green-700",
    Clean: "bg-green-50 text-green-700",
    Yes: "bg-green-50 text-green-700",
    "N/A": "bg-stone-100 text-stone-500",
    Slight: "bg-yellow-50 text-yellow-700",
    Light: "bg-yellow-50 text-yellow-700",
    "Light Dust": "bg-yellow-50 text-yellow-700",
    Damp: "bg-blue-50 text-blue-700",
    Wet: "bg-blue-50 text-blue-700",
    Moderate: "bg-orange-50 text-orange-700",
    "Moderate Dust": "bg-orange-50 text-orange-700",
    Heavy: "bg-red-50 text-red-700",
    "Heavy Dust": "bg-red-50 text-red-700",
    Excessive: "bg-red-100 text-red-800",
    No: "bg-red-50 text-red-700",
    "Needs Maintenance": "bg-amber-50 text-amber-700",
  };

  return (
    <Badge variant="secondary" className={`text-xs font-medium ${colorMap[value] || "bg-stone-100 text-stone-600"}`}>
      {value}
    </Badge>
  );
}