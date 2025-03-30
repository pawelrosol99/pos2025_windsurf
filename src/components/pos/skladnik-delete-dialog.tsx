"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

interface SkladnikDeleteDialogProps {
  skladnikId: number;
  skladnikNazwa: string;
  onSuccess: () => void;
}

export function SkladnikDeleteDialog({ skladnikId, skladnikNazwa, onSuccess }: SkladnikDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      // Sprawdź, czy składnik jest używany w produktach
      const { data: produkty, error: checkError } = await supabase
        .from("skladniki_produktow")
        .select("id")
        .eq("skladnik_id", skladnikId)
        .limit(1);

      if (checkError) {
        throw checkError;
      }

      if (produkty && produkty.length > 0) {
        toast({
          title: "Nie można usunąć",
          description: "Ten składnik jest używany w jednym lub więcej produktach. Usuń najpierw te powiązania.",
          variant: "destructive",
        });
        return;
      }

      // Usuń składnik
      const { error } = await supabase
        .from("skladniki")
        .delete()
        .eq("id", skladnikId);

      if (error) {
        throw error;
      }

      toast({
        title: "Sukces",
        description: "Składnik został usunięty",
      });
      
      onSuccess();
      setOpen(false);
    } catch (error: any) {
      console.error("Błąd podczas usuwania składnika:", error.message);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć składnika",
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
          <DialogTitle>Usuń składnik</DialogTitle>
          <DialogDescription>
            Czy na pewno chcesz usunąć składnik &quot;{skladnikNazwa}&quot;? 
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
