"use client";

/**
 * Register Patient Page Component for MediCore ERP.
 * 
 * Features & UI Alignment:
 * 1. Synchronized with Backend PatientDto and Patient JPA Entity.
 * 2. Captures Demographics: Full Name, Mobile Phone, Email, Date of Birth, Age, Gender, Blood Group, ABHA ID.
 * 3. Clinical Allergy Protocol: Allows recording multiple drug allergies with Severity and Reaction descriptions.
 * 4. Submits payload to POST /patients endpoint, retrieves generated UHID, and navigates to Patient Profile.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { patientsApi, PatientDto, AllergyDto } from "@medicore/api";
import { toast } from "sonner";
import { User, Phone, Mail, Calendar, ShieldAlert, Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RegisterPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Patient Demographic Fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("MALE");
  const [age, setAge] = useState<number | "">("");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [abhaId, setAbhaId] = useState("");

  // Clinical Allergy Items
  const [allergies, setAllergies] = useState<AllergyDto[]>([]);
  const [newAllergen, setNewAllergen] = useState("");
  const [newSeverity, setNewSeverity] = useState("HIGH");
  const [newReaction, setNewReaction] = useState("");

  const addAllergyItem = () => {
    if (!newAllergen.trim()) {
      toast.error("Please specify allergen name (e.g. Penicillin)");
      return;
    }
    setAllergies([...allergies, { allergen: newAllergen, severity: newSeverity, reaction: newReaction }]);
    setNewAllergen("");
    setNewReaction("");
  };

  const removeAllergyItem = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      toast.error("Patient Name and Mobile Number are required");
      return;
    }

    setLoading(true);
    try {
      const payload: PatientDto = {
        name,
        phone,
        email: email || undefined,
        birthDate: birthDate || undefined,
        gender,
        age: age ? Number(age) : undefined,
        bloodGroup,
        abhaId: abhaId || undefined,
        allergies,
      };

      const res = await patientsApi.register(payload);
      toast.success(`Patient Registered Successfully! UHID: ${res.data.data?.uhid || "Generated"}`);
      router.push(`/patients/${res.data.data?.id}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error?.response?.data?.error?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/patients"
          className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Patient Registration</h1>
          <p className="text-sm text-muted-foreground">Register patient &amp; record clinical demographics and allergy warnings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-foreground border-b border-border pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Demographics &amp; Personal Info
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3.5 py-2.5 bg-muted/30 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                Mobile Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-muted/30 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                Email Address (Optional)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. patient@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-muted/30 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                Date of Birth (Optional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-muted/30 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                Age (Years)
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 35"
                className="w-full px-3.5 py-2.5 bg-muted/30 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-muted/30 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                Blood Group
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-muted/30 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                ABHA ID (Optional)
              </label>
              <input
                type="text"
                value={abhaId}
                onChange={(e) => setAbhaId(e.target.value)}
                placeholder="14-digit ABHA number"
                className="w-full px-3.5 py-2.5 bg-muted/30 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Clinical Allergy Safety Card */}
        <div className="bg-card border border-allergy/30 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-allergy" /> Drug &amp; Clinical Allergies
            </h2>
            <span className="text-xs bg-allergy/10 text-allergy font-medium px-2.5 py-1 rounded-full">
              Hard Blocker Safety Protocol
            </span>
          </div>

          {/* Added allergies list */}
          {allergies.length > 0 && (
            <div className="space-y-2">
              {allergies.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-allergy/5 border border-allergy/20 rounded-xl">
                  <div>
                    <span className="font-bold text-allergy text-sm">{item.allergen}</span>
                    <span className="ml-2 text-xs px-2 py-0.5 bg-allergy text-white rounded-full font-semibold">
                      {item.severity}
                    </span>
                    {item.reaction && <p className="text-xs text-muted-foreground mt-0.5">Reaction: {item.reaction}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAllergyItem(idx)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new allergy subform */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <input
              type="text"
              value={newAllergen}
              onChange={(e) => setNewAllergen(e.target.value)}
              placeholder="Allergen (e.g. Penicillin, Aspirin)"
              className="px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={newSeverity}
              onChange={(e) => setNewSeverity(e.target.value)}
              className="px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="HIGH">High (Anaphylaxis Risk)</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <div className="flex gap-2">
              <input
                type="text"
                value={newReaction}
                onChange={(e) => setNewReaction(e.target.value)}
                placeholder="Reaction (e.g. Rash, Hives)"
                className="flex-1 px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={addAllergyItem}
                className="px-3 py-2 bg-allergy text-white font-medium rounded-xl hover:bg-allergy/90 transition-all text-xs flex items-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link
            href="/patients"
            className="px-6 py-2.5 bg-muted text-muted-foreground font-medium rounded-xl hover:bg-muted/80 transition-all text-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? "Registering..." : "Complete Registration"}
          </button>
        </div>
      </form>
    </div>
  );
}
