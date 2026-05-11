import axios from "axios";

const folderApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_FOLDER_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

export default folderApi;
