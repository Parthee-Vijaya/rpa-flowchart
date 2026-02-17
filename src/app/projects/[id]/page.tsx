import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/db";
import FlowchartEditor from "@/components/FlowchartEditor";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProjectById(id);

  if (!project) {
    notFound();
  }

  const nodes = JSON.parse(project.nodes);
  const edges = JSON.parse(project.edges);

  return (
    <FlowchartEditor
      projectId={project.id}
      projectName={project.name}
      initialNodes={nodes}
      initialEdges={edges}
    />
  );
}
