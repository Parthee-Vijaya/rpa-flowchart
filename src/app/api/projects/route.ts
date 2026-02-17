import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { createProject, getAllProjects } from "@/lib/db";

export async function GET() {
  const projects = getAllProjects();
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const project = createProject({
    id: uuid(),
    name: body.name || "Nyt projekt",
    description: body.description,
    processOwner: body.processOwner,
  });
  return NextResponse.json(project, { status: 201 });
}
