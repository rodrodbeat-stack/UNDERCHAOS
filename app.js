/* ==========================================
   UNDERCHAOS — SKYNET SOCIAL
   SOCIAL ENGINE 2050
========================================== */

const postText = document.getElementById("postText");
const publishBtn = document.getElementById("publishBtn");
const photoInput = document.getElementById("photoInput");
const videoInput = document.getElementById("videoInput");
const audioInput = document.getElementById("audioInput");
const preview = document.getElementById("preview");

const postsContainer = document.getElementById("postsContainer");
const reelsContainer = document.getElementById("reelsContainer");
const feedFilter = document.getElementById("feedFilter");
const searchInput = document.getElementById("searchInput");

const selectedFiles = [];

const currentUser = {
  name: "darkcode_2050",
  avatar: "https://i.pravatar.cc/100?img=12"
};

/* ==========================================
   FILE UPLOADS
========================================== */

function registerFileInput(input, type) {
  if (!input) return;

  input.addEventListener("change", () => {
    const files = Array.from(input.files || []);

    files.forEach(file => {
      const validTypes = {
        image: file.type.startsWith("image/"),
        video: file.type.startsWith("video/"),
        audio: file.type.startsWith("audio/")
      };

      if (!validTypes[type]) return;

      selectedFiles.push({
        file,
        type,
        url: URL.createObjectURL(file)
      });
    });

    renderPreview();
    input.value = "";
  });
}

registerFileInput(photoInput, "image");
registerFileInput(videoInput, "video");
registerFileInput(audioInput, "audio");

/* ==========================================
   PREVIEW
========================================== */

function renderPreview() {
  preview.innerHTML = "";

  selectedFiles.forEach((item, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "preview-item";

    let media;

    if (item.type === "image") {
      media = document.createElement("img");
      media.src = item.url;
      media.alt = item.file.name;
    }

    if (item.type === "video") {
      media = document.createElement("video");
      media.src = item.url;
      media.controls = true;
      media.muted = true;
    }

    if (item.type === "audio") {
      media = document.createElement("audio");
      media.src = item.url;
      media.controls = true;
    }

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "×";
    remove.className = "remove-preview";

    remove.addEventListener("click", () => {
      URL.revokeObjectURL(item.url);
      selectedFiles.splice(index, 1);
      renderPreview();
    });

    wrapper.append(media, remove);
    preview.appendChild(wrapper);
  });
}

/* ==========================================
   CREATE MEDIA ELEMENTS
========================================== */

function createMediaElement(item) {
  const media = document.createElement(
    item.type === "video" ? "video" :
    item.type === "audio" ? "audio" : "img"
  );

  media.src = item.url;

  if (item.type === "video") {
    media.controls = true;
    media.playsInline = true;
    media.preload = "metadata";
  }

  if (item.type === "audio") {
    media.controls = true;
    media.preload = "metadata";
  }

  if (item.type === "image") {
    media.alt = item.file.name;
    media.loading = "lazy";
  }

  return media;
}

/* ==========================================
   CREATE POST
========================================== */

function createPost() {
  const text = postText.value.trim();

  if (!text && selectedFiles.length === 0) {
    alert("Escribe algo o selecciona una fotografía, video o música.");
    return;
  }

  const files = [...selectedFiles];

  let type = "text";

  if (files.length > 0) {
    type = files[0].type;
  }

  const article = document.createElement("article");
  article.className = "post-card";
  article.dataset.type = type;

  const header = document.createElement("div");
  header.className = "post-header";

  const avatar = document.createElement("img");
  avatar.src = currentUser.avatar;
  avatar.alt = "Perfil";

  const author = document.createElement("div");
  author.className = "post-author";

  author.innerHTML = `
    <strong>${currentUser.name}</strong>
    <small>Ahora · UNDERCHAOS</small>
  `;

  const more = document.createElement("button");
  more.className = "post-more";
  more.type = "button";
  more.textContent = "•••";

  header.append(avatar, author, more);

  const content = document.createElement("div");
  content.className = "post-caption";

  const description = document.createElement("p");
  description.textContent = text;

  content.appendChild(description);

  const mediaContainer = document.createElement("div");
  mediaContainer.className = "post-media";

  files.forEach(item => {
    const media = createMediaElement(item);

    if (item.type === "audio") {
      mediaContainer.appendChild(media);
    } else {
      mediaContainer.appendChild(media);
    }
  });

  const reactions = document.createElement("div");
  reactions.className = "post-reactions";

  reactions.innerHTML = `
    <button type="button" class="like-btn">♥ <span>0</span></button>
    <button type="button" class="comment-btn">◯ <span>0</span></button>
    <button type="button" class="share-btn">➤</button>
    <button type="button" class="save-btn">♧</button>
  `;

  const commentArea = document.createElement("div");
  commentArea.className = "comment-area";

  commentArea.innerHTML = `
    <input type="text" placeholder="Escribe un comentario...">
    <button type="button" class="send-comment">PUBLICAR</button>
  `;

  article.append(
    header,
    content,
    mediaContainer,
    reactions,
    commentArea
  );

  postsContainer.prepend(article);

  // Los videos también aparecen en Reels.
  files.filter(item => item.type === "video").forEach(item => {
    createReel(item);
  });

  postText.value = "";

  selectedFiles.length = 0;
  preview.innerHTML = "";

  applyFilters();

  article.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

publishBtn.addEventListener("click", createPost);

/* ==========================================
   CREATE REELS
========================================== */

function createReel(item) {
  const card = document.createElement("article");
  card.className = "reel-card";

  const cover = document.createElement("div");
  cover.className = "reel-cover uploaded-reel";

  const video = document.createElement("video");
  video.src = item.url;
  video.controls = true;
  video.playsInline = true;
  video.preload = "metadata";

  const title = document.createElement("strong");
  title.textContent = item.file.name;

  const author = document.createElement("small");
  author.textContent = "@" + currentUser.name;

  cover.appendChild(video);
  card.append(cover, title, author);

  reelsContainer.prepend(card);
}

/* ==========================================
   LIKE / SAVE / SHARE
========================================== */

document.addEventListener("click", async event => {

  const like = event.target.closest(".like-btn");

  if (like) {
    like.classList.toggle("liked");

    const counter = like.querySelector("span");

    if (counter) {
      let value = parseInt(counter.textContent.replace("k", "")) || 0;

      if (like.classList.contains("liked")) {
        value++;
      } else {
        value = Math.max(0, value - 1);
      }

      counter.textContent = value;
    }
  }

  const save = event.target.closest(".save-btn");

  if (save) {
    save.classList.toggle("liked");
    save.textContent = save.classList.contains("liked") ? "◆" : "♧";
  }

  const share = event.target.closest(".share-btn");

  if (share) {
    const url = window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      alert("Enlace copiado. ¡Compártelo!");
    } catch {
      alert("No se pudo copiar el enlace automáticamente.");
    }
  }

  const comment = event.target.closest(".comment-btn");

  if (comment) {
    const area = comment.closest(".post-card")?.querySelector(".comment-area");
    area?.querySelector("input")?.focus();
  }

});

