"use client";
import { useViewport } from "@xyflow/react";

interface Swimlane {
  application: string;
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
}

export default function SwimlaneBackgrounds({ swimlanes }: SwimlaneBackgroundsProps) {
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
