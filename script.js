(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORAGE = { theme: "aivision-theme", favorites: "aivision-favorites", history: "aivision-history" };
  let lastPrompt = "";
  let toastTimer;

  function readStore(key, fallback) {
    try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
    catch { return fallback; }
  }
  function writeStore(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { showToast("Browser storage is full or unavailable."); return false; }
  }
  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
  }
  function setStatus(message, type = "info") {
    const status = $("#status-message");
    status.textContent = message;
    status.className = "status-message" + (type === "info" ? "" : " " + type);
    status.hidden = false;
  }
  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
  }
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = filename; link.style.display = "none";
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function saveHistory(item) {
    const history = readStore(STORAGE.history, []);
    history.unshift(item);
    writeStore(STORAGE.history, history.slice(0, 30));
    renderHistory();
  }
  function renderHistory() {
    const grid = $("#history-grid");
    if (!grid) return;
    const history = readStore(STORAGE.history, []);
    if (!history.length) {
      grid.innerHTML = '<div class="empty-state"><span><i data-lucide="images"></i></span><strong>Your canvas is waiting</strong><p>Generate your first image and it will show up here.</p></div>';
      refreshIcons(); return;
    }
    grid.replaceChildren();
    history.forEach((item, index) => {
      const card = document.createElement("article"); card.className = "history-card";
      const img = document.createElement("img"); img.src = item.url; img.alt = item.prompt || "Generated artwork"; img.loading = "lazy";
      img.addEventListener("click", () => openModal(item.url, item.prompt || "Your creation"));
      const footer = document.createElement("div"); footer.className = "history-card-footer";
      const prompt = document.createElement("p"); prompt.textContent = item.prompt || "AI artwork"; prompt.title = item.prompt || "";
      const actions = document.createElement("div"); actions.className = "history-actions";
      const download = document.createElement("button"); download.type = "button"; download.title = "Download image"; download.setAttribute("aria-label", "Download image"); download.innerHTML = '<i data-lucide="download"></i>';
      download.addEventListener("click", () => downloadImage(item.url, "aivision-creation-" + (index + 1) + ".png"));
      const remove = document.createElement("button"); remove.type = "button"; remove.title = "Remove from history"; remove.setAttribute("aria-label", "Remove from history"); remove.innerHTML = '<i data-lucide="trash-2"></i>';
      remove.addEventListener("click", () => { const list = readStore(STORAGE.history, []); list.splice(index, 1); writeStore(STORAGE.history, list); renderHistory(); showToast("Removed from recent creations."); });
      actions.append(download, remove); footer.append(prompt, actions); card.append(img, footer); grid.append(card);
    });
    refreshIcons();
  }
  async function downloadImage(url, filename) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Download failed");
      downloadBlob(await response.blob(), filename);
    } catch {
      if (/^https:\/\//i.test(url)) window.open(url, "_blank", "noopener,noreferrer");
      else showToast("This image could not be downloaded.");
    }
  }
  function openModal(url, title) {
    $("#modal-image").src = url;
    $("#modal-title").textContent = title || "Your creation";
    $("#image-modal").hidden = false;
    $("#close-modal").focus();
  }
  function closeModal() { $("#image-modal").hidden = true; }
  function setTheme(theme) {
    document.body.classList.toggle("dark", theme === "dark");
    writeStore(STORAGE.theme, theme);
    const button = $("#theme-toggle");
    if (button) {
      button.innerHTML = theme === "dark" ? '<i data-lucide="moon"></i>' : '<i data-lucide="sun"></i>';
      button.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    }
    refreshIcons();
  }
  function setStyle(style) {
    const select = $("#style-select");
    if (!select) return;
    const option = [...select.options].find(item => item.value === style);
    if (option) select.value = style;
    $("#create").scrollIntoView({ behavior: "smooth", block: "start" });
    $("#prompt").focus({ preventScroll: true });
    showToast("Style selected: " + (option ? option.textContent : style));
  }
  function initFilters() {
    $$(".filter-chip").forEach(button => button.addEventListener("click", () => {
      $$(".filter-chip").forEach(item => item.classList.toggle("active", item === button));
      const filter = button.dataset.filter;
      $$(".artwork-card").forEach(card => card.hidden = filter !== "all" && card.dataset.category !== filter);
    }));
  }
  function initFavorites() {
    const favorites = new Set(readStore(STORAGE.favorites, []));
    $$(".artwork-card").forEach(card => {
      const title = $("h3", card)?.textContent || "";
      const button = $(".favorite-btn", card);
      const setFavoriteState = (active) => {
        button.classList.toggle("is-favorite", active);
        button.setAttribute("aria-pressed", String(active));
        button.setAttribute("aria-label", (active ? "Remove " : "Add ") + title + " " + (active ? "from" : "to") + " favorites");
      };
      setFavoriteState(favorites.has(title));
      button.addEventListener("click", () => {
        if (favorites.has(title)) { favorites.delete(title); setFavoriteState(false); showToast("Removed from favorites."); }
        else { favorites.add(title); setFavoriteState(true); showToast("Added to favorites."); }
        writeStore(STORAGE.favorites, [...favorites]);
      });
    });
  }
  async function submitGeneration(event) {
    event.preventDefault();
    const promptInput = $("#prompt");
    const prompt = promptInput.value.trim();
    if (!prompt) { setStatus("Add a description of the image you want to create.", "error"); promptInput.focus(); return; }
    if (prompt.length < 3) { setStatus("Please make your prompt a little more descriptive.", "error"); return; }
    const button = $("#generate-button");
    const original = button.innerHTML;
    const payload = {
      prompt,
      style: $("#style-select").value,
      size: $("#aspect-select").value,
      quality: $("#quality-select").value
    };
    lastPrompt = prompt;
    button.disabled = true;
    button.innerHTML = '<i data-lucide="loader-circle"></i><span>Preparing...</span>';
    refreshIcons();
    setStatus("Checking the image-generation service…");
    try {
      const configuredEndpoint = document.querySelector('meta[name="aivision-api-endpoint"]')?.content?.trim();
      const endpoint = configuredEndpoint || "/api/images/generate";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 404 || response.status === 501) throw new Error("The AI backend is not connected yet. Add a secure server endpoint at POST /api/images/generate to enable real image generation.");
        throw new Error(data.error || data.message || "The image service returned an error (" + response.status + ").");
      }
      const imageUrl = data.imageUrl || data.url || data.image?.url || data.data?.[0]?.url;
      if (!imageUrl) throw new Error("The server responded, but no image URL was returned. Check your AI provider adapter.");
      saveHistory({ url: imageUrl, prompt, style: payload.style, createdAt: new Date().toISOString() });
      setStatus("Your image is ready! It has been added to Recent creations.", "success");
      openModal(imageUrl, prompt);
      showToast("Image generated successfully.");
    } catch (error) {
      setStatus(error.message || "Could not connect to the image service. Please try again.", "error");
      showToast("Image generation needs a configured AI backend.");
    } finally {
      button.disabled = false;
      button.innerHTML = original;
      refreshIcons();
    }
  }
  function init() {
    refreshIcons();
    setTheme(readStore(STORAGE.theme, "light"));
    renderHistory();
    initFilters();
    initFavorites();

    const prompt = $("#prompt");
    const count = $("#prompt-count");
    prompt.addEventListener("input", () => { count.textContent = prompt.value.length + " / 1200"; });
    $("#generate-form").addEventListener("submit", submitGeneration);
    $("#enhance-prompt").addEventListener("click", () => {
      const input = $("#prompt");
      const value = input.value.trim();
      if (!value) { input.value = "A beautiful, highly detailed scene with harmonious colors, soft cinematic lighting, thoughtful composition, atmospheric depth, and refined textures"; }
      else if (!/lighting|composition|detailed|quality|atmosphere/i.test(value)) input.value = value.replace(/[.!\s]*$/, "") + ", highly detailed, refined composition, soft cinematic lighting, atmospheric depth, beautiful color harmony";
      input.dispatchEvent(new Event("input"));
      input.focus();
      showToast("Prompt suggestions added — review and edit before generating.");
    });
    $$(".prompt-use").forEach(button => button.addEventListener("click", () => {
      prompt.value = button.dataset.prompt || "";
      prompt.dispatchEvent(new Event("input"));
      prompt.focus();
      $("#create").scrollIntoView({ behavior: "smooth" });
      showToast("Prompt added to the generator.");
    }));
    $$(".style-card").forEach(button => button.addEventListener("click", () => setStyle(button.dataset.style)));
    $("#theme-toggle").addEventListener("click", () => setTheme(document.body.classList.contains("dark") ? "light" : "dark"));
    $("#open-sidebar").addEventListener("click", () => $("#sidebar").classList.add("open"));
    $("#close-sidebar").addEventListener("click", () => $("#sidebar").classList.remove("open"));
    $$(".side-link[data-view]").forEach(link => link.addEventListener("click", () => {
      $$(".side-link[data-view]").forEach(item => item.classList.toggle("active", item === link));
      $("#breadcrumb-current").textContent = link.querySelector("span")?.textContent || "Create image";
      $("#sidebar").classList.remove("open");
    }));
    $("#open-history").addEventListener("click", () => { $("#history").scrollIntoView({ behavior: "smooth" }); $("#sidebar").classList.remove("open"); });
    $("#clear-history").addEventListener("click", () => {
      if (!readStore(STORAGE.history, []).length) { showToast("Your recent creations are already empty."); return; }
      if (window.confirm("Clear all locally saved creation history? This cannot be undone.")) { writeStore(STORAGE.history, []); renderHistory(); showToast("Creation history cleared."); }
    });
    $("#download-history").addEventListener("click", () => {
      const history = readStore(STORAGE.history, []);
      if (!history.length) { showToast("There is no creation history to export yet."); return; }
      downloadBlob(new Blob([JSON.stringify(history, null, 2)], { type: "application/json" }), "aivision-history.json");
    });
    $("#profile-button").addEventListener("click", () => showToast("Profile and sign-in require backend authentication."));
    $("#close-modal").addEventListener("click", closeModal);
    $("#image-modal").addEventListener("click", event => { if (event.target === $("#image-modal")) closeModal(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape") { closeModal(); $("#sidebar").classList.remove("open"); } });
    $("#modal-download").addEventListener("click", () => { const image = $("#modal-image"); if (image.src) downloadImage(image.src, "aivision-artwork.png"); });
    $("#modal-regenerate").addEventListener("click", () => { closeModal(); $("#prompt").value = lastPrompt || $("#prompt").value; $("#prompt").focus(); $("#create").scrollIntoView({ behavior: "smooth" }); showToast("Edit your prompt or generate again."); });
    $("#explore").setAttribute("aria-label", "Explore curated artwork inspiration");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();