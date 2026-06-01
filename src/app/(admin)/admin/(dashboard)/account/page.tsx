"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, Eye, EyeOff, KeyRound, Loader2, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabaseBrowser } from "@/lib/supabase-browser";

type PasswordFieldProps = {
  id: string;
  label: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  minLength?: number;
};

function PasswordField({
  id,
  label,
  autoComplete,
  value,
  onChange,
  disabled,
  minLength,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const VisibilityIcon = visible ? EyeOff : Eye;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="border-white/10 bg-black/30 pr-11"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:bg-white/5 hover:text-white"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          aria-pressed={visible}
        >
          <VisibilityIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminAccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const { data, error: userError } = await supabaseBrowser.auth.getUser();

      if (userError || !data.user?.email) {
        router.push("/admin/login");
        return;
      }

      setEmail(data.user.email);
      setLoadingUser(false);
    }

    loadUser();
  }, [router]);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError("Session admin introuvable. Reconnectez-vous a l'administration.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Le nouveau mot de passe doit contenir au moins 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("Le nouveau mot de passe doit etre different de l'ancien.");
      return;
    }

    setSaving(true);

    try {
      const { data: sessionData, error: sessionError } = await supabaseBrowser.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (sessionError || !accessToken) {
        throw new Error("Session admin introuvable. Reconnectez-vous a l'administration.");
      }

      const response = await fetch("/api/admin/account/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const result = (await response.json()) as { error?: string; passwordChangedAt?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Impossible de modifier le mot de passe.");
      }

      if (result.passwordChangedAt) {
        window.localStorage.setItem("admin:lastPasswordChangedAt", result.passwordChangedAt);
        window.dispatchEvent(
          new CustomEvent("admin-password-changed", {
            detail: { passwordChangedAt: result.passwordChangedAt },
          })
        );
      }

      const { error: signInError } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password: newPassword,
      });

      if (signInError) {
        throw new Error("Mot de passe modifie, mais la session n'a pas pu etre actualisee. Reconnectez-vous.");
      }

      resetForm();
      setSuccess("Mot de passe modifie avec succes.");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Impossible de modifier le mot de passe.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-400">Administration</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Compte admin</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Modifiez le mot de passe du compte administrateur connecte.
        </p>
      </div>

      <Card className="border-white/10 bg-[#111217]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-red-500/20 bg-red-500/10">
              <KeyRound className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <CardTitle className="text-white">Changer le mot de passe</CardTitle>
              <CardDescription>
                {loadingUser ? "Chargement du compte..." : email}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="border-red-500/30 bg-red-500/10 text-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-100">
                <LockKeyhole className="h-4 w-4 text-emerald-300" />
                <AlertTitle>Mot de passe verrouille</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <PasswordField
              id="currentPassword"
              label="Mot de passe actuel"
              autoComplete="current-password"
              value={currentPassword}
              onChange={setCurrentPassword}
              disabled={loadingUser || saving}
            />

            <div className="grid gap-5 md:grid-cols-2">
              <PasswordField
                id="newPassword"
                label="Nouveau mot de passe"
                autoComplete="new-password"
                value={newPassword}
                onChange={setNewPassword}
                disabled={loadingUser || saving}
                minLength={8}
              />

              <PasswordField
                id="confirmPassword"
                label="Confirmer le mot de passe"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                disabled={loadingUser || saving}
                minLength={8}
              />
            </div>

            <Button type="submit" disabled={loadingUser || saving} className="min-w-44">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Modification...
                </>
              ) : (
                "Modifier le mot de passe"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
