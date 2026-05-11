import api from "@/lib/folderAxios";
import type { Folder, Datoteka } from "@/types";

const BASE = "api/folder";

export const folderApi = {
  dajPoId: (id: number) =>
    api.get<Folder>(`${BASE}/${id}`).then((r) => r.data),

  lista: () =>
    api.get<Folder[]>(BASE).then((r) => r.data),

  dajZaPredmet: (predmetId: number) =>
    api.get<Folder[]>(BASE).then((r) =>
      (r.data ?? []).filter((f) => f.predmetId === predmetId)
    ),

  dajDatoteke: (folderId: number) =>
    api.get<Datoteka[]>(`${BASE}/${folderId}/datoteke`).then((r) => r.data ?? []),

  dodaj: (predmetId: number, folder: Partial<Folder>) =>
    api.post(`${BASE}/${predmetId}`, folder),

  izbrisi: (id: number, korisnikId: number) =>
    api.delete(`${BASE}/${id}/${korisnikId}`),

  izmjeniIme: (id: number, folder: Partial<Folder>) =>
    api.put(`${BASE}/${id}`, folder),
};
