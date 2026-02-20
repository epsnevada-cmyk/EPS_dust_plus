import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DailyHeader({ form, setForm }) {
  const truckOptions = Array.from({ length: 25 }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 sm:p-6 space-y-5">
      <h2 className="text-lg font-semibold text-stone-900">Daily Details</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date *</Label>
          <Input
            type="date"
            value={form.date || ""}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Completed By</Label>
          <Input
            placeholder="Inspector name"
            value={form.completed_by || ""}
            onChange={(e) => setForm({ ...form, completed_by: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Dust Sign Posted</Label>
          <Select value={form.dust_sign_posted || ""} onValueChange={(v) => setForm({ ...form, dust_sign_posted: v })}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Dust Permit On Site</Label>
          <Select value={form.dust_permit_on_site || ""} onValueChange={(v) => setForm({ ...form, dust_permit_on_site: v })}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Soil Import/Export Trucks Running</Label>
          <Select
            value={form.soil_import_export_trucks_running?.toString() || ""}
            onValueChange={(v) => setForm({ ...form, soil_import_export_trucks_running: parseInt(v) })}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select #..." />
            </SelectTrigger>
            <SelectContent>
              {truckOptions.map((n) => (
                <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}