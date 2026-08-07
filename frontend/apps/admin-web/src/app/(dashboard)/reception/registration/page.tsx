"use client";

import { useState } from "react";
import {
  User, Phone, Shield, HeartPulse, FileText, QrCode, Printer,
  CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Search, Plus, Trash2
} from "lucide-react";
import { patientsApi, PatientDto } from "@medicore/api";
import { toast } from "sonner";

export default function PatientRegistrationPage() {
  const [activeTab, setActiveTab] = useState<"basic" | "contact" | "emergency" | "medical" | "insurance" | "digital">("basic");
  const [submitting, setSubmitting] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState<PatientDto | null>(null);

  // Form State
  const [formData, setFormData] = useState<PatientDto>({
    name: "",
    middleName: "",
    lastName: "",
    gender: "MALE",
    birthDate: "",
    age: undefined,
    bloodGroup: "O_POSITIVE",
    maritalStatus: "SINGLE",
    occupation: "",
    aadhaar: "",
    pan: "",
    phone: "",
    altPhone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactPhone: "",
    existingDiseases: "",
    previousSurgeries: "",
    disabilityStatus: "NONE",
    pregnancyStatus: false,
    corporatePatient: false,
    tpaDetails: "",
    abhaId: "",
    allergies: [],
  });

  const [allergyInput, setAllergyInput] = useState({ allergen: "", severity: "MODERATE", reaction: "" });

  const handleInputChange = (field: keyof PatientDto, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddAllergy = () => {
    if (!allergyInput.allergen) return;
    setFormData((prev) => ({
      ...prev,
      allergies: [...(prev.allergies || []), allergyInput],
    }));
    setAllergyInput({ allergen: "", severity: "MODERATE", reaction: "" });
  };

  const handleRemoveAllergy = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      allergies: (prev.allergies || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("Patient Full Name and Phone Number are required!");
      return;
    }

    try {
      setSubmitting(true);
      const res = await patientsApi.register(formData);
      const pData = (res as any).data?.data || (res as any).data || res;
      if (pData) {
        setRegisteredPatient(pData);
        toast.success(`Patient registered! UHID: ${pData.uhid}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed. Check for duplicate records.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between bg-card border border-border p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Register New Patient</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enterprise front-office patient demographic capture, ABHA linking, insurance validation, and UHID generation.
          </p>
        </div>
      </div>

      {/* Main Registration Suite */}
      {!registeredPatient ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {/* Navigation Tabs */}
          <div className="flex border-b border-border bg-muted/30 overflow-x-auto">
            {[
              { id: "basic", label: "Basic Info", icon: User },
              { id: "contact", label: "Contact Details", icon: Phone },
              { id: "emergency", label: "Emergency Contact", icon: Shield },
              { id: "medical", label: "Medical & Allergies", icon: HeartPulse },
              { id: "insurance", label: "Insurance & TPA", icon: FileText },
              { id: "digital", label: "Digital ABHA", icon: QrCode },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary bg-card"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* TAB 1: BASIC DEMOGRAPHICS */}
            {activeTab === "basic" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter first name"
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Middle Name</label>
                  <input
                    type="text"
                    value={formData.middleName || ""}
                    onChange={(e) => handleInputChange("middleName", e.target.value)}
                    placeholder="Middle name"
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName || ""}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Last name"
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Gender *</label>
                  <select
                    value={formData.gender || "MALE"}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.birthDate || ""}
                    onChange={(e) => handleInputChange("birthDate", e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Age (Years)</label>
                  <input
                    type="number"
                    value={formData.age || ""}
                    onChange={(e) => handleInputChange("age", Number(e.target.value))}
                    placeholder="Age"
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Blood Group</label>
                  <select
                    value={formData.bloodGroup || "O_POSITIVE"}
                    onChange={(e) => handleInputChange("bloodGroup", e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="A_POSITIVE">A+</option>
                    <option value="A_NEGATIVE">A-</option>
                    <option value="B_POSITIVE">B+</option>
                    <option value="B_NEGATIVE">B-</option>
                    <option value="AB_POSITIVE">AB+</option>
                    <option value="AB_NEGATIVE">AB-</option>
                    <option value="O_POSITIVE">O+</option>
                    <option value="O_NEGATIVE">O-</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Marital Status</label>
                  <select
                    value={formData.maritalStatus || "SINGLE"}
                    onChange={(e) => handleInputChange("maritalStatus", e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="SINGLE">Single</option>
                    <option value="MARRIED">Married</option>
                    <option value="DIVORCED">Divorced</option>
                    <option value="WIDOWED">Widowed</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Occupation</label>
                  <input
                    type="text"
                    value={formData.occupation || ""}
                    onChange={(e) => handleInputChange("occupation", e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Aadhaar Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.aadhaar || ""}
                    onChange={(e) => handleInputChange("aadhaar", e.target.value)}
                    placeholder="12 digit Aadhaar"
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">PAN Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.pan || ""}
                    onChange={(e) => handleInputChange("pan", e.target.value)}
                    placeholder="10 digit PAN"
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: CONTACT DETAILS */}
            {activeTab === "contact" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground">Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="10 digit phone number"
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Alternate Mobile</label>
                  <input
                    type="text"
                    value={formData.altPhone || ""}
                    onChange={(e) => handleInputChange("altPhone", e.target.value)}
                    placeholder="Alternate phone"
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Email Address</label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="patient@email.com"
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-xs font-semibold text-foreground">Residential Address</label>
                  <input
                    type="text"
                    value={formData.address || ""}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Street, locality, house number"
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">City</label>
                  <input
                    type="text"
                    value={formData.city || ""}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="City name"
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">State</label>
                  <input
                    type="text"
                    value={formData.state || ""}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="State name"
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">PIN Code</label>
                  <input
                    type="text"
                    value={formData.pincode || ""}
                    onChange={(e) => handleInputChange("pincode", e.target.value)}
                    placeholder="6 digit PIN"
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: EMERGENCY CONTACT */}
            {activeTab === "emergency" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={formData.emergencyContactName || ""}
                    onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                    placeholder="Guardian or relative name"
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Relationship</label>
                  <input
                    type="text"
                    value={formData.emergencyContactRelation || ""}
                    onChange={(e) => handleInputChange("emergencyContactRelation", e.target.value)}
                    placeholder="e.g. Spouse, Father, Sister"
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Emergency Contact Phone</label>
                  <input
                    type="text"
                    value={formData.emergencyContactPhone || ""}
                    onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                    placeholder="10 digit contact phone"
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: MEDICAL & ALLERGIES */}
            {activeTab === "medical" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground">Existing Chronic Diseases</label>
                    <textarea
                      rows={2}
                      value={formData.existingDiseases || ""}
                      onChange={(e) => handleInputChange("existingDiseases", e.target.value)}
                      placeholder="e.g. Type 2 Diabetes, Hypertension"
                      className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground">Previous Surgeries</label>
                    <textarea
                      rows={2}
                      value={formData.previousSurgeries || ""}
                      onChange={(e) => handleInputChange("previousSurgeries", e.target.value)}
                      placeholder="e.g. Appendectomy (2021)"
                      className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>

                {/* Add Allergies Section */}
                <div className="border-t border-border pt-4 space-y-4">
                  <h4 className="text-sm font-bold text-foreground">Known Clinical Allergies</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-muted/30 p-4 rounded-xl">
                    <input
                      type="text"
                      placeholder="Allergen (e.g. Penicillin)"
                      value={allergyInput.allergen}
                      onChange={(e) => setAllergyInput((p) => ({ ...p, allergen: e.target.value }))}
                      className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs outline-none"
                    />
                    <select
                      value={allergyInput.severity}
                      onChange={(e) => setAllergyInput((p) => ({ ...p, severity: e.target.value }))}
                      className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs outline-none"
                    >
                      <option value="MILD">Mild</option>
                      <option value="MODERATE">Moderate</option>
                      <option value="SEVERE">Severe</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Reaction (e.g. Hives, Anaphylaxis)"
                      value={allergyInput.reaction}
                      onChange={(e) => setAllergyInput((p) => ({ ...p, reaction: e.target.value }))}
                      className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddAllergy}
                      className="flex items-center justify-center gap-1 bg-primary text-primary-foreground text-xs font-semibold py-1.5 rounded-lg hover:bg-primary/90"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Allergy</span>
                    </button>
                  </div>

                  {formData.allergies && formData.allergies.length > 0 && (
                    <div className="space-y-2">
                      {formData.allergies.map((alg, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs">
                          <div>
                            <span className="font-bold text-rose-700 dark:text-rose-400">{alg.allergen}</span>
                            <span className="ml-2 text-muted-foreground">({alg.severity}) — {alg.reaction}</span>
                          </div>
                          <button type="button" onClick={() => handleRemoveAllergy(idx)} className="text-rose-600 hover:text-rose-800">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: INSURANCE & TPA */}
            {activeTab === "insurance" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 md:col-span-2">
                  <input
                    type="checkbox"
                    id="corp"
                    checked={formData.corporatePatient || false}
                    onChange={(e) => handleInputChange("corporatePatient", e.target.checked)}
                    className="w-4 h-4 rounded text-primary border-border"
                  />
                  <label htmlFor="corp" className="text-sm font-semibold text-foreground cursor-pointer">
                    Corporate / Insurance Empaneled Patient
                  </label>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">TPA / Insurance Company</label>
                  <input
                    type="text"
                    value={formData.tpaDetails || ""}
                    onChange={(e) => handleInputChange("tpaDetails", e.target.value)}
                    placeholder="e.g. Star Health / ICICI Lombard"
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 6: DIGITAL HEALTH ABHA */}
            {activeTab === "digital" && (
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                  <QrCode className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">Ayushman Bharat Digital Mission (ABDM / ABHA)</h4>
                    <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                      Link patient's 14-digit ABHA Number or generate a new ABHA health ID for digital health record interoperability.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">ABHA ID / ABHA Address</label>
                  <input
                    type="text"
                    value={formData.abhaId || ""}
                    onChange={(e) => handleInputChange("abhaId", e.target.value)}
                    placeholder="e.g. 91-8822-4411-0099 or user@abdm"
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Form Action Controls */}
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  const tabs: ("basic" | "contact" | "emergency" | "medical" | "insurance" | "digital")[] = ["basic", "contact", "emergency", "medical", "insurance", "digital"];
                  const idx = tabs.indexOf(activeTab);
                  if (idx > 0) setActiveTab(tabs[idx - 1]);
                }}
                disabled={activeTab === "basic"}
                className="px-4 py-2 rounded-xl border border-border text-sm font-semibold disabled:opacity-50"
              >
                Previous Step
              </button>

              <div className="flex items-center gap-3">
                {activeTab !== "digital" && (
                  <button
                    type="button"
                    onClick={() => {
                      const tabs: ("basic" | "contact" | "emergency" | "medical" | "insurance" | "digital")[] = ["basic", "contact", "emergency", "medical", "insurance", "digital"];
                      const idx = tabs.indexOf(activeTab);
                      if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1]);
                    }}
                    className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted"
                  >
                    Next Step
                  </button>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? "Registering..." : "Complete Registration"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* PRINTABLE UHID CARD MODAL / SUCCESS VIEW */
        <div className="bg-card border border-border rounded-2xl p-8 max-w-2xl mx-auto space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">Patient Registered Successfully!</h2>
            <p className="text-sm text-muted-foreground mt-1">Universal Health Identifier (UHID) generated.</p>
          </div>

          {/* UHID Card */}
          <div className="bg-gradient-to-br from-sidebar via-sidebar to-sidebar/90 border border-sidebar-border text-sidebar-foreground p-6 rounded-2xl text-left space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-sidebar-border pb-3">
              <div>
                <span className="text-xs uppercase tracking-wider text-sidebar-muted font-bold">MediCore Hospital Patient Card</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{registeredPatient.name}</h3>
              </div>
              <QrCode className="w-10 h-10 text-white opacity-80" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-sidebar-muted block">UHID Number</span>
                <span className="text-base font-extrabold text-amber-400">{registeredPatient.uhid}</span>
              </div>
              <div>
                <span className="text-sidebar-muted block">Phone Number</span>
                <span className="font-semibold text-white">{registeredPatient.phone}</span>
              </div>
              <div>
                <span className="text-sidebar-muted block">Gender / Age</span>
                <span className="font-semibold text-white">{registeredPatient.gender} • {registeredPatient.age || "N/A"} yrs</span>
              </div>
              <div>
                <span className="text-sidebar-muted block">Blood Group</span>
                <span className="font-semibold text-white">{registeredPatient.bloodGroup}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-background text-sm font-semibold hover:bg-muted"
            >
              <Printer className="w-4 h-4" />
              <span>Print Registration Slip</span>
            </button>

            <button
              onClick={() => {
                setRegisteredPatient(null);
                setFormData({
                  name: "", phone: "", gender: "MALE", bloodGroup: "O_POSITIVE", allergies: []
                });
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              <span>Register Another Patient</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
