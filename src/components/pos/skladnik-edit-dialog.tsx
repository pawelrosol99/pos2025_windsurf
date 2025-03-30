"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

interface RodzajSkladnikow {
  id: number;
  nazwa: string;
}

interface Skladnik {
  id: number;
  nazwa: string;
  rodzaj_id: number;
  firma_id: number;
  data_utworzenia: string;
  rodzaj_nazwa?: string;
}

interface SkladnikEditDialogProps {
  skladnik: Skladnik;
  rodzajeSkladnikow: RodzajSkladnikow[];
  onSuccess: () => void;
}

export function SkladnikEditDialog({ skladnik, rodzajeSkladnikow, onSuccess }: SkladnikEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [nazwa, setNazwa] = useState(skladnik.nazwa);
  const [rodzajId, setRodzajId] = useState(skladnik.rodzaj_id.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nazwa.trim() || !rodzajId) {
      toast({
        title: "Błąd",
        description: "Nazwa składnika i rodzaj są wymagane",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("skladniki")
        .update({ 
          nazwa, 
          rodzaj_id: rodzajId 
        })
        .eq("id", skladnik.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Sukces",
        description: "Składnik został zaktualizowany",
      });
      
      onSuccess();
      setOpen(false);
    } catch (error: any) {
      console.error("Błąd podczas aktualizacji składnika:", error.message);
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować składnika",
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
          <DialogTitle>Edytuj składnik</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-nazwa">Nazwa</Label>
            <Input
              id="edit-nazwa"
              value={nazwa}
              onChange={(e) => setNazwa(e.target.value)}
              placeholder="Nazwa składnika"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-rodzaj">Rodzaj składnika</Label>
            <Select 
              value={rodzajId} 
              onValueChange={setRodzajId}
              disabled={isSubmitting || rodzajeSkladnikow.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz rodzaj składnika" />
              </SelectTrigger>
              <SelectContent>
                {rodzajeSkladnikow.map((rodzaj) => (
                  <SelectItem key={rodzaj.id} value={rodzaj.id.toString()}>
                    {rodzaj.nazwa}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting || !nazwa.trim() || !rodzajId}>
              {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
