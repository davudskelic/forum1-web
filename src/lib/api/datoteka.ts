import api from "@/lib/axios";
import type { Datoteka, Folder } from "@/types";

const BASE = "api/datoteka";

export const datotekaApi = {
  dajPoId: (id: number) =>
    api.get<Datoteka>(`${BASE}/${id}`).then((r) => r.data),

  lista: () =>
    api.get<Datoteka[]>(BASE).then((r) => r.data),

  dajPoNazivu: (ime: string) =>
    api.get<Datoteka>(`${BASE}/naziv/${ime}`).then((r) => r.data),

  dajFolderZaDatoteku: (datotekaId: number) =>
    api.get<Folder>(`${BASE}/folder/${datotekaId}`).then((r) => r.data),

  dodaj: (folderId: number, datoteka: Partial<Datoteka>) =>
    api.post(`${BASE}/${folderId}`, datoteka),

  izbrisi: (id: number, idBrisaca: number) =>
    api.delete(`${BASE}/${id}/${idBrisaca}`),

  izbrisiSveZaFolder: (folderId: number, idBrisaca: number) =>
    api.delete(`${BASE}/folder/${folderId}/${idBrisaca}`),
};
