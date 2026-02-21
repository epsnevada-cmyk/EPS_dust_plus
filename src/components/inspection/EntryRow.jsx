import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const SOIL_CONDITIONS = ["Dry", "Damp", "Wet", "Muddy", "Frozen", "Crusted"];
const DUST_EMISSIONS = ["None", "Slight", "Moderate", "Heavy", "Excessive"];
const TRACKOUT_STREET = ["None", "Light", "Moderate", "Heavy"];
const CURBS_SIDEWALKS = ["Clean", "Light Dust", "Moderate Dust", "Heavy Dust"];
const DEVICE_EFFECTIVE = ["Yes", "No", "N/A", "Needs Maintenance"];

export default function EntryRow({ entry, onChange, onDelete, index }) {
  const update = (field, value) => {
    onChange(index, { ...entry, [field]: value });
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-black">Entry #{index + 1}</span>
        <Button variant="ghost" size="icon" className="text-stone-400 hover:text-red-500 h-8 w-8" onClick={() => onDelete(index)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-500">Time *</label>
          <Input type="time" value={entry.time || ""} onChange={(e) => update("time", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-500">Temp, Wind Speed & Dir.</label>
          <Input placeholder="e.g. 85°F, 10 mph NW" value={entry.temp_wind_speed_dir || ""} onChange={(e) => update("temp_wind_speed_dir", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <DropdownField label="Soil Condition" value={entry.soil_condition} options={SOIL_CONDITIONS} onChange={(v) => update("soil_condition", v)} />
        <DropdownField label="Dust Emissions" value={entry.dust_emissions} options={DUST_EMISSIONS} onChange={(v) => update("dust_emissions", v)} />
        <DropdownField label="Trackout on Street" value={entry.trackout_on_street} options={TRACKOUT_STREET} onChange={(v) => update("trackout_on_street", v)} />
        <DropdownField label="Curbs & Sidewalks" value={entry.curbs_and_sidewalks} options={CURBS_SIDEWALKS} onChange={(v) => update("curbs_and_sidewalks", v)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DropdownField label="Trackout Control Device Effective" value={entry.trackout_control_device_effective} options={DEVICE_EFFECTIVE} onChange={(v) => update("trackout_control_device_effective", v)} />
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-500">Notes, Action Taken</label>
          <Textarea
            placeholder="Enter notes..."
            value={entry.notes_action_taken || ""}
            onChange={(e) => update("notes_action_taken", e.target.value)}
            className="min-h-[60px] resize-none"
          />
        </div>
      </div>
    </div>
  );
}

function DropdownField({ label, value, options, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-stone-500">{label}</label>
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger className="bg-white text-xs h-9">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}