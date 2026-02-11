import { redirect } from "next/navigation";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, FileText, Mic, Folder, Calendar, Shield, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default async function UsagePage() {
  const userId = await getCurrentUserIdOrThrow();

  // Date de début du mois en cours
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Stats du mois
  const [meetingsCount, projectsCount, membersCount, transcriptions] = await Promise.all([
    // Nombre de réunions créées ce mois
    prisma.meeting.count({
      where: {
        ownerId: userId,
        createdAt: { gte: startOfMonth },
      },
    }),
    // Nombre de projets
    prisma.project.count({
      where: {
        ownerId: userId,
      },
    }),
    // Nombre de membres de l'entreprise (si l'utilisateur a une entreprise)
    (async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });
      if (!user?.companyId) return 0;
      return prisma.user.count({
        where: { companyId: user.companyId },
      });
    })(),
    // Transcriptions du mois avec durée estimée
    prisma.meetingTranscriptionJob.findMany({
      where: {
        meeting: { ownerId: userId },
        createdAt: { gte: startOfMonth },
        deletedAt: null,
        status: "done",
      },
      select: {
        id: true,
        createdAt: true,
        transcribedText: true,
        meeting: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
  ]);

  // Calculer les minutes audio transcrites
  // Estimation : ~150 mots/minute de parole, ~5 caractères/mot = ~750 caractères/minute
  // On peut aussi estimer via la longueur du texte transcrit
  const totalMinutesTranscribed = transcriptions.reduce((total, job) => {
    if (!job.transcribedText) return total;
    // Estimation basée sur la longueur du texte (approximatif)
    const wordCount = job.transcribedText.split(/\s+/).length;
    const estimatedMinutes = Math.ceil(wordCount / 150); // ~150 mots/minute
    return total + estimatedMinutes;
  }, 0);

  // Nombre de comptes rendus (réunions avec raw_notes)
  const reportsCount = await prisma.meeting.count({
    where: {
      ownerId: userId,
      raw_notes: { isNot: null },
      createdAt: { gte: startOfMonth },
    },
  });

  // Historique d'événements (simplifié pour MVP)
  // On peut créer un modèle UsageEvent plus tard si nécessaire
  const recentTranscriptions = transcriptions.slice(0, 10).map((job) => ({
    date: job.createdAt,
    type: "transcription" as const,
    meetingTitle: job.meeting.title,
    meetingId: job.meeting.id,
    volume: job.transcribedText
      ? `${Math.ceil(job.transcribedText.split(/\s+/).length / 150)} min`
      : "N/A",
    status: "done" as const,
  }));

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Utilisation</h1>
        <p className="text-slate-600">Statistiques et historique de votre utilisation de PILOTYS</p>
      </div>

      <div className="grid gap-6">
        {/* Stats du mois */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Réunions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <p className="text-2xl font-bold text-slate-900">{meetingsCount}</p>
              </div>
              <p className="text-xs text-slate-500 mt-1">Ce mois</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Comptes rendus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                <p className="text-2xl font-bold text-slate-900">{reportsCount}</p>
              </div>
              <p className="text-xs text-slate-500 mt-1">Ce mois</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Minutes audio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-purple-600" />
                <p className="text-2xl font-bold text-slate-900">{totalMinutesTranscribed}</p>
              </div>
              <p className="text-xs text-slate-500 mt-1">Transcrites ce mois</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Projets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-orange-600" />
                <p className="text-2xl font-bold text-slate-900">{projectsCount}</p>
              </div>
              <p className="text-xs text-slate-500 mt-1">Total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Membres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                <p className="text-2xl font-bold text-slate-900">{membersCount}</p>
              </div>
              <p className="text-xs text-slate-500 mt-1">Dans l'entreprise</p>
            </CardContent>
          </Card>
        </div>

        {/* Historique d'événements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Historique d'utilisation
            </CardTitle>
            <CardDescription>Événements récents de ce mois</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTranscriptions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-sm">Aucun événement ce mois</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Réunion</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Volume</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTranscriptions.map((event) => (
                      <tr key={event.meetingId} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {formatDistanceToNow(event.date, { addSuffix: true, locale: fr })}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Transcription
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/app/meetings/${event.meetingId}/analyze`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {event.meetingTitle}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">{event.volume}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Terminé
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gestion des données */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-slate-600" />
              Gestion des données
            </CardTitle>
            <CardDescription>Accédez à la politique de confidentialité et gérez vos données</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/legal/confidentialite"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              Politique de confidentialité
              <ExternalLink className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

