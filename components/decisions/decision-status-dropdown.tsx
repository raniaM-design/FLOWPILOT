"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, FileText, CheckCircle2, Archive } from "lucide-react";
import { updateDecisionStatus } from "@/app/app/decisions/[id]/actions";
import { useRouter } from "next/navigation";

interface DecisionStatusDropdownProps {
  decisionId: string;
  currentStatus: "DRAFT" | "DECIDED" | "ARCHIVED";
}

const statusOptions = [
  { value: "DRAFT" as const, label: "Brouillon", icon: FileText },
  { value: "DECIDED" as const, label: "Décidée", icon: CheckCircle2 },
  { value: "ARCHIVED" as const, label: "Archivée", icon: Archive },
];

export function DecisionStatusDropdown({ decisionId, currentStatus }: DecisionStatusDropdownProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const currentOption = statusOptions.find(opt => opt.value === currentStatus);

  const handleStatusChange = (newStatus: "DRAFT" | "DECIDED" | "ARCHIVED") => {
    if (newStatus === currentStatus) return;
    
    startTransition(async () => {
      await updateDecisionStatus(decisionId, newStatus);
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="default"
          disabled={isPending}
          className="gap-2"
        >
          {currentOption && <currentOption.icon className="h-4 w-4" />}
          <span>Changer statut</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {statusOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = option.value === currentStatus;
          
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              disabled={isSelected || isPending}
              className={isSelected ? "bg-slate-100" : ""}
            >
              <Icon className="h-4 w-4 mr-2" />
              <span>{option.label}</span>
              {isSelected && <span className="ml-auto text-xs">✓</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

