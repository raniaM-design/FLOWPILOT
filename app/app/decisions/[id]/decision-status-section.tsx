"use client";

import { useState, createContext, useContext } from "react";
import { DecisionWarningAlert } from "./decision-warning-alert";
import { UpdateDecisionStatusResult } from "./actions";

// Context pour partager le warning entre les composants
const WarningContext = createContext<{
  warning: UpdateDecisionStatusResult["warning"] | null;
  setWarning: (warning: UpdateDecisionStatusResult["warning"] | null) => void;
} | null>(null);

export function useWarningContext() {
  const context = useContext(WarningContext);
  if (!context) {
    throw new Error("useWarningContext must be used within DecisionStatusProvider");
  }
  return context;
}

interface DecisionStatusProviderProps {
  children: React.ReactNode;
  decisionId: string;
}

export function DecisionStatusProvider({
  children,
  decisionId,
}: DecisionStatusProviderProps) {
  const [warning, setWarning] = useState<UpdateDecisionStatusResult["warning"] | null>(null);

  return (
    <WarningContext.Provider value={{ warning, setWarning }}>
      {children}
    </WarningContext.Provider>
  );
}

export function DecisionWarningDisplay() {
  const context = useWarningContext();
  if (!context.warning) return null;

  return (
    <DecisionWarningAlert
      warning={context.warning}
      decisionId=""
      onDismiss={() => context.setWarning(null)}
    />
  );
}

