import { api } from "../actions/api";

export class Payments {
  static async getPayments(id: string) {
    const { data } = await api.get(`/${id}`);

    return data;
  }

  static async updatePayments(id: string, selectedDates: string[]) {
    const { data } = await api.post(`/${id}`, { selectedDates });

    return data;
  }
}
