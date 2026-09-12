import "./ui-overrides.css";

const STATE_STORAGE_KEY = "part5-studio-v1";
const LARGE_DEFAULT_MIGRATION_KEY = "part5-ui-large-default-v1";
const THEME_STORAGE_KEY = "part5-ui-theme";

type Theme = "light" | "dark";

type StoredState = {
  schema?: unknown;
  attempts?: unknown;
  bookmarks?: unknown;
  exposures?: unknown;
  session?: unknown;
  settings?: {
    largeText?: unknown;
    goal?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

function migrateLargeTextDefault() {
  try {
    if (localStorage.getItem(LARGE_DEFAULT_MIGRATION_KEY) === "1") return;

    const raw = localStorage.getItem(STATE_STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as StoredState;
      if (
        stored?.schema !== 1 ||
        !Array.isArray(stored.attempts) ||
        !Array.isArray(stored.bookmarks)
      )
        return;

      const previousSettings =
        stored.settings && typeof stored.settings === "object"
          ? stored.settings
          : {};
      stored.settings = {
        ...previousSettings,
        largeText: true,
        goal: [5, 10, 15].includes(Number(previousSettings.goal))
          ? Number(previousSettings.goal)
          : 10,
      };
      localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(stored));
    } else {
      localStorage.setItem(
        STATE_STORAGE_KEY,
        JSON.stringify({
          schema: 1,
          attempts: [],
          bookmarks: [],
          exposures: {},
          session: null,
          settings: { largeText: true, goal: 10 },
        }),
      );
    }

    localStorage.setItem(LARGE_DEFAULT_MIGRATION_KEY, "1");
  } catch {
    // Keep the original learning record untouched if storage is unavailable or malformed.
  }
}

const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

function getTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    // Fall through to the system preference.
  }
  return systemDark.matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = theme === "dark" ? "#111a16" : "#164f3d";
  syncThemeSwitch();
}

function setTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The visual change can still be applied for this tab.
  }
  applyTheme(theme);
}

function syncThemeSwitch() {
  const button = document.querySelector<HTMLButtonElement>("[data-theme-switch]");
  if (!button) return;
  const dark = document.documentElement.dataset.theme === "dark";
  button.classList.toggle("on", dark);
  button.setAttribute("aria-checked", String(dark));
  button.setAttribute("aria-label", dark ? "ダークモードをオフ" : "ダークモードをオン");
}

function ensureThemeSetting() {
  const panels = Array.from(document.querySelectorAll<HTMLElement>(".settings-panel"));
  const displayPanel = panels.find((panel) =>
    panel.querySelector("h2")?.textContent?.includes("学習と表示"),
  );
  if (!displayPanel) return;

  let row = displayPanel.querySelector<HTMLElement>(".theme-setting-row");
  if (!row) {
    row = document.createElement("div");
    row.className = "setting-row theme-setting-row";

    const copy = document.createElement("div");
    const label = document.createElement("b");
    label.textContent = "ダークモード";
    const description = document.createElement("p");
    description.textContent = "夜間でもまぶしくなりにくい、落ち着いた緑系の配色にします。";
    copy.append(label, description);

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.themeSwitch = "true";
    button.className = "switch";
    button.setAttribute("role", "switch");
    const knob = document.createElement("span");
    button.append(knob);
    button.addEventListener("click", () => {
      const next: Theme =
        document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      setTheme(next);
    });

    row.append(copy, button);
    displayPanel.append(row);
  }
  syncThemeSwitch();
}

let lastQuestionKey = "";
function syncStudyScreen() {
  const session = document.querySelector<HTMLElement>(".session-content");
  document.body.classList.toggle("part5-session-active", Boolean(session));

  if (!session) {
    lastQuestionKey = "";
    return;
  }

  const number = session.querySelector<HTMLElement>(".question-meta b")?.textContent?.trim();
  const sentence = session
    .querySelector<HTMLElement>(".question-sentence")
    ?.textContent?.trim()
    .slice(0, 80);
  if (!number) return;

  const key = `${number}:${sentence ?? ""}`;
  if (key === lastQuestionKey) return;
  lastQuestionKey = key;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
  });
}

let syncQueued = false;
function syncUi() {
  ensureThemeSetting();
  syncStudyScreen();
}
function queueSync() {
  if (syncQueued) return;
  syncQueued = true;
  requestAnimationFrame(() => {
    syncQueued = false;
    syncUi();
  });
}

migrateLargeTextDefault();
applyTheme(getTheme());

const root = document.getElementById("root");
if (root) {
  new MutationObserver(queueSync).observe(root, {
    childList: true,
    subtree: true,
  });
}

window.addEventListener("pageshow", queueSync);
systemDark.addEventListener("change", () => {
  try {
    if (localStorage.getItem(THEME_STORAGE_KEY)) return;
  } catch {
    // If storage is blocked, continue following the system theme.
  }
  applyTheme(systemDark.matches ? "dark" : "light");
});
queueSync();
