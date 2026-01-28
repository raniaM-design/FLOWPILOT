/**
 * Convention globale de z-index pour l'application
 * 
 * Utilisation :
 * - z-overlay (9999) : DropdownMenu, Select, Popover, Tooltip, etc.
 * - z-modal (10000) : Modals, Dialogs, Drawers
 * 
 * Ces valeurs garantissent que les overlays ne sont pas clippés
 * par des conteneurs avec overflow et restent au-dessus de tout.
 */

export const Z_INDEX = {
  overlay: 9999, // DropdownMenu, Select, Popover, Tooltip
  modal: 10000, // Modals, Dialogs, Drawers
} as const;

// Classes Tailwind correspondantes
export const Z_INDEX_CLASSES = {
  overlay: "z-[9999]",
  modal: "z-[10000]",
} as const;

