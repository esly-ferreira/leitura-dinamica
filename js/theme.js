const toggleButton = document.getElementById("toggle-dark-mode");
const htmlEl = document.documentElement;
const iconEl = toggleButton?.querySelector(".material-symbols-rounded");

function setTheme(isDark) {
  if (isDark) {
    htmlEl.setAttribute("data-theme", "dark");
    if (iconEl) iconEl.textContent = "light_mode";
  } else {
    htmlEl.removeAttribute("data-theme");
    if (iconEl) iconEl.textContent = "dark_mode";
  }
  localStorage.setItem("app-theme", isDark ? "dark" : "light");
}

function initTheme() {
  const savedTheme = localStorage.getItem("app-theme");
  if (savedTheme) {
    setTheme(savedTheme === "dark");
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark);
  }
}

if (toggleButton) {
  toggleButton.addEventListener("click", () => {
    const isCurrentlyDark = htmlEl.getAttribute("data-theme") === "dark";
    setTheme(!isCurrentlyDark);
  });
}

// Inicializar na carga
initTheme();
