"use client";
import { useState, useMemo } from "react";

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

const ALL_TAGS = [
  "MKJ",
  "CinqStay",
  "DocuWrap",
  "BespaarPilot",
  "Trading",
  "Longevity",
  "ORAVIVUM",
  "General",
];

const TAG_COLORS: Record<string, string> = {
  MKJ: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  CinqStay: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  DocuWrap: "bg-green-500/20 text-green-400 border-green-500/30",
  BespaarPilot: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Trading: "bg-red-500/20 text-red-400 border-red-500/30",
  Longevity: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  ORAVIVUM: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  General: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("nl-NL", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Dashboard({ logs }: { logs: LogEntry[] }) {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      // Tag filter
      if (activeTag && !log.tags.includes(activeTag)) return false;

      // Date range filter
      if (dateFrom && log.date < dateFrom) return false;
      if (dateTo && log.date > dateTo) return false;

      // Search filter
      if (search) {
        const q = search.toLowerCase();
        const haystack = [
          log.title,
          log.summary,
          ...log.tags,
          ...log.decisions,
          ...log.actionItems,
          ...log.participants,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [logs, search, activeTag, dateFrom, dateTo]);

  // Count tags for sidebar
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tag of ALL_TAGS) counts[tag] = 0;
    for (const log of logs) {
      for (const tag of log.tags) {
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }
    return counts;
  }, [logs]);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg border border-gray-700"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={
              sidebarOpen
                ? "M6 18L18 6M6 6l12 12"
                : "M4 6h16M4 12h16M4 18h16"
            }
          />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#111] border-r border-gray-800 p-6 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8">
          <h1 className="text-xl font-bold text-amber-500">MKJ Memory</h1>
          <p className="text-xs text-gray-500 mt-1">Daily Decision Log</p>
        </div>

        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Projects
          </h2>
          <button
            onClick={() => {
              setActiveTag(null);
              setSidebarOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition ${
              !activeTag
                ? "bg-amber-500/10 text-amber-400"
                : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            All{" "}
            <span className="text-gray-600 ml-1">({logs.length})</span>
          </button>
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setActiveTag(activeTag === tag ? null : tag);
                setSidebarOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition ${
                activeTag === tag
                  ? "bg-amber-500/10 text-amber-400"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              {tag}{" "}
              <span className="text-gray-600 ml-1">
                ({tagCounts[tag] || 0})
              </span>
            </button>
          ))}
        </div>

        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Date Range
          </h2>
          <div className="space-y-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-amber-500"
              placeholder="From"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-amber-500"
              placeholder="To"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Clear dates
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-h-screen">
        {/* Search bar */}
        <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur border-b border-gray-800 px-4 lg:px-8 py-4">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-amber-500 placeholder-gray-500"
              />
            </div>
            <div className="text-sm text-gray-500">
              {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-lg">No entries found</p>
              <p className="text-sm mt-2">
                {search || activeTag || dateFrom || dateTo
                  ? "Try adjusting your filters"
                  : "Add your first log entry via the API"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((log) => {
                const expanded = expandedIds.has(log.id);
                return (
                  <div
                    key={log.id}
                    className="bg-[#141414] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition"
                  >
                    {/* Card header — always visible */}
                    <button
                      onClick={() => toggleExpand(log.id)}
                      className="w-full text-left px-5 py-4 flex items-start gap-4"
                    >
                      {/* Date badge */}
                      <div className="flex-shrink-0 text-center min-w-[50px]">
                        <div className="text-xs text-gray-500">
                          {formatDate(log.date).split(" ")[0]}
                        </div>
                        <div className="text-lg font-bold text-gray-300">
                          {log.date.split("-")[2]}
                        </div>
                        <div className="text-xs text-gray-600">
                          {log.date.split("-")[1]}-
                          {log.date.split("-")[0].slice(2)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-200 truncate">
                            {log.title}
                          </h3>
                          {log.time && (
                            <span className="text-xs text-gray-600">
                              {log.time}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                          {log.summary}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {log.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`text-xs px-2 py-0.5 rounded-full border ${
                                TAG_COLORS[tag] || TAG_COLORS.General
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                          {log.actionItems.length > 0 && (
                            <span className="text-xs text-gray-600">
                              {log.actionItems.length} action item
                              {log.actionItems.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expand indicator */}
                      <svg
                        className={`w-5 h-5 text-gray-600 flex-shrink-0 transition-transform ${
                          expanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Expanded content */}
                    {expanded && (
                      <div className="px-5 pb-5 border-t border-gray-800 pt-4 ml-[66px]">
                        {/* Full summary */}
                        <div className="mb-4">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Summary
                          </h4>
                          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {log.summary}
                          </p>
                        </div>

                        {/* Decisions */}
                        {log.decisions.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              Decisions
                            </h4>
                            <ul className="space-y-1">
                              {log.decisions.map((d, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-gray-300 flex items-start gap-2"
                                >
                                  <span className="text-amber-500 mt-0.5">
                                    ▸
                                  </span>
                                  {d}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Action items */}
                        {log.actionItems.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              Action Items
                            </h4>
                            <ul className="space-y-1">
                              {log.actionItems.map((a, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-gray-300 flex items-start gap-2"
                                >
                                  <span className="text-gray-600">☐</span>
                                  {a}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Participants */}
                        {log.participants.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              Participants
                            </h4>
                            <div className="flex gap-2 flex-wrap">
                              {log.participants.map((p) => (
                                <span
                                  key={p}
                                  className="text-xs px-2 py-1 bg-gray-800 rounded-full text-gray-400"
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
