import React, { useRef, useState } from "react";
import { FileText, Upload, HelpCircle, CornerDownLeft, Sparkles, Clipboard, Trash2, CheckCircle } from "lucide-react";

interface DocumentInputProps {
  text: string;
  onChange: (text: string) => void;
  onLoadTemplate: (text: string) => void;
  gdprConsent: boolean;
  onConsentChange: (consent: boolean) => void;
}

export const SAMPLE_TEMPLATES = [
  {
    id: "medical",
    title: "Clinical Record",
    badge: "Medical",
    content: `PATIENT CLINICAL ASSESSMENT REPORT
Date: June 15, 2026

Subject: Jane Gallagher
Date of Birth: 14-Oct-1981
SSN / Gov ID: 382-11-9253
Residential Address: 1042 West Oak Avenue, Austin, TX 78701
Contact Email: gallagher.jane@medisecure.org
Contact Number: (555) 328-9102

CLINICAL ENCOUNTER NOTES:
Dr. Robert J. Smith examined the patient. Subject presented with persistent acute migraine and tension headaches lasting over 48 hours. Subject reports mild nausea and light sensitivity.

TREATMENT PLAN:
Prescribed sumatriptan 100mg. Recommended high hydration intake. Follow up in 14 days if headache persists. 
Urgent bill payment processed securely online using patient's premium card (VISA: 4111-2222-3333-4444) for co-pay amount of $45.00.`
  },
  {
    id: "extc_syllabus",
    title: "EXTC Syllabus",
    badge: "Academic",
    content: `=== EXTC DEPARTMENT ACADEMIC REGISTRY & CURRICULUM ===
ELECTRONICS & TELECOMMUNICATION ENGINEERING (EXTC)
Academic Term: Winter Semester 2026

1. COURSE COORDINATOR METRICS:
Principal Instructor: Dr. Sharon Vance
Contact Hotline: 206-555-0134
Coordinator Email: sharon.vance@central-extc-university.edu
Administrative Headquarters: 405 Tech Tower Road, Seattle, WA 98105
Academic Web Server Node: 192.168.1.105

2. SYLLABUS CORE MODULES:
- Module A: Wave Guides, Fiber Optics, and Electromagnetic Vector Generation.
- Module B: Frequency Fourier Analysis, Phase Modulation, and Convolution Systems.
- Module C: Digital Signal Processors and Cellular Network Base Station Handshakes.
- Module D: Lab Experiments on Microprocessors.

3. FINANCIAL GATEWAYS & ACQUIRED TEXTBOOKS:
Course reference textbooks are purchased through academic account VISA card 4111-2222-3333-4444. All lab experiments are performed locally inside temporary sandbox memory spaces.`
  },
  {
    id: "hr",
    title: "Employment Agreement",
    badge: "HR",
    content: `ADDENDUM TO CONTRACT OF EMPLOYMENT
This addendum is executed pursuant to corporate integrity guidelines between:

EMPLOYER: Acme Global Logistics Corp (URL: https://acme-global.com, Production IP: 192.168.1.102)
EMPLOYEE: Thomas Miller
Contact Email: thomas.miller3322@gmail.com
Mobile Line: +1 415-329-8811
Residential Address: 49 Pine Lane, San Francisco, CA 94102

TERMS OF AGREEMENT:
1. Thomas Miller shall serve in the full-time role of Director of Secure DevOps, reporting to the CTO.
2. The annual base compensation will be $145,000, payable monthly to the employee's checking account ending in ****.
3. Access credentials for company production servers on the secure IP space 10.0.8.254 are strictly confidential and subject to direct NDA audit.`
  },
  {
    id: "support",
    title: "Customer Support Mail",
    badge: "Support/Finance",
    content: `To: support@securepay-gateway.com
From: sarah.oconnor@yahoo.co.uk (Sarah O'Connor)
Subject: Urgent Security Fraud investigation on credit card!

Dear support team,

I am writing to report a deeply suspicious transaction on my MasterCard: 5412-7511-9285-0012 which appeared on my online statement yesterday for $459.99, labeled "Dublin Tech Retailers". 

I did not authorize this charge! I was at local work near 55 Elm Street, Boston, MA 02108.
For verification, my account identifiers are:
- Customer SSN Match: SSN-992-12-3211
- Registered contact phone: 617-555-0143
- Browser IP Address: 172.56.21.199

Please freeze this account immediately. I look forward to an expedited refund and safe remapping of my credentials.

Sincerely,
Sarah O'Connor`
  }
];

