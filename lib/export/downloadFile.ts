/**
 * Utilitaire pour télécharger un fichier depuis une URL API
 * Gère le téléchargement côté client avec gestion d'erreurs détaillées
 */
"use client";

export async function downloadFromApi(
  url: string,
  filename: string
): Promise<void> {
  try {
    console.log(`[downloadFromApi] Calling URL: ${url}`);
    
    const response = await fetch(url, {
      method: "POST",
    });

    const contentType = response.headers.get("content-type") || "";
    const status = response.status;
    const finalUrl = response.url; // URL finale après redirects
    
    console.log(`[downloadFromApi] Response: status=${status}, contentType=${contentType}, url=${finalUrl}, redirected=${response.redirected}`);

    // Détecter les redirects
    if (response.redirected) {
      console.warn(`[downloadFromApi] Redirect detected: original=${url}, final=${finalUrl}`);
    }

    // Détecter le HTML (souvent signe d'une erreur 404, redirect auth, ou crash)
    if (contentType.includes("text/html")) {
      const htmlPreview = await response.text().then((text) => {
        // Extraire un aperçu du HTML pour debug
        const match = text.match(/<title>(.*?)<\/title>/i);
        const title = match ? match[1] : "No title";
        const is404 = text.includes("404") || text.includes("Not Found");
        const isError = text.includes("Error") || text.includes("error");
        return { title, is404, isError, preview: text.substring(0, 200) };
      });

      let errorMessage = `Export endpoint returned HTML. Likely wrong URL, 404, redirect, or auth error.`;
      errorMessage += `\nURL called: ${url}`;
      errorMessage += `\nFinal URL: ${finalUrl}`;
      errorMessage += `\nStatus: ${status}`;
      
      if (response.redirected) {
        errorMessage += `\nRedirect detected: ${url} → ${finalUrl}`;
      }
      
      if (htmlPreview.is404) {
        errorMessage += `\nReason: 404 Not Found (route may not exist)`;
      } else if (status === 302 || status === 307 || status === 308) {
        errorMessage += `\nReason: Redirect (likely auth redirect to login page)`;
      } else {
        errorMessage += `\nReason: Server returned HTML instead of file/JSON`;
      }
      
      errorMessage += `\nHTML preview: ${htmlPreview.title || "No title"}`;
      
      console.error(`[downloadFromApi] HTML response detected:`, {
        url,
        finalUrl,
        status,
        redirected: response.redirected,
        htmlPreview,
      });
      
      throw new Error(errorMessage);
    }

    if (!response.ok) {
      // Vérifier le content-type pour savoir comment parser l'erreur
      let errorMessage = `Erreur HTTP ${status}`;
      
      if (contentType.includes("application/json")) {
        // Erreur JSON avec détails
        try {
          const errorJson = await response.json();
          // Prioriser details, puis error, puis message par défaut
          errorMessage = errorJson.details || errorJson.error || errorMessage;
          // Log stack trace in development (client-side check)
          if (errorJson.stack && typeof window !== "undefined") {
            console.error("Stack trace:", errorJson.stack);
          }
        } catch (parseError) {
          // Si le JSON ne peut pas être parsé, utiliser le texte brut
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
      } else if (contentType.includes("text/html")) {
        // HTML retourné au lieu de JSON/fichier
        const htmlText = await response.text();
        const match = htmlText.match(/<title>(.*?)<\/title>/i);
        const title = match ? match[1] : "No title";
        errorMessage = `HTML returned instead of file/JSON. Status: ${status}. Title: ${title}`;
        console.error(`[downloadFromApi] HTML response on error:`, {
          url,
          status,
          title,
          preview: htmlText.substring(0, 200),
        });
      } else {
        // Erreur texte
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    // Vérifier que le content-type correspond à un fichier binaire attendu
    const isPdf = contentType.includes("application/pdf");
    const isPpt = contentType.includes("application/vnd.openxmlformats-officedocument.presentationml.presentation");
    const isBinary = isPdf || isPpt || contentType.includes("application/octet-stream");

    if (!isBinary && !contentType.includes("application/json")) {
      console.warn(`[downloadFromApi] Unexpected content-type: ${contentType}. Expected PDF, PPT, or JSON.`);
    }

    // Récupérer le blob (NE JAMAIS utiliser response.text() pour un fichier binaire)
    // Le blob() préserve l'intégrité binaire du fichier
    const blob = await response.blob();

    // Vérifier que le blob n'est pas vide
    if (blob.size === 0) {
      throw new Error("Le fichier téléchargé est vide");
    }

    // Créer un lien temporaire pour télécharger
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);

    // Déclencher le téléchargement
    link.click();

    // Nettoyer
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(link);
    
    console.log(`[downloadFromApi] Download successful: ${filename} (${blob.size} bytes)`);
  } catch (error) {
    console.error("[downloadFromApi] Erreur lors du téléchargement:", error);
    throw error;
  }
}

