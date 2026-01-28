/**
 * Helpers pour les statuts d'actions (côté client)
 */

export function getActionStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "TODO":
      return "secondary";
    case "DOING":
      return "default";
    case "DONE":
      return "outline";
    case "BLOCKED":
      return "destructive";
    default:
      return "outline";
  }
}

export function getActionStatusLabel(status: string): string {
  switch (status) {
    case "TODO":
      return "À faire";
    case "DOING":
      return "En cours";
    case "DONE":
      return "Terminée";
    case "BLOCKED":
      return "Bloquée";
    default:
      return status;
  }
}

