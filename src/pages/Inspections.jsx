import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Plus, Calendar, User, FileText, Eye, Trash2, ClipboardList } from "lucide-react";

export default function Inspections() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectIdParam = urlParams.get("projectId");

  const [filterProjectId, setFilterProjectId] = useState(projectIdParam || "all");
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-created_date"),
  });

  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ["inspections"],
    queryFn: () => base44.entities.DailyInspection.list("-date"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const entries = await base44.entities.InspectionEntry.filter({ daily_inspection_id: id });
      for (const entry of entries) {
        await base44.entities.InspectionEntry.delete(entry.id);
      }
      await base44.entities.DailyInspection.delete(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inspections"] }),
  });

  const filtered = filterProjectId === "all"
    ? inspections
    : inspections.filter((i) => i.project_id === filterProjectId);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Inspections</h1>
          <p className="text-sm text-stone-500 mt-1">Daily dust control inspection records</p>
        </div>
        <Link to={createPageUrl("DailyInspectionForm") + (filterProjectId !== "all" ? `?projectId=${filterProjectId}` : "")}>
          <Button className="bg-[#FD700] hover:bg-[#FFB700] text-black font-semibold gap-2">
            <Plus className="w-4 h-4" /> New Inspection
          </Button>
        </Link>
      </div>

      {/* Project Filter */}
      <div className="mb-6">
        <Select value={filterProjectId} onValueChange={setFilterProjectId}>
          <SelectTrigger className="w-full sm:w-72 bg-white border-stone-200">
            <SelectValue placeholder="Filter by project..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-600">No inspections found</h3>
          <p className="text-sm text-stone-400 mt-1">Create your first daily inspection</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((inspection) => (
            <Card key={inspection.id} className="hover:shadow-md transition-all border-stone-200">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-[var(--brand)] shrink-0" />
                      <h3 className="font-semibold text-stone-900 truncate">{inspection.project_name || "Unnamed"}</h3>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {inspection.date ? format(new Date(inspection.date), "MMM d, yyyy") : "—"}
                      </span>
                      {inspection.completed_by && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {inspection.completed_by}
                        </span>
                      )}
                      {inspection.dust_permit_number && (
                        <span>Permit #{inspection.dust_permit_number}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {inspection.dust_sign_posted && (
                        <Badge variant="outline" className="text-xs">
                          Sign: {inspection.dust_sign_posted}
                        </Badge>
                      )}
                      {inspection.dust_permit_on_site && (
                        <Badge variant="outline" className="text-xs">
                          Permit On Site: {inspection.dust_permit_on_site}
                        </Badge>
                      )}
                      {inspection.soil_import_export_trucks_running && (
                        <Badge variant="outline" className="text-xs">
                          Trucks: {inspection.soil_import_export_trucks_running}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link to={createPageUrl("InspectionView") + `?id=${inspection.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-500 hover:text-black">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link to={createPageUrl("DailyInspectionForm") + `?inspectionId=${inspection.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-500 hover:text-black">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-stone-400 hover:text-red-500"
                      onClick={() => deleteMutation.mutate(inspection.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}