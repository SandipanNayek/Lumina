import { createSlice } from "@reduxjs/toolkit";

const conversationSlice = createSlice({
    name: "conversation",
    initialState: {
      conversations: [],
      selectedConversation: null, 
    },
    reducers: {
        setConversations: (state, action) => {
            state.conversations = action.payload;
        },
        addConversation: (state, action) => {
            state.conversations.unshift(action.payload);
        },
        setSelectedConversation: (state, action) => {
            state.selectedConversation = action.payload;
        },
        // ADDED THIS: Instantly wipes chats from the screen on logout
        clearConversations: (state) => {
            state.conversations = [];
            state.selectedConversation = null;
        }
    }
})

// Export the new clearConversations action
export const { setConversations, addConversation, setSelectedConversation, clearConversations } = conversationSlice.actions; 
export default conversationSlice.reducer;