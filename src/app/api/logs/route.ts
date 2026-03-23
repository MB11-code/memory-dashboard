import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const GITHUB_REPO = "MB11-code/memory-dashboard";
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/contents/data`;

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

// Fetch file from GitHub (returns content + sha, or null if not found)
async function githubGetFile(
  fileName: string
): Promise<{ content: string; sha: string } | null> {
  const token = process.env.GITHUB_TOKEN;
  const res = await fetch(`${GITHUB_API}/${fileName}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub GET failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { content, sha: data.sha };
}

// Create or update file on GitHub
async function githubPutFile(
  fileName: string,
  content: string,
  sha?: string
): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const body: Record<string, string> = {
    message: `Update ${fileName}`,
    content: Buffer.from(content).toString("base64"),
    branch: "main",
  };
  if (sha) body.sha = sha;

  const res = await fetch(`${GITHUB_API}/${fileName}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub PUT failed (${res.status}): ${text}`);
  }
}

export async function GET(req: NextRequest) {
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
  // Auth check
  const authPassword = req.headers.get("x-password");
  if (authPassword !== process.env.DASHBOARD_PASSWORD) {
    const session = req.cookies.get("memory_session");
    if (!session || session.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Parse body
  let entry: LogEntry;
  try {
    entry = await req.json();
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid JSON body", detail: String(err) },
      { status: 400 }
    );
  }

  // Validate required fields
  if (!entry.date || !entry.title || !entry.summary) {
    return NextResponse.json(
      { error: "Missing required fields: date, title, summary" },
      { status: 400 }
    );
  }

  // Check GITHUB_TOKEN
  if (!process.env.GITHUB_TOKEN) {
    return NextResponse.json(
      { error: "Server misconfiguration: GITHUB_TOKEN not set" },
      { status: 500 }
    );
  }

  try {
    // Defaults
    entry.tags = entry.tags || ["General"];
    entry.decisions = entry.decisions || [];
    entry.actionItems = entry.actionItems || [];
    entry.participants = entry.participants || [];
    entry.time = entry.time || new Date().toTimeString().slice(0, 5);

    const fileName = `${entry.date}.json`;

    // Get existing file from GitHub
    const existing = await githubGetFile(fileName);
    let entries: LogEntry[] = [];
    if (existing) {
      try {
        const parsed = JSON.parse(existing.content);
        entries = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        entries = [];
      }
    }

    // Generate ID if not provided
    if (!entry.id) {
      const num = String(entries.length + 1).padStart(3, "0");
      entry.id = `${entry.date}-${num}`;
    }

    // Upsert: replace if duplicate ID, otherwise append
    const dupIndex = entries.findIndex((e) => e.id === entry.id);
    if (dupIndex >= 0) {
      entries[dupIndex] = entry;
    } else {
      entries.push(entry);
    }

    // Write back to GitHub
    await githubPutFile(
      fileName,
      JSON.stringify(entries, null, 2),
      existing?.sha
    );

    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    console.error("POST /api/logs error:", err);
    return NextResponse.json(
      { error: "Failed to save log entry", detail: String(err) },
      { status: 500 }
    );
  }
}
