import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const TASKS_DIR = path.join(process.cwd(), "data", "tasks");

const PROJECT_FILES: Record<string, string> = {
  mb: "mb.json",
  longevity: "longevity.json",
  revenue: "revenue.json",
  cinqstay: "cinqstay.json",
  docuwrap: "docuwrap.json",
};

function readProject(key: string) {
  const filePath = path.join(TASKS_DIR, PROJECT_FILES[key]);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
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

  const project = req.nextUrl.searchParams.get("project");

  if (project) {
    if (!PROJECT_FILES[project]) {
      return NextResponse.json({ error: "Unknown project" }, { status: 400 });
    }
    const data = readProject(project);
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  }

  // Return all projects
  const all: Record<string, unknown> = {};
  for (const key of Object.keys(PROJECT_FILES)) {
    const data = readProject(key);
    if (data) all[key] = data;
  }
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const authPassword = req.headers.get("x-password");
  if (authPassword !== process.env.DASHBOARD_PASSWORD) {
    const session = req.cookies.get("memory_session");
    if (!session || session.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = await req.json();
    const { project, data } = body;

    if (!project || !PROJECT_FILES[project]) {
      return NextResponse.json({ error: "Invalid project" }, { status: 400 });
    }
    if (!data) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    if (!fs.existsSync(TASKS_DIR)) {
      fs.mkdirSync(TASKS_DIR, { recursive: true });
    }

    const filePath = path.join(TASKS_DIR, PROJECT_FILES[project]);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
