chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    const websiteUrl = tab.url.split("/")[2]; // take the hostname out of the URL

    // Check if the tab is a website that the user has set a time limit for.
    const userSettings = await chrome.storage.local.get(websiteUrl);

    const currentTimer = await chrome.storage.session.get("activeTimer");
    if (!userSettings || !userSettings[websiteUrl]) {
      // If the user has not set a time limit for this website, deactivate the timer.
      if (currentTimer?.activeTimer?.tabId === tabId) {
        // If there is an active timer on this tad that is not for this website
        await chrome.storage.session.set({
          activeTimer: { url: null, tabId: null },
        });
      }
    } else {
      // If the user has set a time limit for this website
      if (
        !currentTimer?.activeTimer?.url || // If is not active timer
        currentTimer.activeTimer.url !== websiteUrl // If the active timer is not for this website
      ) {
        await chrome.storage.session.set({
          activeTimer: { url: websiteUrl, tabId },
        }); // Set the active timer for this website
        await setTimer(websiteUrl, userSettings[websiteUrl], tabId); // Play the timer
      }
    }
  }
});

async function setTimer(url, time, tabId) {
  chrome.action.setBadgeTextColor({ color: "#000000", tabId });
  chrome.action.setBadgeBackgroundColor({ color: "#00ff00", tabId });
  chrome.action.setBadgeText({ text: "on", tabId });
  // Set the timer
  await new Promise((resolve) => setTimeout(resolve, time * 60 * 1000));
  // Check if the timer is active for this website
  const currentTimer = await chrome.storage.session.get("activeTimer");
  if (
    currentTimer.activeTimer.url === url &&
    currentTimer.activeTimer.tabId === tabId
  ) {
    // If it is, redirect to the website
    await chrome.storage.session.set({
      activeTimer: { url: null, tabId: null },
    }); // Deactivate the timer
    chrome.action.setBadgeBackgroundColor({ color: "#ff0000", tabId });
    chrome.action.setBadgeText({ text: "over", tabId });
    chrome.tabs.update(tabId, { url: "https://www.google.com" });
  }
}

chrome.storage.onChanged.addListener(async (changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    if (namespace === "local") {
      // Set the active timer to the website that changed
      try {
        let tabs = await chrome.tabs.query({});
        const tab = tabs.find((tab) => tab.url.split("/")[2] === key);
        console.log("tab.id", tab?.id);
        if (tab?.id) {
          await chrome.storage.session.set({
            activeTimer: { url: key, tabId: tab.id },
          });
          setTimer(key, newValue, tab.id);
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
});
