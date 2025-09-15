import axios from "axios";

export const api = axios.create({
  baseURL: "https://mybizness.tools/bckend/api/calendario",
  //baseURL: "/bckend/api/calendario",
});
