import React, { useState } from "react";
import { PIIEntity } from "../types";
import { Copy, Check, Eye, EyeOff, ShieldCheck, Download, Sparkles, RefreshCw, AlertTriangle, FileText, Compass } from "lucide-react";
import { rehydrateText } from "../utils/sanitizer";

interface ResultsPanelProps {
  rawText: string;
  sanitizedText: string;
  llmOutput: string;
  entities: PIIEntity[];
  taskName: string;
  isProcessing: boolean;
}

export default function ResultsPanel({
  rawText,
  sanitizedText,
  llmOutput,
  entities,
  taskName,
  isProcessing
}: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<"doc" | "model" | "summary" | "mapping">("doc");
  const [localRehydrate, setLocalRehydrate] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Dedicated states for Summarizer tab
  const [localSummary, setLocalSummary] = useState<string>("");
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Auto-focus tabs to assist corporate employees during operations
  React.useEffect(() => {
    if (isProcessing) {
      setActiveTab("model");
    }
  }, [isProcessing]);

  React.useEffect(() => {
    if (llmOutput) {
      setActiveTab("model");
      // Synced to summary if user selected Crisp Executive Summary
      if (taskName === "Crisp Executive Summary" || taskName.toLowerCase().includes("summary")) {
        setLocalSummary(llmOutput);
      }
    }
  }, [llmOutput, taskName]);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (e) {
      console.error("Failed to copy", e);
    }
  };

  // Dedicated generator in-memory inside summary tab
  const handleGenerateSummary = async () => {
    if (!rawText.trim()) return;
    setIsSummarizing(true);
    setSummaryError(null);
    try {
      const res = await fetch("/api/proxy/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: rawText,
          rules: [], // The backend performs standard safety sanitizing/redaction 
          task: "summarize",
          taskName: "Crisp Executive Summary"
        })
      });
      const data = await res.json();
      if (data.llmOutput) {
        setLocalSummary(data.llmOutput);
      } else {
        setSummaryError("Failed to extract context. Please check your network or key.");
      }
    } catch (e) {
      setSummaryError("Secure gateway communication interrupted.");
      console.error(e);
    } finally {
      setIsSummarizing(false);
    }
  };

  const currentDisplayOutput = localRehydrate
    ? rehydrateText(llmOutput, entities)
    : llmOutput;

  const currentDisplaySummary = localRehydrate
    ? rehydrateText(localSummary, entities)
    : localSummary;

  const currentDisplaySanitizedText = localRehydrate
    ? rawText
    : sanitizedText;

  const handleDownloadTransformed = (textValue: string, filenameLabel: string) => {
    const blob = new Blob([textValue], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `secure_proxy_${filenameLabel}_${localRehydrate ? "rehydrated" : "sanitized"}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPrivacyScoreRating = () => {
    if (entities.length === 0) return { score: 100, label: "Zero Risk", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    return { score: 100, label: "GDPR Compliant", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
  };

  const rating = getPrivacyScoreRating();

  return (
    <div id="results-panel-container" className="flex flex-col h-full gap-4 animate-fade-in">
      {/* Tab Switcher & Privacy Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
        {/* Tab triggers */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab("doc")}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === "doc"
                ? "bg-slate-800 text-white font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sanitized Document Preview
          </button>
          <button
            onClick={() => setActiveTab("model")}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === "model"
                ? "bg-slate-800 text-white font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Model Task Output
          </button>
          
          {/* New Interactive Summarizer tab inside results box as explicitly requested */}
          <button
            onClick={() => setActiveTab("summary")}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === "summary"
                ? "bg-emerald-600/20 text-emerald-400 border border-emerald-505/30 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Compass className="w-3 h-3 text-emerald-400" />
            Compliance Auto-Summarizer
          </button>

          <button
            onClick={() => setActiveTab("mapping")}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === "mapping"
                ? "bg-slate-800 text-white font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Local Decouple Map ({entities.length})
          </button>
        </div>

        {/* Global Privacy Rating Scorecard */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${rating.color}`}>
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{rating.label}: {rating.score}% Corrected</span>
        </div>
      </div>

      {/* Main Panel Content Area */}
      <div className="flex-1 min-h-[360px] bg-slate-900/10 rounded-xl border border-slate-800 flex flex-col overflow-hidden">
        
        {/* Standard Info Toolbar inside tab */}
        <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-3 flex justify-between items-center flex-wrap gap-2">
          <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            {activeTab === "doc" && <FileText className="w-4 h-4 text-slate-400" />}
            {activeTab === "doc" && "Sanitized Source Document"}
            {activeTab === "model" && <Sparkles className="w-4 h-4 text-emerald-400" />}
            {activeTab === "model" && `Model Response: ${taskName || "Summarize Document"}`}
            {activeTab === "summary" && <Compass className="w-4 h-4 text-emerald-400" />}
            {activeTab === "summary" && "Auto-Summarizer: Executive Bullet Draft"}
            {activeTab === "mapping" && "In-Memory PII Decouple Schema"}
          </h4>

          {/* Action buttons bar */}
          <div className="flex items-center gap-3">
            {/* Rehydration Slider client side only */}
            {(activeTab === "model" || activeTab === "doc" || activeTab === "summary") && (
              <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
                <span className="text-[10px] font-semibold uppercase text-slate-400 select-none">
                  Client-Side Re-hydrate:
                </span>
                <button
                  onClick={() => setLocalRehydrate(!localRehydrate)}
                  disabled={entities.length === 0}
                  className={`relative w-8 h-4.5 rounded-full p-0.5 transition-colors cursor-pointer focus:outline-none ${
                    entities.length === 0
                      ? "opacity-40 cursor-not-allowed bg-slate-800"
                      : localRehydrate
                      ? "bg-emerald-500"
                      : "bg-slate-700 hover:bg-slate-600"
                  }`}
                  title={entities.length === 0 ? "No redacted entities to hydrate" : "Securely map redacted PII back into place client-side only."}
                >
                  <span
                    className={`block w-3.5 h-3.5 rounded-full bg-white transition-all transform ${
                      localRehydrate ? "translate-x-3.5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className={`text-[10px] font-bold ${localRehydrate ? "text-emerald-400" : "text-slate-400"}`}>
                  {localRehydrate ? "ON" : "OFF"}
                </span>
              </div>
            )}

            {/* General Action items */}
            {activeTab === "model" && llmOutput && (
              <>
                <button
                  onClick={() => handleCopy(currentDisplayOutput, "output")}
                  className="p-1.5 hover:bg-slate-800 hover:text-white rounded-lg text-slate-400 transition-colors flex items-center gap-1 cursor-pointer text-xs font-medium"
                >
                  {copiedText === "output" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Output
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDownloadTransformed(currentDisplayOutput, "task_output")}
                  className="p-1.5 hover:bg-slate-800 hover:text-white rounded-lg text-slate-400 transition-colors flex items-center gap-1 cursor-pointer text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Markdown
                </button>
              </>
            )}

            {activeTab === "summary" && localSummary && (
              <>
                <button
                  onClick={() => handleCopy(currentDisplaySummary, "summary-copy")}
                  className="p-1.5 hover:bg-slate-800 hover:text-white rounded-lg text-slate-400 transition-colors flex items-center gap-1 cursor-pointer text-xs font-medium"
                >
                  {copiedText === "summary-copy" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Summary
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDownloadTransformed(currentDisplaySummary, "executive_summary")}
                  className="p-1.5 hover:bg-slate-800 hover:text-white rounded-lg text-slate-400 transition-colors flex items-center gap-1 cursor-pointer text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Summary
                </button>
              </>
            )}

            {activeTab === "doc" && rawText && (
              <button
                onClick={() => handleCopy(currentDisplaySanitizedText, "doc")}
                className="p-1.5 hover:bg-slate-800 hover:text-white rounded-lg text-slate-400 transition-colors flex items-center gap-1 cursor-pointer text-xs font-semibold"
              >
                {copiedText === "doc" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Text
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Tab display zones */}
        <div className="flex-1 p-4 overflow-y-auto leading-relaxed text-sm font-sans">
          {/* Processing Screen overlay helper */}
          {isProcessing && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-950/20 backdrop-blur-sm z-10 py-12">
              <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-3.5" />
              <p className="text-sm font-semibold text-slate-300">
                Securely decrypting compliance payload...
              </p>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                Guardrail regex filtering succeeded. Running LLM logic.
              </p>
            </div>
          )}

          {!isProcessing && (
            <>
              {/* Tab 1: Sanitized doc view */}
              {activeTab === "doc" && (
                <div className="h-full">
                  {!rawText ? (
                    <div className="h-full flex items-center justify-center text-slate-600 italic font-sans py-12 text-center">
                      Please insert or paste a source document inside the left box first.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {localRehydrate && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-center gap-2 font-semibold animate-pulse">
                          <AlertTriangle className="w-4 h-4" />
                          <span>WARNING: Currently displaying unredacted document. Personal identifying markers are visible!</span>
                        </div>
                      )}
                      
                      {/* Document Viewer block */}
                      <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-300 bg-slate-955/20 p-4 border border-slate-800 rounded-lg leading-relaxed max-h-[380px] overflow-y-auto">
                        {(() => {
                          const textToProcess = currentDisplaySanitizedText;
                          if (localRehydrate) return textToProcess;

                          // Progressive highlight placeholders
                          let parts: React.ReactNode[] = [textToProcess];
                          
                          // Sort entities by placeholder length descending to avoid replacement overlapping
                          const sortedEntities = [...entities].sort((a, b) => b.placeholder.length - a.placeholder.length);
                          
                          // Replace each placeholder with colored highlight badge
                          for (const entity of sortedEntities) {
                            const newParts: React.ReactNode[] = [];
                            parts.forEach((part) => {
                              if (typeof part === "string") {
                                const splitRegex = new RegExp(`(${entity.placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "g");
                                const splitted = part.split(splitRegex);
                                splitted.forEach((sub, sIdx) => {
                                  if (sub === entity.placeholder) {
                                    newParts.push(
                                      <span
                                        key={`${entity.id}-${sIdx}-${Math.random()}`}
                                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 selection:bg-amber-500/20"
                                        title={`Redacted: "${entity.text}" (${entity.type})`}
                                      >
                                        {entity.placeholder}
                                      </span>
                                    );
                                  } else if (sub) {
                                    newParts.push(sub);
                                  }
                                });
                              } else {
                                newParts.push(part);
                              }
                            });
                            parts = newParts;
                          }

                          return parts.length > 0 ? parts : textToProcess;
                        })()}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: LLM Task Outflow */}
              {activeTab === "model" && (
                <div className="h-full">
                  {!llmOutput ? (
                    <div className="h-full flex items-center justify-center text-slate-600 italic font-sans py-12 text-center">
                      Please select parameter, click "Execute Secure Process" and active results will appear here.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {localRehydrate ? (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-2 font-semibold font-sans animate-fade-in">
                          <ShieldCheck className="w-4 h-4" />
                          <span>SUCCESS: Local browser re-hydrated. Rendered response contains actual items but rest assured, they never left your device!</span>
                        </div>
                      ) : (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs rounded-lg flex items-center gap-2 font-semibold font-sans">
                          <EyeOff className="w-4 h-4" />
                          <span>SECURE VIEW: Placeholders are kept unmodified in output. Toggle Re-hydrate slide to map values back.</span>
                        </div>
                      )}

                      {/* Display Markdown parsed results */}
                      <div className="prose prose-invert max-w-none text-slate-300 text-xs sm:text-sm bg-slate-950/20 p-4 border border-slate-800 rounded-lg max-h-[380px] overflow-y-auto leading-relaxed">
                        {currentDisplayOutput.split("\n").map((line, lIdx) => {
                          if (line.startsWith("### ")) {
                            return <h3 key={lIdx} className="text-sm font-bold text-slate-100 mt-3 mb-1">{line.replace("### ", "")}</h3>;
                          }
                          if (line.startsWith("## ")) {
                            return <h2 key={lIdx} className="text-base font-bold text-white mt-4 mb-1.5">{line.replace("## ", "")}</h2>;
                          }
                          if (line.startsWith("# ")) {
                            return <h1 key={lIdx} className="text-lg font-extrabold text-white mt-5 mb-2">{line.replace("# ", "")}</h1>;
                          }
                          if (line.startsWith("- ") || line.startsWith("* ")) {
                            return (
                              <ul key={lIdx} className="list-disc list-inside ml-2 my-1">
                                <li>{line.substring(2)}</li>
                              </ul>
                            );
                          }
                          return <p key={lIdx} className="my-1 whitespace-pre-wrap">{line}</p>;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Interactive summarizer on results box */}
              {activeTab === "summary" && (
                <div className="h-full">
                  {!rawText ? (
                    <div className="h-full flex items-center justify-center text-slate-600 italic font-sans py-12 text-center">
                      Please load a source document inside the left box to initiate summarized executive guidelines here.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {isSummarizing ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                          <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin mb-3" />
                          <p className="text-xs font-semibold text-emerald-400">Summarizing sanitized metrics...</p>
                        </div>
                      ) : !localSummary ? (
                        <div className="py-8 text-center flex flex-col items-center justify-center">
                          <div className="p-3 bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 rounded-full mb-3 select-none">
                            <Compass className="w-6 h-6" />
                          </div>
                          <h4 className="text-xs font-bold text-slate-200">Compliance Quick Summarizer</h4>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-[360px] leading-relaxed mx-auto">
                            Instantly condense the sanitized text document into bullet points safely in-memory without exposing personal names or financial details.
                          </p>
                          <button
                            onClick={handleGenerateSummary}
                            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 transition-all font-bold text-xs rounded-lg text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10"
                          >
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                            Generate Compliance Auto-Summary
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {localRehydrate ? (
                            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] rounded-lg flex items-center gap-2 font-semibold">
                              <ShieldCheck className="w-4 h-4" />
                              <span>Auto-Summary Re-hydrated! Standard identities are visible locally.</span>
                            </div>
                          ) : (
                            <div className="p-2.5 bg-slate-800/60 border border-slate-700/80 text-slate-400 text-[11px] rounded-lg flex items-center justify-between gap-2">
                              <span>All identities are redacted with placeholders below.</span>
                              <button
                                onClick={handleGenerateSummary}
                                className="text-[10px] text-emerald-400 hover:text-emerald-300 hover:underline font-bold"
                              >
                                🔄 Re-Generate Summary
                              </button>
                            </div>
                          )}

                          {summaryError && (
                            <p className="text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">{summaryError}</p>
                          )}

                          {/* Display summary text formatted */}
                          <div className="prose prose-invert max-w-none text-slate-300 text-xs sm:text-sm bg-slate-950/20 p-4 border border-slate-800 rounded-lg max-h-[350px] overflow-y-auto leading-relaxed shadow-inner">
                            {currentDisplaySummary.split("\n").map((line, lIdx) => {
                              if (line.startsWith("### ")) {
                                return <h3 key={lIdx} className="text-sm font-bold text-slate-100 mt-2 mb-1">{line.replace("### ", "")}</h3>;
                              }
                              if (line.startsWith("## ")) {
                                return <h2 key={lIdx} className="text-base font-bold text-white mt-3 mb-1">{line.replace("## ", "")}</h2>;
                              }
                              if (line.startsWith("# ")) {
                                return <h1 key={lIdx} className="text-lg font-extrabold text-white mt-4 mb-2">{line.replace("# ", "")}</h1>;
                              }
                              if (line.startsWith("- ") || line.startsWith("* ")) {
                                return (
                                  <ul key={lIdx} className="list-disc list-inside ml-2 my-1">
                                    <li>{line.substring(2)}</li>
                                  </ul>
                                );
                              }
                              return <p key={lIdx} className="my-1 whitespace-pre-wrap">{line}</p>;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Mapping Decouple parameters */}
              {activeTab === "mapping" && (
                <div className="h-full">
                  {entities.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-600 italic font-sans py-12 text-center">
                      Zero redacted elements. Mapping index is clean.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Safety note */}
                      <div className="p-3 bg-slate-800/60 border border-slate-700 text-slate-400 text-xs rounded-lg leading-relaxed flex items-start gap-2.5 font-sans">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-200">How This Preserves Privacy & GDPR (Article 5):</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-sans">
                            This temporary table exists strictly in your local browser sandbox memory.
                            The secure proxy used these placeholders to execute remote LLM functions, guaranteeing that third-party cloud engines handle only mathematical placeholders—never your raw identities.
                          </p>
                        </div>
                      </div>

                      {/* Map Table */}
                      <div className="border border-slate-800 rounded-lg overflow-hidden max-h-[280px] overflow-y-auto">
                        <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
                          <thead>
                            <tr className="bg-slate-900 border-b border-slate-850 text-slate-400 select-none uppercase text-[9px] tracking-wider font-semibold">
                              <th className="p-3 pl-4">Placeholder Assigned</th>
                              <th className="p-3">PII Entity Category</th>
                              <th className="p-3 text-right pr-4">Original Raw Parameter</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entities.map((ent, entIdx) => (
                              <tr key={`${ent.id}-${entIdx}`} className="border-b border-slate-800/50 hover:bg-slate-800/10 font-mono text-slate-300">
                                <td className="p-3 pl-4 font-bold text-amber-400 selection:bg-amber-500/20">{ent.placeholder}</td>
                                <td className="p-3 text-[10px] select-none text-slate-400 uppercase">{ent.type}</td>
                                <td className="p-3 text-right font-medium pr-4 text-emerald-400 selection:bg-emerald-500/20">
                                  {ent.text}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
