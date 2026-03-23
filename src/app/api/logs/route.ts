import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export interface LogEntry {
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

function getAllLogs(): LogEntry[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    return [];
  }
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  const logs: LogEntry[] = [];
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(DATA_DIR, file), "utf-8");
      const data = JSON.parse(content);
      if (Array.isArray(data)) {
        logs.push(...data);
      } else {
        logs.push(data);
      }
    } catch {
      // skip invalid files
    }
  }
  return logs.sort((a, b) => {
    const dateComp = b.date.localeCompare(a.date);
    if (dateComp !== 0) return dateComp;
    return (b.time || "00:00").localeCompare(a.time || "00:00");
  });
}

export async function GET(req: NextRequest) {
  // Check auth: cookie or x-password header
  const session = req.cookies.get("memory_session");
  const authPassword = req.headers.get("x-password");
  if (
    authPassword !== process.env.DASHBOARD_PASSWORD &&
    (!session || session.value !== "authenticated")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs = getAllLogs();
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  // Check password header
  const authPassword = req.headers.get("x-password");
  if (authPassword !== process.env.DASHBOARD_PASSWORD) {
    // Also check cookie
    const session = req.cookies.get("memory_session");
    if (!session || session.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const entry: LogEntry = await req.json();

    // Validate required fields
    if (!entry.date || !entry.title || !entry.summary) {
      return NextResponse.json(
        { error: "Missing required fields: date, title, summary" },
        { status: 400 }
      );
    }

    // Generate ID if not provided
    if (!entry.id) {
      const existing = getAllLogs().filter((l) => l.date === entry.date);
      const num = String(existing.length + 1).padStart(3, "0");
      entry.id = `${entry.date}-${num}`;
    }

    // Defaults
    entry.tags = entry.tags || ["General"];
    entry.decisions = entry.decisions || [];
    entry.actionItems = entry.actionItems || [];
    entry.participants = entry.participants || [];
    entry.time = entry.time || new Date().toTimeString().slice(0, 5);

    // Save to date-based file
    const fileName = `${entry.date}.json`;
    const filePath = path.join(DATA_DIR, fileName);

    let entries: LogEntry[] = [];
    if (fs.existsSync(filePath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        entries = Array.isArray(existing) ? existing : [existing];
      } catch {
        entries = [];
      }
    }

    // Check for duplicate ID
    const dupIndex = entries.findIndex((e) => e.id === entry.id);
    if (dupIndex >= 0) {
      entries[dupIndex] = entry;
    } else {
      entries.push(entry);
    }

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(entries, null, 2));

    return NextResponse.json({ ok: true, entry });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
