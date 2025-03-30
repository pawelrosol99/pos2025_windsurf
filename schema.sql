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

-- Dodanie konta superadmina
INSERT INTO uzytkownicy (login, haslo, rola) 
VALUES ('superadmin', 'superadminjogi123', 'superadmin');

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
