import React, { useState } from "react";
import { PIIRedactionRule } from "../types";
import { ShieldCheck, Plus, X, Lock, CheckCircle, HelpCircle } from "lucide-react";

interface GuardrailSettingsProps {
  rules: PIIRedactionRule[];
  onToggleRule: (ruleId: string) => void;
  customSensitiveWords: string[];
  onAddCustomWord: (word: string) => void;
  onRemoveCustomWord: (word: string) => void;
}

export default function GuardrailSettings({
  rules,
  onToggleRule,
  customSensitiveWords,
  onAddCustomWord,
  onRemoveCustomWord
}: GuardrailSettingsProps) {
  const [newWord, setNewWord] = useState("");

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addWord();
    }
  };

  const addWord = () => {
    const trimmed = newWord.trim();
    if (trimmed && !customSensitiveWords.includes(trimmed)) {
      onAddCustomWord(trimmed);
      setNewWord("");
    }
  };

  return (
    <div id="guardrail-settings-container" className="flex flex-col gap-6 h-full">
      {/* Policy Rules Header */}
      <div>
        <div className="flex gap-1.5 items-center mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Privacy Guardrail Policies (Article 5)
          </h3>
        </div>
        <p className="text-[10px] text-slate-500 font-sans">
          Select standard structural entities of Personal Identifiable Information (PII) to redact on the proxy endpoint.
        </p>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
        {rules.map((rule) => (
          <div
            key={rule.id}
            onClick={() => onToggleRule(rule.id)}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
              rule.enabled
                ? "border-emerald-500/40 bg-emerald-950/10 hover:bg-emerald-950/20"
                : "border-slate-800 bg-slate-900/40 hover:bg-slate-800/60"
            }`}
          >
            <div className="mt-0.5">
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={() => {}} // handled by div click
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500/20 border-slate-700 bg-slate-900 cursor-pointer"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center gap-2">
                <span className={`text-xs font-semibold truncate ${rule.enabled ? "text-emerald-400" : "text-slate-300"}`}>
                  {rule.name}
                </span>
                <span className="text-[9px] font-mono bg-slate-800/80 text-slate-400 px-1.5 py-0.5 rounded uppercase">
                  {rule.type}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {rule.description}
              </p>
              {rule.enabled && (
                <div className="text-[9px] font-mono text-emerald-500 bg-emerald-500/5 inline-block py-0.5 px-1.5 rounded mt-2">
                  Format: <span className="font-bold">{rule.placeholder}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Custom Sensitive Words Section */}
      <div className="border-t border-slate-800/80 pt-5 mt-auto">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Custom Restricted Keywords
            </h4>
            <p className="text-[10px] text-slate-500 mt-0.5 font-sans leading-normal">
              Redact custom corporate names, proprietary project names, or specific identifiers.
            </p>
          </div>
        </div>

        {/* Action input bar */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type word (e.g. ProjectX, Acme) and press Enter"
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-sans"
          />
          <button
            onClick={addWord}
            type="button"
            className="px-3 py-2 bg-slate-800 border border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>

        {/* Word Badges list */}
        <div className="flex flex-wrap gap-2 max-h-[110px] overflow-y-auto p-1 bg-slate-900/30 rounded-lg border border-slate-800/50 min-h-[44px] items-center">
          {customSensitiveWords.length === 0 ? (
            <span className="text-[10px] text-slate-600 italic px-2">
              No custom sensitive words declared.
            </span>
          ) : (
            customSensitiveWords.map((word) => (
              <span
                key={word}
                className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-medium pl-2.5 pr-1 py-0.5 rounded-full"
              >
                {word}
                <button
                  type="button"
                  onClick={() => onRemoveCustomWord(word)}
                  className="p-0.5 hover:bg-amber-500/25 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
