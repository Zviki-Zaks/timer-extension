const formEl = document.querySelector(".popup-form");
const minutesEl = document.querySelector("#minutes");
const buttonEl = document.querySelector("button");

let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const websiteUrl = tab.url.split("/")[2];
const res = await chrome.storage.local.get(websiteUrl);

if (res && res[websiteUrl]) {
  minutesEl.value = res[tab.url.split("/")[2]];
}

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const minutes = parseInt(minutesEl.value);
  if (isNaN(minutes) || minutes <= 0) {
    return;
  }
  await chrome.storage.local.set({ [tab.url.split("/")[2]]: minutes });
});
