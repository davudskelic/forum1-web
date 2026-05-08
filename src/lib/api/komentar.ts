import api from "@/lib/axios";
import type { Komentar } from "@/types";

const BASE = "api/komentar";

export const komentarApi = {
  dajPoId: (id: number) =>
    api.get<Komentar>(`${BASE}/${id}`).then((r) => r.data),

  lista: () =>
    api.get<Komentar[]>(BASE).then((r) => r.data),

  dajPoUpitu: (upitId: number) =>
    api.get<Komentar[]>(`${BASE}/upit/${upitId}`).then((r) => r.data),

  dodaj: (upitId: number, korisnikId: number, komentar: Partial<Komentar>) =>
    api.post(`${BASE}/${upitId}/${korisnikId}`, komentar),

  izbrisi: (komentarId: number, korisnikId: number) =>
    api.delete(`${BASE}/${komentarId}/${korisnikId}`),
};
