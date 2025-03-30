import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { Edit2 } from "lucide-react";

interface Pracownik {
  id: number;
  firma_id: number;
  imie_nazwisko: string;
  nr_tel: string;
  mail: string;
  login: string;
  haslo: string;
  rola: string;
}

interface PracownikEditFormProps {
  pracownik: Pracownik;
  onSuccess?: () => void;
}

export function PracownikEditForm({ pracownik, onSuccess }: PracownikEditFormProps) {
  const [formData, setFormData] = useState<Pracownik>({
    id: pracownik.id,
    firma_id: pracownik.firma_id,
    imie_nazwisko: pracownik.imie_nazwisko,
    nr_tel: pracownik.nr_tel,
    mail: pracownik.mail,
    login: pracownik.login,
    haslo: pracownik.haslo,
    rola: pracownik.rola
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Aktualizuj dane formularza gdy zmienia się pracownik
    setFormData({
      id: pracownik.id,
      firma_id: pracownik.firma_id,
      imie_nazwisko: pracownik.imie_nazwisko,
      nr_tel: pracownik.nr_tel,
      mail: pracownik.mail,
      login: pracownik.login,
      haslo: pracownik.haslo,
      rola: pracownik.rola
    });
  }, [pracownik]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleChange = (value: string) => {
    setFormData({
      ...formData,
      rola: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("pracownicy")
        .update({
          imie_nazwisko: formData.imie_nazwisko,
          nr_tel: formData.nr_tel,
          mail: formData.mail,
          login: formData.login,
          haslo: formData.haslo,
          rola: formData.rola
        })
        .eq("id", pracownik.id);

      if (error) throw error;

      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd podczas aktualizacji pracownika");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edytuj pracownika</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="imie_nazwisko">Imię i nazwisko</Label>
              <Input
                id="imie_nazwisko"
                name="imie_nazwisko"
                value={formData.imie_nazwisko}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nr_tel">Numer telefonu</Label>
              <Input
                id="nr_tel"
                name="nr_tel"
                value={formData.nr_tel}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mail">Email</Label>
              <Input
                id="mail"
                name="mail"
                type="email"
                value={formData.mail}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login">Login</Label>
              <Input
                id="login"
                name="login"
                value={formData.login}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="haslo">Hasło</Label>
              <div className="flex">
                <Input
                  id="haslo"
                  name="haslo"
                  type={showPassword ? "text" : "password"}
                  value={formData.haslo}
                  onChange={handleChange}
                  required
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="ml-2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Ukryj" : "Pokaż"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rola">Rola</Label>
              <Select 
                value={formData.rola} 
                onValueChange={handleRoleChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz rolę" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="pracownik">Pracownik</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="text-destructive text-sm mt-2">{error}</div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
