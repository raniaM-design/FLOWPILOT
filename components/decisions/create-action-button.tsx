"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreateActionButtonProps {
  decisionId: string;
}

export function CreateActionButton({ decisionId }: CreateActionButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    // Scroll vers le formulaire d'ajout d'action (qui sera dans la page)
    const formElement = document.getElementById("new-action-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "center" });
      // Focus sur le champ titre après un court délai
      setTimeout(() => {
        const titleInput = formElement.querySelector('input[name="title"]') as HTMLInputElement;
        if (titleInput) {
          titleInput.focus();
        }
      }, 300);
    }
  };

  return (
    <Button 
      onClick={handleClick}
      className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white"
    >
      <Plus className="mr-2 h-4 w-4" />
      Action liée
    </Button>
  );
}

