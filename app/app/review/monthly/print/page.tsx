import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { buildMonthlyReviewData } from "@/lib/review/monthly/buildMonthlyReviewData";
import { generateAllChartsPNG } from "@/lib/review/monthly/generate-charts";
import { PrintActionButton } from "@/components/print-action-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { LOGO_OFFICIAL_PATH } from "@/lib/logo-config";

export default async function MonthlyReviewPrintPage() {
  const userId = await getCurrentUserIdOrThrow();

  // Dates pour le mois courant
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const locale = "fr"; // TODO: récupérer depuis les headers ou query params

  // Construire les données de la monthly review
  const data = await buildMonthlyReviewData({
    year,
    month,
    locale,
    userId,
  });

  // Générer les graphiques en PNG
  const charts = await generateAllChartsPNG(data);

  // Convertir les buffers en data URLs pour l'affichage
  const activityChartUrl = charts.activity ? `data:image/png;base64,${charts.activity.toString("base64")}` : null;
  const statusChartUrl = charts.status ? `data:image/png;base64,${charts.status.toString("base64")}` : null;
  const projectsChartUrl = charts.projects ? `data:image/png;base64,${charts.projects.toString("base64")}` : null;

  return (
    <div className="print-container">
      {/* Boutons d'action (cachés à l'impression) */}
      <div className="print-actions flex items-center gap-2 mb-4">
        <Link href="/app/review?period=month">
          <Button variant="outline" size="sm" className="print-hidden">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </Link>
        <PrintActionButton href="/app/review/monthly/print" />
      </div>

      {/* Contenu print */}
      <div className="print-content">
        <header className="print-header">
          {/* Logo PILOTYS */}
          <div className="print-logo-container">
            <img 
              src={LOGO_OFFICIAL_PATH}
              alt="PILOTYS" 
              className="print-logo-img"
              style={{ height: "32px", width: "auto", objectFit: "contain" }}
            />
          </div>
          <h1 className="print-title">Monthly Review — {data.period.label}</h1>
          <p className="print-subtitle">
            Vue d'ensemble du mois : indicateurs, décisions et focus.
          </p>
          <p className="print-date">
            Généré le {new Date().toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </header>

        <div className="print-body">
          {/* Résumé exécutif */}
          <div className="print-section">
            <h2 className="print-section-title">Résumé exécutif</h2>
            <div 
              className="print-text" 
              style={{
                backgroundColor: "#EFF6FF",
                border: "1px solid #BFDBFE",
                borderRadius: "8px",
                padding: "1.5rem",
                color: "#1E293B",
                lineHeight: "1.6",
              }}
            >
              <p style={{ margin: 0 }}>{data.summary}</p>
            </div>
          </div>

          {/* Indicateurs clés */}
          <div className="print-section">
            <h2 className="print-section-title">Indicateurs clés</h2>
            <div className="print-grid print-grid-3">
              <div className="print-kpi-card">
                <div className="print-kpi-label">Réunions</div>
                <div className="print-kpi-value">{data.kpis.meetings}</div>
              </div>
              <div className="print-kpi-card">
                <div className="print-kpi-label">Actions totales</div>
                <div className="print-kpi-value">{data.kpis.actionsTotal}</div>
              </div>
              <div className="print-kpi-card">
                <div className="print-kpi-label">Actions terminées</div>
                <div className="print-kpi-value">{data.kpis.actionsDone}</div>
              </div>
              <div className="print-kpi-card">
                <div className="print-kpi-label">Actions en retard</div>
                <div className="print-kpi-value">{data.kpis.actionsOverdue}</div>
              </div>
              <div className="print-kpi-card">
                <div className="print-kpi-label">Décisions</div>
                <div className="print-kpi-value">{data.kpis.decisions}</div>
              </div>
              <div className="print-kpi-card">
                <div className="print-kpi-label">Taux de complétion</div>
                <div className="print-kpi-value">{data.kpis.completionRate}%</div>
              </div>
            </div>
          </div>

          {/* Graphiques */}
          {(activityChartUrl || statusChartUrl || projectsChartUrl) && (
            <div className="print-section">
              <h2 className="print-section-title">Graphiques</h2>
              
              {/* Graphique activité par semaine */}
              {activityChartUrl && (
                <div className="print-chart">
                  <h3 style={{ fontSize: "14pt", fontWeight: 600, marginBottom: "0.5rem", color: "#000" }}>
                    Activité par semaine
                  </h3>
                  <img src={activityChartUrl} alt="Activité par semaine" />
                </div>
              )}

              {/* Graphiques status et projets côte à côte */}
              {(statusChartUrl || projectsChartUrl) && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", marginTop: "1.5rem" }}>
                  {statusChartUrl && (
                    <div className="print-chart">
                      <h3 style={{ fontSize: "14pt", fontWeight: 600, marginBottom: "0.5rem", color: "#000" }}>
                        Répartition des actions
                      </h3>
                      <img src={statusChartUrl} alt="Répartition des actions" />
                    </div>
                  )}
                  
                  {projectsChartUrl && (
                    <div className="print-chart">
                      <h3 style={{ fontSize: "14pt", fontWeight: 600, marginBottom: "0.5rem", color: "#000" }}>
                        Avancement des projets
                      </h3>
                      <img src={projectsChartUrl} alt="Avancement des projets" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Décisions clés */}
          {data.highlights.keyDecisions.length > 0 && (
            <div className="print-section">
              <h2 className="print-section-title">Décisions clés</h2>
              <div className="print-list">
                {data.highlights.keyDecisions.map((decision) => (
                  <div key={decision.id} className="print-item">
                    <div className="print-item-header">
                      <h3 className="print-item-title">{decision.title}</h3>
                      {decision.status === "DECIDED" && (
                        <span className="print-badge print-badge-success">Décidée</span>
                      )}
                    </div>
                    <div className="print-item-meta">
                      {decision.projectName && (
                        <>
                          <span>{decision.projectName}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{decision.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Focus mois suivant */}
          {data.highlights.nextMonthFocus.length > 0 && (
            <div className="print-section">
              <h2 className="print-section-title">Focus mois suivant</h2>
              <div className="print-list">
                {data.highlights.nextMonthFocus.map((item) => (
                  <div key={item.id} className="print-item">
                    <div className="print-item-header">
                      <h3 className="print-item-title">{item.title}</h3>
                      <span className="print-badge">{item.status}</span>
                    </div>
                    <div className="print-item-meta">
                      {item.projectName && (
                        <>
                          <span>{item.projectName}</span>
                          <span>•</span>
                        </>
                      )}
                      {item.dueDate && (
                        <>
                          <span>Échéance: {item.dueDate}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.highlights.keyDecisions.length === 0 && data.highlights.nextMonthFocus.length === 0 && (
            <div className="print-empty">
              <p>Aucun élément à afficher pour ce mois.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
