-- Tabela rodzajów składników
CREATE TABLE rodzaje_skladnikow (
  id SERIAL PRIMARY KEY,
  nazwa TEXT NOT NULL,
  firma_id INTEGER REFERENCES firmy(id) NOT NULL,
  data_utworzenia TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela składników
CREATE TABLE skladniki (
  id SERIAL PRIMARY KEY,
  nazwa TEXT NOT NULL,
  rodzaj_id INTEGER REFERENCES rodzaje_skladnikow(id) NOT NULL,
  firma_id INTEGER REFERENCES firmy(id) NOT NULL,
  data_utworzenia TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela kategorii produktów
CREATE TABLE kategorie (
  id SERIAL PRIMARY KEY,
  nazwa TEXT NOT NULL,
  firma_id INTEGER REFERENCES firmy(id) NOT NULL,
  data_utworzenia TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela rozmiarów dla kategorii
CREATE TABLE rozmiary (
  id SERIAL PRIMARY KEY,
  nazwa TEXT NOT NULL,
  kategoria_id INTEGER REFERENCES kategorie(id) NOT NULL,
  data_utworzenia TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela cen dla rodzajów składników w danym rozmiarze
CREATE TABLE ceny_rodzajow_skladnikow (
  id SERIAL PRIMARY KEY,
  rozmiar_id INTEGER REFERENCES rozmiary(id) NOT NULL,
  rodzaj_skladnika_id INTEGER REFERENCES rodzaje_skladnikow(id) NOT NULL,
  cena DECIMAL(10, 2) NOT NULL,
  data_utworzenia TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(rozmiar_id, rodzaj_skladnika_id)
);

-- Tabela stanowisk
CREATE TABLE stanowiska (
  id SERIAL PRIMARY KEY,
  nazwa TEXT NOT NULL,
  stawka_godzinowa DECIMAL(10, 2) NOT NULL,
  firma_id INTEGER REFERENCES firmy(id) NOT NULL,
  data_utworzenia TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela produktów
CREATE TABLE produkty (
  id SERIAL PRIMARY KEY,
  nazwa TEXT NOT NULL,
  kategoria_id INTEGER REFERENCES kategorie(id) NOT NULL,
  firma_id INTEGER REFERENCES firmy(id) NOT NULL,
  data_utworzenia TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela cen bazowych produktów dla różnych rozmiarów
CREATE TABLE ceny_produktow (
  id SERIAL PRIMARY KEY,
  produkt_id INTEGER REFERENCES produkty(id) NOT NULL,
  rozmiar_id INTEGER REFERENCES rozmiary(id) NOT NULL,
  cena_bazowa DECIMAL(10, 2) NOT NULL,
  data_utworzenia TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(produkt_id, rozmiar_id)
);

-- Tabela składników w produktach
CREATE TABLE skladniki_produktow (
  id SERIAL PRIMARY KEY,
  produkt_id INTEGER REFERENCES produkty(id) NOT NULL,
  skladnik_id INTEGER REFERENCES skladniki(id) NOT NULL,
  data_utworzenia TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(produkt_id, skladnik_id)
);

-- Tabela dni pracy
CREATE TABLE dni_pracy (
  id SERIAL PRIMARY KEY,
  firma_id INTEGER REFERENCES firmy(id) NOT NULL,
  data DATE NOT NULL,
  godzina_rozpoczecia TIME NOT NULL,
  godzina_zakonczenia TIME,
  zakonczone BOOLEAN NOT NULL DEFAULT FALSE,
  data_utworzenia TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela przypisań pracowników do stanowisk w danym dniu
CREATE TABLE przypisania_pracownikow (
  id SERIAL PRIMARY KEY,
  dzien_pracy_id INTEGER REFERENCES dni_pracy(id) NOT NULL,
  pracownik_id INTEGER REFERENCES pracownicy(id) NOT NULL,
  stanowisko_id INTEGER REFERENCES stanowiska(id) NOT NULL,
  godzina_rozpoczecia TIME NOT NULL,
  godzina_zakonczenia TIME,
  liczba_godzin DECIMAL(5, 2),
  kwota_wyplaty DECIMAL(10, 2),
  wyplata_odebrana BOOLEAN NOT NULL DEFAULT FALSE,
  data_utworzenia TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(dzien_pracy_id, pracownik_id, stanowisko_id)
);

-- Tabela zamówień
CREATE TABLE zamowienia (
  id SERIAL PRIMARY KEY,
  numer TEXT NOT NULL,
  firma_id INTEGER REFERENCES firmy(id) NOT NULL,
  pracownik_id INTEGER REFERENCES pracownicy(id) NOT NULL,
  rodzaj TEXT NOT NULL CHECK (rodzaj IN ('sala', 'wynos', 'dowoz')),
  forma_platnosci TEXT NOT NULL CHECK (forma_platnosci IN ('gotowka', 'karta')),
  status_platnosci TEXT NOT NULL CHECK (status_platnosci IN ('zaplacone', 'do_zaplaty')),
  status TEXT NOT NULL CHECK (status IN ('nowe', 'w_przygotowaniu', 'gotowe', 'wydane', 'dostarczone')),
  info TEXT,
  nr_tel TEXT,
  adres TEXT,
  godzina_utworzenia TIME NOT NULL,
  planowana_godzina_dostawy TIME,
  kwota_calkowita DECIMAL(10, 2) NOT NULL,
  data DATE NOT NULL,
  sprawdzone BOOLEAN NOT NULL DEFAULT FALSE,
  data_utworzenia TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela pozycji zamówienia
CREATE TABLE pozycje_zamowienia (
  id SERIAL PRIMARY KEY,
  zamowienie_id INTEGER REFERENCES zamowienia(id) NOT NULL,
  produkt_id INTEGER REFERENCES produkty(id) NOT NULL,
  rozmiar_id INTEGER REFERENCES rozmiary(id) NOT NULL,
  ilosc INTEGER NOT NULL DEFAULT 1,
  cena DECIMAL(10, 2) NOT NULL,
  data_utworzenia TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela zmodyfikowanych składników w pozycjach zamówienia
CREATE TABLE modyfikacje_skladnikow (
  id SERIAL PRIMARY KEY,
  pozycja_zamowienia_id INTEGER REFERENCES pozycje_zamowienia(id) NOT NULL,
  skladnik_id INTEGER REFERENCES skladniki(id) NOT NULL,
  akcja TEXT NOT NULL CHECK (akcja IN ('dodany', 'usuniety')),
  cena DECIMAL(10, 2) NOT NULL,
  data_utworzenia TIMESTAMP NOT NULL DEFAULT NOW()
);
