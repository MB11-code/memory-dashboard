"use client";
import { useState, useEffect } from "react";

type Task = { title: string; done: boolean; note?: string };
type Section = { title: string; status: string; tasks: Task[] };
type Board = { lastUpdated: string; sections: Section[] };
type Boards = Record<string, Board>;

const projectTabs = [
  { key: "mb", label: "MKJ" },
  { key: "longevity", label: "ORAVIVUM" },
  { key: "revenue", label: "Revenue" },
  { key: "cinqstay", label: "CinqStay" },
  { key: "docuwrap", label: "DocuWrap" },
];

const statusColors: Record<string, string> = {
  "in-progress": "bg-blue-500/20 text-blue-400",
  "to-do": "bg-gray-500/20 text-gray-400",
  "waiting": "bg-amber-500/20 text-amber-400",
  "done": "bg-green-500/20 text-green-400",
};

const statusLabels: Record<string, string> = {
  "in-progress": "In Progress",
  "to-do": "To Do",
  "waiting": "Wacht op Marlon",
  "done": "Done",
};

function SectionBlock({ section }: { section: Section }) {
  const [open, setOpen] = useState(section.status !== "done");
  const doneCount = section.tasks.filter((t) => t.done).length;

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-900/50 hover:bg-gray-900 transition text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-sm">{open ? "▼" : "▶"}</span>
          <h3 className="font-semibold">{section.title}</h3>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              statusColors[section.status] || "bg-gray-700 text-gray-300"
            }`}
          >
            {statusLabels[section.status] || section.status}
          </span>
        </div>
        <span className="text-sm text-gray-500">
          {doneCount}/{section.tasks.length}
        </span>
      </button>
      {open && (
        <div className="divide-y divide-gray-800/50">
          {section.tasks.map((task, i) => (
            <div key={i} className="px-4 py-3 flex items-start gap-3">
              <span
                className={`mt-0.5 text-lg ${
                  task.done ? "text-green-500" : "text-gray-600"
                }`}
              >
                {task.done ? "☑" : "☐"}
              </span>
              <div className="flex-1 min-w-0">
                <span
                  className={
                    task.done ? "text-gray-500 line-through" : "text-white"
                  }
                >
                  {task.title}
                </span>
                {task.note && (
                  <p className="text-sm text-gray-500 mt-0.5">{task.note}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TaskBoard() {
  const [boards, setBoards] = useState<Boards | null>(null);
  const [activeProject, setActiveProject] = useState("mb");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load tasks");
        return r.json();
      })
      .then((data) => {
        setBoards(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Loading tasks...</p>
      </div>
    );
  }

  if (!boards) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Failed to load tasks</p>
      </div>
    );
  }

  const board = boards[activeProject];

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6">
      {/* Project sub-tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-lg p-1 mb-6 overflow-x-auto">
        {projectTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveProject(tab.key)}
            className={`flex-1 min-w-[80px] py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${
              activeProject === tab.key
                ? "bg-amber-500 text-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {board ? (
        <>
          <p className="text-xs text-gray-500 mb-4">
            Laatste update:{" "}
            {new Date(board.lastUpdated).toLocaleDateString("nl-NL", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {" — "}
            {new Date(board.lastUpdated).toLocaleTimeString("nl-NL", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <div className="space-y-3">
            {board.sections.map((section, i) => (
              <SectionBlock key={i} section={section} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <p>No tasks found for this project</p>
        </div>
      )}
    </div>
  );
}
