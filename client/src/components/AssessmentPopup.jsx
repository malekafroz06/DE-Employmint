import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiEye, FiShield, FiClock, FiFileText } from 'react-icons/fi';

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

const formatDate = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return ""; }
};

const POPUP_WIDTH = 380;
const POPUP_MAX_HEIGHT = 420;

const AssessmentPopup = ({ candidate }) => {
  const [show, setShow]   = useState(false);
  const [style, setStyle] = useState({});
  const btnRef            = useRef(null);
  const hideTimer         = useRef(null);

  const computePosition = () => {
    if (!btnRef.current) return {};
    const rect = btnRef.current.getBoundingClientRect();
    const vpW  = window.innerWidth;
    const vpH  = window.innerHeight;

    // Prefer right side; fall back to left if not enough space
    let left = rect.right + 8;
    if (left + POPUP_WIDTH > vpW - 8) left = rect.left - POPUP_WIDTH - 8;
    if (left < 8) left = 8;

    // Align top with the button; shift up if it would overflow bottom
    let top = rect.top;
    if (top + POPUP_MAX_HEIGHT > vpH - 8) top = vpH - POPUP_MAX_HEIGHT - 8;
    if (top < 8) top = 8;

    return { top, left };
  };

  const open  = () => { clearTimeout(hideTimer.current); setStyle(computePosition()); setShow(true);  };
  const close = () => { hideTimer.current = setTimeout(() => setShow(false), 150); };

  return (
    <>
      <button
        ref={btnRef}
        onMouseEnter={open}
        onMouseLeave={close}
        className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="View Assessment"
      >
        <FiEye size={16} />
      </button>

      {show && createPortal(
        <div
          onMouseEnter={() => clearTimeout(hideTimer.current)}
          onMouseLeave={close}
          style={{
            position:  'fixed',
            top:       style.top,
            left:      style.left,
            width:     POPUP_WIDTH,
            maxHeight: POPUP_MAX_HEIGHT,
            zIndex:    9999,
          }}
          className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {candidate.candidateName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-gray-900 truncate">
                Assessment — {candidate.candidateName}
              </p>
              <p className="text-xs text-gray-500 truncate">{candidate.email}</p>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3">
            {/* Candidate info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Candidate Info</p>
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-700">
                <div>
                  <span className="text-gray-400 block mb-0.5">Name</span>
                  {candidate.assessmentData?.candidateName || candidate.candidateName}
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Email</span>
                  <span className="truncate block">{candidate.assessmentData?.candidateEmail || candidate.email}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Phone</span>
                  {candidate.assessmentData?.candidatePhone || candidate.phone}
                </div>
              </div>
            </div>

            {/* Remarks */}
            {Array.isArray(candidate.assessmentData?.remarks) &&
             candidate.assessmentData.remarks.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Remarks</p>
                {candidate.assessmentData.remarks.map((r, i) => (
                  <div
                    key={i}
                    className={`rounded-lg px-3 py-2 border text-xs ${ROLE_COLORS[r.role] || ROLE_COLORS.recruiter}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FiShield size={10} />
                      <span className="font-semibold uppercase">{ROLE_LABELS[r.role] || r.role}</span>
                      {r.submittedAt && (
                        <span className="ml-auto opacity-60 flex items-center gap-1">
                          <FiClock size={9} /> {formatDate(r.submittedAt)}
                        </span>
                      )}
                    </div>
                    <p className="leading-relaxed">{r.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <FiFileText size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-xs">No remarks found in assessment</p>
              </div>
            )}

            {candidate.assessmentData?.submittedAt && (
              <p className="text-xs text-gray-400 text-right">
                Submitted: {formatDate(candidate.assessmentData.submittedAt)}
              </p>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default AssessmentPopup;
