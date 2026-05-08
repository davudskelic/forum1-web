import api from "@/lib/axios";
import type { TipZnanosti, Grad } from "@/types";

export const tipZnanostiApi = {
  lista: () =>
    api.get<TipZnanosti[]>("api/tipovi-znanosti").then((r) => r.data),
};

export const gradApi = {
  lista: () =>
    api.get<Grad[]>("api/grad").then((r) => r.data),
};
