// background.js — Service Worker

chrome.runtime.onInstalled.addListener(() => {
  
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  
  chrome.storage.local.get(["notes"], (result) => {
    if (result.notes === undefined) {
      chrome.storage.local.set({ notes: "" });
    }
  });
});




chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-sidebar") {

    
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!tab) return; 
    const { panelOpen } = await chrome.storage.local.get(["panelOpen"]);

    if (panelOpen) {
      
      await chrome.sidePanel.setOptions({
        tabId: tab.id,
        enabled: false
      });
      await chrome.storage.local.set({ panelOpen: false });
    } else {
      
      await chrome.sidePanel.setOptions({
        tabId: tab.id,
        path: "sidepanel.html",
        enabled: true
      });
      await chrome.sidePanel.open({ tabId: tab.id });
      await chrome.storage.local.set({ panelOpen: true });
    }
  }
});
