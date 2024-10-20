import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Index } from "./dev-server/index";
import "./dev-server.css";
import "@inkdropapp/css/reset.css";
import "@inkdropapp/css/tokens.css";
import "@inkdropapp/base-ui-theme/styles/theme.css";
import { ColorTokensPage } from "./dev-server/color-tokens";
import { VariablesPage } from "./dev-server/variables";
import { ComponentsPage } from "./dev-server/components";

const cssFiles = [
  "/Users/nora/Developments/inkdrop/plugins/solarized-light-ui/styles/tokens.css",
  "/Users/nora/Developments/inkdrop/plugins/solarized-light-ui/styles/theme.css",
];

cssFiles.forEach((file) => {
  import(/* @vite-ignore */ file);
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
    children: [
      { path: "", element: <VariablesPage /> },
      { path: "tokens", element: <ColorTokensPage /> },
      { path: "components", element: <ComponentsPage /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
