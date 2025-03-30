# Panel Administracyjny dla Firm

Aplikacja do zarządzania firmami i pracownikami z podziałem na role i panele.

## Funkcjonalności

### Panel Super Admina
- Logowanie na konto superadmina (login: superadmin, hasło: superadminjogi123)
- Zarządzanie firmami (dodawanie, przeglądanie)
- Dodawanie pracowników do firm
- Przydzielanie ról pracownikom (admin, pracownik)

### Panel Firmy
- Logowanie na konto pracownika lub admina firmy
- Przeglądanie danych firmy
- Zarządzanie pracownikami (dla admina)

## Technologie

- Next.js z App Router
- Shadcn/ui dla komponentów UI
- Supabase jako baza danych
- Responsywny design (mobile-first)

## Struktura bazy danych

```sql
-- Tabela firm
CREATE TABLE firmy (
  id SERIAL PRIMARY KEY,
  nazwa TEXT NOT NULL,
  ulica TEXT NOT NULL,
  miejscowosc TEXT NOT NULL,
  nr_tel TEXT NOT NULL,
  mail TEXT NOT NULL,
  data_utworzenia TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela użytkowników (dla superadmina)
CREATE TABLE uzytkownicy (
  id SERIAL PRIMARY KEY,
  login TEXT NOT NULL UNIQUE,
  haslo TEXT NOT NULL,
  rola TEXT NOT NULL DEFAULT 'uzytkownik',
  data_utworzenia TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela pracowników firm
CREATE TABLE pracownicy (
  id SERIAL PRIMARY KEY,
  firma_id INTEGER REFERENCES firmy(id),
  imie_nazwisko TEXT NOT NULL,
  nr_tel TEXT NOT NULL,
  mail TEXT NOT NULL,
  login TEXT NOT NULL UNIQUE,
  haslo TEXT NOT NULL,
  rola TEXT NOT NULL DEFAULT 'pracownik',
  data_utworzenia TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Instalacja i uruchomienie

1. Sklonuj repozytorium
2. Zainstaluj zależności:
   ```
   npm install
   ```
3. Skonfiguruj zmienne środowiskowe w pliku `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=twój_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=twój_klucz_supabase
   ```
4. Uruchom aplikację w trybie deweloperskim:
   ```
   npm run dev
   ```

## Domyślne konto superadmina

- Login: superadmin
- Hasło: superadminjogi123
# pos2025_windsurf
