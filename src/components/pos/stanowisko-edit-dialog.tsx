"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

interface Stanowisko {
  id: number;
  nazwa: string;
  stawka_godzinowa: number;
  firma_id: number;
  data_utworzenia: string;
}

interface StanowiskoEditDialogProps {
  stanowisko: Stanowisko;
  onSuccess: () => void;
}

export function StanowiskoEditDialog({ stanowisko, onSuccess }: StanowiskoEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [nazwa, setNazwa] = useState(stanowisko.nazwa);
  const [stawkaGodzinowa, setStawkaGodzinowa] = useState(stanowisko.stawka_godzinowa.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nazwa.trim()) {
      toast({
        title: "Błąd",
        description: "Nazwa stanowiska nie może być pusta",
        variant: "destructive",
      });
      return;
    }

    const stawkaValue = parseFloat(stawkaGodzinowa.replace(",", "."));
    if (isNaN(stawkaValue) || stawkaValue <= 0) {
      toast({
        title: "Błąd",
        description: "Stawka godzinowa musi być liczbą dodatnią",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("stanowiska")
        .update({ 
          nazwa, 
          stawka_godzinowa: stawkaValue 
        })
        .eq("id", stanowisko.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Sukces",
        description: "Stanowisko zostało zaktualizowane",
      });
      
      onSuccess();
      setOpen(false);
    } catch (error: any) {
      console.error("Błąd podczas aktualizacji stanowiska:", error.message);
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować stanowiska",
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
          <DialogTitle>Edytuj stanowisko</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-nazwa">Nazwa</Label>
            <Input
              id="edit-nazwa"
              value={nazwa}
              onChange={(e) => setNazwa(e.target.value)}
              placeholder="Nazwa stanowiska"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-stawka">Stawka godzinowa (zł)</Label>
            <Input
              id="edit-stawka"
              value={stawkaGodzinowa}
              onChange={(e) => setStawkaGodzinowa(e.target.value)}
              placeholder="Stawka godzinowa"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting || !nazwa.trim() || !stawkaGodzinowa.trim()}>
              {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
