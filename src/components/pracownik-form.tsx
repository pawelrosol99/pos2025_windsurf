import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";

interface PracownikFormProps {
  firmaId: number;
  onSuccess?: () => void;
}

export function PracownikForm({ firmaId, onSuccess }: PracownikFormProps) {
  const [formData, setFormData] = useState({
    imie_nazwisko: "",
    nr_tel: "",
    mail: "",
    login: "",
    haslo: "",
    rola: "pracownik"
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        .insert([{
          ...formData,
          firma_id: firmaId
        }]);

      if (error) throw error;

      // Resetuj formularz
      setFormData({
        imie_nazwisko: "",
        nr_tel: "",
        mail: "",
        login: "",
        haslo: "",
        rola: "pracownik"
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd podczas dodawania pracownika");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Dodaj nowego pracownika</CardTitle>
      </CardHeader>
      <CardContent>
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
              <Input
                id="haslo"
                name="haslo"
                type="password"
                value={formData.haslo}
                onChange={handleChange}
                required
              />
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

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Dodawanie..." : "Dodaj pracownika"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
