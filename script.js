const DEBUG = false;

const STORAGE_KEY = "aott_history";
const TODAY_KEY = "aott_today";
const BG_KEY = "aott_background";
const COOLDOWN_DAYS = 5;

const feedbackMessages = [
  "That's all it takes. Well done.",
  "You showed up. That matters.",
  "Small things add up. Be proud.",
  "You took care of yourself today.",
  "That counts. Every single time.",
];

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveToHistory(activity) {
  const history = getHistory();
  history.push({ activity, date: todayString() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function recentActivities() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - COOLDOWN_DAYS);
  return getHistory()
    .filter((entry) => new Date(entry.date) >= cutoff)
    .map((entry) => entry.activity);
}

function todaysEntry() {
  return getHistory().find((entry) => entry.date === todayString());
}

function pickActivity(all) {
  const recent = recentActivities();
  const available = all.filter((a) => !recent.includes(a));
  const pool = available.length > 0 ? available : all;
  return pool[Math.floor(Math.random() * pool.length)];
}

function randomFeedback() {
  return feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)];
}

function setDailyBackground(backgrounds) {
  let bg;
  if (DEBUG) {
    bg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
  } else {
    const stored = JSON.parse(localStorage.getItem(BG_KEY));
    if (stored?.date === todayString()) {
      bg = stored.bg;
    } else {
      bg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
      localStorage.setItem(BG_KEY, JSON.stringify({ date: todayString(), bg }));
    }
  }
  document.body.style.backgroundImage = `url('${bg.file}')`;
  const attribution = document.getElementById("attribution");
  attribution.innerHTML = `Photo by <a href="${bg.url}" target="_blank" rel="noopener">${bg.photographer}</a> on <a href="https://unsplash.com" target="_blank" rel="noopener">Unsplash</a>`;
}

function randomFriend(friends) {
  return friends[Math.floor(Math.random() * friends.length)];
}

async function init() {
  const [activitiesRes, backgroundsRes, friendsRes] = await Promise.all([
    fetch("activities.json"),
    fetch("backgrounds.json"),
    fetch("friends.json"),
  ]);
  const activities = await activitiesRes.json();
  const backgrounds = await backgroundsRes.json();
  const friends = await friendsRes.json();
  setDailyBackground(backgrounds);

  const activityEl = document.getElementById("activity");
  const btnEl = document.getElementById("check-btn");
  const feedbackEl = document.getElementById("feedback");

  const existing = !DEBUG && todaysEntry();

  if (existing) {
    activityEl.textContent = existing.activity;
    feedbackEl.innerHTML = `<div class="already-done"><strong>Great job! Come back tomorrow, ${randomFriend(friends)}.</strong></div>`;
    feedbackEl.classList.add("visible");
    btnEl.classList.add("done");
    btnEl.disabled = true;
    return;
  }

  const stored = !DEBUG && JSON.parse(localStorage.getItem(TODAY_KEY));
  const chosen = stored?.date === todayString()
    ? stored.activity
    : pickActivity(activities);
  if (!DEBUG) localStorage.setItem(TODAY_KEY, JSON.stringify({ date: todayString(), activity: chosen }));
  activityEl.textContent = chosen;

  btnEl.addEventListener("click", () => {
    saveToHistory(chosen);
    btnEl.classList.add("done");
    btnEl.disabled = true;
    feedbackEl.textContent = randomFeedback();
    feedbackEl.classList.add("visible");
  });
}

init();
