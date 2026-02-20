import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { FolderOpen, ClipboardList, Plus, Calendar, ArrowRight, FileText } from "lucide-react";

export default function Dashboard() {
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-created_date"),
  });

  const { data: inspections = [], isLoading: loadingInspections } = useQuery({
    queryKey: ["inspections"],
    queryFn: () => base44.entities.DailyInspection.list("-date", 10),
  });

  const activeProjects = projects.filter((p) => p.status === "active");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">EPS Dust+</h1>
        <p className="text-stone-500 mt-1">Dust Control Inspection Dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={FolderOpen}
          label="Active Projects"
          value={loadingProjects ? "—" : activeProjects.length}
          color="bg-emerald-500"
        />
        <StatCard
          icon={ClipboardList}
          label="Total Inspections"
          value={loadingInspections ? "—" : inspections.length}
          color="bg-[var(--brand)]"
        />
        <StatCard
          icon={Calendar}
          label="Last Inspection"
          value={
            loadingInspections || inspections.length === 0
              ? "—"
              : inspections[0]?.date
              ? format(new Date(inspections[0].date), "MMM d")
              : "—"
          }
          color="bg-[var(--accent)]"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link to={createPageUrl("DailyInspectionForm")}>
          <Card className="group cursor-pointer hover:shadow-md transition-all border-stone-200 hover:border-[var(--accent)]">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand)] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900">New Inspection</h3>
                <p className="text-sm text-stone-500">Start a daily dust control record</p>
              </div>
              <ArrowRight className="w-5 h-5 text-stone-300 ml-auto group-hover:text-[var(--brand)] transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl("Projects")}>
          <Card className="group cursor-pointer hover:shadow-md transition-all border-stone-200 hover:border-[var(--accent)]">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--accent)] flex items-center justify-center group-hover:scale-105 transition-transform">
                <FolderOpen className="w-6 h-6 text-[var(--brand)]" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900">Manage Projects</h3>
                <p className="text-sm text-stone-500">View and create job projects</p>
              </div>
              <ArrowRight className="w-5 h-5 text-stone-300 ml-auto group-hover:text-[var(--brand)] transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Inspections */}
      <Card className="border-stone-200">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Recent Inspections</CardTitle>
          <Link to={createPageUrl("Inspections")}>
            <Button variant="ghost" size="sm" className="text-xs text-stone-500">
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loadingInspections ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : inspections.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-8">No inspections yet</p>
          ) : (
            <div className="space-y-2">
              {inspections.slice(0, 5).map((insp) => (
                <Link key={insp.id} to={createPageUrl("InspectionView") + `?id=${insp.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-[var(--brand)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">{insp.project_name || "—"}</p>
                      <p className="text-xs text-stone-400">
                        {insp.date ? format(new Date(insp.date), "MMM d, yyyy") : "—"}
                        {insp.completed_by && ` · ${insp.completed_by}`}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card className="border-stone-200 overflow-hidden">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-stone-900 mt-0.5">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}