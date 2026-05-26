import React from "react";
import { createRoot } from "react-dom/client";
import { browser } from "wxt/browser";
import "@/entrypoints/shared.css";
import { App } from "@/entrypoints/options/App";

const isEmbeddedOptionsView = window.top !== window;
const hasStandaloneFlag = new URLSearchParams(window.location.search).has("standalone");

if (isEmbeddedOptionsView && !hasStandaloneFlag) {
  void browser.tabs.create({
    url: browser.runtime.getURL("/options.html?standalone=1"),
  });
  document.body.innerHTML =
    '<div style="padding:16px;font:14px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">Opening settings in a standalone tab...</div>';
} else {
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
}
