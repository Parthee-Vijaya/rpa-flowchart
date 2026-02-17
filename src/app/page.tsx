import Link from "next/link";
import { getAllProjects } from "@/lib/db";
import CreateProjectButton from "./CreateProjectButton";

export const dynamic = "force-dynamic";

export default function Dashboard() {
  const projects = getAllProjects();

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">RPA Flowchart Generator</h1>
          <CreateProjectButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <svg
              className="w-16 h-16 text-zinc-700 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
            <h2 className="text-lg font-semibold text-zinc-400 mb-2">
              Ingen projekter endnu
            </h2>
            <p className="text-sm text-zinc-500 mb-6">
              Opret dit foerste flowchart-projekt for at komme i gang
            </p>
            <CreateProjectButton large />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => {
              const nodeCount = JSON.parse(project.nodes).length;
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-all group"
                >
                  <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors mb-1">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span>{nodeCount} noder</span>
                    <span>
                      {new Date(project.updated_at).toLocaleDateString("da-DK")}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
