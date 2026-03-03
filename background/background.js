/**
 * background/background.js (MV3 service worker)
 * Purpose: Configure side panel behavior. No PHI handling here.
 */

chrome.runtime.onInstalled.addListener(() => {
  // Ensure the side panel is available when the extension is installed/updated.
  chrome.sidePanel.setOptions({ path: "sidepanel/sidepanel.html", enabled: true });
});

// When the user clicks the extension icon, open the side panel.
chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (tab?.windowId != null) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    }
  } catch (error) {
    // Best-effort; service worker has no UI.
    console.warn("Failed to open side panel:", error);
  }
});