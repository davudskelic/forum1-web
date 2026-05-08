import api from "@/lib/axios";
import type { Prijava } from "@/types";

export const prijavaApi = {
  dajSve: () =>
    api.get<Prijava[]>("api/prijava").then((r) => r.data),

  dodaj: (prijava: Partial<Prijava>) =>
    api.post("api/prijava", prijava),

  izbrisi: (prijavaId: number) =>
    api.delete(`api/prijava/${prijavaId}`),
};
