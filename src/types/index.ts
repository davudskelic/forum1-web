// ── Korisnik (Korisnik.cs) ──────────────────────────────────────────────────
export interface Korisnik {
  id: number;
  email: string;
  lozinka?: string;
  miniAdmin: boolean;
  admin: boolean;
  ocjenaKorisnika: number;
  profilna: string;
  deviceToken?: string;
}

// ── TipZnanosti (TipZnanosti.cs) ────────────────────────────────────────────
export interface TipZnanosti {
  id: number;
  ime: string;
}

// ── Upit (Upit.cs) ──────────────────────────────────────────────────────────
export interface Upit {
  id: number;
  naslovUpita: string;
  tekstUpita: string;
  korisnikID: number;
  korisnikUpita?: Korisnik;
  datumObjaveUpita: string;
  tipZnanostiID?: number;
  tipZnanosti?: TipZnanosti;
  putanjaSlika1?: string;
  putanjaSlika2?: string;
  putanjaSlika3?: string;
  putanjaSlika4?: string;
}

export interface UpitRequest {
  upit: Omit<Upit, "id" | "korisnikUpita" | "tipZnanosti">;
  slikePutanje?: string[];
}

// ── Komentar (Komentar.cs) ──────────────────────────────────────────────────
export interface Komentar {
  id: number;
  tekstKomentara: string;
  korisnikID: number;
  korisnikKomentara?: Korisnik;
  upitID?: number;
  datumKomentarisanja: string;
}

// ── Instrukcija (Instrukcija.cs) ────────────────────────────────────────────
export interface Instrukcija {
  id: number;
  naslov: string;
  sadrzaj: string;
  datumObjave: string;
  tipZnanostiID?: number;
  TipZnanosti?: TipZnanosti;
  korisnikID: number;
  korinskik?: Korisnik;
  gradId: number;
}

// ── Obavijest (Obavijest.cs) ────────────────────────────────────────────────
export interface Obavijest {
  id: number;
  naslov: string;
  tekstObavjesti: string;
  urlSlike: string;
  datum: string;
}

// ── Fakultet / Univerzitet / Smjer / Semestar / Predmet ────────────────────
export interface Univerzitet {
  id: number;
  naziv: string;
  grad: string;
  ikona: string;
}

export interface Fakultet {
  id: number;
  ime: string;
  ikona: string;
  univerzitetId: number;
}

export interface Smjer {
  id: number;
  ime: string;
  ikona: string;
  fakultetId: number;
}

export interface Semestar {
  id: number;
  ime: string;
  ikona: string;
  smjerId: number;
}

export interface Predmet {
  id: number;
  ime: string;
  ikona: string;
  semestarId: number;
}

// ── Grad (Grad.cs) ──────────────────────────────────────────────────────────
export interface Grad {
  id: number;
  naziv: string;
}

// ── Folder (Folder.cs) ──────────────────────────────────────────────────────
export interface Folder {
  id: number;
  ime: string;
  predmetId: number;
  korisnickiMail: string;
}

// ── Datoteka (Datoteka.cs) ──────────────────────────────────────────────────
export interface Datoteka {
  id: number;
  ime: string;
  ekstenzija: string;
  putanja: string;
  datumDodavanja: string;
  folderId: number;
  korisnickiMail: string;
}

// ── Reklama (Reklama.cs) ────────────────────────────────────────────────────
export interface Reklama {
  id: number;
  naslov: string;
  urlReklame: string;
  mjestoReklame: string;
}

// ── Prijava (Prijava.cs) ────────────────────────────────────────────────────
export interface Prijava {
  id: number;
  idPrijavljivaca: number;
  mailPrijavljivaca: string;
  idOkrivljenog: number;
  mailOkrivljenog: string;
  idPosta: number;
  tipPosta: string;
  razlogPrijave: string;
  datumPrijave: string;
}

// ── EkstenzijaMaila ─────────────────────────────────────────────────────────
export interface EkstenzijaMaila {
  id: number;
  ekstenzija: string;
}

// ── Auth ────────────────────────────────────────────────────────────────────
export interface LozinkaModel {
  novaLozinka: string;
  ponovljenaLozinka: string;
}
