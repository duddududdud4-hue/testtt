const STORAGE_KEY = "denverControlState";
const AUTH_KEY = "denverControlAuth";

const defaultState = {
  account: {
    email: "",
    nickname: "Denver",
    discordId: "836194205881640972",
    faction: "FIB",
    level: 10,
    theme: "noir"
  },
  checks: [],
  reputation: [],
  logs: [],
  bot: {
    server: "",
    reportsChannel: "",
    checksChannel: ""
  },
  settings: {
    animations: true,
    compact: false,
    timestamps: true
  },
  ui: {
    activeTab: "stats"
  }
};

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(defaultState));
}

function loadState() {
  const base = cloneDefaultState();
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return base;
  }

  try {
    const parsed = JSON.parse(raw);
    const merged = {
      ...base,
      account: { ...base.account, ...(parsed.account || {}) },
      checks: Array.isArray(parsed.checks) ? parsed.checks : base.checks,
      reputation: Array.isArray(parsed.reputation) ? parsed.reputation : base.reputation,
      logs: Array.isArray(parsed.logs) ? parsed.logs : base.logs,
      bot: { ...base.bot, ...(parsed.bot || {}) },
      settings: { ...base.settings, ...(parsed.settings || {}) },
      ui: { ...base.ui, ...(parsed.ui || {}) }
    };

    if (!["noir", "obsidian", "steel", "midnight"].includes(merged.account.theme)) {
      merged.account.theme = "noir";
    }

    if (merged.account.theme === "obsidian") {
      merged.account.theme = "noir";
    }

    return merged;
  } catch {
    return base;
  }
}

let state = loadState();

const loginScreen = document.getElementById("loginScreen");
const appShell = document.getElementById("appShell");
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const settingsDrawer = document.getElementById("settingsDrawer");
const profileSettingsTrigger = document.getElementById("profileSettingsTrigger");
const closeSettingsButton = document.getElementById("closeSettingsButton");
const logoutButton = document.getElementById("logoutButton");
const themeWave = document.getElementById("themeWave");
const pageTitle = document.getElementById("pageTitle");
const navItems = document.querySelectorAll(".nav-item");
const panels = document.querySelectorAll(".tab-panel");

const statusFactionChip = document.getElementById("statusFactionChip");
const displayNickname = document.getElementById("displayNickname");
const displayRole = document.getElementById("displayRole");
const drawerNickname = document.getElementById("drawerNickname");
const drawerRole = document.getElementById("drawerRole");

const summaryNickname = document.getElementById("summaryNickname");
const summaryRole = document.getElementById("summaryRole");
const summaryLevel = document.getElementById("summaryLevel");
const summaryFaction = document.getElementById("summaryFaction");
const summaryChecks = document.getElementById("summaryChecks");
const summaryReputation = document.getElementById("summaryReputation");
const fractionGrid = document.getElementById("fractionGrid");

const statCuratorsBadge = document.getElementById("statCuratorsBadge");
const statCuratorsValue = document.getElementById("statCuratorsValue");
const statLowActivityBadge = document.getElementById("statLowActivityBadge");
const statLowActivityValue = document.getElementById("statLowActivityValue");
const statReputationBadge = document.getElementById("statReputationBadge");
const statReputationValue = document.getElementById("statReputationValue");

const toggleCheckFormButton = document.getElementById("toggleCheckFormButton");
const checkFormCard = document.getElementById("checkFormCard");
const checkForm = document.getElementById("checkForm");
const checkFaction = document.getElementById("checkFaction");
const checkType = document.getElementById("checkType");
const checkStatus = document.getElementById("checkStatus");
const checkComment = document.getElementById("checkComment");
const checksTableBody = document.getElementById("checksTableBody");

const toggleReputationFormButton = document.getElementById("toggleReputationFormButton");
const reputationFormCard = document.getElementById("reputationFormCard");
const reputationForm = document.getElementById("reputationForm");
const reputationDelta = document.getElementById("reputationDelta");
const reputationReason = document.getElementById("reputationReason");
const reputationTotal = document.getElementById("reputationTotal");
const reputationList = document.getElementById("reputationList");

const curatorTableBody = document.getElementById("curatorTableBody");
const curatorForm = document.getElementById("curatorForm");
const curatorNickname = document.getElementById("curatorNickname");
const curatorEmail = document.getElementById("curatorEmail");
const curatorLevel = document.getElementById("curatorLevel");
const curatorFaction = document.getElementById("curatorFaction");
const curatorRolePreview = document.getElementById("curatorRolePreview");

const logsList = document.getElementById("logsList");
const clearLogsButton = document.getElementById("clearLogsButton");

