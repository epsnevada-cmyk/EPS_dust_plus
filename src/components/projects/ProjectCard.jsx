import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderOpen, FileText, ChevronRight, Trash2, FileCheck } from "lucide-react";

export default function ProjectCard({ project, inspectionCount, onDelete, plansFolderId }) {
  return (
    <Card className="group hover:shadow-md transition-all duration-300 border-stone-200 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-stretch">
          <div className="w-1.5 bg-black group-hover:bg-[#FD700] transition-colors" />
          <div className="flex-1 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FolderOpen className="w-4 h-4 text-black shrink-0" />
                  <h3 className="font-semibold text-stone-900 truncate">{project.project_name}</h3>
                </div>
                {project.dust_permit_number && (
                  <p className="text-xs text-stone-500 ml-6">Permit #{project.dust_permit_number}</p>
                )}
                {project.completed_by && (
                  <p className="text-xs text-stone-500 ml-6 mt-0.5">By: {project.completed_by}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="secondary" className="text-xs bg-stone-100 text-stone-600">
                  <FileText className="w-3 h-3 mr-1" />
                  {inspectionCount} inspections
                </Badge>
                <Badge className={`text-xs ${project.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'}`}>
                  {project.status || 'active'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Link to={createPageUrl("DailyInspectionForm") + `?projectId=${project.id}`} className="flex-1">
                <Button className="w-full bg-[#FD700] hover:bg-[#FFB700] text-black font-semibold text-sm gap-2">
                  <FileText className="w-4 h-4" />
                  New Inspection
                </Button>
              </Link>
              <Link to={createPageUrl("Inspections") + `?projectId=${project.id}`}>
                <Button variant="outline" className="text-sm gap-1 border-stone-300">
                  View <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
              {plansFolderId && (
                <a href={`https://drive.google.com/drive/folders/${plansFolderId}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="text-xs gap-1 border-[#FD700] text-black hover:bg-[#FD700] hover:text-black">
                    <FileCheck className="w-3 h-3" />
                    Plans
                  </Button>
                </a>
              )}
              <Button variant="ghost" size="icon" className="text-stone-400 hover:text-red-500" onClick={() => onDelete(project.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}