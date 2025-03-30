"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { 
  Plus, 
  Clock, 
  CreditCard, 
  Wallet, 
  Users, 
  Home, 
  MapPin, 
  Check, 
  X, 
  Phone, 
  Info, 
  Calendar, 
  Timer,
  DollarSign,
  Trash2,
  UserCheck
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { NoweZamowienieDialog } from "@/components/pos/nowe-zamowienie-dialog";
import { ProduktDialog } from "@/components/pos/produkt-dialog";

interface Kategoria {
  id: number;
  nazwa: string;
}

interface Produkt {
  id: number;
  nazwa: string;
  kategoria_id: number;
}

interface Rozmiar {
  id: number;
  nazwa: string;
  kategoria_id: number;
}

interface CenaProdukt {
  id: number;
  produkt_id: number;
  rozmiar_id: number;
  cena_bazowa: number;
}

interface Zamowienie {
  id: number;
  numer: string;
  rodzaj: 'sala' | 'wynos' | 'dowoz';
  forma_platnosci: 'gotowka' | 'karta';
  status_platnosci: 'zaplacone' | 'do_zaplaty';
  status: 'nowe' | 'w_przygotowaniu' | 'gotowe' | 'wydane' | 'dostarczone';
  godzina_utworzenia: string;
  planowana_godzina_dostawy: string;
  kwota_calkowita: number;
  stolik?: string;
  adres_dostawy?: string;
  telefon_klienta?: string;
  uwagi?: string;
}

interface PozycjaZamowienia {
  produkt_id: number;
  produkt_nazwa: string;
  rozmiar_id: number;
  rozmiar_nazwa: string;
  cena: number;
  ilosc: number;
  usunieteSkladniki: {
    id: number;
    nazwa: string;
    akcja: 'usuniety';
    cena: number;
  }[];
  dodaneSkladniki: {
    id: number;
    nazwa: string;
    akcja: 'dodany';
    cena: number;
  }[];
}

