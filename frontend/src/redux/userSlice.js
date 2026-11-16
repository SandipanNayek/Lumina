import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
    name: "user",
    initialState: {
      userData: null,
      isLoading: true, // Add a loading state
    },
    reducers: {
        setUserdata: (state, action) => {
            state.userData = action.payload;
            state.isLoading = false; // Stop loading when data arrives
        },
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        }
    }
})

export const { setUserdata, setLoading } = userSlice.actions; 
export default userSlice.reducer;