const settingsForm = document.getElementById("settingsForm");
const settingsNickname = document.getElementById("settingsNickname");
const settingsDiscordId = document.getElementById("settingsDiscordId");
const themeSelect = document.getElementById("themeSelect");
const themeSelectTrigger = document.getElementById("themeSelectTrigger");
const themeSelectValue = document.getElementById("themeSelectValue");
const themeSelectMenu = document.getElementById("themeSelectMenu");
const themeOptions = document.querySelectorAll("[data-theme-option]");

const allFactions = ["FIB", "LSCSD", "EMS", "GOV", "LSPD", "WN", "SANG"];
const themeLabels = {
  noir: "Черная",
  obsidian: "Обсидиан",
  steel: "Сталь",
  midnight: "Ночной"
};
const themeWaveBackgrounds = {
  noir: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(150,165,191,0.45) 48%, rgba(0,0,0,0) 76%)",
  obsidian: "radial-gradient(circle, rgba(248,87,176,0.95) 0%, rgba(141,116,255,0.48) 48%, rgba(0,0,0,0) 76%)",
  steel: "radial-gradient(circle, rgba(137,240,219,0.95) 0%, rgba(141,168,255,0.42) 48%, rgba(0,0,0,0) 76%)",
  midnight: "radial-gradient(circle, rgba(100,232,255,0.95) 0%, rgba(111,134,255,0.45) 48%, rgba(0,0,0,0) 76%)"
};

let themeDraft = state.account.theme;
let themeWaveCommitTimer = null;
let themeWaveCleanupTimer = null;

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getRoleByLevel(level) {
  if (level <= 4) return "Fraction Curator";
  if (level === 5) return "RP-Куратор";
  if (level === 6) return "Senior Administrator";
  if (level === 7) return "Главный следящий";
  if (level === 8) return "Заместитель главного администратора";
  if (level === 9) return "Главный администратор";
  return "Tech";
}

function formatTime(date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getRoleClass(value) {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

function getStatusClass(status) {
  if (status === "Проверенно") return "positive";
  if (status === "В процессе") return "warning";
  return "negative";
}

function getReputationTotal() {
  return state.reputation.reduce((sum, item) => sum + Number(item.delta), 0);
}

function getLowActivityCount() {
  return state.checks.filter((item) => item.status === "Отстутсвует").length;
}

function addLog(text) {
  state.logs.unshift({
    text,
    time: formatTime(new Date())
  });

  if (state.logs.length > 50) {
    state.logs.length = 50;
  }
}

function setAuth(value) {
  localStorage.setItem(AUTH_KEY, value ? "true" : "false");
}

function isAuthed() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

function applyThemeValue(theme) {
  document.body.dataset.theme = theme;
}

function applyThemeSettings() {
  applyThemeValue(state.account.theme);
  document.body.classList.toggle("compact", state.settings.compact);
  document.body.classList.toggle("no-animations", !state.settings.animations);
}

function openSettings() {
  themeDraft = state.account.theme;
  renderSettings();
  positionSettingsPopover();
  settingsDrawer.classList.add("is-open");
  profileSettingsTrigger.setAttribute("aria-expanded", "true");
}

function closeSettings() {
  settingsDrawer.classList.remove("is-open");
  profileSettingsTrigger.setAttribute("aria-expanded", "false");
  themeDraft = state.account.theme;
  applyThemeValue(state.account.theme);
  closeThemeMenu();
}

function openThemeMenu() {
  themeSelectMenu.classList.add("is-open");
  themeSelectTrigger.setAttribute("aria-expanded", "true");
}

function closeThemeMenu() {
  themeSelectMenu.classList.remove("is-open");
  themeSelectTrigger.setAttribute("aria-expanded", "false");
}

function toggleThemeMenu() {
  if (!themeSelectMenu.classList.contains("is-open")) {
    openThemeMenu();
  } else {
    closeThemeMenu();
  }
}

function toggleSettings() {
  if (settingsDrawer.classList.contains("is-open")) {
    closeSettings();
  } else {
    openSettings();
  }
}

function positionSettingsPopover() {
  const triggerRect = profileSettingsTrigger.getBoundingClientRect();
  const width = Math.min(400, window.innerWidth - 32);
  const estimatedHeight = settingsDrawer.offsetHeight || 420;
  const left = Math.max(16, Math.min(triggerRect.right - width, window.innerWidth - width - 16));
  let top = triggerRect.bottom + 14;

  if (top + estimatedHeight > window.innerHeight - 16) {
    top = Math.max(16, triggerRect.top - estimatedHeight - 14);
  }

  settingsDrawer.style.left = `${left}px`;
  settingsDrawer.style.top = `${top}px`;
}

function playThemeWave(theme, sourceElement) {
  if (!state.settings.animations) {
    applyThemeValue(theme);
    return;
  }

  const rect = sourceElement.getBoundingClientRect();
  themeWave.style.left = `${rect.left + rect.width / 2}px`;
  themeWave.style.top = `${rect.top + rect.height / 2}px`;
  themeWave.style.background = themeWaveBackgrounds[theme] || themeWaveBackgrounds.noir;
  themeWave.classList.remove("animate");
  void themeWave.offsetWidth;
  themeWave.classList.add("animate");

  window.clearTimeout(themeWaveCommitTimer);
  window.clearTimeout(themeWaveCleanupTimer);

  themeWaveCommitTimer = window.setTimeout(() => {
    applyThemeValue(theme);
  }, 170);

  themeWaveCleanupTimer = window.setTimeout(() => {
    themeWave.classList.remove("animate");
  }, 700);
}

function switchTab(tabName) {
  state.ui.activeTab = tabName;
  pageTitle.textContent = "Majestic Curators";

  navItems.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });

  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === tabName);
  });

  saveState();
}

