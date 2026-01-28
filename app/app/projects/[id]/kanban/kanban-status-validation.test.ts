/**
 * Test de validation : vérifier que toutes les colonnes Kanban ont un mapping vers un statut valide
 * Ce test échoue si une colonne n'a pas de mapping vers un statut valide
 */

import { STATUS_CONFIG } from "./project-kanban-board";

// Types de statuts valides selon le backend
type ValidStatus = "TODO" | "DOING" | "DONE" | "BLOCKED";

// Liste des statuts valides
const VALID_STATUSES: ValidStatus[] = ["TODO", "DOING", "DONE", "BLOCKED"];

describe("Kanban Status Validation", () => {
  it("devrait avoir un mapping pour tous les statuts valides", () => {
    // Vérifier que chaque statut valide a une configuration
    VALID_STATUSES.forEach((status) => {
      expect(STATUS_CONFIG).toHaveProperty(status);
      expect(STATUS_CONFIG[status]).toBeDefined();
      expect(STATUS_CONFIG[status].label).toBeTruthy();
    });
  });

  it("ne devrait pas avoir de statuts non valides dans la configuration", () => {
    // Vérifier que tous les statuts dans STATUS_CONFIG sont valides
    Object.keys(STATUS_CONFIG).forEach((status) => {
      expect(VALID_STATUSES).toContain(status as ValidStatus);
    });
  });

  it("devrait avoir exactement 4 colonnes (une par statut)", () => {
    expect(Object.keys(STATUS_CONFIG)).toHaveLength(4);
    expect(Object.keys(STATUS_CONFIG).sort()).toEqual(VALID_STATUSES.sort());
  });

  it("devrait avoir un label pour chaque statut", () => {
    VALID_STATUSES.forEach((status) => {
      const config = STATUS_CONFIG[status];
      expect(config.label).toBeTruthy();
      expect(typeof config.label).toBe("string");
    });
  });
});

