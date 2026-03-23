"use client";
import { useEffect, useState } from "react";
import Dashboard from "./Dashboard";

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

export default function Home() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/logs")
      .then((r) => r.json())
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return <Dashboard logs={logs} />;
}