function toggleCard(card) {
  card.classList.toggle("hidden");
}

function closeCard(card) {
  card.classList.add("hidden");
}

function renderIdentity() {
  const role = getRoleByLevel(Number(state.account.level));

  statusFactionChip.textContent = state.account.faction;
  displayNickname.textContent = state.account.nickname;
  displayRole.textContent = role;
  drawerNickname.textContent = state.account.nickname;
  drawerRole.textContent = role;

  summaryNickname.textContent = state.account.nickname;
  summaryRole.textContent = role;
  summaryLevel.textContent = String(state.account.level);
  summaryFaction.textContent = state.account.faction;
  summaryChecks.textContent = String(state.checks.length);
  summaryReputation.textContent = String(getReputationTotal());
}

function renderStats() {
  const totalCurators = 1;
  const lowActivity = getLowActivityCount();
  const reputation = getReputationTotal();

  statCuratorsBadge.textContent = String(totalCurators);
  statCuratorsValue.textContent = String(totalCurators);
  statLowActivityBadge.textContent = String(lowActivity);
  statLowActivityValue.textContent = String(lowActivity);
  statReputationBadge.textContent = String(reputation);
  statReputationBadge.className = `metric-badge ${getRoleClass(reputation)}`;
  statReputationValue.textContent = String(reputation);

  fractionGrid.innerHTML = "";

  allFactions.forEach((faction) => {
    const box = document.createElement("div");
    box.className = "fraction-box";
    box.innerHTML = `
      <strong>${faction}</strong>
      <small>${state.account.faction === faction ? "1 куратор" : "0 кураторов"}</small>
    `;
    fractionGrid.appendChild(box);
  });
}

