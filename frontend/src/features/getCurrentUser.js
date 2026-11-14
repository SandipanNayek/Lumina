import api from "../utils/axios";

const getCurrentUser = async () => {
    console.log("all ok");

    try {
        const { data } = await api.get("/api/me");

        console.log("data proceed");
        console.log("Actual response:", data);

        return data;

    } catch (error) {
        console.log("Error:", error.response?.data || error.message);
        return null;
    }
};

export default getCurrentUser;