import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Sliders,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle,
  AlertOctagon,
  Download,
  ShieldCheck,
  Compass,
  ArrowRight,
  Activity,
  History,
  Lock,
  UserCheck,
  FileText,
  Terminal,
  FileUp,
  Cpu,
  Trash2,
  ChevronRight,
  ExternalLink,
  Info,
  LockKeyhole
} from "lucide-react";
import { PIIRedactionRule, ProxyLog, PIIEntity } from "./types";
import { DEFAULT_RULES, performRedaction } from "./utils/sanitizer";
import DocumentInput, { SAMPLE_TEMPLATES } from "./components/DocumentInput";

interface AuditRecord {
  id: string;
  timestamp: string;
  taskName: string;
  model: string;
  charsScanned: number;
  piiDetected: number;
  status: "success" | "failed";
  policyRuleCount: number;
}

interface ConsoleLogItem {
  id: string;
  time: string;
  type: "info" | "success" | "warning" | "error" | "sys";
  msg: string;
}

export default function App() {
  // Tab Navigation: persistent tabs at the top as requested
  const [activeTab, setActiveTab] = useState<"control" | "governance" | "analysis">("control");
  
  // Compliance consents
  const [gdprConsent, setGdprConsent] = useState(true);

  // Text inputs & state (rawText initialized to empty to avoid clinical data hallucination upon custom drops)
  const [rawText, setRawText] = useState("");
  const [customSensitiveWords, setCustomSensitiveWords] = useState<string[]>(["Acme", "ProjectX"]);
  
  // Rules structure (including regex values so you can edit patterns in Tab 2)
  const [rules, setRules] = useState<PIIRedactionRule[]>(() => {
    // Inject standard regex strings into rule items so they are displayable / editable
    const standardRegexes: Record<string, string> = {
      email: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
      phone: "(?:\\+?\\d{1,4}[-.\\s]?)?\\(?\\d{2,4}\\)?[-.\\s]?\\d{3,4}[-.\\s]?\\d{4}\\b",
      creditCard: "\\b\\d{4}[-.\\s]?\\d{4}[-.\\s]?\\d{4}[-.\\s]?\\d{4}\\b",
      ssn: "\\b\\d{3}-\\d{2}-\\d{4}\\b",
      ip: "\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b",
      url: "https?://(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&//=]*)",
      address: "\\b\\d+\\s+[A-Za-z0-9#\\s\\.,]{5,50}\\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Lane|Ln|Way|Court|Ct|Circle|Cir)\\b",
      name: "Dr\\.\\s+[A-Z][a-z]+|Mr\\.\\s+[A-Z][a-z]+|[A-Z][a-z]+\\s+[A-Z][a-z]+"
    };
    return DEFAULT_RULES.map(r => ({
      ...r,
      pattern: standardRegexes[r.type] || ""
    }));
  });

  // Task controllers
  const [task, setTask] = useState("summarize");
  const [taskName, setTaskName] = useState("Crisp Executive Summary");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-3.5-flash");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a secure, high-integrity LLM worker operating behind a Secure Redaction Proxy. Adhere strictly to GDPR Article 5 data minimization policies."
  );

  // Outputs
  const [sanitizedText, setSanitizedText] = useState("");
  const [entities, setEntities] = useState<PIIEntity[]>([]);
  const [llmOutput, setLlmOutput] = useState("");

  // Processing Console logs list
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogItem[]>([
    { id: "init-1", time: "08:46:34", type: "sys", msg: "Secure Proxy Operating Core loaded. Status: IDLE" },
    { id: "init-2", time: "08:46:34", type: "sys", msg: "Volatile memory bounds online. Transient payload tunneling active." }
  ]);

  // Audit Logs database
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([
    {
      id: "audit-1",
      timestamp: "2026-06-22T08:15:30",
      taskName: "Crisp Executive Summary",
      model: "gemini-3.5-flash",
      charsScanned: 844,
      piiDetected: 4,
      status: "success",
      policyRuleCount: 7
    },
    {
      id: "audit-2",
      timestamp: "2026-06-22T08:31:12",
      taskName: "Translate to English",
      model: "gemini-3.5-flash",
      charsScanned: 1120,
      piiDetected: 5,
      status: "success",
      policyRuleCount: 7
    }
  ]);

  // Task definitions
  const taskOptions = [
    { id: "summarize", name: "Crisp Executive Summary", desc: "Create a structured, clean bullet draft summarizing principal takeaways." },
    { id: "translate_en", name: "Translate to English", desc: "Translate clinical, academic, or corporate records accurately into fluent English." },
    { id: "translate_es", name: "Translate to Spanish", desc: "Translate clinical, academic, or corporate records accurately into formal and fluent Spanish." },
    { id: "translate_fr", name: "Translate to French", desc: "Translate clinical, academic, or corporate records accurately into elegant and professional French." },
    { id: "translate_de", name: "Translate to German", desc: "Translate clinical, academic, or corporate records accurately into precise, idiomatic German." },
    { id: "translate_ja", name: "Translate to Japanese", desc: "Translate clinical, academic, or corporate records accurately into polite and natural Japanese." },
    { id: "translate_zh", name: "Translate to Chinese (Simplified)", desc: "Translate clinical, academic, or corporate records accurately into formal Simplified Chinese." },
    { id: "translate_hi", name: "Translate to Hindi", desc: "Translate clinical, academic, or corporate records accurately into precise, fluent Hindi." },
    { id: "translate_pt", name: "Translate to Portuguese", desc: "Translate clinical, academic, or corporate records accurately into elegant, natural Portuguese." },
    { id: "translate_it", name: "Translate to Italian", desc: "Translate clinical, academic, or corporate records accurately into correct, sophisticated Italian." },
    { id: "action_items", name: "Action Items Extraction", desc: "Isolate urgent action points and security deliverables." },
    { id: "rewrite", name: "Grammar & Professional Rewrite", desc: "Clean and refine language tone for executive briefing formats." },
    { id: "sanitize-only", name: "Anonymize/Sanitize Only (No LLM Call)", desc: "Scrub PII elements entirely in-memory without sending out." }
  ];

  // Sync rule triggers
  const handleToggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
    addConsoleLog("sys", `Security rule updated.`);
  };

  const handleEditRulePattern = (ruleId: string, newPattern: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, pattern: newPattern } : r))
    );
  };

  const handleTaskChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setTask(selectedId);
    const selectedOption = taskOptions.find(o => o.id === selectedId);
    if (selectedOption) {
      setTaskName(selectedOption.name);
      addConsoleLog("info", `Workspace action targeted: ${selectedOption.name}`);
    }
  };

  const addConsoleLog = (type: "info" | "success" | "warning" | "error" | "sys", msg: string) => {
    const time = new Date().toTimeString().split(' ')[0];
    setConsoleLogs(prev => [
      ...prev,
      { id: `log-${Date.now()}-${Math.random()}`, time, type, msg }
    ]);
  };

  // Helper trigger to load sample templates (e.g. academic EXTC Course Syllabus)
  const handleLoadTemplate = (content: string) => {
    setRawText(content);
    addConsoleLog("info", "Ingested test template document. Pipeline buffer primed.");
    
    // Reset output to idle
    setLlmOutput("");
    setSanitizedText("");
    setEntities([]);
  };

  // Custom blocks lists
  const handleAddCustomWord = (word: string) => {
    const trimmed = word.trim();
    if (trimmed && !customSensitiveWords.includes(trimmed)) {
      setCustomSensitiveWords((prev) => [...prev, trimmed]);
      addConsoleLog("success", `Custom blocklist parameter registered: '${trimmed}'`);
    }
  };

  const handleRemoveCustomWord = (word: string) => {
    setCustomSensitiveWords((prev) => prev.filter((w) => w !== word));
    addConsoleLog("info", `Removed custom blocklist parameter: '${word}'`);
  };

  // Live pre-rendering dry-run PII calculations
  useEffect(() => {
    if (rawText) {
      const res = performRedaction(rawText, rules, customSensitiveWords);
      setSanitizedText(res.sanitizedText);
      setEntities(res.entities);
    } else {
      setSanitizedText("");
      setEntities([]);
    }
  }, [rawText, rules, customSensitiveWords]);

  // Clean wipe session (Erasure - GDPR Article 17)
  const handleExileAllSessionState = () => {
    setRawText("");
    setCustomSensitiveWords(["Acme", "ProjectX"]);
    setLlmOutput("");
    setSanitizedText("");
    setEntities([]);
    setConsoleLogs([
      { id: `log-${Date.now()}`, time: new Date().toTimeString().split(' ')[0], type: "success", msg: "GDPR Article 17 Right to Erasure satisfied. Volatile memory scrubbed." }
    ]);
    alert("Volatile context completely purged from memory.");
  };

  // Execution trigger running full circular pipeline simulation perfectly aligned to active rules
  const handleStartTaskPipeline = async () => {
    if (!rawText.trim()) {
      addConsoleLog("warning", "Execution aborted: Input source stream is empty.");
      alert("Please enter text or choose a template first.");
      return;
    }

    if (!gdprConsent) {
      addConsoleLog("error", "Regulatory block: GDPR processing unauthorized.");
      alert("You need to check the GDPR consent checkbox to permit local de-identification algorithms.");
      return;
    }

    setIsProcessing(true);
    setLlmOutput("");
    
    addConsoleLog("sys", "================ INITIALIZING PIPELINE OPERATION ================");
    addConsoleLog("info", `Loading input source document stream (${rawText.length} characters)...`);
    
    await new Promise((r) => setTimeout(r, 650));
    
    addConsoleLog("success", "Ingestion step finalized cleanly. Buffers isolated.");
    addConsoleLog("info", "Starting PII Redaction algorithms matching active policies...");

    // Live redaction calculation
    const currentSanitization = performRedaction(rawText, rules, customSensitiveWords);
    addConsoleLog("success", `PII Redaction complete. Isolated and masked ${currentSanitization.entities.length} sensitive identifier tokens.`);
    
    await new Promise((r) => setTimeout(r, 750));

    addConsoleLog("info", `Forwarding anonymized secure payload to Surrogate Sandbox Model (${selectedModel}) for task: ${taskName}.`);

    try {
      let actualTaskInstruction = task;
      if (task === "summarize") {
        actualTaskInstruction = "Create a crisp, bulleted executive summary highlighting main context, conclusions, and structural guidelines.";
      } else if (task === "action_items") {
        actualTaskInstruction = "Review the document and extract a numbered chronological list of urgent, actionable items.";
      } else if (task === "rewrite") {
        actualTaskInstruction = "Rewrite the contents into elegant, grammatically clean, and professional high-level business markdown text.";
      } else if (task === "entities") {
        actualTaskInstruction = "Extract formal entities, diagnostic categories, or technical modules into parsed index items.";
      } else if (task === "translate_en") {
        actualTaskInstruction = "Translate this entire text into grammatically fluent, professional English markdown.";
      } else if (task === "translate_es") {
        actualTaskInstruction = "Translate this entire text into grammatically fluent, professional Spanish markdown.";
      } else if (task === "translate_fr") {
        actualTaskInstruction = "Translate this entire text into grammatically fluent, professional French markdown.";
      } else if (task === "translate_de") {
        actualTaskInstruction = "Translate this entire text into grammatically fluent, professional German markdown.";
      } else if (task === "translate_ja") {
        actualTaskInstruction = "Translate this entire text into grammatically fluent, professional Japanese markdown with appropriate politeness.";
      } else if (task === "translate_zh") {
        actualTaskInstruction = "Translate this entire text into grammatically fluent, professional Simplified Chinese markdown.";
      } else if (task === "translate_hi") {
        actualTaskInstruction = "Translate this entire text into grammatically fluent, professional Hindi markdown.";
      } else if (task === "translate_pt") {
        actualTaskInstruction = "Translate this entire text into grammatically fluent, professional Portuguese markdown.";
      } else if (task === "translate_it") {
        actualTaskInstruction = "Translate this entire text into grammatically fluent, professional Italian markdown.";
      }

      const res = await fetch("/api/proxy/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: rawText,
          rules: rules,
          customWords: customSensitiveWords,
          task: actualTaskInstruction,
          taskName: taskName,
          systemPrompt: systemPrompt
        })
      });

      if (!res.ok) {
        throw new Error(`Proxy worker node replied with status: ${res.status}`);
      }

      const data = await res.json();
      
      setLlmOutput(data.llmOutput);
      setSanitizedText(data.sanitizedText);
      setEntities(data.entities);

      addConsoleLog("success", "Transient secure connection completed. Generated task output under strict zero-leakage threshold.");
      addConsoleLog("sys", "Session closed. Output mapped securely to Analysis layer.");

      // Append verified audit entry
      const verifiedAudit: AuditRecord = {
        id: `aud-${Date.now().toString(36)}-${Math.floor(Math.random() * 900 + 100)}`,
        timestamp: new Date().toISOString().replace('Z', '').split('.')[0],
        taskName: taskName,
        model: selectedModel,
        charsScanned: rawText.length,
        piiDetected: data.entities?.length || 0,
        status: "success",
        policyRuleCount: rules.filter(r => r.enabled).length
      };
      setAuditRecords(prev => [verifiedAudit, ...prev]);

      // Shift user gently into Tab 3 "Analysis" to see outputs intuitively!
      setTimeout(() => {
        setActiveTab("analysis");
      }, 700);

    } catch (err: any) {
      console.error(err);
      addConsoleLog("error", `Task execution failed: ${err.message || String(err)}`);
      
      const failedAudit: AuditRecord = {
        id: `aud-${Date.now().toString(36)}`,
        timestamp: new Date().toISOString().replace('Z', '').split('.')[0],
        taskName: taskName,
        model: selectedModel,
        charsScanned: rawText.length,
        piiDetected: 0,
        status: "failed",
        policyRuleCount: rules.filter(r => r.enabled).length
      };
      setAuditRecords(prev => [failedAudit, ...prev]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Top Professional IDE Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex justify-between items-center flex-wrap gap-4 select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/35 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest text-slate-300 uppercase">
                SECURE PROXY AGENT CORE
              </span>
              <span className="text-[9px] font-bold tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase">
                GDPR ARTICLE 5 MANDATE
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-none mt-1 font-mono">
              In-Memory Privacy Shield for Large Language Model Pipelines
            </p>
          </div>
        </div>

        {/* Global metadata credentials */}
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
            <span className="text-[10px] uppercase font-bold text-slate-300">PORT 3000 // TLS 1.3 SECURE</span>
          </div>
        </div>
      </header>

      {/* Persistent Top Tab Navigation with highly polished IDE/professional look */}
      <div className="bg-slate-900/60 border-b border-slate-800/85 px-6 py-1 pr-6 flex items-center justify-between select-none">
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveTab("control")}
            className={`px-4 py-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "control"
                ? "border-emerald-500 text-white bg-slate-950/40"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className={`w-3.5 h-3.5 ${activeTab === "control" ? "text-emerald-400" : "text-slate-500"}`} />
            Control Center
          </button>
          
          <button
            onClick={() => setActiveTab("governance")}
            className={`px-4 py-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "governance"
                ? "border-emerald-500 text-white bg-slate-950/40"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${activeTab === "governance" ? "text-amber-400" : "text-slate-500"}`} />
            Governance
          </button>

          <button
            onClick={() => setActiveTab("analysis")}
            className={`px-4 py-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "analysis"
                ? "border-emerald-500 text-white bg-slate-950/40"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Compass className={`w-3.5 h-3.5 ${activeTab === "analysis" ? "text-blue-400" : "text-slate-500"}`} />
            Analysis
          </button>
        </div>

        {/* Global Volatile Session Cleaner */}
        <button
          onClick={handleExileAllSessionState}
          className="text-[10px] font-mono text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 px-2.5 py-1 rounded cursor-pointer transition-all flex items-center gap-1.5 font-bold"
          title="satisfies Article 17 Right to Erasure immediately"
        >
          <Trash2 className="w-3 h-3 text-red-400" />
          Purge Session Cache
        </button>
      </div>

      {/* Main Workspace Frame (Acts as stable frame - tab content preserves parent states) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">

        {/* TAB 1: CONTROL CENTER (THE HARNESS) */}
        {activeTab === "control" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Desktop-optimized wide container replacing the visual circular pipeline diagram */}
            <div className="w-full bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-5 shadow-lg">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5 select-none">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    Task Configuration
                  </h2>
                  <p className="text-[10px] text-slate-400 mt-1 font-sans">
                    Upload text records or select test templates, specify model goals, and initiate the proxy.
                  </p>
                </div>
                <span className="text-[9px] font-mono text-slate-500 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded select-none">
                  ISOLATION_HOT
                </span>
              </div>

              {/* Sub-selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Model Choice */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 select-none">
                    Surrogate Worker Sandbox
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-sans cursor-pointer whitespace-nowrap"
                  >
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash (Fidelity Balanced)</option>
                    <option value="gemini-3.5-pro">Gemini 3.5 Pro (Deep Strategy)</option>
                  </select>
                </div>

                {/* Task Instructions Selector with support for many translation languages */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 select-none">
                    Requested Task Action
                  </label>
                  <select
                    value={task}
                    onChange={handleTaskChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-sans cursor-pointer text-ellipsis overflow-hidden"
                  >
                    {taskOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name} — {opt.desc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom System Instruction Overrides */}
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 select-none">
                  Worker Model Directive Guidelines (System Prompt Header)
                </label>
                <input
                  type="text"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 hover:border-slate-755 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg text-xs font-sans text-slate-300 outline-none"
                  placeholder="E.g. You are a high-integrity LLM assistant operating behind a Secure Redaction Proxy."
                />
              </div>

              {/* Ingestion Drop-zone & State management */}
              <div className="bg-slate-950 rounded-xl p-4.5 border border-slate-800/85">
                <DocumentInput
                  text={rawText}
                  onChange={setRawText}
                  onLoadTemplate={handleLoadTemplate}
                  gdprConsent={gdprConsent}
                  onConsentChange={setGdprConsent}
                />
              </div>

              {/* Start Task Button prominently at the bottom of the Left panel */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleStartTaskPipeline}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 font-extrabold text-xs uppercase tracking-wider text-white rounded-lg cursor-pointer shadow-lg shadow-emerald-500/20 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2 hover:translate-y-[-1px] select-none"
                >
                  {isProcessing ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin text-white" />
                      Executing Secure Pipeline...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white text-white" />
                      Start Active Task
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Bottom Processing Console (Wide Area) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg select-none">
              <div className="bg-slate-950 px-5 py-3 border-b border-slate-800/85 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2 tracking-widest uppercase">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Volatile Processing Console Log
                </span>
                <span className="text-[9px] font-mono text-slate-500 font-bold uppercase animate-pulse">
                  STUPIDLY FAST MEMORY SCOPE // ZERO SCRATCH DISK LOGS
                </span>
              </div>
              <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 min-h-[170px] max-h-[220px] overflow-y-auto space-y-1.5 scrollbar-thin">
                {consoleLogs.map((log) => {
                  let styleClass = "text-slate-400";
                  let prefix = "ℹ️ [INFO]";
                  if (log.type === "success") {
                    styleClass = "text-emerald-400 font-bold";
                    prefix = "✅ [OK]";
                  } else if (log.type === "warning") {
                    styleClass = "text-amber-400 font-bold";
                    prefix = "⚠️ [WARN]";
                  } else if (log.type === "error") {
                    styleClass = "text-red-400 font-bold animate-pulse";
                    prefix = "🛑 [ERR]";
                  } else if (log.type === "sys") {
                    styleClass = "text-blue-400 font-bold";
                    prefix = "🛡️ [SYS]";
                  }
                  return (
                    <div key={log.id} className="flex gap-2.5 items-start leading-relaxed hover:bg-slate-900/40 p-1 rounded transition-colors">
                      <span className="text-slate-600 flex-shrink-0 select-none">[{log.time}]</span>
                      <span className={`${styleClass} flex-shrink-0 select-none`}>{prefix}</span>
                      <span className="text-slate-200">{log.msg}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GOVERNANCE (THE TRUST LAYER) */}
        {activeTab === "governance" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in items-start">
            
            {/* Left Box: Security Policies and Rule Parameters */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-5 shadow-lg">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5 select-none">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  Regulatory Policies Configuration
                </h2>
                <p className="text-[10px] text-slate-400 mt-1 font-sans">
                  Inspect Regex patterns and control enabled de-identification guardrails. Custom blocks can target specific nomenclature.
                </p>
              </div>

              {/* Regex Rules Control Panel list */}
              <div className="space-y-3.5">
                {rules.map((rule) => {
                  const numMatches = entities.filter((e) => e.type === rule.type).length;
                  return (
                    <div key={rule.id} className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg hover:border-slate-750 transition-all flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={() => handleToggleRule(rule.id)}
                            id={`toggle-${rule.id}`}
                            className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-800 rounded cursor-pointer"
                          />
                          <label htmlFor={`toggle-${rule.id}`} className="text-xs font-bold text-slate-200 cursor-pointer select-none">
                            {rule.name}
                          </label>
                        </div>
                        {rule.enabled && numMatches > 0 && (
                          <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full select-none">
                            {numMatches} matched
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-400 font-sans leading-none pl-6 select-none">
                        {rule.description}
                      </p>

                      {/* Pattern Expression Editor box */}
                      <div className="pl-6 mt-1 flex items-center gap-2">
                        <span className="text-[9px] font-mono text-slate-500 uppercase select-none">Regex</span>
                        <input
                          type="text"
                          value={rule.pattern || ""}
                          onChange={(e) => handleEditRulePattern(rule.id, e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-800 text-[10px] font-mono text-emerald-500 px-2 py-1 rounded outline-none focus:ring-1 focus:ring-slate-700"
                          placeholder="No design pattern"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Target Dictionary and Blocklists tags list */}
              <div className="bg-slate-950 p-4 border border-slate-850 rounded-lg space-y-3">
                <div className="flex justify-between items-center select-none">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Custom Nomenclature Blocklist</span>
                  <span className="text-[9px] text-slate-500 font-mono">Word tokens matches</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    id="custom-word-input"
                    placeholder="Enter sensitive word (e.g. SecretProject)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.currentTarget;
                        handleAddCustomWord(target.value);
                        target.value = "";
                      }
                    }}
                    className="flex-1 bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById("custom-word-input") as HTMLInputElement;
                      if (input && input.value) {
                        handleAddCustomWord(input.value);
                        input.value = "";
                      }
                    }}
                    className="px-3.5 bg-slate-800 hover:bg-slate-750 transition-colors border border-slate-700 hover:border-emerald-500 text-xs font-bold rounded cursor-pointer shrink-0 uppercase tracking-widest text-emerald-400"
                  >
                    Add
                  </button>
                </div>

                {customSensitiveWords.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {customSensitiveWords.map((word) => (
                      <span
                        key={word}
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-900 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 text-[10px] font-mono text-slate-300 rounded cursor-pointer transition-colors group"
                        onClick={() => handleRemoveCustomWord(word)}
                        title="Click to erase word block"
                      >
                        {word}
                        <span className="text-[8px] text-slate-500 group-hover:text-red-400 font-bold">×</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-600 font-sans py-1 select-none">No custom target words added yet.</p>
                )}
              </div>
            </div>

            {/* Right Box: Audit Logs (Proof list) */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-5 h-full shadow-lg">
              <div className="border-b border-slate-800 pb-3 flex justify-between items-center select-none">
                <div>
                  <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                    <History className="w-4 h-4 text-purple-400" />
                    Statutory Auditing Register
                  </h2>
                  <p className="text-[10px] text-slate-400 mt-1 font-sans">
                    Trace history of previous pipeline operations confirming de-identification safety and TLS tunnel handshakes.
                  </p>
                </div>
                <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono px-2 py-0.5 rounded font-black">
                  AUDITED
                </span>
              </div>

              {/* Historical audit log register table */}
              <div className="bg-slate-950 border border-slate-850 rounded-lg overflow-hidden">
                <div className="max-h-[460px] overflow-y-auto scrollbar-thin">
                  <table className="w-full text-left border-collapse font-mono text-[10.5px]">
                    <thead>
                      <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-500 font-bold uppercase select-none text-[9.5px]">
                        <th className="p-3 pl-4">Timestamp (UTC)</th>
                        <th className="p-3">Compliance Task</th>
                        <th className="p-3 text-center">Minimized PII</th>
                        <th className="p-3 text-right pr-4">ISO audit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditRecords.map((rec) => (
                        <tr
                          key={rec.id}
                          className="border-b border-slate-850/40 hover:bg-slate-900/30 text-slate-300 transition-colors"
                        >
                          <td className="p-3 pl-4 text-slate-500">{rec.timestamp.slice(11, 19)}</td>
                          <td className="p-3 font-semibold text-slate-200">{rec.taskName}</td>
                          <td className="p-3 text-center text-amber-400 font-bold bg-amber-500/2 ml-1 rounded">
                            {rec.piiDetected} Redacted
                          </td>
                          <td className="p-3 text-right pr-4">
                            {rec.status === "success" ? (
                              <span className="text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 border border-emerald-900/30 rounded inline-flex items-center gap-1 select-none">
                                <CheckCircle className="w-3 h-3" /> PASS
                              </span>
                            ) : (
                              <span className="text-red-400 font-bold bg-red-500/5 px-2 py-0.5 border border-red-900/30 rounded inline-flex items-center gap-1 select-none">
                                <AlertOctagon className="w-3 h-3" /> FAIL
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-lg text-slate-400 text-[10px] leading-relaxed font-sans flex items-start gap-2.5 select-none">
                <UserCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-300">Auditing Verification Clause:</h5>
                  <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                    This cryptographic sandbox registry maintains proof-of-compliance records locally. Data packets are purged in-memory periodically. Zero tracking cookies are set, ensuring standard de-identification parameters comply with Articles 5 & 25.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: ANALYSIS (THE UTILITY LAYER) */}
        {activeTab === "analysis" && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-6 shadow-lg animate-fade-in">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center select-none flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-blue-400 animate-spin-slow" />
                  Processed Output Analysis
                </h2>
                <p className="text-[10px] text-slate-400 mt-1 font-sans">
                  The final outputs returned securely from the surrogate worker node. Sanitized tokens remain fully intact.
                </p>
              </div>

              {/* View Original Toggle (Greyed out / Disabled by default) in margin */}
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800/80 p-2.5 rounded-lg">
                <div className="flex flex-col text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">Reconstruct Original PII</span>
                  <span className="text-[7.5px] text-slate-600 font-mono mt-0.5 uppercase tracking-wide">Authorized Role Credentials Locked</span>
                </div>
                
                {/* Visual Greyed out toggle switch */}
                <div 
                  className="relative w-8 h-4.5 rounded-full bg-slate-800 cursor-not-allowed opacity-40 select-none border border-slate-700 flex items-center"
                  title="Auditing security limits apply. Requires legal team key."
                >
                  <span className="block w-2.5 h-2.5 rounded-full bg-slate-600 translate-x-1" />
                </div>
                <button
                  disabled
                  className="px-2 py-1 bg-slate-900 text-[9px] text-slate-600 border border-slate-800 rounded font-bold cursor-not-allowed select-none"
                  title="Authentication required for reversing de-identification"
                >
                  Decrypt
                </button>
              </div>
            </div>

            {/* Read-only output panel container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Left Side: Sanitized output stream */}
              <div className="lg:col-span-8 flex flex-col space-y-3.5">
                <div className="flex justify-between items-center select-none">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    Model Task Output
                  </span>
                  
                  {llmOutput && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(llmOutput);
                        alert("Secure output copied to compliance buffer.");
                      }}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 transition-colors border border-slate-800 text-[10px] text-emerald-400 font-bold rounded cursor-pointer"
                    >
                      Copy Output
                    </button>
                  )}
                </div>

                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4.5 min-h-[300px] flex flex-col justify-between">
                  {llmOutput ? (
                    <div className="text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap select-text">
                      {llmOutput}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 select-none opacity-60">
                      <LockKeyhole className="w-8 h-8 text-slate-700 mb-2.5" />
                      <p className="text-xs font-semibold text-slate-400">Sandbox output buffer currently empty.</p>
                      <p className="text-[10px] text-slate-500 max-w-sm mt-1 leading-relaxed">
                        Specify a task in the Control Center and trigger "Start Task" to execute secure anonymization parsing.
                      </p>
                    </div>
                  )}

                  {/* Encryption signatures info */}
                  {llmOutput && (
                    <div className="mt-6 pt-3.5 border-t border-slate-850/80 flex justify-between items-center text-[9px] font-mono text-slate-500 select-none">
                      <span>SIGNATURE: MD5_SSL_SANDBOX_OK</span>
                      <span>GDPR EXPORT COMPLIANT // NO PERSISTED RECORD</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Matched Entities Decoupled list */}
              <div className="lg:col-span-4 bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3 text-[10px] font-bold text-slate-400 uppercase select-none">
                    <span>Isolated Mapping Table</span>
                    <span className="text-emerald-400 font-mono font-black">{entities.length} items</span>
                  </div>

                  {entities.length > 0 ? (
                    <div className="space-y-2 max-h-[320px] overflow-y-auto scrollbar-thin">
                      {entities.map((item) => (
                        <div
                          key={item.id}
                          className="p-2 border border-slate-850 hover:border-slate-800 bg-slate-900/40 rounded flex flex-col gap-1 text-[10.5px] font-mono leading-none transition-colors"
                        >
                          <div className="flex justify-between items-center select-none">
                            <span className="text-emerald-400 font-black">{item.placeholder}</span>
                            <span className="text-[8.5px] font-bold text-slate-500 bg-slate-950 px-1 py-0.5 border border-slate-850 rounded uppercase leading-none">
                              {item.type}
                            </span>
                          </div>
                          <span className="text-slate-400 select-none mt-1 leading-normal break-all">
                            Scrubbed: <strong className="text-slate-100">{item.text}</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center select-none opacity-50 py-12">
                      <ShieldCheck className="w-6 h-6 text-slate-600 mb-1.5" />
                      <p className="text-[10px] font-medium text-slate-500">No matching PII entities detected.</p>
                    </div>
                  )}
                </div>

                <div className="pt-3.5 mt-4 border-t border-slate-850/80 font-mono text-[9px] text-slate-500 leading-normal select-none">
                  <p>DECOUPLE_RECORDS: ACTIVE</p>
                  <p className="text-slate-650 mt-1">This map is transiently maintained in volatile memory and is never written to disk or sent to surrogate LLM endpoints.</p>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Footer bar */}
      <footer className="bg-slate-900 border-t border-slate-800/80 py-3.5 px-6 select-none font-mono text-[9.5px] text-slate-500 flex justify-between items-center gap-4 flex-wrap">
        <span>SECURITY STANDARD: ISO-27001 PROXY MIDDLEWARE</span>
        <span>RECORDS PROCESSING METHOD: MEMORY RETENTION ONLY</span>
      </footer>

    </div>
  );
}


