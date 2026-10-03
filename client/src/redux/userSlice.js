import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
    name: "user",

    initialState: {
        userData: null,
        // app khulte hi current-user check hota hai — tab tak "pata nahi" (true).
        // bina iske refresh par ek pal ke liye user logged-out dikhta aur ProtectedRoute login par bhej deta
        loading: true,
    },

    reducers: {
        // user set/clear karna = ab pata hai logged in hai ya nahi → loading khatam
        setUserData: (state, action) => {
            state.userData = action.payload;
            state.loading = false;
        },
        // check ho gaya par user nahi mila (userData ko chhedo mat — beech me login ho gaya ho to mit jaata)
        finishLoading: (state) => {
            state.loading = false;
        },
        // interview start par credit kata — server ka naya balance Navbar me dikhao (poora user dobara mat mango)
        setCredit: (state, action) => {
            if (state.userData) state.userData.credit = action.payload;
        },
    },
});

export const { setUserData, finishLoading, setCredit } = userSlice.actions;

export default userSlice.reducer;
