import axios from "axios";

export const api = axios.create({
  baseURL: "https://tnei.me/bckend/api/calendario",
});