function renderChecks() {
  if (state.checks.length === 0) {
    checksTableBody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">Записей пока нет.</div>
        </td>
      </tr>
    `;
    return;
  }

  checksTableBody.innerHTML = state.checks.map((item) => `
    <tr>
      <td>${state.account.nickname}</td>
      <td>${item.faction}</td>
      <td>${item.type}</td>
      <td><span class="tag ${getStatusClass(item.status)}">${item.status}</span></td>
      <td>${item.comment || "-"}</td>
    </tr>
  `).join("");
}

function renderReputation() {
  const total = getReputationTotal();
  reputationTotal.textContent = String(total);

  if (state.reputation.length === 0) {
    reputationList.innerHTML = `<div class="empty-state">Изменений пока нет.</div>`;
    return;
  }

  reputationList.innerHTML = state.reputation.map((item) => `
    <div class="timeline-item">
      <span class="timeline-mark"></span>
      <div>
        <strong>${item.delta > 0 ? "+" : ""}${item.delta} ${state.account.nickname}</strong>
        <p>${item.reason}</p>
      </div>
    </div>
  `).join("");
}

function renderCurator() {
  const role = getRoleByLevel(Number(state.account.level));
  const reputation = getReputationTotal();

  curatorTableBody.innerHTML = `
    <tr>
      <td>${state.account.nickname}</td>
      <td>${state.account.level}</td>
      <td>${role}</td>
      <td>${state.account.faction}</td>
      <td>${reputation}</td>
      <td>${state.checks.length}</td>
    </tr>
  `;

  curatorNickname.value = state.account.nickname;
  curatorEmail.value = state.account.email || "";
  curatorLevel.value = String(state.account.level);
  curatorFaction.value = state.account.faction;
  curatorRolePreview.textContent = role;
}

function renderLogs() {
  if (state.logs.length === 0) {
    logsList.innerHTML = `<div class="empty-state">Логов пока нет.</div>`;
    return;
  }

  logsList.innerHTML = state.logs.map((item) => `
    <div class="log-item">
      <span class="log-marker"></span>
      ${state.settings.timestamps ? `<time>${item.time}</time>` : ""}
      <p>${item.text}</p>
    </div>
  `).join("");
}

function renderSettings() {
  if (!settingsDrawer.classList.contains("is-open")) {
    themeDraft = state.account.theme;
  }

  settingsNickname.value = state.account.nickname;
  settingsDiscordId.value = state.account.discordId;
  themeSelectValue.textContent = themeLabels[themeDraft] || themeLabels.noir;

  themeOptions.forEach((option) => {
    option.classList.toggle("active", option.dataset.themeOption === themeDraft);
  });
}

function renderAll() {
  applyThemeSettings();
  renderIdentity();
  renderStats();
  renderChecks();
  renderReputation();
  renderCurator();
  renderLogs();
  renderSettings();
  switchTab(state.ui.activeTab);
}

function showApp() {
  loginScreen.classList.add("hidden");
  appShell.classList.remove("hidden");
  renderAll();
}

function showLogin() {
  appShell.classList.add("hidden");
  loginScreen.classList.remove("hidden");
  closeSettings();
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  state.account.email = loginEmail.value.trim();
  saveState();
  setAuth(true);
  showApp();
});

logoutButton.addEventListener("click", () => {
  setAuth(false);
  closeSettings();
  showLogin();
});

profileSettingsTrigger.addEventListener("click", toggleSettings);
profileSettingsTrigger.setAttribute("aria-expanded", "false");
closeSettingsButton.addEventListener("click", closeSettings);
themeSelectTrigger.addEventListener("click", toggleThemeMenu);

themeOptions.forEach((option) => {
  option.addEventListener("click", () => {
    themeDraft = option.dataset.themeOption;
    themeSelectValue.textContent = themeLabels[themeDraft] || themeLabels.noir;
    themeOptions.forEach((item) => item.classList.remove("active"));
    option.classList.add("active");
    playThemeWave(themeDraft, option);
    closeThemeMenu();
  });
});

navItems.forEach((button) => {
  button.addEventListener("click", () => {
    switchTab(button.dataset.tab);
  });
});

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.close);
    if (target) {
      closeCard(target);
    }
  });
});

toggleCheckFormButton.addEventListener("click", () => {
  toggleCard(checkFormCard);
  checkFaction.value = state.account.faction;
});

checkForm.addEventListener("submit", (event) => {
  event.preventDefault();

  state.checks.unshift({
    faction: checkFaction.value,
    type: checkType.value,
    status: checkStatus.value,
    comment: checkComment.value.trim()
  });

  addLog(`Добавлена проверка: ${checkType.value}, ${checkStatus.value}.`);
  saveState();
  checkForm.reset();
  checkFaction.value = state.account.faction;
  closeCard(checkFormCard);
  renderAll();
});

toggleReputationFormButton.addEventListener("click", () => {
  toggleCard(reputationFormCard);
});

reputationForm.addEventListener("submit", (event) => {
  event.preventDefault();

  state.reputation.unshift({
    delta: Number(reputationDelta.value),
    reason: reputationReason.value.trim()
  });

  addLog(`Изменена репутация: ${Number(reputationDelta.value) > 0 ? "+" : ""}${reputationDelta.value}.`);
  saveState();
  reputationForm.reset();
  closeCard(reputationFormCard);
  renderAll();
});

curatorLevel.addEventListener("change", () => {
  curatorRolePreview.textContent = getRoleByLevel(Number(curatorLevel.value));
});

curatorForm.addEventListener("submit", (event) => {
  event.preventDefault();

  state.account.nickname = curatorNickname.value.trim() || state.account.nickname;
  state.account.level = Number(curatorLevel.value);
  state.account.faction = curatorFaction.value;

  addLog(`Обновлен аккаунт куратора: ${state.account.nickname}, уровень ${state.account.level}.`);
  saveState();
  renderAll();
});

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();

  state.account.nickname = settingsNickname.value.trim() || state.account.nickname;
  state.account.theme = themeDraft;
  state.account.discordId = settingsDiscordId.value.trim();

  addLog("Сохранены настройки профиля.");
  saveState();
  renderAll();
  closeSettings();
});

clearLogsButton.addEventListener("click", () => {
  state.logs = [];
  saveState();
  renderLogs();
});

document.addEventListener("click", (event) => {
  if (!themeSelect.contains(event.target)) {
    closeThemeMenu();
  }

  if (
    settingsDrawer.classList.contains("is-open") &&
    !settingsDrawer.contains(event.target) &&
    !profileSettingsTrigger.contains(event.target)
  ) {
    closeSettings();
  }
});

window.addEventListener("resize", () => {
  if (settingsDrawer.classList.contains("is-open")) {
    positionSettingsPopover();
  }
});

window.addEventListener("scroll", () => {
  if (settingsDrawer.classList.contains("is-open")) {
    positionSettingsPopover();
  }
}, { passive: true });

if (state.account.email) {
  loginEmail.value = state.account.email;
}

if (isAuthed()) {
  showApp();
} else {
  showLogin();
}
