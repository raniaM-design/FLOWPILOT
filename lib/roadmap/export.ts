"use client";

import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import PptxGenJS from "pptxgenjs";

/**
 * Capture la roadmap en PNG haute résolution
 */
export async function captureRoadmapPng(elementId: string = "roadmap-export-canvas"): Promise<string> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Élément #${elementId} introuvable`);
  }

  // Attendre que les polices soient chargées
  await document.fonts.ready;

  // Attendre un peu pour s'assurer que tout est rendu
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Capturer en haute résolution (scale 2 pour meilleure qualité)
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
 * Convertit une data URL en Blob
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Exporte la roadmap en PDF
 */
export async function exportRoadmapToPdf(
  projectName: string,
  elementId: string = "roadmap-export-canvas"
): Promise<void> {
  try {
    // Capturer l'image
    const dataUrl = await captureRoadmapPng(elementId);
    const imgBlob = dataUrlToBlob(dataUrl);

    // Créer un canvas temporaire pour obtenir les dimensions
    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    // Dimensions A4 paysage (en mm)
    const pdfWidth = 297; // A4 landscape width
    const pdfHeight = 210; // A4 landscape height

    // Calculer les dimensions de l'image pour s'adapter au PDF
    const imgAspectRatio = img.width / img.height;
    const pdfAspectRatio = pdfWidth / pdfHeight;

    let finalWidth: number;
    let finalHeight: number;
    let x: number;
    let y: number;

    if (imgAspectRatio > pdfAspectRatio) {
      // L'image est plus large, on ajuste à la largeur
      finalWidth = pdfWidth;
      finalHeight = pdfWidth / imgAspectRatio;
      x = 0;
      y = (pdfHeight - finalHeight) / 2;
    } else {
      // L'image est plus haute, on ajuste à la hauteur
      finalHeight = pdfHeight;
      finalWidth = pdfHeight * imgAspectRatio;
      x = (pdfWidth - finalWidth) / 2;
      y = 0;
    }

    // Créer le PDF
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Ajouter l'image
    pdf.addImage(dataUrl, "PNG", x, y, finalWidth, finalHeight);

    // Générer le nom de fichier
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const fileName = `PILOTYS_Roadmap_${projectName.replace(/\s+/g, "_")}_${dateStr}.pdf`;

    // Télécharger
    pdf.save(fileName);
  } catch (error) {
    console.error("Erreur lors de l'export PDF:", error);
    throw new Error("Erreur lors de l'export PDF de la roadmap");
  }
}

/**
 * Exporte la roadmap en PPT
 */
export async function exportRoadmapToPpt(
  projectName: string,
  elementId: string = "roadmap-export-canvas"
): Promise<void> {
  try {
    // Capturer l'image
    const dataUrl = await captureRoadmapPng(elementId);
    const imgBlob = dataUrlToBlob(dataUrl);

    // Créer la présentation
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE"; // 16:9

    // Créer une slide
    const slide = pptx.addSlide();

    // Ajouter l'image en pleine slide
    slide.addImage({
      data: dataUrl,
      x: 0,
      y: 0,
      w: 10,
      h: 5.625, // 16:9 ratio
    });

    // Générer le nom de fichier
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const fileName = `PILOTYS_Roadmap_${projectName.replace(/\s+/g, "_")}_${dateStr}.pptx`;

    // Télécharger
    await pptx.writeFile({ fileName });
  } catch (error) {
    console.error("Erreur lors de l'export PPT:", error);
    throw new Error("Erreur lors de l'export PPT de la roadmap");
  }
}

