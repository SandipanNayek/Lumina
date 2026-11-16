import api from "../utils/axios";

const getCurrentUser = async () => {
     console.log("getCurrentUser called!");

    try {
        const { data } = await api.get("/api/me");

        console.log("Actual response:", data);

        return data;

    } catch (error) {
        console.log("Error:", error.response?.data || error.message);
        return null;
    }
};

export default getCurrentUser;