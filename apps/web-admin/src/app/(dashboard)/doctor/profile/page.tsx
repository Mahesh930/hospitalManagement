"use client";

import { useState, useEffect } from "react";
import {
  doctorsApi,
  DoctorProfileDto
} from "@medicore/api";
import {
  UserCheck,
  Building,
  Phone,
  Mail,
  GraduationCap,
  Clock,
  Save,
  CheckCircle2,
  Calendar,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";

export default function DoctorProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<DoctorProfileDto | null>(null);

  // Form State
  const [specialization, setSpecialization] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [qualification, setQualification] = useState("");
  const [experienceYears, setExperienceYears] = useState<number | "">("");
  const [scheduleSummary, setScheduleSummary] = useState("");
  const [consultationFee, setConsultationFee] = useState<number | "">("");
  const [isAvailable, setIsAvailable] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await doctorsApi.getMyProfile();
      if (res.data?.data) {
        const p = res.data.data;
        setProfile(p);
        setSpecialization(p.specialization || "");
        setRoomNumber(p.roomNumber || "");
        setPhone(p.phone || "");
        setQualification(p.qualification || "");
        setExperienceYears(p.experienceYears || "");
        setScheduleSummary(p.scheduleSummary || "");
        setConsultationFee(p.consultationFee || "");
        setIsAvailable(p.isAvailable ?? true);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed to load doctor profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload: Partial<DoctorProfileDto> = {
        specialization,
        roomNumber,
        phone,
        qualification,
        experienceYears: experienceYears === "" ? undefined : Number(experienceYears),
        scheduleSummary,
        consultationFee: consultationFee === "" ? undefined : Number(consultationFee),
        isAvailable
      };

      const res = await doctorsApi.updateProfile(payload);
      if (res.data?.data) {
        setProfile(res.data.data);
      }
      toast.success("Doctor profile and schedule updated successfully");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading Doctor Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <div className="flex items-center gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <UserCheck className="w-7 h-7" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{profile?.name || "Doctor Profile"}</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isAvailable
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
              }`}
            >
              {isAvailable ? "Available / On Duty" : "On Leave / Off Duty"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Medical Reg: {profile?.registrationNumber || "NOT RECORDED"} • Email: {profile?.email}
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-primary" /> Professional Details &amp; Availability
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Medical Specialization</label>
            <input
              type="text"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="e.g. Senior Consultant Cardiologist"
              className="w-full px-3.5 py-2.5 bg-muted/30 border border-input rounded-xl text-sm font-semibold"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">OPD Consultation Room</label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g. OPD Room 204"
              className="w-full px-3.5 py-2.5 bg-muted/30 border border-input rounded-xl text-sm font-semibold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Direct Contact Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Qualifications / Degrees</label>
            <input
              type="text"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              placeholder="MBBS, MD, DM (Cardiology)"
              className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Experience (Years)</label>
            <input
              type="number"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="12"
              className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Consultation Fee (INR)</label>
            <input
              type="number"
              value={consultationFee}
              onChange={(e) => setConsultationFee(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="800"
              className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm font-bold font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Weekly Schedule Summary</label>
            <input
              type="text"
              value={scheduleSummary}
              onChange={(e) => setScheduleSummary(e.target.value)}
              placeholder="Mon-Fri: 09:00 - 15:00, Sat: 09:00 - 13:00"
              className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm"
            />
          </div>
        </div>

        <div className="p-4 bg-muted/20 border border-border rounded-xl flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-foreground block">Duty Availability Status</span>
            <span className="text-xs text-muted-foreground">
              Toggle to appear active or paused in the hospital reception queue assignment.
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-sm hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Changes..." : "Save Professional Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
