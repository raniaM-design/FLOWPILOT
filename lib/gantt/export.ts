"use client";

import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

/**
 * Capture le diagramme Gantt en PNG haute résolution
 */
async function captureGanttPng(elementId: string = "gantt-export-canvas"): Promise<string> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Élément #${elementId} introuvable`);
  }

  await document.fonts.ready;
  await new Promise((resolve) => setTimeout(resolve, 500));

  const dataUrl = await toPng(element, {
    quality: 1.0,
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
    style: {
      transform: "scale(1)",
      transformOrigin: "top left",
    },
  });

  return dataUrl;
}

/**
 * Exporte le diagramme Gantt en PDF (A4 paysage, logo et couleurs inclus)
 */
export async function exportGanttToPdf(
  projectName: string,
  elementId: string = "gantt-export-canvas"
): Promise<void> {
  try {
    const dataUrl = await captureGanttPng(elementId);

    const img = new Image();
    img.src = dataUrl;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
    });

    const pdfWidth = 297;
    const pdfHeight = 210;

    const imgAspectRatio = img.width / img.height;
    const pdfAspectRatio = pdfWidth / pdfHeight;

    let finalWidth: number;
    let finalHeight: number;
    let x: number;
    let y: number;

    if (imgAspectRatio > pdfAspectRatio) {
      finalWidth = pdfWidth;
      finalHeight = pdfWidth / imgAspectRatio;
      x = 0;
      y = (pdfHeight - finalHeight) / 2;
    } else {
      finalHeight = pdfHeight;
      finalWidth = pdfHeight * imgAspectRatio;
      x = (pdfWidth - finalWidth) / 2;
      y = 0;
    }

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    pdf.addImage(dataUrl, "PNG", x, y, finalWidth, finalHeight);

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const fileName = `PILOTYS_Gantt_${projectName.replace(/\s+/g, "_")}_${dateStr}.pdf`;

    pdf.save(fileName);
  } catch (error) {
    console.error("Erreur lors de l'export PDF du Gantt:", error);
    throw new Error("Erreur lors de l'export PDF du diagramme de Gantt");
  }
}
