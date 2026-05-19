import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Check, User, Mail, Phone, Building, Users, Target,
  ChevronLeft, ChevronRight, Shield, Clock, MessageSquare,
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const STEPS = [
  { id: 1, key: "basic",       title: "Basic Information",   icon: User,     description: "Candidate details" },
  { id: 2, key: "consultancy", title: "Consultancy Remarks", icon: Building, description: "Consultancy evaluation" },
  { id: 3, key: "hr",          title: "HR Remarks",          icon: Users,    description: "HR evaluation" },
  { id: 4, key: "management",  title: "Manager Remarks",     icon: Target,   description: "Management evaluation" },
];

const ROLE_COLORS = {
  consultancy: "bg-blue-50 border-blue-200 text-blue-700",
  hr:          "bg-purple-50 border-purple-200 text-purple-700",
  management:  "bg-green-50 border-green-200 text-green-700",
  recruiter:   "bg-gray-50 border-gray-200 text-gray-700",
};

const ROLE_LABELS = {
  consultancy: "Consultancy",
  hr:          "HR",
  management:  "Management",
  recruiter:   "Recruiter",
};

const STEP_TITLES = {
  consultancy: "Consultancy Remarks",
  hr:          "HR Remarks",
  management:  "Manager Remarks",
};

const formatDate = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return ""; }
};

