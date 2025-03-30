"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

interface Kategoria {
  id: number;
  nazwa: string;
  firma_id: number;
  data_utworzenia: string;
}

interface KategoriaEditDialogProps {
  kategoria: Kategoria;
  onSuccess: () => void;
}

export function KategoriaEditDialog({ kategoria, onSuccess }: KategoriaEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [nazwa, setNazwa] = useState(kategoria.nazwa);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nazwa.trim()) {
      toast({
        title: "Błąd",
        description: "Nazwa kategorii nie może być pusta",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("kategorie")
        .update({ nazwa })
        .eq("id", kategoria.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Sukces",
        description: "Kategoria została zaktualizowana",
      });
      
      onSuccess();
      setOpen(false);
    } catch (error: any) {
      console.error("Błąd podczas aktualizacji kategorii:", error.message);
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować kategorii",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edytuj kategorię</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-nazwa">Nazwa</Label>
            <Input
              id="edit-nazwa"
              value={nazwa}
              onChange={(e) => setNazwa(e.target.value)}
              placeholder="Nazwa kategorii"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting || !nazwa.trim()}>
              {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
