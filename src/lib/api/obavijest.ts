import api from "@/lib/axios";
import type { Obavijest } from "@/types";

const BASE = "api/Obavijest";

export const obavijestApi = {
  lista: () =>
    api.get<Obavijest[]>(BASE).then((r) => r.data),

  dajPoId: (id: number) =>
    api.get<Obavijest>(`${BASE}/${id}`).then((r) => r.data),

  dodaj: (obavijest: Partial<Obavijest>) =>
    api.post(BASE, obavijest),

  izbrisi: (id: number) =>
    api.delete(`${BASE}/${id}`),
};
