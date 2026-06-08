"use client";

import { useState } from "react";
import { Provider } from "react-redux";

import { AuthBootstrap } from "./AuthBootstrap";
import { makeStore } from "./index";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => makeStore());
  return (
    <Provider store={store}>
      <AuthBootstrap>{children}</AuthBootstrap>
    </Provider>
  );
}
