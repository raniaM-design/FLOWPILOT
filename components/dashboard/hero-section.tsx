import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Chip } from "@/components/ui/chip";
import { AlertCircle, Calendar, Ban, Sparkles } from "lucide-react";

interface HeroSectionProps {
  overdueCount: number;
  todayCount: number;
  blockedCount: number;
}

/**
 * Section HERO moderne pour le dashboard
 * Design énergique et motivant
 */
export function HeroSection({ overdueCount, todayCount, blockedCount }: HeroSectionProps) {
  const totalCritical = overdueCount + todayCount + blockedCount;
  const isAllGood = totalCritical === 0;

  return (
    <FlowCard variant="default" className="bg-gradient-to-br from-blue-50 via-white to-emerald-50 border-blue-200/60">
      <FlowCardContent className="py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                Bonjour 👋
              </h2>
            </div>
            <p className="text-lg text-slate-600 mb-4">
              Voici ce qui compte aujourd'hui
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {overdueCount > 0 && (
                <Chip variant="danger" size="md" className="gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-semibold">{overdueCount}</span>
                  <span>en retard</span>
                </Chip>
              )}
              {todayCount > 0 && (
                <Chip variant="warning" size="md" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-semibold">{todayCount}</span>
                  <span>aujourd'hui</span>
                </Chip>
              )}
              {blockedCount > 0 && (
                <Chip variant="warning" size="md" className="gap-2">
                  <Ban className="h-4 w-4" />
                  <span className="font-semibold">{blockedCount}</span>
                  <span>bloquée{blockedCount > 1 ? "s" : ""}</span>
                </Chip>
              )}
              {isAllGood && (
                <div className="flex items-center gap-2 text-emerald-600">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-lg font-medium">Rien de critique. Continue comme ça !</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </FlowCardContent>
    </FlowCard>
  );
}