export default function KelnerPage() {
  const params = useParams();
  const firmaId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [firmaData, setFirmaData] = useState<any>(null);
  const [kategorie, setKategorie] = useState<Kategoria[]>([]);
  const [produkty, setProdukty] = useState<Record<number, Produkt[]>>({});
  const [rozmiary, setRozmiary] = useState<Record<number, Rozmiar[]>>({});
  const [cenyProduktow, setCenyProduktow] = useState<Record<number, Record<number, number>>>({});
  const [zamowienia, setZamowienia] = useState<Zamowienie[]>([]);
  const [aktywneZamowienie, setAktywneZamowienie] = useState<Zamowienie | null>(null);
  const [aktywnaKategoria, setAktywnaKategoria] = useState<number | null>(null);
  
  // Stan dla nowego zamówienia
  const [noweZamowienie, setNoweZamowienie] = useState(false);
  const [rodzajZamowienia, setRodzajZamowienia] = useState<'sala' | 'wynos' | 'dowoz'>('sala');
  const [formaPlatnosci, setFormaPlatnosci] = useState<'gotowka' | 'karta'>('gotowka');
  const [statusPlatnosci, setStatusPlatnosci] = useState<'zaplacone' | 'do_zaplaty'>('do_zaplaty');
  const [numerStolika, setNumerStolika] = useState('');
  const [adresDostawy, setAdresDostawy] = useState('');
  const [telefonKlienta, setTelefonKlienta] = useState('');
  const [uwagi, setUwagi] = useState('');
  const [planowanaGodzina, setPlanowanaGodzina] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userData, setUserData] = useState<{
    imie_nazwisko?: string;
    login?: string;
    id?: number;
  }>({});
  
  // Stan dla dialogu produktu
  const [produktDialogOpen, setProduktDialogOpen] = useState(false);
  const [wybranyProdukt, setWybranyProdukt] = useState<Produkt | null>(null);
  const [pozycjeZamowienia, setPozycjeZamowienia] = useState<PozycjaZamowienia[]>([]);
  const [kwotaZamowienia, setKwotaZamowienia] = useState(0);

  useEffect(() => {
    const fetchFirmaData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("firmy")
          .select("*")
          .eq("id", firmaId)
          .single();

        if (error) {
          throw error;
        }

        setFirmaData(data);
      } catch (error) {
        console.error("Błąd podczas pobierania danych firmy:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchKategorie = async () => {
      try {
        const { data, error } = await supabase
          .from("kategorie")
          .select("*")
          .eq("firma_id", firmaId)
          .order("nazwa");

        if (error) {
          throw error;
        }

        setKategorie(data || []);
        
        // Ustaw pierwszą kategorię jako aktywną
        if (data && data.length > 0) {
          setAktywnaKategoria(data[0].id);
          await fetchProduktyForKategoria(data[0].id);
          await fetchRozmiaryForKategoria(data[0].id);
        }
      } catch (error) {
        console.error("Błąd podczas pobierania kategorii:", error);
      }
    };

    const fetchZamowienia = async () => {
      try {
        const { data, error } = await supabase
          .from("zamowienia")
          .select("*")
          .eq("firma_id", firmaId)
          .in("status", ["nowe", "w_przygotowaniu", "gotowe"])
          .order("godzina_utworzenia", { ascending: false });

        if (error) {
          throw error;
        }

        setZamowienia(data || []);
      } catch (error) {
        console.error("Błąd podczas pobierania zamówień:", error);
      }
    };

    // Pobierz dane zalogowanego użytkownika z localStorage
    const getUserData = () => {
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
      }
    };

    if (firmaId) {
      fetchFirmaData();
      fetchKategorie();
      fetchZamowienia();
      getUserData();
    }
  }, [firmaId]);

  const fetchProduktyForKategoria = async (kategoriaId: number) => {
    try {
      const { data, error } = await supabase
        .from("produkty")
        .select("*")
        .eq("kategoria_id", kategoriaId)
        .eq("firma_id", firmaId)
        .order("nazwa");

      if (error) {
        throw error;
      }

      setProdukty(prev => ({
        ...prev,
        [kategoriaId]: data || []
      }));

      // Pobierz ceny dla każdego produktu
      for (const produkt of data || []) {
        await fetchCenyForProdukt(produkt.id);
      }
    } catch (error) {
      console.error("Błąd podczas pobierania produktów:", error);
    }
  };

  const fetchRozmiaryForKategoria = async (kategoriaId: number) => {
    try {
      const { data, error } = await supabase
        .from("rozmiary")
        .select("*")
        .eq("kategoria_id", kategoriaId)
        .order("nazwa");

      if (error) {
        throw error;
      }

      setRozmiary(prev => ({
        ...prev,
        [kategoriaId]: data || []
      }));
    } catch (error) {
      console.error("Błąd podczas pobierania rozmiarów:", error);
    }
  };

  const fetchCenyForProdukt = async (produktId: number) => {
    try {
      const { data, error } = await supabase
        .from("ceny_produktow")
        .select("*")
        .eq("produkt_id", produktId);

      if (error) {
        throw error;
      }

      const cenyMap: Record<number, number> = {};
      for (const cena of data || []) {
        cenyMap[cena.rozmiar_id] = cena.cena_bazowa;
      }

      setCenyProduktow(prev => ({
        ...prev,
        [produktId]: cenyMap
      }));
    } catch (error) {
      console.error("Błąd podczas pobierania cen produktu:", error);
    }
  };

  const handleKategoriaClick = async (kategoriaId: number) => {
    setAktywnaKategoria(kategoriaId);
    
    if (!produkty[kategoriaId]) {
      await fetchProduktyForKategoria(kategoriaId);
    }
    
    if (!rozmiary[kategoriaId]) {
      await fetchRozmiaryForKategoria(kategoriaId);
    }
  };

  const handleNoweZamowienie = (zamowienieId: number) => {
    // Pobierz nowo utworzone zamówienie
    const fetchNoweZamowienie = async () => {
      try {
        const { data, error } = await supabase
          .from("zamowienia")
          .select("*")
          .eq("id", zamowienieId)
          .single();

        if (error) {
          throw error;
        }

        // Dodaj nowe zamówienie do listy i ustaw jako aktywne
        setZamowienia(prev => [data, ...prev]);
        setAktywneZamowienie(data);
      } catch (error) {
        console.error("Błąd podczas pobierania nowego zamówienia:", error);
      }
    };

    fetchNoweZamowienie();
  };

  const handleProduktClick = (produkt: Produkt) => {
    setWybranyProdukt(produkt);
    setProduktDialogOpen(true);
  };

  const handleAddToOrder = (pozycja: PozycjaZamowienia) => {
    // Dodaj ilość domyślnie 1
    const nowaPozycja = {
      ...pozycja,
      ilosc: 1
    };
    
    setPozycjeZamowienia(prev => [...prev, nowaPozycja]);
    
    // Przelicz kwotę zamówienia
    const nowaKwota = kwotaZamowienia + nowaPozycja.cena;
    setKwotaZamowienia(nowaKwota);
    
    toast({
      title: "Dodano do zamówienia",
      description: `${pozycja.produkt_nazwa} (${pozycja.rozmiar_nazwa})`,
    });
  };
  
  const handleRemoveFromOrder = (index: number) => {
    const pozycja = pozycjeZamowienia[index];
    const nowaKwota = kwotaZamowienia - pozycja.cena;
    
    setPozycjeZamowienia(prev => prev.filter((_, i) => i !== index));
    setKwotaZamowienia(nowaKwota);
    
    toast({
      title: "Usunięto z zamówienia",
      description: `${pozycja.produkt_nazwa} (${pozycja.rozmiar_nazwa})`,
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      // Sprawdź tylko, czy są pozycje w zamówieniu
      if (pozycjeZamowienia.length === 0) {
        throw new Error("Dodaj przynajmniej jeden produkt do zamówienia");
      }

      // Generowanie numeru zamówienia (format: RRMMDD-XXX)
      const now = new Date();
      const datePart = `${now.getFullYear().toString().slice(2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
      
      // Pobierz ostatnie zamówienie z dzisiaj, aby wygenerować kolejny numer
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
      const { data: ostatnieZamowienia, error: errorZamowienia } = await supabase
        .from("zamowienia")
        .select("numer")
        .gte("data", startOfDay)
        .order("data", { ascending: false })
        .limit(1);

      if (errorZamowienia) {
        throw errorZamowienia;
      }

      let numerPorzadkowy = 1;
      if (ostatnieZamowienia && ostatnieZamowienia.length > 0) {
        const ostatniNumer = ostatnieZamowienia[0].numer;
        const ostatniNumerPorzadkowy = parseInt(ostatniNumer.split('-')[1]);
        if (!isNaN(ostatniNumerPorzadkowy)) {
          numerPorzadkowy = ostatniNumerPorzadkowy + 1;
        }
      }

      const numerZamowienia = `${datePart}-${numerPorzadkowy.toString().padStart(3, '0')}`;
      const godzinaUtworzenia = now.toTimeString().split(' ')[0];
      
      // Ustaw planowaną godzinę dostawy jeśli nie została wybrana
      const planowanaGodzinaDost = planowanaGodzina 
        ? planowanaGodzina.toTimeString().split(' ')[0] 
        : null;

      // Dodaj zamówienie
      const { data, error } = await supabase
        .from("zamowienia")
        .insert([
          {
            firma_id: firmaId,
            numer: numerZamowienia,
            rodzaj: rodzajZamowienia,
            forma_platnosci: formaPlatnosci,
            status_platnosci: statusPlatnosci,
            adres: rodzajZamowienia === "dowoz" ? adresDostawy : null,
            nr_tel: telefonKlienta,
            info: rodzajZamowienia === "sala" ? numerStolika : (uwagi.trim() || null),
            status: "nowe",
            godzina_utworzenia: godzinaUtworzenia,
            planowana_godzina_dostawy: planowanaGodzinaDost,
            kwota_calkowita: kwotaZamowienia,
            pracownik_id: userData.id || null,
            data: now.toISOString().split('T')[0],
          }
        ])
        .select();

      if (error) {
        throw error;
      }
      
      const zamowienieId = data[0].id;
      
      // Dodaj pozycje zamówienia
      const pozycjeToInsert = pozycjeZamowienia.map(pozycja => ({
        zamowienie_id: zamowienieId,
        produkt_id: pozycja.produkt_id,
        rozmiar_id: pozycja.rozmiar_id,
        ilosc: pozycja.ilosc,
        cena: pozycja.cena,
      }));
      
      const { data: pozycjeData, error: pozycjeError } = await supabase
        .from("pozycje_zamowienia")
        .insert(pozycjeToInsert)
        .select();
        
      if (pozycjeError) {
        throw pozycjeError;
      }
      
      // Dodaj modyfikacje składników
      const modyfikacjeToInsert = [];
      
      for (let i = 0; i < pozycjeZamowienia.length; i++) {
        const pozycja = pozycjeZamowienia[i];
        const pozycjaId = pozycjeData[i].id;
        
        // Dodaj usunięte składniki
        for (const skladnik of pozycja.usunieteSkladniki) {
          modyfikacjeToInsert.push({
            pozycja_zamowienia_id: pozycjaId,
            skladnik_id: skladnik.id,
            akcja: 'usuniety',
            cena: skladnik.cena,
          });
        }
        
        // Dodaj dodane składniki
        for (const skladnik of pozycja.dodaneSkladniki) {
          modyfikacjeToInsert.push({
            pozycja_zamowienia_id: pozycjaId,
            skladnik_id: skladnik.id,
            akcja: 'dodany',
            cena: skladnik.cena,
          });
        }
      }
      
      if (modyfikacjeToInsert.length > 0) {
        const { error: modyfikacjeError } = await supabase
          .from("modyfikacje_skladnikow")
          .insert(modyfikacjeToInsert);
          
        if (modyfikacjeError) {
          throw modyfikacjeError;
        }
      }

      toast({
        title: "Sukces",
        description: `Utworzono nowe zamówienie #${numerZamowienia}`,
      });

      setZamowienia(prev => [data[0], ...prev]);
      setAktywneZamowienie(data[0]);
      setNoweZamowienie(false);
      setRodzajZamowienia('sala');
      setFormaPlatnosci('gotowka');
      setStatusPlatnosci('do_zaplaty');
      setNumerStolika('');
      setAdresDostawy('');
      setTelefonKlienta('');
      setUwagi('');
      setPlanowanaGodzina(null);
      setPozycjeZamowienia([]);
      setKwotaZamowienia(0);
    } catch (error: any) {
      console.error("Błąd podczas tworzenia nowego zamówienia:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się utworzyć zamówienia",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Ładowanie...</div>;
  }

  if (!firmaData) {
    return <div className="flex justify-center items-center min-h-screen">Nie znaleziono firmy</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation firmaId={firmaId} />
      <main className="container mx-auto py-6 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Lewa kolumna - lista zamówień i kategorie */}
          <div className="md:col-span-2">
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Zamówienia</CardTitle>
                  <Button onClick={() => setNoweZamowienie(true)}>Utwórz nowe zamówienie</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex overflow-x-auto pb-4 space-x-4">
                  {zamowienia.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground w-full">
                      Brak aktywnych zamówień. Utwórz nowe zamówienie.
                    </div>
                  ) : (
                    zamowienia.map((zamowienie) => (
                      <Card 
                        key={zamowienie.id} 
                        className={`w-64 shrink-0 cursor-pointer border-2 ${
                          zamowienie.status_platnosci === 'zaplacone' ? 'border-green-500' : 'border-red-500'
                        }`}
                        onClick={() => setAktywneZamowienie(zamowienie)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              <span className="text-sm">{zamowienie.godzina_utworzenia}</span>
                            </div>
                            <div>
                              {zamowienie.forma_platnosci === 'gotowka' ? (
                                <Wallet className="h-4 w-4" />
                              ) : (
                                <CreditCard className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                          <div className="flex items-center">
                            {zamowienie.rodzaj === 'sala' ? (
                              <UserCheck className="h-4 w-4 mr-1" />
                            ) : zamowienie.rodzaj === 'wynos' ? (
                              <Home className="h-4 w-4 mr-1" />
                            ) : (
                              <MapPin className="h-4 w-4 mr-1" />
                            )}
                            <span className="text-sm font-medium">
                              {zamowienie.rodzaj === 'sala' ? 'Sala' : 
                               zamowienie.rodzaj === 'wynos' ? 'Wynos' : 'Dowóz'}
                            </span>
                          </div>
                          <div className="mt-2">
                            <span className="text-sm font-bold">
                              {zamowienie.kwota_calkowita.toFixed(2)} zł
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Menu</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs 
                  value={aktywnaKategoria?.toString() || ""}
                  onValueChange={(value) => handleKategoriaClick(parseInt(value))}
                >
                  <TabsList className="mb-4 w-full flex overflow-x-auto">
                    {kategorie.map((kategoria) => (
                      <TabsTrigger 
                        key={kategoria.id} 
                        value={kategoria.id.toString()}
                        className="flex-shrink-0"
                      >
                        {kategoria.nazwa}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {kategorie.map((kategoria) => (
                    <TabsContent key={kategoria.id} value={kategoria.id.toString()}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {produkty[kategoria.id]?.map((produkt) => (
                          <Card 
                            key={produkt.id} 
                            className="cursor-pointer hover:bg-accent"
                            onClick={() => handleProduktClick(produkt)}
                          >
                            <CardContent className="p-4">
                              <h3 className="font-medium text-center">{produkt.nazwa}</h3>
                              {rozmiary[kategoria.id]?.length > 0 && (
                                <div className="mt-2 text-sm text-center">
                                  <div className="text-xs text-muted-foreground mb-1">Rozmiary:</div>
                                  {rozmiary[kategoria.id]?.map((rozmiar) => (
                                    <div key={rozmiar.id} className="flex justify-between">
                                      <span>{rozmiar.nazwa}:</span>
                                      <span className="font-medium">
                                        {cenyProduktow[produkt.id]?.[rozmiar.id]?.toFixed(2) || "-"} zł
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                        {(!produkty[kategoria.id] || produkty[kategoria.id].length === 0) && (
                          <div className="col-span-full text-center py-4 text-muted-foreground">
                            Brak produktów w tej kategorii
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Prawa kolumna - szczegóły zamówienia */}
          <div>
            {noweZamowienie ? (
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle>Nowe zamówienie</CardTitle>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date().toLocaleDateString()}
                      <Timer className="h-4 w-4 ml-2" />
                      {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {userData.imie_nazwisko || "Nieznany pracownik"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Rodzaj zamówienia */}
                    <div>
                      <div className="flex justify-center mb-4">
                        <div className="flex rounded-lg overflow-hidden">
                          <Button
                            type="button"
                            variant="ghost"
                            className={`px-4 py-2 flex items-center gap-2 ${
                              rodzajZamowienia === 'sala' 
                                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => setRodzajZamowienia('sala')}
                          >
                            <Users className="h-4 w-4" />
                            Sala
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className={`px-4 py-2 flex items-center gap-2 ${
                              rodzajZamowienia === 'wynos' 
                                ? 'bg-amber-600 text-white hover:bg-amber-700' 
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => setRodzajZamowienia('wynos')}
                          >
                            <Home className="h-4 w-4" />
                            Wynos
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className={`px-4 py-2 flex items-center gap-2 ${
                              rodzajZamowienia === 'dowoz' 
                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => setRodzajZamowienia('dowoz')}
                          >
                            <MapPin className="h-4 w-4" />
                            Dowóz
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Forma płatności */}
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Płatność</Label>
                        <div className="flex rounded-lg overflow-hidden">
                          <Button
                            type="button"
                            variant="ghost"
                            className={`flex-1 py-1 flex items-center justify-center gap-1 ${
                              formaPlatnosci === 'gotowka' 
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => setFormaPlatnosci('gotowka')}
                          >
                            <Wallet className="h-3 w-3" />
                            <span className="text-xs">Gotówka</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className={`flex-1 py-1 flex items-center justify-center gap-1 ${
                              formaPlatnosci === 'karta' 
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => setFormaPlatnosci('karta')}
                          >
                            <CreditCard className="h-3 w-3" />
                            <span className="text-xs">Karta</span>
                          </Button>
                        </div>
                      </div>

                      {/* Status płatności */}
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
                        <div className="flex rounded-lg overflow-hidden">
                          <Button
                            type="button"
                            variant="ghost"
                            className={`flex-1 py-1 flex items-center justify-center gap-1 ${
                              statusPlatnosci === 'do_zaplaty' 
                                ? 'bg-red-600 text-white hover:bg-red-700' 
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => setStatusPlatnosci('do_zaplaty')}
                          >
                            <X className="h-3 w-3" />
                            <span className="text-xs">Do zapłaty</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className={`flex-1 py-1 flex items-center justify-center gap-1 ${
                              statusPlatnosci === 'zaplacone' 
                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => setStatusPlatnosci('zaplacone')}
                          >
                            <Check className="h-3 w-3" />
                            <span className="text-xs">Zapłacone</span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Pola dodatkowe w zależności od typu zamówienia */}
                    <div className="space-y-3">
                      {rodzajZamowienia === 'sala' && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <Input
                            id="numerStolika"
                            value={numerStolika}
                            onChange={(e) => setNumerStolika(e.target.value)}
                            placeholder="Numer stolika"
                            className="flex-1"
                          />
                        </div>
                      )}

                      {(rodzajZamowienia === 'wynos' || rodzajZamowienia === 'dowoz') && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <Input
                            id="telefonKlienta"
                            value={telefonKlienta}
                            onChange={(e) => setTelefonKlienta(e.target.value)}
                            placeholder="Telefon klienta"
                            className="flex-1"
                          />
                        </div>
                      )}

                      {rodzajZamowienia === 'dowoz' && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <Input
                            id="adresDostawy"
                            value={adresDostawy}
                            onChange={(e) => setAdresDostawy(e.target.value)}
                            placeholder="Adres dostawy"
                            className="flex-1"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="uwagi"
                          value={uwagi}
                          onChange={(e) => setUwagi(e.target.value)}
                          placeholder="Uwagi do zamówienia"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {/* Planowana godzina dostawy */}
                    <div className="bg-muted/30 rounded-lg p-2">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          <span>Planowana dostawa:</span>
                        </div>
                        <span className="font-bold">
                          {planowanaGodzina 
                            ? planowanaGodzina.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                            : new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1 h-7 text-xs"
                          onClick={() => {
                            const date = new Date();
                            date.setMinutes(date.getMinutes() + 5);
                            setPlanowanaGodzina(date);
                          }}
                        >
                          +5 min
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1 h-7 text-xs"
                          onClick={() => {
                            const date = new Date();
                            date.setMinutes(date.getMinutes() + 20);
                            setPlanowanaGodzina(date);
                          }}
                        >
                          +20 min
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1 h-7 text-xs"
                          onClick={() => {
                            const date = new Date();
                            date.setMinutes(date.getMinutes() + 60);
                            setPlanowanaGodzina(date);
                          }}
                        >
                          +60 min
                        </Button>
                      </div>
                    </div>

                    {/* Lista produktów */}
                    <div className="space-y-3">
                      {pozycjeZamowienia.length > 0 ? (
                        <>
                          <div className="text-sm font-medium">Produkty w zamówieniu:</div>
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {pozycjeZamowienia.map((pozycja, index) => (
                              <div 
                                key={index} 
                                className="flex items-center justify-between bg-muted/50 p-2 rounded-md"
                              >
                                <div className="flex-1">
                                  <div className="font-medium">{pozycja.produkt_nazwa}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {pozycja.rozmiar_nazwa} - {pozycja.cena.toFixed(2)} zł
                                  </div>
                                  
                                  {/* Modyfikacje składników */}
                                  {(pozycja.usunieteSkladniki.length > 0 || pozycja.dodaneSkladniki.length > 0) && (
                                    <div className="mt-1 text-xs">
                                      {pozycja.usunieteSkladniki.length > 0 && (
                                        <div className="text-red-500 dark:text-red-400">
                                          Bez: {pozycja.usunieteSkladniki.map(s => s.nazwa).join(', ')}
                                        </div>
                                      )}
                                      {pozycja.dodaneSkladniki.length > 0 && (
                                        <div className="text-green-500 dark:text-green-400">
                                          Dodane: {pozycja.dodaneSkladniki.map(s => s.nazwa).join(', ')}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => handleRemoveFromOrder(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="bg-muted/20 rounded-lg p-3 text-center text-sm text-muted-foreground">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <DollarSign className="h-4 w-4" />
                            <span>Wybierz produkty z menu po lewej stronie</span>
                          </div>
                          <span className="text-xs">Koszyk jest pusty</span>
                        </div>
                      )}
                    </div>

                    {/* Podsumowanie */}
                    <div className="flex justify-between items-center font-bold text-base mt-4">
                      <span>Razem:</span>
                      <span>{kwotaZamowienia.toFixed(2)} zł</span>
                    </div>

                    <Separator />

                    {/* Przyciski */}
                    <div className="flex justify-between pt-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        size="sm"
                        onClick={() => setNoweZamowienie(false)}
                      >
                        Anuluj
                      </Button>
                      <Button 
                        type="submit"
                        size="sm"
                        disabled={isSubmitting}
                        className="gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        {isSubmitting ? "Tworzenie..." : "Dodaj zamówienie"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Szczegóły zamówienia</CardTitle>
                  <CardDescription>
                    {aktywneZamowienie 
                      ? `Zamówienie #${aktywneZamowienie.numer}` 
                      : "Brak aktywnego zamówienia"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!aktywneZamowienie ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <p className="text-sm text-muted-foreground text-center">
                        Utwórz nowe zamówienie lub wybierz istniejące z listy po lewej stronie
                      </p>
                    </div>
                  ) : (
                    <div>
                      {/* Tutaj będą szczegóły aktywnego zamówienia */}
                      <p className="text-center text-muted-foreground">
                        Funkcjonalność w trakcie implementacji
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      
      {/* Dialog wyboru produktu */}
      <ProduktDialog
        open={produktDialogOpen}
        onOpenChange={setProduktDialogOpen}
        produkt={wybranyProdukt}
        firmaId={firmaId}
        onAddToOrder={handleAddToOrder}
      />
    </div>
  );
}
