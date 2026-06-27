import React from "react";
import { motion } from "motion/react";
import { FileUp, ShieldAlert, CheckCircle2, Lock, Sparkles, RefreshCw, AlertTriangle } from "lucide-react";
import { ProxyLog } from "../types";

interface ProcessTraceProps {
  currentStep: "idle" | "redaction" | "sending" | "complete" | "error";
  logs: ProxyLog[];
  localRehydrated: boolean;
}

export default function ProcessTrace({ currentStep, logs, localRehydrated }: ProcessTraceProps) {
  const steps = [
    {
      id: "ingest",
      title: "Document Ingestion",
      desc: "TLS Secured Ingress",
      icon: FileUp,
      triggerStates: ["redaction", "sending", "complete", "error"]
    },
    {
      id: "guardrail",
      title: "Security Guardrails",
      desc: "Local Pattern Redacting",
      icon: ShieldAlert,
      triggerStates: ["redaction", "sending", "complete", "error"]
    },
    {
      id: "forward",
      title: "Secure Proxy Model Request",
      desc: "Gemini API Zero-Leak Processing",
      icon: Lock,
      triggerStates: ["sending", "complete"]
    },
    {
      id: "rehydrate",
      title: "Browser Client Re-hydration",
      desc: "Client-side Secure Decouple",
      icon: RefreshCw,
      triggerStates: ["complete"]
    }
  ];

  const getStepStatus = (step: typeof steps[0]) => {
    if (currentStep === "error") {
      if (step.id === "ingest" || step.id === "guardrail") return "success";
      if (step.id === "forward") return "error";
      return "idle";
    }

    if (currentStep === "idle") return "idle";

    if (currentStep === "redaction") {
      if (step.id === "ingest") return "success";
      if (step.id === "guardrail") return "active";
      return "idle";
    }

    if (currentStep === "sending") {
      if (step.id === "ingest" || step.id === "guardrail") return "success";
      if (step.id === "forward") return "active";
      return "idle";
    }

    if (currentStep === "complete") {
      if (step.id === "rehydrate") {
        return localRehydrated ? "success" : "idle";
      }
      return "success";
    }

    return "idle";
  };

  return (
    <div id="process-trace-container" className="flex flex-col gap-4 h-full">
      {/* Pipeline Visual Header */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
          Secure Proxy Operations Pipeline
        </h4>
        <p className="text-[10px] text-slate-500 font-sans">
          Real-time execution telemetry showing de-identification decoupling.
        </p>
      </div>

      {/* Steps Visual Chain */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
        {steps.map((step, idx) => {
          const status = getStepStatus(step);
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative flex flex-col items-center text-center group">
              {/* Connector line for sequential steps */}
              {idx < steps.length - 1 && (
                <div className="hidden sm:block absolute top-6 left-[65%] right-[-35%] h-[2px] bg-slate-800 z-0">
                  {status === "success" && (
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      className="h-full bg-emerald-500"
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </div>
              )}

              {/* Step Circle */}
              <div className="relative z-10">
                {status === "active" ? (
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                    className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 font-bold shadow-lg shadow-emerald-500/10"
                  >
                    <Icon className="w-5 h-5 animate-pulse" />
                  </motion.div>
                ) : status === "success" ? (
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                ) : status === "error" ? (
                  <div className="w-12 h-12 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center text-red-400 font-bold">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 font-bold group-hover:border-slate-600 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                )}
              </div>

              {/* Step Label Info */}
              <span className="text-[11px] font-semibold text-slate-200 mt-2.5 line-clamp-1">
                {step.title}
              </span>
              <span className="text-[9px] text-slate-500 mt-0.5 max-w-[130px] line-clamp-1 leading-normal font-sans">
                {step.desc}
              </span>
            </div>
          );
        })}
      </div>

      {/* Terminal Telemetry Logs */}
      <div className="flex-1 min-h-[160px] flex flex-col rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-[10px]">
        {/* Terminal Title Header */}
        <div className="bg-slate-900 px-3.5 py-2 border-b border-slate-800/80 flex justify-between items-center">
          <span className="text-[10px] uppercase font-bold text-slate-500 select-none tracking-widest flex items-center gap-1.5 font-sans">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            Compliance Logs Terminal
          </span>
          <span className="text-[9px] text-slate-600 uppercase font-bold">
            STATUTORY COMPLIANT • SECURE PROXY
          </span>
        </div>

        {/* Console Logs Body */}
        <div id="logs-terminal" className="flex-1 p-3 overflow-y-auto flex flex-col gap-1.5 max-h-[220px]">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic py-4 text-center select-none font-sans">
              Waiting for execution instruction trigger...
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2.5 hover:bg-slate-900/50 py-0.5 px-1 rounded transition-colors leading-relaxed">
                <span className="text-slate-600 select-none">{log.timestamp.slice(11, 19)}</span>
                <span className={`font-bold select-none capitalize w-16 [text-align:right] ${
                  log.category === "guardrail" ? "text-amber-500" :
                  log.category === "gdpr" ? "text-blue-400" :
                  log.category === "model" ? "text-emerald-400" : "text-purple-400"
                }`}>
                  [{log.category}]
                </span>
                <span className={`flex-1 select-all ${
                  log.type === "error" ? "text-red-400 font-semibold" :
                  log.type === "warning" ? "text-amber-400" :
                  log.type === "success" ? "text-emerald-400" : "text-slate-400"
                }`}>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
