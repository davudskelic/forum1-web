import api from "@/lib/axios";
import type { Korisnik, LozinkaModel } from "@/types";

const BASE = "api/korisnik";

export const korisnikApi = {
  dajPoId: (id: number) =>
    api.get<Korisnik>(`${BASE}/${id}`).then((r) => r.data),

  listaKorisnika: () =>
    api.get<Korisnik[]>(BASE).then((r) => r.data),

  dajPoEmailu: (email: string) =>
    api.get<Korisnik>(`${BASE}/email/${email}`)
      .then((r) => r.data)
      .catch((err) => {
        if (err?.response?.status === 404) return null;
        throw err;
      }),

  dodaj: (korisnik: Korisnik) =>
    api.post<boolean>(BASE, korisnik).then((r) => r.status === 200 || r.status === 201),

  izbrisi: (idKorisnika: number, idBrisaca: number) =>
    api.delete(`${BASE}/${idKorisnika}/${idBrisaca}`),

  dajAdmine: () =>
    api.get<Korisnik[]>(`${BASE}/admini`).then((r) => r.data),

  dajMiniAdmine: () =>
    api.get<Korisnik[]>(`${BASE}/miniadmini`).then((r) => r.data),

  izmjeniLozinku: (idKorisnik: number, idMjenjaca: number, model: LozinkaModel) =>
    api.patch(`${BASE}/${idKorisnik}/lozinka/${idMjenjaca}`, model),

  dodjeliAdmina: (korisnikId: number, idMjenjac: number) =>
    api.patch(`${BASE}/${korisnikId}/dodjeli-admina/${idMjenjac}`, null),

  dodjeliMiniAdmina: (korisnikId: number, idMjenjac: number) =>
    api.patch(`${BASE}/${korisnikId}/dodjeli-miniadmina/${idMjenjac}`, null),

  oduzmiMiniAdmina: (korisnikId: number, idMjenjac: number) =>
    api.patch(`${BASE}/${korisnikId}/oduzmi-miniadmina/${idMjenjac}`, null),

  promijeniSliku: (korisnikId: number, novaSlika: string) =>
    api.patch(`${BASE}/${korisnikId}/slika`, novaSlika),

  ukloniSliku: (korisnikId: number) =>
    api.patch(`${BASE}/${korisnikId}/ukloni-sliku`, null),

  updateDeviceToken: (id: number, token: string) =>
    api.patch(`${BASE}/${id}/device-token`, token),
};
