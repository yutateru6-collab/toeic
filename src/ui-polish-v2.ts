import "./ui-polish-v2.css";

const ABOUT_ENTRY_LABELS = [
  "問題の制作方針",
  "制作方針・検証状況",
  "このアプリについて",
];

function goHome() {
  const openDialog = document.querySelector<HTMLDialogElement>("dialog.dialog[open]");
  openDialog?.querySelector<HTMLButtonElement>(".dialog-head .icon-btn")?.click();
  requestAnimationFrame(() => {
    document.querySelector<HTMLButtonElement>(".sidebar .brand")?.click();
  });
}

function bindMobileTitleHome() {
  const title = document.querySelector<HTMLElement>(".mobile-brand");
  if (!title || title.dataset.homeLinkBound === "1") return;

  title.dataset.homeLinkBound = "1";
  title.setAttribute("role", "button");
  title.setAttribute("tabindex", "0");
  title.setAttribute("aria-label", "ホームへ戻る");
  title.setAttribute("title", "ホームへ戻る");

  title.addEventListener("click", goHome);
  title.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    goHome();
  });
}

function removeAboutEntryPoints() {
  document.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
    const text = button.textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (ABOUT_ENTRY_LABELS.some((label) => text.includes(label))) button.remove();
  });

  const aboutDialog = Array.from(
    document.querySelectorAll<HTMLDialogElement>("dialog.dialog"),
  ).find((dialog) =>
    dialog
      .querySelector(".dialog-head h2")
      ?.textContent?.includes("一問ずつ、根拠のある学びを。"),
  );

  if (aboutDialog?.open) {
    aboutDialog.querySelector<HTMLButtonElement>(".dialog-head .icon-btn")?.click();
  }
}

function improveThemeSettingCopy() {
  const row = document.querySelector<HTMLElement>(".theme-setting-row");
  if (!row) return;
  const heading = row.querySelector("b");
  const description = row.querySelector("p");
  if (heading) heading.textContent = "ダークモード";
  if (description)
    description.textContent =
      "墨黒と明るい文字を中心にし、緑はアクセントだけにしてコントラストを高めます。";
}

function removeAllTopicsOption() {
  const topicLabel = Array.from(
    document.querySelectorAll<HTMLLabelElement>(".hub-filters label"),
  ).find((label) => label.textContent?.trim().startsWith("論点"));
  const select = topicLabel?.querySelector<HTMLSelectElement>("select");
  if (!select) return;

  const allOption = Array.from(select.options).find(
    (option) =>
      option.value === "all" && option.textContent?.trim() === "すべての論点",
  );
  if (!allOption) return;

  const wasAll = select.value === "all";
  allOption.remove();

  if (wasAll && select.options.length > 0) {
    select.value = select.options[0].value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

let queued = false;
function syncUiPolish() {
  queued = false;
  bindMobileTitleHome();
  removeAboutEntryPoints();
  improveThemeSettingCopy();
  removeAllTopicsOption();
}

function queueUiPolish() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(syncUiPolish);
}

const root = document.getElementById("root");
if (root) {
  new MutationObserver(queueUiPolish).observe(root, {
    childList: true,
    subtree: true,
  });
}

window.addEventListener("pageshow", queueUiPolish);
queueUiPolish();
