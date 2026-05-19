import { createStore, applyMiddleware } from "redux";
import { rootReducer } from "./reducer";

// Very small thunk-style middleware so we can dispatch functions (async actions)
const thunkMiddleware = (storeAPI) => (next) => (action) =>
  typeof action === "function"
    ? action(storeAPI.dispatch, storeAPI.getState)
    : next(action);

export const store = createStore(rootReducer, applyMiddleware(thunkMiddleware));