/* ==========================================
   COMMENTS
========================================== */

document.addEventListener("click", event => {
  const button = event.target.closest(".send-comment");

  if (!button) return;

  const area = button.closest(".comment-area");
  const input = area.querySelector("input");
  const value = input.value.trim();

  if (!value) return;

  const post = button.closest(".post-card");

  const comment = document.createElement("div");
  comment.className = "new-comment";

  const strong = document.createElement("strong");
  strong.textContent = currentUser.name + ": ";

  const text = document.createElement("span");
  text.textContent = value;

  comment.append(strong, text);
  area.before(comment);

  const counter = post.querySelector(".comment-btn span");

  if (counter) {
    counter.textContent = (parseInt(counter.textContent) || 0) + 1;
  }

  input.value = "";
});

/* ==========================================
   FEED FILTER
========================================== */

function applyFilters() {
  const selected = feedFilter?.value || "all";
  const search = searchInput?.value.toLowerCase().trim() || "";

  document.querySelectorAll(".post-card").forEach(post => {
    const type = post.dataset.type || "text";
    const text = post.textContent.toLowerCase();

    const typeMatches = selected === "all" || type === selected;
    const searchMatches = !search || text.includes(search);

    post.style.display =
      typeMatches && searchMatches ? "" : "none";
  });
}

feedFilter?.addEventListener("change", applyFilters);
searchInput?.addEventListener("input", applyFilters);

/* ==========================================
   FACTORY CHAT
========================================== */

const chatForm = document.getElementById("chatForm");
const chatText = document.getElementById("chatText");
const chatMessages = document.getElementById("chatMessages");
const chatToggle = document.getElementById("chatToggle");

chatForm?.addEventListener("submit", event => {
  event.preventDefault();

  const message = chatText.value.trim();

  if (!message) return;

  const row = document.createElement("div");
  row.className = "chat-user";

  const avatar = document.createElement("img");
  avatar.src = currentUser.avatar;
  avatar.alt = "";

  const info = document.createElement("div");

  const name = document.createElement("strong");
  name.textContent = currentUser.name;

  const text = document.createElement("small");
  text.textContent = message;

  info.append(name, text);
  row.append(avatar, info);

  chatMessages.appendChild(row);

  chatText.value = "";

  chatMessages.scrollTop = chatMessages.scrollHeight;
});

chatToggle?.addEventListener("click", () => {
  const hidden = chatMessages.style.display === "none";

  chatMessages.style.display = hidden ? "grid" : "none";
  chatForm.style.display = hidden ? "flex" : "none";

  chatToggle.textContent = hidden ? "−" : "+";
});

/* ==========================================
   NOTIFICATIONS
========================================== */

document.getElementById("notificationBtn")?.addEventListener("click", () => {
  alert("SKYNET SOCIAL: no tienes nuevas notificaciones.");
});

/* ==========================================
   STORY BUTTON
========================================== */

document.getElementById("addStoryBtn")?.addEventListener("click", () => {
  photoInput?.click();
});

/* ==========================================
   INITIALIZATION
========================================== */

applyFilters();

console.log("UNDERCHAOS SOCIAL ENGINE ONLINE");
console.log("SKYNET SOCIAL // VERSION 2050");
