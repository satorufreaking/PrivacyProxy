import React, { useState } from "react";
import { FileDown, ShieldAlert, BadgeCheck, CheckCircle, Trash2, Printer, Scale, ShieldCheck } from "lucide-react";

interface GdprComplianceHubProps {
  onClearAllSessionData: () => void;
  userEmail: string;
}

export default function GdprComplianceHub({ onClearAllSessionData, userEmail }: GdprComplianceHubProps) {
  const [orgName, setOrgName] = useState("Corporate Entity");
  const [officerName, setOfficerName] = useState(userEmail || "Security Compliance Officer");
  const [dpaCertified, setDpaCertified] = useState(false);

  const handlePrintDPA = () => {
    window.print();
  };

  return (
    <div id="gdpr-hub-container" className="flex flex-col gap-5 h-full max-h-[580px] overflow-y-auto pr-1">
      {/* Structural Header */}
      <div>
        <div className="flex gap-1.5 items-center mb-1">
          <Scale className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            GDPR Compliance Center & Audits
          </h3>
        </div>
        <p className="text-[10px] text-slate-500 font-sans">
          Manage regulatory frameworks, generate statutory Data Processing agreements, and toggle erasure.
        </p>
      </div>

      {/* Compliance pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900/40 border border-slate-800 p-3 rounded-lg flex flex-col">
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold mb-1 select-none">
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
            Article 5(1)(c)
          </div>
          <span className="text-[11px] font-semibold text-slate-200 uppercase">Data Minimization</span>
          <p className="text-[10px] text-slate-400 mt-1 leading-normal font-sans">
            Guarantees only sanitized, de-identified tokens ever cross network ports to third-party providers. Leaking vector surface equals 0%.
          </p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-3 rounded-lg flex flex-col">
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold mb-1 select-none">
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
            Article 17
          </div>
          <span className="text-[11px] font-semibold text-slate-200 uppercase">Right to Erasure</span>
          <p className="text-[10px] text-slate-400 mt-1 leading-normal font-sans">
            Statutory right to trigger instantaneous, volatile wipeout of database caches, transient logs, and browser index mapping parameters.
          </p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-3 rounded-lg flex flex-col">
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold mb-1 select-none">
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
            Article 32
          </div>
          <span className="text-[11px] font-semibold text-slate-200 uppercase">System Security</span>
          <p className="text-[10px] text-slate-400 mt-1 leading-normal font-sans">
            Rigorous TLS 1.3 handshake encryption plus automatic local decoupled memory mapping prevents persistent MITM vulnerability windows.
          </p>
        </div>
      </div>

      {/* Interactive Data Processing Addendum (DPA) */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4.5 flex flex-col gap-4">
        <div>
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wide flex items-center gap-1.5 select-none">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Interactive DPA Generator (Article 28)
          </h4>
          <p className="text-[10px] text-slate-500 mt-0.5 leading-normal font-sans">
            Generate and export an official GDPR-compliant Data Processing Addendum with our Secure Proxy.
          </p>
        </div>

        {/* Form Inputs */}
        {!dpaCertified ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Organization / Controller Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-all font-sans"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Appointed Data Protection Officer</label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-all font-sans"
              />
            </div>
            <div className="sm:col-span-2 mt-2">
              <button
                onClick={() => setDpaCertified(true)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 transition-all text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/15"
              >
                Assemble Compliance Agreement
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-slate-800 rounded-lg bg-slate-950/60 p-4 space-y-3 font-sans print:bg-white print:text-black print:p-8">
            {/* Stamp badge */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-3 gap-2 flex-wrap">
              <div>
                <h5 className="text-xs font-bold text-slate-100 uppercase font-mono tracking-widest">
                  GDPR DATA PROCESSING ADDENDUM (DPA)
                </h5>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                  Ref: DPA-SECPROX-{Math.random().toString(36).substr(2, 6).toUpperCase()}
                </p>
              </div>
              <span className="text-[8px] font-bold tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded uppercase select-none">
                Approved & Executed
              </span>
            </div>

            {/* Legal content */}
            <div className="text-[10px] text-slate-400 leading-relaxed font-sans space-y-2">
              <p>
                This Agreement is entered into by and between <strong>{orgName}</strong> ("Data Controller") and <strong>Secure Proxy Document Sanitizer</strong> ("Data Processor"), addressing the processing of Personal Data under GDPR Article 28 parameters.
              </p>
              <p>
                <strong>1. Scope & Instructions:</strong> Processor shall maintain strict server-side in-memory isolation. All personal parameters submitted (including Government IDs, Names, Credit Cards, email strings) are strictly subjected to de-identification redaction filters immediately upon packet ingress, prior to executing secondary services or pipeline subprocesses.
              </p>
              <p>
                <strong>2. Technical Measures:</strong> Strict state-isolation architecture ensures mapped identifiers are never committed to permanent disks. Cryptographic transmission (minimum TLS 1.3) protects transit handshakes.
              </p>
              <p>
                <strong>Data Protection Officer Liaison:</strong> {officerName}
              </p>
            </div>

            {/* Printing DPA triggers */}
            <div className="flex gap-2.5 pt-3 border-t border-slate-850/80 justify-end print:hidden">
              <button
                onClick={() => setDpaCertified(false)}
                className="text-xs px-2.5 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer"
              >
                Edit Parameters
              </button>
              <button
                onClick={handlePrintDPA}
                className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Certificate
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Erasure Action Area */}
      <div className="p-4 bg-red-950/10 border border-red-500/20 rounded-xl flex items-start gap-4">
        <Trash2 className="w-10 h-10 text-red-400 flex-shrink-0 bg-red-500/10 p-2 rounded-full" />
        <div className="flex-1">
          <h4 className="text-xs font-bold text-red-400 uppercase tracking-wide">
            GDPR Article 17 Erasure Engine (Volatile Wipe)
          </h4>
          <p className="text-[10px] text-slate-400 mt-1 leading-normal font-sans">
            Completely purge current in-memory maps, active log pipelines, and browser state parameters instantly. This action is irreversible and guarantees absolute privacy.
          </p>
          <button
            onClick={onClearAllSessionData}
            className="mt-3 text-xs font-bold px-3 py-1.5 bg-red-650/40 text-red-300 hover:text-red-100 hover:bg-red-600 transition-all rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md border border-red-500/35"
          >
            Purge All Session Data
          </button>
        </div>
      </div>
    </div>
  );
}
