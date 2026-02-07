"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save, X } from "lucide-react";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  useEffect(() => {
    loadProfile();
  }, []);
  
  const loadProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur inconnue" }));
        console.error("Erreur API:", errorData);
        alert(errorData.error || "Erreur lors de la récupération de vos informations. Veuillez réessayer.");
        return;
      }
      const data = await response.json();
      setProfile(data);
      setName(data.name || "");
      setAvatarPreview(data.avatarUrl || null);
    } catch (error) {
      console.error("Erreur lors du chargement du profil:", error);
      alert("Erreur lors de la récupération de vos informations. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSave = async () => {
    setSaving(true);
    try {
      // Upload de l'avatar si un fichier a été sélectionné
      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        
        const avatarResponse = await fetch("/api/user/avatar", {
          method: "POST",
          body: formData,
        });
        
        if (!avatarResponse.ok) {
          const error = await avatarResponse.json();
          alert(error.error || "Erreur lors de l'upload de l'avatar");
          setSaving(false);
          return;
        }
        
        const { avatarUrl } = await avatarResponse.json();
        setAvatarPreview(avatarUrl);
      }
      
      // Mettre à jour le nom
      const profileResponse = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name || null }),
      });
      
      if (!profileResponse.ok) {
        const error = await profileResponse.json();
        alert(error.error || "Erreur lors de la mise à jour du profil");
        return;
      }
      
      const updatedProfile = await profileResponse.json();
      setProfile(updatedProfile);
      
      // Recharger la page pour mettre à jour le menu utilisateur
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde du profil");
    } finally {
      setSaving(false);
    }
  };
  
  const getInitials = (email: string, name: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };
  
  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="text-center text-red-600">Erreur lors du chargement du profil</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Mon profil</h1>
          <p className="text-slate-600">Gérez vos informations personnelles</p>
        </div>
        
        <FlowCard variant="default" className="bg-white border-0 shadow-lg">
          <FlowCardContent className="p-6">
            <div className="space-y-6">
              {/* Photo de profil */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview || undefined} alt={profile.name || profile.email} />
                    <AvatarFallback className="bg-blue-600 text-white text-2xl font-semibold">
                      {getInitials(profile.email, profile.name)}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg"
                  >
                    <Camera className="h-4 w-4 text-white" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700">Photo de profil</p>
                  <p className="text-xs text-slate-500">JPG, PNG ou GIF (max 5MB)</p>
                </div>
              </div>
              
              {/* Nom */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
                  Nom d'affichage
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                  className="h-11"
                  maxLength={100}
                  autoComplete="name"
                />
                <p className="text-xs text-slate-500">
                  Ce nom sera visible par les autres utilisateurs de votre entreprise
                </p>
              </div>
              
              {/* Email (lecture seule) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  value={profile.email}
                  disabled
                  className="h-11 bg-slate-50"
                  autoComplete="email"
                />
                <p className="text-xs text-slate-500">
                  L'email ne peut pas être modifié
                </p>
              </div>
              
              {/* Boutons */}
              <div className="flex items-center gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6"
                >
                  {saving ? (
                    <>Enregistrement...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer les modifications
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  className="text-slate-600 hover:text-slate-900"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </FlowCardContent>
        </FlowCard>
      </div>
    </div>
  );
}

