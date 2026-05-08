import api from "@/lib/axios";
import type { Upit, Komentar } from "@/types";

const BASE = "api/upit";

export const upitApi = {
  dajPoId: (id: number) =>
    api.get<Upit>(`${BASE}/${id}`).then((r) => r.data),

  lista: () =>
    api.get<Upit[]>(BASE).then((r) => r.data),

  dajKorisnikovUpite: (korisnikId: number) =>
    api.get<Upit[]>(`${BASE}/korisnik/${korisnikId}`).then((r) => r.data),

  dajPoTipu: (tipId: number) =>
    api.get<Upit[]>(`${BASE}/tip/${tipId}`).then((r) => r.data),

  dajZaPeriod: (odDat: string, doDat: string) =>
    api.get<Upit[]>(`${BASE}/period?odDat=${odDat}&doDat=${doDat}`).then((r) => r.data),

  dajKomentare: (upitId: number) =>
    api.get<Komentar[]>(`${BASE}/${upitId}/komentari`).then((r) => r.data),

  dodaj: (korisnikId: number, tipZnanostiId: number, upit: Partial<Upit>, slikePutanje?: string[]) =>
    api.post(`${BASE}/${korisnikId}/${tipZnanostiId}`, { upit, slikePutanje: slikePutanje ?? [] }),

  izbrisi: (upitId: number, korisnikId: number) =>
    api.delete(`${BASE}/${upitId}/${korisnikId}`),

  izmjeniNaslov: (upitId: number, korisnikId: number, noviNaslov: string) =>
    api.patch(`${BASE}/${upitId}/naslov/${korisnikId}`, noviNaslov),

  izmjeniSadrzaj: (upitId: number, korisnikId: number, sadrzaj: string) =>
    api.patch(`${BASE}/${upitId}/sadrzaj/${korisnikId}`, sadrzaj),

  izmjeniTip: (upitId: number, korisnikId: number, tipId: number) =>
    api.patch(`${BASE}/${upitId}/tip/${korisnikId}`, tipId),

  dodajSliku: (upitId: number, korisnikId: number, putanja: string) =>
    api.patch(`${BASE}/${upitId}/dodaj-sliku/${korisnikId}`, putanja),

  obrisiSliku: (upitId: number, korisnikId: number, putanja: string) =>
    api.patch(`${BASE}/${upitId}/obrisi-sliku/${korisnikId}`, putanja),
};