export default function AssessmentPage() {
  const [params] = useSearchParams();
  const email         = params.get("email")         || "";
  const name          = params.get("name")          || "";
  const phone         = params.get("phone")         || "";
  const applicationId = params.get("applicationId") || "";
  const companyToken  = localStorage.getItem("companyToken") || "";

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading]         = useState(false);
  const [submitted, setSubmitted]     = useState(false);

  const [candidateName,  setCandidateName]  = useState(name);
  const [candidateEmail, setCandidateEmail] = useState(email);
  const [candidatePhone, setCandidatePhone] = useState(phone);

  const [remarks,      setRemarks]      = useState({ consultancy: "", hr: "", management: "" });
  const [savedRemarks, setSavedRemarks] = useState([]);
  const [isExisting,   setIsExisting]   = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState(null);

  // Get role from companyToken (only for sub-users with a specific roleType)
  const getUserRole = () => {
    if (!companyToken) return null;
    try {
      const payload = JSON.parse(atob(companyToken.split(".")[1]));
      return payload.isSubUser && payload.roleType ? payload.roleType : null;
    } catch { return null; }
  };
  const userRole = getUserRole();

  // Load existing assessment on mount
  useEffect(() => {
    if (!email) return;
    const load = async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${BACKEND_URL}/api/candidates/assessment/email/${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.success && data.assessment) {
          const a = data.assessment;
          setCandidateName(a.candidateName  || name);
          setCandidateEmail(a.candidateEmail || email);
          setCandidatePhone(a.candidatePhone || phone);
          setSavedRemarks(Array.isArray(a.remarks) ? a.remarks : []);
          setIsExisting(true);
          setLastUpdated(a.lastUpdated || a.submittedAt);
        }
      } catch { /* no assessment yet */ }
      finally  { setLoading(false); }
    };
    load();
  }, [email]);

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  // ✅ FIX: use stepKey as role (consultancy/hr/management), only override if sub-user token has roleType
  const handleStepSubmit = async (stepKey) => {
    const text = remarks[stepKey]?.trim();
    if (!text) { alert("Please enter your remarks before submitting."); return; }

    const roleKey = userRole || stepKey; // ← KEY FIX: stepKey = "consultancy" | "hr" | "management"

    const payload = {
      candidateName,
      candidateEmail,
      candidatePhone,
      remarkEntry: { role: roleKey, text },
      assessmentStatus: "completed",
    };

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/candidates/assessment`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) { alert(`Failed: ${result.message || "Unknown error"}`); return; }

      // Sync from server response if remarks returned, else update locally
      if (result.data?.remarks) {
        setSavedRemarks(result.data.remarks);
      } else {
        setSavedRemarks((prev) => {
          const filtered = prev.filter((r) => r.role !== roleKey);
          return [...filtered, { role: roleKey, text, submittedAt: new Date().toISOString() }];
        });
      }

      setRemarks((prev) => ({ ...prev, [stepKey]: "" }));
      setIsExisting(true);
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };
const handleFinalSubmit = async () => {
  setLoading(true);
  try {
    const stepKey = "management";
    const roleKey = userRole || stepKey;

    // ✅ Check BOTH the textarea (new/editing) AND already-saved remark
    const textToSubmit = remarks[stepKey]?.trim();
    const alreadySaved = getSaved(stepKey);

    // Only submit if there's new text in textarea (new entry or edit)
    // If already saved and no new text, skip the remark POST (it's already in DB)
    if (textToSubmit) {
      const payload = {
        candidateName,
        candidateEmail,
        candidatePhone,
        remarkEntry: { role: roleKey, text: textToSubmit },
        assessmentStatus: "completed",
      };

      const res = await fetch(`${BACKEND_URL}/api/candidates/assessment`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        alert(`Failed to save remark: ${result.message || "Unknown error"}`);
        return;
      }
      if (result.data?.remarks) setSavedRemarks(result.data.remarks);

    } else if (!alreadySaved) {
      // No text entered AND nothing saved — warn the user
      alert("Please enter Manager Remarks before submitting.");
      return;
    }
    // If alreadySaved && !textToSubmit → remark already in DB, just proceed

    // Mark as accepted in bulk-upload
    if (applicationId && companyToken) {
      try {
        await axios.post(
          `${BACKEND_URL}/api/bulk-upload/accept/${applicationId}`,
          {
            assessmentData: {
              candidateName,
              candidateEmail,
              candidatePhone,
              remarks: savedRemarks,
              submittedAt: new Date().toISOString(),
            },
          },
          { headers: { token: companyToken } }
        );
      } catch (err) {
        console.error("Error marking as accepted in bulk-upload:", err);
      }
    }

    // Change application status
    if (applicationId && companyToken) {
      try {
        await axios.post(
          `${BACKEND_URL}/api/company/change-status`,
          { id: applicationId, status: "Accepted" },
          { headers: { token: companyToken } }
        );
      } catch (err) {
        console.error("Error accepting application:", err);
      }
    }

    // Broadcast to parent tab
    try {
      const bc = new BroadcastChannel("application_updates");
      bc.postMessage({ 
      type: "APPLICATION_ACCEPTED", 
      applicationId,           // job application _id (for ViewApplications)
      candidateEmail,          // ← ADD THIS (for SearchResume to match by email)
  });
      bc.close();
    } catch { /* not supported */ }

    setSubmitted(true);

  } finally {
    setLoading(false);
  }
};

  const stepObj     = STEPS[currentStep - 1];
  const isLastStep  = currentStep === STEPS.length;
  const isFirstStep = currentStep === 1;
  const stepKey     = stepObj.key;
  const getSaved    = (role) => savedRemarks.find((r) => r.role === role);

  // ─── Submitted screen ───────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md w-full"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Check size={30} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Assessment Submitted!</h2>
          <p className="text-gray-500 mb-2">
            The assessment for{" "}
            <span className="font-semibold text-gray-700">{candidateName}</span> has been
            completed and the application has been accepted.
          </p>
          <p className="text-sm text-gray-400">You can now close this tab.</p>
          <button
            onClick={() => window.close()}
            className="mt-6 px-6 py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
          >
            Close Tab
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── Main page ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Candidate Assessment</h1>
          <p className="text-sm text-gray-500 mt-1">
            Fill assessment to accept application
            {userRole && (
              <span className="ml-2 text-blue-600 font-medium">
                ({ROLE_LABELS[userRole] || userRole} View)
              </span>
            )}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">

          {/* ── Step Progress ── */}
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
            {/* Mobile dots */}
            <div className="flex sm:hidden items-center justify-center gap-2 mb-2">
              {STEPS.map((s, i) => (
                <div
                  key={s.id}
                  className={`h-2 rounded-full transition-all ${
                    currentStep === i + 1 ? "w-8 bg-red-500" :
                    currentStep > i + 1   ? "w-2 bg-green-500" : "w-2 bg-gray-300"
                  }`}
                />
              ))}
            </div>
            <div className="sm:hidden text-center">
              <div className="text-sm font-semibold text-red-600">{stepObj.title}</div>
              <div className="text-xs text-gray-500">{stepObj.description}</div>
            </div>

            {/* Desktop stepper */}
            <div className="hidden sm:flex items-center">
              {STEPS.map((s, i) => {
                const Icon     = s.icon;
                const isActive = currentStep === i + 1;
                const isDone   = currentStep > i + 1;
                return (
                  <div key={s.id} className="flex items-center flex-1">
                    <div className="flex items-center">
                      <div
                        className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
                          isActive ? "bg-red-500 text-white" :
                          isDone   ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {isDone ? <Check size={18} /> : <Icon size={18} />}
                      </div>
                      <div className="ml-2.5 hidden md:block">
                        <div className={`text-xs font-semibold ${isActive ? "text-red-600" : isDone ? "text-green-600" : "text-gray-500"}`}>
                          {s.title}
                        </div>
                        <div className="text-xs text-gray-400">{s.description}</div>
                      </div>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-px mx-3 ${isDone ? "bg-green-300" : "bg-gray-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Body ── */}
          <div className="p-5 min-h-[320px]">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500" />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >

                  {/* ── Step 1: Basic Info ── */}
                  {currentStep === 1 && (
                    <>
                      {isExisting && (
                        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                          <Check size={15} className="mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium">Existing assessment found.</span>
                            {lastUpdated && (
                              <span className="ml-1 flex items-center gap-1 text-blue-500 mt-0.5 text-xs">
                                <Clock size={11} /> Last updated: {formatDate(lastUpdated)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Candidate info */}
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Candidate Info
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <User size={14} className="text-gray-400 flex-shrink-0" />
                            <span className="font-medium truncate">{candidateName || "—"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Mail size={14} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{candidateEmail || "—"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Phone size={14} className="text-gray-400 flex-shrink-0" />
                            <span>{candidatePhone || "—"}</span>
                          </div>
                        </div>
                      </div>

                      {/* ✅ Remarks summary — always shows all 3 slots */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                          <MessageSquare size={13} /> Remarks Summary
                        </h3>

                        {["consultancy", "hr", "management"].map((role) => {
                          const r          = getSaved(role);
                          const colorClass = ROLE_COLORS[role];
                          return (
                            <div
                              key={role}
                              className={`rounded-lg px-4 py-3 border ${
                                r ? colorClass : "bg-gray-50 border-gray-200 text-gray-400"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Shield size={12} />
                                <span className="text-xs font-semibold uppercase">
                                  {STEP_TITLES[role]}
                                </span>
                                {r?.submittedAt && (
                                  <span className="ml-auto text-xs opacity-60 flex items-center gap-1">
                                    <Clock size={10} /> {formatDate(r.submittedAt)}
                                  </span>
                                )}
                                {r && (
                                  <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 ml-1">
                                    <Check size={10} /> Done
                                  </span>
                                )}
                              </div>
                              <p className="text-sm">
                                {r
                                  ? r.text
                                  : <span className="italic text-xs">Not submitted yet</span>
                                }
                              </p>
                            </div>
                          );
                        })}

                        {/* Recruiter remarks (legacy / fallback) */}
                        {savedRemarks.filter((r) => r.role === "recruiter").map((r, i) => (
                          <div key={i} className={`rounded-lg px-4 py-3 border ${ROLE_COLORS.recruiter}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <Shield size={12} />
                              <span className="text-xs font-semibold uppercase">Recruiter Remarks</span>
                              {r.submittedAt && (
                                <span className="ml-auto text-xs opacity-60 flex items-center gap-1">
                                  <Clock size={10} /> {formatDate(r.submittedAt)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm">{r.text}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* ── Steps 2 / 3 / 4: Remarks ── */}
                  {currentStep > 1 && (() => {
                    const saved     = getSaved(stepKey);
                    const isEditing = remarks[stepKey]?.length > 0;

                    return (
                      <div className="space-y-4">

                        {/* ✅ READ-ONLY card when saved and not currently editing */}
                        {saved && !isEditing ? (
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                              {stepObj.title}
                            </label>
                            <div className={`rounded-lg px-4 py-4 border-2 ${ROLE_COLORS[stepKey] || ROLE_COLORS.recruiter}`}>
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Shield size={12} />
                                <span className="text-xs font-semibold uppercase">
                                  {ROLE_LABELS[stepKey] || stepKey}
                                </span>
                                {saved.submittedAt && (
                                  <span className="ml-auto text-xs opacity-60 flex items-center gap-1">
                                    <Clock size={10} /> {formatDate(saved.submittedAt)}
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                  <Check size={10} /> Submitted
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{saved.text}</p>
                              <button
                                type="button"
                                onClick={() => setRemarks((prev) => ({ ...prev, [stepKey]: saved.text }))}
                                className="mt-3 text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                Edit remark
                              </button>
                            </div>
                          </div>

                        ) : (
                          /* ✅ EDITABLE textarea (new entry or editing existing) */
                          <div className="space-y-2">
                            {/* Show previous value struck-through when editing */}
                            {saved && isEditing && (
                              <div className={`rounded-lg px-4 py-3 border opacity-60 ${ROLE_COLORS[stepKey] || ROLE_COLORS.recruiter}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <Shield size={12} />
                                  <span className="text-xs font-semibold uppercase">
                                    Previous: {ROLE_LABELS[stepKey] || stepKey}
                                  </span>
                                </div>
                                <p className="text-sm line-through">{saved.text}</p>
                              </div>
                            )}

                            <label className="block text-sm font-semibold text-gray-700">
                              {saved ? `Update ${stepObj.title}` : stepObj.title}
                            </label>
                            <textarea
                              value={remarks[stepKey] || ""}
                              onChange={(e) =>
                                setRemarks((prev) => ({ ...prev, [stepKey]: e.target.value }))
                              }
                              rows={6}
                              placeholder={`Enter ${stepObj.title.toLowerCase()} here...`}
                              className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                            />

                            <div className="flex items-center justify-between">
                              {saved && (
                                <button
                                  type="button"
                                  onClick={() => setRemarks((prev) => ({ ...prev, [stepKey]: "" }))}
                                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                                >
                                  Cancel edit
                                </button>
                              )}

                              {/* Submit / Update button — shown for both non-last AND last step */}
                              {!isLastStep && (
                                <button
                                  type="button"
                                  onClick={() => handleStepSubmit(stepKey)}
                                  disabled={loading || !remarks[stepKey]?.trim()}
                                  className="ml-auto flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {loading
                                    ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                    : <Check size={15} />}
                                  {saved ? "Update Remarks" : "Submit Remarks"}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* ── Footer Navigation ── */}
          <div className="flex items-center justify-between p-5 border-t border-gray-200 bg-gray-50">
            <button
              onClick={prevStep}
              disabled={isFirstStep || loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isFirstStep || loading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <ChevronLeft size={16} /> Previous
            </button>

            <span className="text-xs text-gray-400">Step {currentStep} of {STEPS.length}</span>

            {isLastStep ? (
              <button
                onClick={handleFinalSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading
                  ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  : <Check size={15} />}
                Submit & Accept
              </button>
            ) : (
              <button
                onClick={nextStep}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight size={16} />
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}