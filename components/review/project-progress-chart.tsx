"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ProjectWithStats } from "@/lib/review/monthly-calculations";
import { useTranslations } from "next-intl";

interface ProjectProgressChartProps {
  projects: ProjectWithStats[];
}

export function ProjectProgressChart({ projects }: ProjectProgressChartProps) {
  const t = useTranslations("review.monthly");
  // Limiter à 10 projets pour la lisibilité
  const displayProjects = projects.slice(0, 10);
  
  const data = displayProjects.map((project) => ({
    name: project.name.length > 20 ? project.name.substring(0, 20) + "..." : project.name,
    fullName: project.name,
    progress: project.progressPercentage,
    status: project.projectStatus,
  }));

  const getBarColor = (status: string) => {
    switch (status) {
      case "on_track":
        return "#22C55E"; // emerald-500
      case "at_risk":
        return "#F59E0B"; // amber-500
      case "blocked":
        return "#EF4444"; // red-500
      default:
        return "#94A3B8"; // slate-400
    }
  };

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, displayProjects.length * 40)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
          stroke="#64748B"
          fontSize={12}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke="#64748B"
          fontSize={12}
          width={150}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                  <p className="font-semibold text-slate-900 mb-1">{data.fullName}</p>
                  <p className="text-sm text-slate-600">
                    {t("projectsProgress.progress")}: {data.progress}%
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="progress" radius={[0, 8, 8, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

