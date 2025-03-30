"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

interface StanowiskoDeleteDialogProps {
  stanowiskoId: number;
  stanowiskoNazwa: string;
  onSuccess: () => void;
}

export function StanowiskoDeleteDialog({ stanowiskoId, stanowiskoNazwa, onSuccess }: StanowiskoDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      // Sprawdź, czy stanowisko jest używane w przypisaniach pracowników
      const { data: przypisania, error: checkError } = await supabase
        .from("przypisania_pracownikow")
        .select("id")
        .eq("stanowisko_id", stanowiskoId)
        .limit(1);

      if (checkError) {
        throw checkError;
      }

      if (przypisania && przypisania.length > 0) {
        toast({
          title: "Nie można usunąć",
          description: "To stanowisko jest używane w przypisaniach pracowników. Usuń najpierw te przypisania.",
          variant: "destructive",
        });
        return;
      }

      // Usuń stanowisko
      const { error } = await supabase
        .from("stanowiska")
        .delete()
        .eq("id", stanowiskoId);

      if (error) {
        throw error;
      }

      toast({
        title: "Sukces",
        description: "Stanowisko zostało usunięte",
      });
      
      onSuccess();
      setOpen(false);
    } catch (error: any) {
      console.error("Błąd podczas usuwania stanowiska:", error.message);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć stanowiska",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Usuń stanowisko</DialogTitle>
          <DialogDescription>
            Czy na pewno chcesz usunąć stanowisko &quot;{stanowiskoNazwa}&quot;? 
            Ta operacja jest nieodwracalna.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
            Anuluj
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Usuwanie..." : "Usuń"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
