async function messenger(request, sender, sendResponse) {
  sendResponse({ complete: true, from: "background" });
  chrome.tabs.sendMessage(request.tab_id,
                         {method:     request.method,
                          expansions: request.expansions,
                          tab_id:     request.tab_id});
}

chrome.runtime.onMessage.addListener(messenger);
