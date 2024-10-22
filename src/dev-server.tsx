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
const themePackageName = import.meta.env.THEME_NAME || ''
const themeAppearance = import.meta.env.THEME_APPEARANCE
const baseProjectPath = import.meta.env.BASE_PROJECT_PATH || ''
const styleSheets: string[] = import.meta.env.STYLE_SHEETS || []

const cssFiles = styleSheets.map(ss => `${baseProjectPath}/styles/${ss}`)

cssFiles.forEach((file) => {
  import(file);
});

document.body.classList.add(`theme-${themePackageName}`);
if (themeAppearance) {
  document.body.classList.add(`${themeAppearance}-mode`);
}

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
