import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "redux";
import Login from "./components/Pages/Login";

const reducer = (state = {
  auth: {
    user: { role: 1 },
    token: "abc",
    pendingEmail: null,
    loading: false,
    error: null,
    successMessage: "",
  },
}, action) => state;

const makeStore = () => configureStore({ reducer });

test("redirects to checkout after login when a user was sent there from a buy-now flow", () => {
  const routeState = {
    returnTo: "/checkout",
    buyNowItem: { productId: "p1", name: "Sample Product" },
  };

  render(
    <Provider store={makeStore()}>
      <MemoryRouter initialEntries={[{ pathname: "/login", state: routeState }]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/checkout" element={<div>Checkout page</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

  expect(screen.getByText("Checkout page")).toBeInTheDocument();
});
