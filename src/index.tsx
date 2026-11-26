import { staticClasses } from "@decky/ui";
import { definePlugin, routerHook } from "@decky/api";
import { FaNetworkWired } from "react-icons/fa";
import { loadTranslations } from "./i18n/translations";
import Panel from "./Panel";
import About from "./pages/About";
import FolderPicker from "./pages/FolderPicker";
import Settings from "./pages/Settings";
import { ABOUT_ROUTE, PICKER_ROUTE, SETTINGS_ROUTE } from "./routes";

export default definePlugin(() => {
  loadTranslations();
  routerHook.addRoute(PICKER_ROUTE, FolderPicker, { exact: true });
  routerHook.addRoute(SETTINGS_ROUTE, Settings, { exact: true });
  routerHook.addRoute(ABOUT_ROUTE, About, { exact: true });
  return {
    name: "DeckSMB+",
    titleView: <div className={staticClasses.Title}>DeckSMB+</div>,
    content: <Panel />,
    icon: <FaNetworkWired />,
    onDismount() {
      routerHook.removeRoute(PICKER_ROUTE);
      routerHook.removeRoute(SETTINGS_ROUTE);
      routerHook.removeRoute(ABOUT_ROUTE);
    },
  };
});
