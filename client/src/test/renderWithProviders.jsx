// component ko asli app jaisa mahaul do: Redux store (apne state ke saath) + Router
import { configureStore } from "@reduxjs/toolkit";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import userSlice, { setUserData } from "../redux/userSlice.js";
import interviewSlice from "../redux/interviewSlice.js";

export const renderWithProviders = (ui, { credit = 500 } = {}) => {
    const store = configureStore({ reducer: { user: userSlice, interview: interviewSlice } });
    store.dispatch(setUserData({ _id: "u1", name: "Test", email: "t@example.com", credit }));
    return {
        store,
        ...render(
            <Provider store={store}>
                <MemoryRouter>{ui}</MemoryRouter>
            </Provider>,
        ),
    };
};
