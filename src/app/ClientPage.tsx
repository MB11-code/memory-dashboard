"use client";
import { useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import TaskBoard from "./TaskBoard";

interface LogEntry {
  id: string;
  date: string;
  time: string;
  title: string;
  summary: string;
  tags: string[];
  decisions: string[];
  actionItems: string[];
  participants: string[];
}

type Tab = "timeline" | "tasks";

export default function ClientPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("timeline");

  useEffect(() => {
    fetch("/api/logs")
      .then((r) => {
        if (!r.ok) {
          window.location.href = "/login";
          return [];
        }
        return r.json();
      })
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch(() => {
        window.location.href = "/login";
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Top navigation */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="flex items-center h-14 gap-8">
            <span className="text-lg font-bold text-amber-500 flex-shrink-0">
              MB
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab("timeline")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  activeTab === "timeline"
                    ? "bg-amber-500/15 text-amber-400"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setActiveTab("tasks")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  activeTab === "tasks"
                    ? "bg-amber-500/15 text-amber-400"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                Tasks
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab content */}
      {activeTab === "timeline" ? (
        <Dashboard logs={logs} />
      ) : (
        <TaskBoard />
      )}
    </div>
  );
}
