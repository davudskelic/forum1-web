import api from "@/lib/axios";
import type { Fakultet, Smjer, Semestar, Predmet, Univerzitet } from "@/types";

export const fakultetApi = {
  lista: () =>
    api.get<Fakultet[]>("api/fakultet").then((r) => r.data),

  dajPoId: (id: number) =>
    api.get<Fakultet>(`api/fakultet/${id}`).then((r) => r.data),

  dajZaUniverzitet: (univId: number) =>
    api.get<Fakultet[]>(`api/univerzitet/${univId}/fakulteti`).then((r) => r.data),
};

export const smjerApi = {
  lista: () =>
    api.get<Smjer[]>("api/smjer").then((r) => r.data),

  dajZaFakultet: (fakultetId: number) =>
    api.get<Smjer[]>(`api/fakultet/${fakultetId}/smjerovi`).then((r) => r.data),
};

export const semestarApi = {
  lista: () =>
    api.get<Semestar[]>("api/semestar").then((r) => r.data),

  dajZaSmjer: (smjerId: number) =>
    api.get<Semestar[]>(`api/smjer/${smjerId}/semestri`).then((r) => r.data),
};

export const predmetApi = {
  lista: () =>
    api.get<Predmet[]>("api/predmet").then((r) => r.data),

  dajZaSemestar: (semestarId: number) =>
    api.get<Predmet[]>(`api/semestar/${semestarId}/predmeti`).then((r) => r.data),
};

export const univerzitetApi = {
  lista: () =>
    api.get<Univerzitet[]>("api/univerzitet").then((r) => r.data),
};
