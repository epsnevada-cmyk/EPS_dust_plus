import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function ProjectFormDialog({ open, onOpenChange, onSubmit }) {
  const [form, setForm] = useState({
    project_name: "",
    dust_permit_number: "",
    completed_by: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit({ ...form, status: "active" });
    setSaving(false);
    setForm({ project_name: "", dust_permit_number: "", completed_by: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[var(--brand)]">New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="project_name">Project Name *</Label>
            <Input
              id="project_name"
              placeholder="e.g. Highway 95 Expansion"
              value={form.project_name}
              onChange={(e) => setForm({ ...form, project_name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dust_permit_number">Dust Permit Number</Label>
            <Input
              id="dust_permit_number"
              placeholder="e.g. DP-2026-0123"
              value={form.dust_permit_number}
              onChange={(e) => setForm({ ...form, dust_permit_number: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="completed_by">Completed By</Label>
            <Input
              id="completed_by"
              placeholder="Inspector name"
              value={form.completed_by}
              onChange={(e) => setForm({ ...form, completed_by: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-[var(--brand)] hover:bg-[var(--brand-light)]">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}