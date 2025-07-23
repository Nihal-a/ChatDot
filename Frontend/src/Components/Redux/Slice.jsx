import { createSlice } from "@reduxjs/toolkit";

const INITIAL_STATE = {
  user: {
    isLoggedIn: false,
    id: null,
    username: null,
    name: null,
    email: null,
    profile: null,
  },
  AccessToken: null,
};

const Slicer = createSlice({
  name: "ChatDot",
  initialState: INITIAL_STATE,
  reducers: {
    Logout: () => INITIAL_STATE,
    login: (state, action) => {
      state.user = {
        ...state.user,
        ...action.payload,
      };
    },
  },
});

export const { login, Logout } = Slicer.actions;

export default Slicer.reducer;
