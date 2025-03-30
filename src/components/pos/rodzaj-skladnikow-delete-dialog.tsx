"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

interface RodzajSkladnikowDeleteDialogProps {
  rodzajId: number;
  rodzajNazwa: string;
  onSuccess: () => void;
}

export function RodzajSkladnikowDeleteDialog({ rodzajId, rodzajNazwa, onSuccess }: RodzajSkladnikowDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      // Sprawdź, czy rodzaj składnika jest używany przez jakieś składniki
      const { data: skladniki, error: checkError } = await supabase
        .from("skladniki")
        .select("id")
        .eq("rodzaj_id", rodzajId)
        .limit(1);

      if (checkError) {
        throw checkError;
      }

      if (skladniki && skladniki.length > 0) {
        toast({
          title: "Nie można usunąć",
          description: "Ten rodzaj składnika jest używany przez jeden lub więcej składników. Usuń najpierw te składniki.",
          variant: "destructive",
        });
        return;
      }

      // Usuń rodzaj składnika
      const { error } = await supabase
        .from("rodzaje_skladnikow")
        .delete()
        .eq("id", rodzajId);

      if (error) {
        throw error;
      }

      toast({
        title: "Sukces",
        description: "Rodzaj składnika został usunięty",
      });
      
      onSuccess();
      setOpen(false);
    } catch (error: any) {
      console.error("Błąd podczas usuwania rodzaju składnika:", error.message);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć rodzaju składnika",
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
          <DialogTitle>Usuń rodzaj składnika</DialogTitle>
          <DialogDescription>
            Czy na pewno chcesz usunąć rodzaj składnika &quot;{rodzajNazwa}&quot;? 
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
