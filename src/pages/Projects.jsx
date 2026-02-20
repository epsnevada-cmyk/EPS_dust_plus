import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FolderOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ProjectCard from "../components/projects/ProjectCard";
import ProjectFormDialog from "../components/projects/ProjectFormDialog";

export default function Projects() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-created_date"),
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ["all-inspections"],
    queryFn: () => base44.entities.DailyInspection.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const getInspectionCount = (projectId) =>
    inspections.filter((i) => i.project_id === projectId).length;

  const filtered = projects.filter((p) =>
    p.project_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Projects</h1>
          <p className="text-sm text-stone-500 mt-1">Manage your dust control inspection jobs</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[var(--brand)] hover:bg-[var(--brand-light)] gap-2">
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white border-stone-200"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-600">No projects yet</h3>
          <p className="text-sm text-stone-400 mt-1">Create your first project to start inspections</p>
          <Button onClick={() => setShowForm(true)} className="mt-4 bg-[var(--brand)] hover:bg-[var(--brand-light)] gap-2">
            <Plus className="w-4 h-4" /> Create Project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              inspectionCount={getInspectionCount(project.id)}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      <ProjectFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={(data) => createMutation.mutateAsync(data)}
      />
    </div>
  );
}