"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

interface KategoriaDeleteDialogProps {
  kategoriaId: number;
  kategoriaNazwa: string;
  onSuccess: () => void;
}

export function KategoriaDeleteDialog({ kategoriaId, kategoriaNazwa, onSuccess }: KategoriaDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      // Sprawdź, czy kategoria ma przypisane rozmiary
      const { data: rozmiary, error: checkRozmiaryError } = await supabase
        .from("rozmiary")
        .select("id")
        .eq("kategoria_id", kategoriaId)
        .limit(1);

      if (checkRozmiaryError) {
        throw checkRozmiaryError;
      }

      if (rozmiary && rozmiary.length > 0) {
        toast({
          title: "Nie można usunąć",
          description: "Ta kategoria ma przypisane rozmiary. Usuń najpierw wszystkie rozmiary.",
          variant: "destructive",
        });
        setIsDeleting(false);
        return;
      }

      // Sprawdź, czy kategoria jest używana w produktach
      const { data: produkty, error: checkProduktyError } = await supabase
        .from("produkty")
        .select("id")
        .eq("kategoria_id", kategoriaId)
        .limit(1);

      if (checkProduktyError) {
        throw checkProduktyError;
      }

      if (produkty && produkty.length > 0) {
        toast({
          title: "Nie można usunąć",
          description: "Ta kategoria jest używana w produktach. Usuń najpierw te produkty.",
          variant: "destructive",
        });
        setIsDeleting(false);
        return;
      }

      // Usuń kategorię
      const { error } = await supabase
        .from("kategorie")
        .delete()
        .eq("id", kategoriaId);

      if (error) {
        throw error;
      }

      toast({
        title: "Sukces",
        description: "Kategoria została usunięta",
      });
      
      onSuccess();
      setOpen(false);
    } catch (error: any) {
      console.error("Błąd podczas usuwania kategorii:", error.message);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć kategorii",
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
          <DialogTitle>Usuń kategorię</DialogTitle>
          <DialogDescription>
            Czy na pewno chcesz usunąć kategorię &quot;{kategoriaNazwa}&quot;? 
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
