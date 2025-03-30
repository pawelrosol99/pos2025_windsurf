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

interface FirmaDeleteDialogProps {
  firmaId: number;
  firmaNazwa: string;
  onSuccess?: () => void;
}

export function FirmaDeleteDialog({ firmaId, firmaNazwa, onSuccess }: FirmaDeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Najpierw usuń wszystkich pracowników firmy
      const { error: pracownicyError } = await supabase
        .from("pracownicy")
        .delete()
        .eq("firma_id", firmaId);

      if (pracownicyError) throw pracownicyError;

      // Następnie usuń firmę
      const { error: firmaError } = await supabase
        .from("firmy")
        .delete()
        .eq("id", firmaId);

      if (firmaError) throw firmaError;

      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd podczas usuwania firmy");
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
          <DialogTitle>Usuń firmę</DialogTitle>
          <DialogDescription>
            Czy na pewno chcesz usunąć firmę &quot;{firmaNazwa}&quot;? Ta operacja spowoduje również usunięcie wszystkich pracowników firmy. Tej operacji nie można cofnąć.
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
            {isLoading ? "Usuwanie..." : "Usuń firmę"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
