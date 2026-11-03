/* =====================================================
   CYBERREELS — SKYNET SOCIAL ENGINE
   SKYNET SOCIAL SYSTEMS | 2050
   ===================================================== */

(() => {
  "use strict";

  const STORAGE = "cyberreels_skynet_v1";

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  const feed = $(".feed-column");
  const composer = $(".composer");
  const postInput = $("#postInput");
  const publishBtn = $("#publishBtn");
  const toast = $("#toast");

  let pendingMedia = [];
  let mediaURLs = [];
  let reelsModal = null;

  let state = {
    likes: {},
    saved: [],
    comments: {},
    following: [],
    messages: []
  };

  /* ===============================
     UTILIDADES
  =============================== */

  function uid() {
    return "CR-" + Date.now() + "-" +
      Math.random().toString(36).slice(2, 7);
  }

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function notify(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(notify.timer);

    notify.timer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2600);
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(state));
    } catch (error) {
      console.error("Storage error:", error);
      notify("No se pudo guardar el estado local.");
    }
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE));

      if (saved) {
        state = { ...state, ...saved };
      }
    } catch (error) {
      console.error("Error loading state:", error);
    }
  }

  function formatCount(number) {
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + "M";
    }

    if (number >= 1000) {
      return (number / 1000).toFixed(1) + "k";
    }

    return String(number);
  }

  function parseCount(value) {
    const text = String(value || "0").trim().toLowerCase();

    if (text.endsWith("k")) {
      return Math.round(parseFloat(text) * 1000);
    }

    if (text.endsWith("m")) {
      return Math.round(parseFloat(text) * 1000000);
    }

    return parseInt(text.replace(/\D/g, ""), 10) || 0;
  }

  /* ===============================
     INICIALIZACIÓN DE PUBLICACIONES
  =============================== */

  function initializePosts() {
    $$(".post").forEach((post, index) => {
      if (!post.dataset.postId) {
        post.dataset.postId = "original-" + index;
      }

      const id = post.dataset.postId;

      if (state.likes[id] === undefined) {
        state.likes[id] = {
          count: parseCount($(".like-btn b", post)?.textContent),
          active: false
        };
      }

      const like = state.likes[id];

      $(".like-btn b", post).textContent =
        formatCount(like.count);

      $(".like-btn", post)?.classList.toggle(
        "liked",
        like.active
      );

      $(".save-btn", post)?.classList.toggle(
        "saved",
        state.saved.includes(id)
      );

      updateComments(post);
    });

    saveState();
  }

  /* ===============================
     COMPOSITOR MULTIMEDIA
  =============================== */

  function createUploadControls() {
    if (!composer) return;

    const buttons = $$(".compose-tool", composer);

    if (buttons.length < 2) return;

    buttons[0].title = "Subir fotografías";
    buttons[1].title = "Subir vídeos";

    const audioButton = document.createElement("button");

    audioButton.type = "button";
    audioButton.className = "compose-tool";
    audioButton.title = "Subir música";
    audioButton.textContent = "♫";

    buttons[1].after(audioButton);

    const photoInput = createInput("image/*", true);
    const videoInput = createInput("video/mp4,video/webm,video/quicktime", true);
    const audioInput = createInput("audio/*", true);

    composer.append(photoInput, videoInput, audioInput);

    buttons[0].addEventListener("click", () => photoInput.click());
    buttons[1].addEventListener("click", () => videoInput.click());
    audioButton.addEventListener("click", () => audioInput.click());

    photoInput.addEventListener("change", event => {
      addMedia(event.target.files, "image");
      event.target.value = "";
    });

    videoInput.addEventListener("change", event => {
      addMedia(event.target.files, "video");
      event.target.value = "";
    });

    audioInput.addEventListener("change", event => {
      addMedia(event.target.files, "audio");
      event.target.value = "";
    });

    createPreviewArea();
  }

  function createInput(accept, multiple) {
    const input = document.createElement("input");

    input.type = "file";
    input.accept = accept;
    input.multiple = multiple;
    input.hidden = true;

    return input;
  }

  function createPreviewArea() {
    const preview = document.createElement("div");

    preview.id = "cyberMediaPreview";
    preview.className = "cyber-media-preview";

    publishBtn?.before(preview);
  }

  function addMedia(files, type) {
    const limits = {
      image: 25,
      video: 150,
      audio: 30
    };

    Array.from(files).forEach(file => {
      if (!file.type.startsWith(type + "/")) {
        notify("Archivo incompatible.");
        return;
      }

      if (file.size > limits[type] * 1024 * 1024) {
        notify(`Máximo permitido: ${limits[type]} MB.`);
        return;
      }

      const url = URL.createObjectURL(file);

      pendingMedia.push({
        id: uid(),
        type,
        name: file.name,
        mime: file.type,
        url
      });

      mediaURLs.push(url);
    });

    renderPreview();

    if (pendingMedia.length) {
      notify("Contenido multimedia cargado.");
    }
  }

  function renderPreview() {
    const preview = $("#cyberMediaPreview");

    if (!preview) return;

    preview.innerHTML = "";

    pendingMedia.forEach(item => {
      const card = document.createElement("div");

      card.className = "cyber-preview-item";

      let content = "";

      if (item.type === "image") {
        content = `<img src="${item.url}" alt="Vista previa">`;
      }

      if (item.type === "video") {
        content = `
          <video src="${item.url}" controls playsinline></video>
        `;
      }

      if (item.type === "audio") {
        content = `
          <div class="audio-preview">
            <span>♫</span>
            <small>${escapeHTML(item.name)}</small>
          </div>
        `;
      }

      card.innerHTML = `
        ${content}
        <button type="button" class="remove-media"
          data-remove-media="${item.id}">×</button>
      `;

      preview.appendChild(card);
    });
  }

  /* ===============================
     PUBLICAR
  =============================== */

  function publishPost() {
    const text = postInput?.value.trim() || "";

    if (!text && pendingMedia.length === 0) {
      notify("Introduce contenido antes de publicar.");
      return;
    }

    const id = uid();

    const media = pendingMedia.map(item => ({ ...item }));

    const article = document.createElement("article");

    article.className = "post panel new-post";
    article.dataset.postId = id;
    article.dataset.search = text.toLowerCase();

    article.innerHTML = `
      <header class="post-header">
        <div class="avatar avatar-red">DC</div>

        <div class="post-author">
          <strong>darkcode_2050</strong>
          <small>Ahora · SKYNET NETWORK</small>
        </div>

        <button class="more">•••</button>
      </header>

      ${text ? `
        <div class="post-copy">
          <strong>darkcode_2050</strong>
          ${escapeHTML(text)}
        </div>
      ` : ""}

      ${renderMedia(media)}

      <div class="post-actions">
        <button class="like-btn">
          <span>♥</span><b>0</b>
        </button>

        <button class="comment-btn">
          <span>◯</span><b>0</b>
        </button>

        <button class="share-btn">
          <span>➤</span>
        </button>

        <button class="save-btn">♧</button>
      </div>

      <div class="post-copy post-comments">
        <div class="comments-list"></div>

        <form class="comment-form">
          <input name="comment"
            placeholder="Escribe un comentario..."
            maxlength="300" required>
          <button type="submit">➤</button>
        </form>
      </div>

      <div class="comment-preview">Añadir un comentario</div>
    `;

    feed.querySelector(".feed-heading").after(article);

    state.likes[id] = {
      count: 0,
      active: false
    };

    if (postInput) postInput.value = "";

    pendingMedia = [];
    renderPreview();

    saveState();

    notify("TRANSMISIÓN PUBLICADA");
  }

  function renderMedia(media) {
    if (!media.length) return "";

    return `
      <div class="post-image cyber-media">
        ${media.map(item => {
          if (item.type === "image") {
            return `
              <img src="${item.url}"
                alt="${escapeHTML(item.name)}">
            `;
          }

          if (item.type === "video") {
            return `
              <video controls playsinline preload="metadata">
                <source src="${item.url}" type="${escapeHTML(item.mime)}">
              </video>
            `;
          }

          return `
            <div class="cyber-audio">
              <span>♫</span>
              <div>
                <strong>${escapeHTML(item.name)}</strong>
                <audio controls preload="metadata">
                  <source src="${item.url}" type="${escapeHTML(item.mime)}">
                </audio>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  publishBtn?.addEventListener("click", publishPost);

  postInput?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      publishPost();
    }
  });

  /* ===============================
     LIKES / GUARDADOS / COMPARTIR
  =============================== */

  document.addEventListener("click", event => {

    const removeButton = event.target.closest("[data-remove-media]");

    if (removeButton) {
      const id = removeButton.dataset.removeMedia;

      const item = pendingMedia.find(media => media.id === id);

      if (item) {
        URL.revokeObjectURL(item.url);
        pendingMedia = pendingMedia.filter(media => media.id !== id);
        renderPreview();
      }

      return;
    }

    const post = event.target.closest(".post");

    if (post) {
      const id = post.dataset.postId;

      if (event.target.closest(".like-btn")) {
        const like = state.likes[id];

        if (!like) return;

        like.active = !like.active;
        like.count += like.active ? 1 : -1;

        $(".like-btn b", post).textContent =
          formatCount(like.count);

        $(".like-btn", post).classList.toggle(
          "liked",
          like.active
        );

        saveState();
        return;
      }

      if (event.target.closest(".save-btn")) {
        const button = $(".save-btn", post);

        if (state.saved.includes(id)) {
          state.saved = state.saved.filter(item => item !== id);
          button.classList.remove("saved");

          notify("PUBLICACIÓN ELIMINADA DE GUARDADOS");
        } else {
          state.saved.push(id);
          button.classList.add("saved");

          notify("PUBLICACIÓN GUARDADA");
        }

        saveState();
        return;
      }

      if (event.target.closest(".comment-btn")) {
        $(".comment-form input", post)?.focus();
        return;
      }

      if (event.target.closest(".share-btn")) {
        sharePost(post);
        return;
      }

      if (event.target.closest(".comment-preview")) {
        $(".comment-form input", post)?.focus();
      }
    }

  });

  async function sharePost(post) {
    const url = location.href.split("#")[0] +
      "#post-" + encodeURIComponent(post.dataset.postId);

    try {
      if (navigator.share) {
        await navigator.share({
          title: "CYBERREELS",
          text: "Mira esta publicación en SKYNET SOCIAL",
          url
        });
      } else {
        await navigator.clipboard.writeText(url);
        notify("ENLACE COPIADO");
      }
    } catch (error) {
      console.log("Share cancelled");
    }
  }

  /* ===============================
     COMENTARIOS
  =============================== */

  document.addEventListener("submit", event => {
    const form = event.target.closest(".comment-form");

    if (!form) return;

    event.preventDefault();

    const post = form.closest(".post");
    const id = post.dataset.postId;
    const input = $('input[name="comment"]', form);
    const text = input.value.trim();

    if (!text) return;

    if (!state.comments[id]) {
      state.comments[id] = [];
    }

    state.comments[id].push({
      author: "darkcode_2050",
      text
    });

    input.value = "";

    updateComments(post);
    saveState();

    notify("COMENTARIO TRANSMITIDO");
  });

  function updateComments(post) {
    const id = post.dataset.postId;
    const comments = state.comments[id] || [];

    const list = $(".comments-list", post);
    const count = $(".comment-btn b", post);

    if (list) {
      list.innerHTML = comments.map(comment => `
        <div class="comment-item">
          <strong>${escapeHTML(comment.author)}</strong>
          ${escapeHTML(comment.text)}
        </div>
      `).join("");
    }

    if (count) {
      count.textContent = comments.length;
    }
  }

  /* ===============================
     REELS
  =============================== */

  function createReelsModal() {
    if (reelsModal) return;

    reelsModal = document.createElement("div");

    reelsModal.id = "cyberReelsModal";
    reelsModal.className = "cyber-reels-modal";

    reelsModal.innerHTML = `
      <div class="reels-window">
        <header>
          <div>
            <strong>CYBERREELS</strong>
            <small>SKYNET VIDEO NETWORK</small>
          </div>

          <button id="closeReels">✕</button>
        </header>

        <div id="reelsContainer"></div>
      </div>
    `;

    document.body.appendChild(reelsModal);

    $("#closeReels", reelsModal).addEventListener("click", closeReels);
  }

  function openReels() {
    createReelsModal();

    const container = $("#reelsContainer");

    const videos = $$(".post").flatMap(post => {
      return [...$("video", post.parentElement || document)?.parentElement?.querySelectorAll("video") || []]
        .filter(video => video.closest(".post") === post)
        .map(video => ({
          video,
          author: $(".post-author", post)?.textContent.trim() || "SKYNET USER",
          text: $(".post-copy", post)?.textContent.trim() || ""
        }));
    });

    const userVideos = $$(".new-post video");

    userVideos.forEach(video => {
      videos.push({
        video,
        author: "darkcode_2050",
        text: "SKYNET VIDEO TRANSMISSION"
      });
    });

    if (!videos.length) {
      container.innerHTML = `
        <div class="reels-empty">
          <span>▣</span>
          <h2>NO SIGNAL</h2>
          <p>Todavía no hay vídeos en la red.</p>
        </div>
      `;
    } else {
      container.innerHTML = videos.map((item, index) => `
        <div class="reel-item">
          <div class="reel-video" data-reel-index="${index}"></div>
          <div class="reel-caption">
            <strong>${escapeHTML(item.author)}</strong>
            <p>${escapeHTML(item.text)}</p>
          </div>
        </div>
      `).join("");

      $$(".reel-item", container).forEach((item, index) => {
        const source = videos[index].video.cloneNode(true);
        source.controls = true;
        source.playsInline = true;
        source.removeAttribute("autoplay");

        $(".reel-video", item).appendChild(source);
      });
    }

    reelsModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeReels() {
    reelsModal?.classList.remove("active");
    document.body.style.overflow = "";
  }

  /* ===============================
     NAVEGACIÓN SUPERIOR
  =============================== */

  const topButtons = $$(".top-actions .icon-btn");

  topButtons.forEach(button => {
    button.addEventListener("click", () => {
      const title = button.title.toLowerCase();

      if (title === "reels") {
        openReels();
      }

      if (title === "guardados") {
        showSaved();
      }

      if (title === "inicio") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      if (title === "enviar") {
        $("#chatMessage")?.focus();
        $("#messages")?.scrollIntoView({ behavior: "smooth" });
      }

      if (title === "notificaciones") {
        notify("CENTRO DE NOTIFICACIONES SKYNET");
      }

      topButtons.forEach(item => item.classList.remove("active"));
      button.classList.add("active");
    });
  });

  /* ===============================
     GUARDADOS
  =============================== */

  function showSaved() {
    const savedPosts = state.saved
      .map(id => document.querySelector(
        `.post[data-post-id="${CSS.escape(id)}"]`
      ))
      .filter(Boolean);

    if (!savedPosts.length) {
      notify("NO HAY PUBLICACIONES GUARDADAS");
      return;
    }

    const originalPositions = savedPosts.map(post => ({
      post,
      parent: post.parentNode,
      next: post.nextSibling
    }));

    const modal = document.createElement("div");

    modal.className = "cyber-saved-modal";

    modal.innerHTML = `
      <div class="saved-window">
        <header>
          <strong>PUBLICACIONES GUARDADAS</strong>
          <button type="button">✕</button>
        </header>
        <div class="saved-content"></div>
      </div>
    `;

    const content = $(".saved-content", modal);

    savedPosts.forEach(post => {
      content.appendChild(post.cloneNode(true));
    });

    $("button", modal).addEventListener("click", () => {
      modal.remove();
    });

    document.body.appendChild(modal);
  }

  /* ===============================
     BUSCADOR
  =============================== */

  $("#searchInput")?.addEventListener("input", event => {
    const query = event.target.value.toLowerCase().trim();

    $$(".post").forEach(post => {
      const content = (
        post.dataset.search || post.textContent
      ).toLowerCase();

      post.style.display = content.includes(query) ? "" : "none";
    });
  });

  /* ===============================
     FACTORY CHAT
  =============================== */

  $("#chatForm")?.addEventListener("submit", event => {
    event.preventDefault();

    const input = $("#chatMessage");
    const text = input?.value.trim();

    if (!text) return;

    const message = {
      text,
      time: new Date().toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    state.messages.push(message);

    const person = document.createElement("div");

    person.className = "chat-person";

    person.innerHTML = `
      <div class="avatar avatar-red">DC</div>
      <div>
        <b>darkcode_2050</b>
        <small>${escapeHTML(text)}</small>
      </div>
      <time>${message.time}</time>
    `;

    $("#chatForm").before(person);

    input.value = "";

    saveState();

    notify("MENSAJE ENVIADO");
  });

  /* ===============================
     ATAJO DE BÚSQUEDA
  =============================== */

  document.addEventListener("keydown", event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      $("#searchInput")?.focus();
    }

    if (event.key === "Escape") {
      closeReels();
    }
  });

  /* ===============================
     INICIAR SKYNET
  =============================== */

  loadState();
  initializePosts();
  createUploadControls();

  console.log(
    "%c CYBERREELS // SKYNET SOCIAL ONLINE ",
    "background:#111;color:#00f5ff;padding:8px;font-weight:bold"
  );

})();
