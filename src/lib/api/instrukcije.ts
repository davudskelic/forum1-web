import api from "@/lib/axios";
import type { Instrukcija } from "@/types";

const BASE = "api/instrukcije";

export const instrukcijeApi = {
  dajPoId: (id: number) =>
    api.get<Instrukcija>(`${BASE}/${id}`).then((r) => r.data),

  lista: () =>
    api.get<Instrukcija[]>(BASE).then((r) => r.data),

  dajKorisnikovaInstrukcije: (korisnikId: number) =>
    api.get<Instrukcija[]>(`${BASE}/korisnik/${korisnikId}`).then((r) => r.data),

  dajPoTipu: (tipId: number) =>
    api.get<Instrukcija[]>(`${BASE}/tip/${tipId}`).then((r) => r.data),

  dajPoGradu: (gradId: number) =>
    api.get<Instrukcija[]>(`${BASE}/grad/${gradId}`).then((r) => r.data),

  dajZaPeriod: (odDat: string, doDat: string) =>
    api.get<Instrukcija[]>(`${BASE}/period?odDat=${odDat}&doDat=${doDat}`).then((r) => r.data),

  dodaj: (korisnikId: number, tipZnanId: number, gradId: number, instrukcija: Partial<Instrukcija>) =>
    api.post(`${BASE}/${korisnikId}/${tipZnanId}/${gradId}`, instrukcija),

  izbrisi: (instrukcijaId: number, korisnikId: number) =>
    api.delete(`${BASE}/${instrukcijaId}/${korisnikId}`),

  izmjeniNaziv: (id: number, korisnikId: number, naziv: string) =>
    api.patch(`${BASE}/${id}/naziv/${korisnikId}`, naziv),

  izmjeniSadrzaj: (id: number, korisnikId: number, sadrzaj: string) =>
    api.patch(`${BASE}/${id}/sadrzaj/${korisnikId}`, sadrzaj),

  izmjeniTip: (id: number, korisnikId: number, tipId: number) =>
    api.patch(`${BASE}/${id}/tip/${korisnikId}`, tipId),

  izmjeniGrad: (id: number, korisnikId: number, gradId: number) =>
    api.patch(`${BASE}/${id}/grad/${korisnikId}`, gradId),
};
