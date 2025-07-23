import { configureStore } from "@reduxjs/toolkit";
import ChatReducer from "./Slice";

export const Store = configureStore({
  reducer: {
    chatdot: ChatReducer,
  },
});

export default Store;
