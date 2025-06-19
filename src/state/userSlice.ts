import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { validateAndReturnUser } from "../types/User";
import { getAuth } from "firebase/auth";
import { get, ref } from "firebase/database";
import { database } from "../firebaseConfig";

export const fetchUser = createAsyncThunk(
    "user/fetchUser",
    async () => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
            throw new Error("User not authenticated");
        }

        const snapshot = await get(ref(database, `users/${user.uid}`));
        const validatedUser = validateAndReturnUser(snapshot.val());
        return validatedUser || null;
    }
);

const userSlice = createSlice({
  name: 'user',
  initialState: { 
    id: '', 
    displayName: '', 
    status: '', 
    approved: false, 
    privileges: false, 
    personalGuestList: 
    {}, email: '',
    loading: true,
    error: null as string | null, 
},
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchUser.pending, () => {
        console.log("Fetching user data...");
    });
    builder.addCase(fetchUser.fulfilled, (state, action) => {
        if (!action.payload) {
            console.error("User data is invalid or not found.");
            return;
        }
        state.id = action.payload.id;
        state.displayName = action.payload.displayName;
        state.status = action.payload.status || "Default";
        state.approved = action.payload.approved || false;
        state.privileges = action.payload.privileges || false;
        state.personalGuestList = action.payload.personalGuestList || {};
        state.email = action.payload.email || "";
        state.loading = false;
        state.error = null as string | null;
    });
    builder.addCase(fetchUser.rejected, (state, action) => {
        console.error("Failed to fetch user data:", action.error.message);
        state.loading = false;
        state.error = action.error.message || "Failed to fetch user data";
    });
  },
});

export default userSlice.reducer;