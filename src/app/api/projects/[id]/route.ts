import { NextRequest, NextResponse } from "next/server";
import {
  getProjectById,
  updateProjectFlowchart,
  updateProjectName,
  deleteProject,
} from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getProjectById(id);
  if (!project) {
    return NextResponse.json({ error: "Projekt ikke fundet" }, { status: 404 });
  }
  return NextResponse.json(project);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  if (body.nodes !== undefined && body.edges !== undefined) {
    updateProjectFlowchart(
      id,
      JSON.stringify(body.nodes),
      JSON.stringify(body.edges)
    );
  }

  if (body.name !== undefined) {
    updateProjectName(id, body.name, body.description);
  }

  const updated = getProjectById(id);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteProject(id);
  return NextResponse.json({ ok: true });
}
