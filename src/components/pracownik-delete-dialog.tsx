import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { Trash2 } from "lucide-react";

interface PracownikDeleteDialogProps {
  pracownikId: number;
  pracownikNazwa: string;
  onSuccess?: () => void;
}

export function PracownikDeleteDialog({ pracownikId, pracownikNazwa, onSuccess }: PracownikDeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("pracownicy")
        .delete()
        .eq("id", pracownikId);

      if (error) throw error;

      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd podczas usuwania pracownika");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="icon" className="h-8 w-8">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Usuń pracownika</DialogTitle>
          <DialogDescription>
            Czy na pewno chcesz usunąć pracownika &quot;{pracownikNazwa}&quot;? Tej operacji nie można cofnąć.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="text-destructive text-sm mt-2">{error}</div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Anuluj
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isLoading}
          >
            {isLoading ? "Usuwanie..." : "Usuń pracownika"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
