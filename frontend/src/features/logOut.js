import api from "../utils/axios.js";

async function logOut() {
  try {
      const { data } = await api.get("/api/auth/logout");
      console.log("Logout successful:", data);
      return data; // Required so SideBar knows it finished
  } catch (error) {
      console.error("Logout failed:", error);
      throw error; // Throw the error so the UI can handle it if needed
  }
}

export default logOut;