export default function DocumentInput({
  text,
  onChange,
  onLoadTemplate,
  gdprConsent,
  onConsentChange
}: DocumentInputProps) {
  const [dragActive, setDragActive] = useState(false);
  const [parseStatus, setParseStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    setParseStatus(`Reading file: ${file.name}...`);
    const extension = file.name.split('.').pop()?.toLowerCase();

    // Check if DOCX or PDF file
    if (extension === 'docx' || extension === 'doc' || extension === 'pdf') {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          setParseStatus("Error: Could not read file bytes.");
          return;
        }

        // Convert ArrayBuffer to Base64 in chunked safe steps
        const uint8 = new Uint8Array(arrayBuffer);
        let binary = '';
        const len = uint8.length;
        const chunkSize = 65536;
        for (let i = 0; i < len; i += chunkSize) {
          const chunk = uint8.subarray(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        const base64 = btoa(binary);

        try {
          setParseStatus(`Extracting text from ${file.name} securely...`);
          const res = await fetch("/api/proxy/parse-file", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              base64Data: base64,
              fileName: file.name,
              fileType: extension,
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || "Failed to extract text from document.");
          }

          const data = await res.json();
          if (data.text !== undefined && data.text !== null) {
            onChange(data.text);
            setParseStatus(`Successfully extracted text from ${file.name}!`);
          } else {
            throw new Error("No readable text found in this document.");
          }
        } catch (err: any) {
          console.error(err);
          setParseStatus(`Extraction fallback: ${err.message || String(err)}`);
          alert(`Could not extract text from "${file.name}": ${err.message || String(err)}. Please try copy-pasting the text instead.`);
        }
      };
      reader.onerror = () => {
        setParseStatus("Error reading file.");
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    // Skip Simulated Templates block (deactivated)
    if (false && (extension === 'docx' || extension === 'doc' || extension === 'pdf')) {
      // Simulate real file OCR/Extractor unpacked in memory
      setTimeout(() => {
        let extractedSimulatedText = "";
        const nameLower = file.name.toLowerCase();
        
        if (nameLower.includes("extc") || nameLower.includes("syllabus") || nameLower.includes("course") || nameLower.includes("curriculum") || nameLower.includes("college") || nameLower.includes("university") || nameLower.includes("engineering")) {
          extractedSimulatedText = `=== EXTC DEPARTMENT ACADEMIC REGISTRY & CURRICULUM ===
Document: ${file.name}
File Size: ${(file.size / 1024).toFixed(1)} KB
Parsing Status: SECURE MEMORY TEXT RECOVERY SUCCESSFUL

DETAILED ACADEMIC CURRICULUM AND LAB STRUCTURE
ELECTRONICS & TELECOMMUNICATION ENGINEERING (EXTC)
Academic Term: Winter Semester 2026

1. COURSE COORDINATOR METRICS:
Principal Instructor: Dr. Sharon Vance
Contact Hotline: 206-555-0134
Coordinator Email: sharon.vance@central-extc-university.edu
Administrative Headquarters: 405 Tech Tower Road, Seattle, WA 98105
Academic Web Server Node: 192.168.1.105

2. SYLLABUS CORE MODULES:
- Module A: Wave Guides, Fiber Optics, and Electromagnetic Vector Generation.
- Module B: Frequency Fourier Analysis, Phase Modulation, and Convolution Systems.
- Module C: Digital Signal Processors and Cellular Network Base Station Handshakes.
- Module D: Lab Experiments on Microprocessors.

3. FINANCIAL GATEWAYS & ACQUIRED TEXTBOOKS:
Course reference textbooks are purchased through academic account VISA card 4111-2222-3333-4444. All lab experiments are performed locally inside temporary sandbox memory spaces.`;
        } else if (nameLower.includes("invoice") || nameLower.includes("receipt") || nameLower.includes("payment") || nameLower.includes("bill") || nameLower.includes("financial")) {
          extractedSimulatedText = `=== TAX INVOICE & RECOVERY AUDIT STATEMENT ===
Document: ${file.name}
File Size: ${(file.size / 1024).toFixed(1)} KB
Parsing Status: SECURE MEMORY TEXT RECOVERY SUCCESSFUL

TRANSACTIONAL META DETAILS
Reference Voucher Code: INV-2026-88019
Billing Entity Rep: Alice Peterson
Contact Mobile Connection: 312-555-9201
Rep Email: alice.p@acme-innovations.org
Home Office Address: 212 Pine Crest Trail, Chicago, IL 60611

ACQUIRED MERCHANDISE STATEMENT
- 10x Corporate Xeon Server Nodes (IP Location Assigned: 10.0.8.22) - $4,500.00
- 1x Security Sandbox VPN Appliance - $1,120.00
- Total Tax Calculated: $449.60
- GRAND TOTAL PAYABLE: $6,069.60

PAYMENT DETAILS PROCESSED:
Processed via Corporate Account MasterCard ending in 5111-2222-3333-4444. Transferred securely to local backup repository.`;
        } else if (nameLower.includes("resume") || nameLower.includes("cv") || nameLower.includes("profile") || nameLower.includes("portfolio")) {
          extractedSimulatedText = `=== APPLICANT RESUME SCAN (DE-IDENTIFICATION COMPLIANT) ===
Document: ${file.name}
File Size: ${(file.size / 1024).toFixed(1)} KB
Parsing Status: SECURE MEMORY TEXT RECOVERY SUCCESSFUL

CANDIDATE BIOMETRICS & HISTORY
Applicant Full Name: Gerald K. Morrison
Home Residence: 1840 Fairview Avenue, Denver, CO 80202
Personal Phone: 303-555-0182
Candidate Email: gerald.morrison@gmail.com
Candidate Portfolio IP space: 192.168.12.8

PROFESSIONAL EXPERIENCE:
Senior Optical Communication Research Assistant (2022 - Present)
- Formulated advanced multiplexing protocols for optical communication pipelines in electronic arrays.
- Assisted engineering departments on regulatory compliance architectures.
- Managed server operations (local IP 10.22.40.85).

ACADEMIC CREDENTIALS:
Bachelor of Science in Electronics and Telecommunication (EXTC Engineering)
Academic Registrar Verification Code: SSN ID 502-33-8891.`;
        } else {
          // General document template with dynamic file metadata
          extractedSimulatedText = `=== SECURE FILE CONTENT EXTRACTION EXTENSION ===
Document: ${file.name}
File Size: ${(file.size / 1024).toFixed(1)} KB
Parsing Status: SECURE MEMORY TEXT RECOVERY SUCCESSFUL

IMPORTANT EXECUTIVE DOCUMENTATION SUMMARY
This record has been dynamically prepared from your uploaded archive: "${file.name}".
To assist security audits, we have included corporate identity metrics that trigger enabled PII filters:

1. COMPLIANCE REGISTERED OFFICERS:
Lead Officer Assigned: Dr. Alexander Hamilton
Contact Mobile: 202-555-0177
Corporate Address: 1600 Pennsylvania Ave NW, Washington, DC 20500
Email Identity Link: hamilton.alexander@federal-reserve-vault.gov
Secured Internal Gateway IP: 192.168.99.112

2. INVENTORY AND METADATA PARAMETERS:
- Project Reference: "${file.name.replace(/\.[^/.]+$/, "")}" Workspace
- Master Registry Access Card: MasterCard 5555-1111-2222-3333
- Regulatory Security Scan: Standard GDPR Article 5 Guardrails Active.

If you paste or browse other plain text files (.txt, .md, .csv) they will read the original file text unmodified directly.`;
        }
        onChange(extractedSimulatedText);
        setParseStatus(`Successfully parsed container and extracted plaintext from ${file.name}!`);
        setTimeout(() => setParseStatus(null), 4000);
      }, 1200);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target?.result as string;
      if (fileContent) {
        onChange(fileContent);
        setParseStatus(`Loaded ${file.name} successfully!`);
        setTimeout(() => setParseStatus(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      readFile(e.target.files[0]);
    }
  };

  // Dedicated pasting function for employees
  const handlePasteClipboard = async () => {
    try {
      const textFromClipboard = await navigator.clipboard.readText();
      if (textFromClipboard) {
        onChange(textFromClipboard);
        setParseStatus("Successfully pasted text from clipboard!");
        setTimeout(() => setParseStatus(null), 3000);
      } else {
        alert("Clipboard is empty or does not contain text.");
      }
    } catch (e) {
      // Fallback message for frame permissions
      alert("Due to browser security in this sandbox panel, please use the keyboard shortcut CTRL+V (or CMD+V) directly inside the text box below to paste your document!");
    }
  };

  const handleClearText = () => {
    onChange("");
    setParseStatus("Cleared source document input.");
    setTimeout(() => setParseStatus(null), 3000);
  };

  return (
    <div id="document-input-container" className="flex flex-col gap-5 h-full">
      {/* Templates Selector */}
      <div>
        <div className="flex gap-1.5 items-center mb-2.5">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Quick Compliance Test Templates
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {SAMPLE_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => onLoadTemplate(tpl.content)}
              className="flex flex-col items-start text-left p-3 rounded-lg border border-slate-700 hover:border-emerald-500/50 bg-slate-800/40 hover:bg-slate-800/80 transition-all cursor-pointer group"
            >
              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded mb-1.5">
                {tpl.badge}
              </span>
              <span className="text-xs font-medium text-slate-200 group-hover:text-white line-clamp-1">
                {tpl.title}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                Click to load sample PII
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Drag-Drop or Textarea Input */}
      <div className="flex-1 min-h-[300px] flex flex-col">
        <div className="flex justify-between items-center mb-2 gap-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 shrink-0">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Input Source Document
          </label>
          
          <div className="flex items-center gap-2">
            {/* Download Test PDF button */}
            <a
              href="/api/proxy/download-sample-pdf"
              download="sample_compliance_document.pdf"
              className="px-2 py-1 text-[11px] bg-slate-800 border border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-slate-300 hover:text-white font-bold rounded flex items-center gap-1 cursor-pointer transition-all shrink-0"
              title="Download a real sample PDF containing medical and patient PII to test file parsing"
            >
              <FileText className="w-3 h-3 text-emerald-400 animate-pulse" />
              Download Test PDF
            </a>

            {/* Quick clean and paste buttons */}
            <button
              onClick={handlePasteClipboard}
              className="px-2 py-1 text-[11px] bg-slate-800 border border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400 font-bold rounded flex items-center gap-1 cursor-pointer transition-all shrink-0"
              title="Click to paste text securely from clipboard"
            >
              <Clipboard className="w-3 h-3" />
              Quick Paste Option
            </button>

            {text && (
              <button
                onClick={handleClearText}
                className="px-2 py-1 text-[11px] bg-slate-800/80 border border-slate-750 hover:border-red-500/50 hover:bg-red-500/10 text-red-400 rounded flex items-center gap-0.5 cursor-pointer transition-all shrink-0"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}

            <span className="text-[10px] text-slate-500 font-mono shrink-0">
              {text.length} characters
            </span>
          </div>
        </div>

        {parseStatus && (
          <div className="mb-2 p-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{parseStatus}</span>
          </div>
        )}

        <div
          id="drop-zone"
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative flex-1 flex flex-col rounded-xl border-2 border-dashed overflow-hidden transition-all duration-200 ${
            dragActive
              ? "border-emerald-500 bg-emerald-950/10"
              : text === ""
              ? "border-slate-700 bg-slate-800/20"
              : "border-slate-700 bg-slate-900/60"
          }`}
        >
          {text === "" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none group">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mb-3 text-slate-400">
                <Upload className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-300">
                Drag and drop your document here
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-[320px] leading-relaxed">
                Supports <strong className="text-emerald-400">PDF, Word (.docx), Plain Text (.txt, .md), spreadsheet (.csv), and web/JSON formats</strong>. Or click the "Quick Paste Option" button or paste text directly.
              </p>
              <div className="mt-4 pointer-events-auto flex items-center justify-center gap-2.5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs px-3.5 py-1.5 border border-emerald-500/30 rounded-lg hover:border-emerald-500 hover:bg-emerald-500/10 text-emerald-400 bg-emerald-500/5 transition-all font-bold cursor-pointer shadow-sm"
                >
                  Browse & Import Any File
                </button>
                <a
                  href="/api/proxy/download-sample-pdf"
                  download="sample_compliance_document.pdf"
                  className="text-xs px-3.5 py-1.5 border border-slate-700 rounded-lg hover:border-slate-500 hover:bg-slate-800 text-slate-300 bg-slate-900 transition-all font-bold cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  Download Sample PDF
                </a>
              </div>
            </div>
          )}

          <textarea
            id="text-input"
            value={text}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type, paste your text document, or select/drop any PDF, Word, TXT, CSV, JSON document to safely scrub..."
            className="w-full flex-1 p-4 bg-transparent text-slate-200 text-sm font-sans resize-none outline-none border-none leading-relaxed placeholder:text-slate-600 focus:ring-0 min-h-0"
          />

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.md,.json,.csv,.pdf,.docx,.doc,.rtf"
            className="hidden"
          />
        </div>
      </div>

      {/* GDPR Consent Box */}
      <div className="p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-lg flex items-start gap-3">
        <input
          type="checkbox"
          id="gdpr-consent-checkbox"
          checked={gdprConsent}
          onChange={(e) => onConsentChange(e.target.checked)}
          className="mt-1 w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500/30 border-slate-700 bg-slate-900 cursor-pointer focus:ring-offset-slate-900 focus:ring-offset-2"
        />
        <div className="flex-1">
          <label htmlFor="gdpr-consent-checkbox" className="text-xs font-semibold text-slate-200 cursor-pointer flex items-center gap-1.5 selection:bg-transparent">
            GDPR Consent and Processing Authorization
          </label>
          <p className="text-[10px] text-slate-400 mt-1 font-sans leading-relaxed">
            By checking this box, you authorize the secure local proxy to run de-identification algorithms under Article 6(1)(a) of the GDPR. Raw personal parameters are processed in-memory and will never be logged or transmitted to standard APIs.
          </p>
        </div>
      </div>
    </div>
  );
}
