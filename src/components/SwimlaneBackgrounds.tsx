"use client";
import { useViewport } from "@xyflow/react";

interface Swimlane {
  application: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Section {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const appColors: Record<string, { bg: string; header: string; text: string }> = {
  Outlook: { bg: "rgba(59, 130, 246, 0.04)", header: "rgba(59, 130, 246, 0.15)", text: "#60a5fa" },
  DUBU: { bg: "rgba(168, 85, 247, 0.04)", header: "rgba(168, 85, 247, 0.15)", text: "#c084fc" },
  SAPA: { bg: "rgba(234, 179, 8, 0.04)", header: "rgba(234, 179, 8, 0.15)", text: "#fbbf24" },
  Proces: { bg: "rgba(113, 113, 122, 0.04)", header: "rgba(113, 113, 122, 0.15)", text: "#a1a1aa" },
  Generelt: { bg: "rgba(113, 113, 122, 0.04)", header: "rgba(113, 113, 122, 0.15)", text: "#a1a1aa" },
};

const defaultColor = { bg: "rgba(34, 211, 238, 0.04)", header: "rgba(34, 211, 238, 0.12)", text: "#67e8f9" };

interface SwimlaneBackgroundsProps {
  swimlanes: Swimlane[];
  sections?: Section[];
}

export default function SwimlaneBackgrounds({ swimlanes, sections = [] }: SwimlaneBackgroundsProps) {
  const { x, y, zoom } = useViewport();

  if (swimlanes.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{
        width: "100%",
        height: "100%",
        overflow: "visible",
      }}
    >
      <g
        transform={`translate(${x}, ${y}) scale(${zoom})`}
      >
        {sections.map((section) => (
          <g key={section.id}>
            <rect
              x={section.x}
              y={section.y}
              width={section.width}
              height={section.height}
              rx={12}
              fill="rgba(148, 163, 184, 0.035)"
              stroke="rgba(148, 163, 184, 0.2)"
              strokeDasharray="10 6"
              strokeWidth={1}
            />
            <rect
              x={section.x + 12}
              y={section.y + 10}
              width={160}
              height={28}
              rx={8}
              fill="rgba(148, 163, 184, 0.2)"
            />
            <text
              x={section.x + 92}
              y={section.y + 29}
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize={12}
              fontWeight={700}
              fontFamily="var(--font-geist-sans), system-ui, sans-serif"
            >
              {section.label}
            </text>
          </g>
        ))}

        {swimlanes.map((sl) => {
          const colors = appColors[sl.application] || defaultColor;
          return (
            <g key={sl.application}>
              {/* Swimlane background */}
              <rect
                x={sl.x - 10}
                y={sl.y}
                width={sl.width + 20}
                height={sl.height}
                rx={12}
                fill={colors.bg}
                stroke={colors.header}
                strokeWidth={1}
                strokeDasharray="6 3"
              />
              {/* Swimlane header */}
              <rect
                x={sl.x - 10}
                y={sl.y}
                width={sl.width + 20}
                height={44}
                rx={12}
                fill={colors.header}
              />
              {/* Bottom corners of header should be sharp */}
              <rect
                x={sl.x - 10}
                y={sl.y + 24}
                width={sl.width + 20}
                height={20}
                fill={colors.header}
              />
              {/* Application name */}
              <text
                x={sl.x + sl.width / 2}
                y={sl.y + 28}
                textAnchor="middle"
                fill={colors.text}
                fontSize={14}
                fontWeight={700}
                fontFamily="var(--font-geist-sans), system-ui, sans-serif"
              >
                {sl.application}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
