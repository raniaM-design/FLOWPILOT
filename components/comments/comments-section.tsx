"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Loader2, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    email: string;
    name: string | null;
  };
}

interface CommentsSectionProps {
  entityType: "decision" | "action";
  entityId: string;
}

export function CommentsSection({ entityType, entityId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  // Charger les commentaires
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setIsLoading(true);
        const endpoint = entityType === "decision" 
          ? `/api/comments/decision/${entityId}`
          : `/api/comments/action/${entityId}`;
        
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments || []);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error("Erreur lors du chargement des commentaires:", errorData);
          // Si c'est une erreur 404 ou autre, on affiche juste un message vide
          if (response.status !== 404) {
            toast.error("Erreur lors du chargement des commentaires");
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des commentaires:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [entityType, entityId]);

  // Ajouter un nouveau commentaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [entityType === "decision" ? "decisionId" : "actionId"]: entityId,
          content: newComment.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout du commentaire");
      }

      const comment = await response.json();
      setComments([...comments, comment]);
      setNewComment("");
      toast.success("Commentaire ajouté avec succès");
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error);
      toast.error("Erreur lors de l'ajout du commentaire");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modifier un commentaire
  const handleEdit = async (commentId: string) => {
    if (!editingContent.trim()) {
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: editingContent.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la modification du commentaire");
      }

      const updatedComment = await response.json();
      setComments(comments.map(c => c.id === commentId ? updatedComment : c));
      setEditingCommentId(null);
      setEditingContent("");
      toast.success("Commentaire modifié avec succès");
    } catch (error) {
      console.error("Erreur lors de la modification du commentaire:", error);
      toast.error("Erreur lors de la modification du commentaire");
    }
  };

  // Supprimer un commentaire
  const handleDelete = async (commentId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du commentaire");
      }

      setComments(comments.filter(c => c.id !== commentId));
      toast.success("Commentaire supprimé avec succès");
    } catch (error) {
      console.error("Erreur lors de la suppression du commentaire:", error);
      toast.error("Erreur lors de la suppression du commentaire");
    }
  };

  // Récupérer l'ID de l'utilisateur actuel depuis l'API
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer l'ID de l'utilisateur actuel depuis une API route
    fetch("/api/user/me")
      .then(res => res.json())
      .then(data => {
        if (data.userId) {
          setCurrentUserId(data.userId);
        }
      })
      .catch(() => {
        // Si l'API n'existe pas, on laisse null et les vérifications se feront côté serveur
      });
  }, []);

  if (isLoading) {
    return (
      <Card className="border-blue-200/50">
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          Commentaires ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Liste des commentaires */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              Aucun commentaire pour le moment. Soyez le premier à commenter !
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="border border-slate-200 rounded-lg p-4 bg-slate-50/50"
              >
                {editingCommentId === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="min-h-[80px]"
                      placeholder="Modifier votre commentaire..."
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditingContent("");
                        }}
                      >
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEdit(comment.id)}
                        disabled={!editingContent.trim()}
                      >
                        Enregistrer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-slate-900">
                            {comment.author.name || comment.author.email.split("@")[0]}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                              locale: fr,
                            })}
                            {comment.updatedAt !== comment.createdAt && " (modifié)"}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                      {(currentUserId === null || comment.author.id === currentUserId) && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditingContent(comment.content);
                            }}
                            title="Modifier"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(comment.id)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Formulaire d'ajout de commentaire */}
        <form onSubmit={handleSubmit} className="space-y-2 border-t border-slate-200 pt-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Ajouter un commentaire..."
            className="min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Commenter
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

