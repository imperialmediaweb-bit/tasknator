"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FileText, RefreshCw, Save, History, ChevronDown, Sparkles, Target, CheckCircle2, Eye, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Asset {
  id: string;
  type: string;
  title: string;
  content: string;
  kpi: string | null;
  task: { id: string; title: string; phase: string } | null;
  versions: { id: string; version: number; content: string; createdAt: string }[];
  updatedAt: string;
}

/**
 * Convert JSON objects/arrays to readable markdown.
 * Handles content that was saved as raw JSON from AI responses.
 */
function jsonToMarkdown(obj: any, depth = 0): string {
  if (typeof obj === "string") return obj;
  if (typeof obj === "number" || typeof obj === "boolean") return String(obj);
  if (Array.isArray(obj)) {
    return obj
      .map((item) => {
        if (typeof item === "string") return `- ${item}`;
        if (typeof item === "object" && item !== null) return jsonToMarkdown(item, depth + 1);
        return `- ${String(item)}`;
      })
      .join("\n\n---\n\n");
  }
  if (typeof obj === "object" && obj !== null) {
    return Object.entries(obj)
      .map(([key, value]) => {
        const label = key
          .replace(/([A-Z])/g, " $1")
          .replace(/[_-]/g, " ")
          .replace(/^\w/, (c) => c.toUpperCase())
          .trim();
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          return `**${label}:** ${value}`;
        }
        if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
          return `**${label}:**\n${value.map((v) => `- ${v}`).join("\n")}`;
        }
        const heading = depth === 0 ? `## ${label}` : depth === 1 ? `### ${label}` : `**${label}**`;
        return `${heading}\n\n${jsonToMarkdown(value, depth + 1)}`;
      })
      .join("\n\n");
  }
  return String(obj);
}

/**
 * If content looks like raw JSON, convert it to readable markdown.
 */
function formatContentForPreview(raw: string): string {
  const trimmed = raw.trim();
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try {
      const parsed = JSON.parse(trimmed);
      return jsonToMarkdown(parsed);
    } catch {
      // Not valid JSON — return as-is
    }
  }
  return raw;
}

export default function AssetEditorPage() {
  const { id } = useParams();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(true);

  useEffect(() => {
    fetchAsset();
  }, [id]);

  async function fetchAsset() {
    try {
      const res = await fetch(`/api/assets/${id}`);
      if (res.ok) {
        const data = await res.json();
        setAsset(data);
        setContent(data.content);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/assets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      await fetchAsset();
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  }

  async function handleRegenerate() {
    setRegenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/assets/${id}/regenerate`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setContent(data.content);
        await fetchAsset();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Regeneration failed (${res.status}). Please try again.`);
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please check your connection and try again.");
    }
    setRegenerating(false);
  }

  function loadVersion(versionContent: string) {
    setContent(versionContent);
    setShowVersions(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-20">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Asset not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{asset.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Type: {asset.type.replace(/_/g, " ")} · Last updated: {new Date(asset.updatedAt).toLocaleString()}
          </p>
          {asset.kpi && (
            <div className="flex items-center gap-2 mt-1.5">
              <Target className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs text-gray-600">KPI: <strong className="text-green-700">{asset.kpi}</strong></span>
            </div>
          )}
          {asset.task && (
            <div className="flex items-center gap-2 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs text-gray-600">Linked to: <strong>{asset.task.title}</strong> ({asset.task.phase.replace("_", " ")})</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <History className="w-4 h-4" />
              Versions ({asset.versions.length})
              <ChevronDown className="w-3 h-3" />
            </button>
            {showVersions && asset.versions.length > 0 && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl border border-gray-200 shadow-lg z-10 max-h-64 overflow-y-auto">
                {asset.versions.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => loadVersion(v.content)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0"
                  >
                    <span className="font-medium text-gray-900">Version {v.version}</span>
                    <span className="text-xs text-gray-400 block mt-0.5">
                      {new Date(v.createdAt).toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {regenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Regenerate
          </button>
          <button
            onClick={handleSave}
            disabled={saving || content === asset.content}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Regeneration failed</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-sm font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Editor */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-1 px-4 pt-3 pb-1 border-b border-gray-100">
          <button
            onClick={() => setPreviewMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${previewMode ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button
            onClick={() => setPreviewMode(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!previewMode ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
        <div className="p-1">
          {previewMode ? (
            <div
              className="w-full min-h-[600px] p-5 text-sm leading-relaxed prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-h2:text-lg prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-2 prose-h2:mt-6 prose-h3:text-base prose-p:text-gray-700 prose-strong:text-gray-800 prose-li:text-gray-700 prose-li:marker:text-blue-500 prose-hr:border-gray-200 cursor-text"
              onClick={() => setPreviewMode(false)}
            >
              <ReactMarkdown>{content ? formatContentForPreview(content) : "*No content yet — click Regenerate to generate.*"}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[600px] p-5 text-sm font-mono leading-relaxed border-0 outline-none resize-none rounded-xl"
              placeholder="Asset content..."
              autoFocus
            />
          )}
        </div>
      </div>

      {/* Content changed indicator */}
      {content !== asset.content && (
        <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          Unsaved changes
        </div>
      )}
    </div>
  );
}
