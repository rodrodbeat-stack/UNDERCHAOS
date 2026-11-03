/* ==========================================
   UNDERCHAOS — SOCIAL ENGINE
   Version 1.0
   ========================================== */

const STORAGE_KEY = "underchaos_social_v1";

const $ = (selector, root = document) => root.querySelector(selector);

const feed = $("#feed");
const reelsFeed = $("#reelsFeed");
const savedFeed = $("#savedFeed");
const postInput = $("#postInput");
const publishBtn = $("#publishBtn");
const mediaPreview = $("#mediaPreview");
const photoInput = $("#photoInput");
const videoInput = $("#videoInput");
const audioInput = $("#audioInput");

let pendingFiles = [];
let posts = [];
let savedIds = new Set();
let following = new Set();
let profile = {
    name: "darkcode_2050",
    bio: "Digital creator | UNDERCHAOS"
};

let temporaryUrls = [];

function createId() {
    return "post-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
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

function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}

function loadState() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (data) {
            posts = Array.isArray(data.posts) ? data.posts : [];
            savedIds = new Set(data.savedIds || []);
            following = new Set(data.following || []);

            if (data.profile) {
                profile = { ...profile, ...data.profile };
            }
        }
    } catch (error) {
        console.error("Error cargando UNDERCHAOS:", error);
    }
}

function saveState() {
    const persistentPosts = posts.map(post => ({
        ...post,
        media: [],
        comments: post.comments || []
    }));

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        posts: persistentPosts,
        savedIds: [...savedIds],
        following: [...following],
        profile
    }));
}

function initializeDemoPosts() {
    document.querySelectorAll(".post").forEach((element, index) => {
        if (!element.dataset.postId) {
            element.dataset.postId = "demo-" + index;
        }

        if (!element.dataset.owner) {
            element.dataset.owner = "community";
        }

        const likeButton = $(".like-btn", element);
        const likeCount = $(".like-count", element);

        posts.push({
            id: element.dataset.postId,
            owner: element.dataset.owner,
            author: $(".post-author", element)?.textContent.trim() || "UNDERCHAOS",
            text: $(".post-copy", element)?.textContent.trim() || "",
            likes: Number(likeCount?.textContent || 0),
            liked: false,
            comments: [],
            media: [],
            demo: true
        });
    });
}

function getPost(id) {
    return posts.find(post => post.id === id);
}

function updateProfile() {
    const name = $("#profileName");
    const bio = $("#profileBio");

    if (name) name.textContent = profile.name;
    if (bio) bio.textContent = profile.bio;

    const followerCount = $("#followerCount");
    if (followerCount) {
        followerCount.textContent = 120 + following.size;
    }

    const profilePosts = $("#profilePosts");
    if (profilePosts) {
        profilePosts.textContent = posts.filter(post =>
            post.owner === "me"
        ).length;
    }
}

/* ==========================================
   MULTIMEDIA
   ========================================== */

function addFiles(files, type) {
    const accepted = {
        image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        video: ["video/mp4", "video/webm", "video/quicktime"],
        audio: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/mp4"]
    };

    Array.from(files).forEach(file => {
        if (!accepted[type].includes(file.type)) {
            showToast("Formato no compatible: " + file.name);
            return;
        }

        const maxSize = type === "video" ? 150 : 30;

        if (file.size > maxSize * 1024 * 1024) {
            showToast(`El archivo supera el límite de ${maxSize} MB.`);
            return;
        }

        pendingFiles.push({
            id: createId(),
            file,
            type,
            url: URL.createObjectURL(file)
        });
    });

    renderPreview();
}

function renderPreview() {
    if (!mediaPreview) return;

    mediaPreview.innerHTML = "";

    pendingFiles.forEach(item => {
        const wrapper = document.createElement("div");
        wrapper.className = "preview-item";

        let media;

        if (item.type === "image") {
            media = document.createElement("img");
            media.src = item.url;
        } else if (item.type === "video") {
            media = document.createElement("video");
            media.src = item.url;
            media.controls = true;
            media.playsInline = true;
        } else {
            media = document.createElement("div");
            media.className = "audio-card";
            media.textContent = "♫ " + item.file.name;
        }

        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "×";
        remove.className = "remove-preview";

        remove.addEventListener("click", () => {
            URL.revokeObjectURL(item.url);
            pendingFiles = pendingFiles.filter(file => file.id !== item.id);
            renderPreview();
        });

        wrapper.append(media, remove);
        mediaPreview.appendChild(wrapper);
    });
}

photoInput?.addEventListener("change", event => {
    addFiles(event.target.files, "image");
    event.target.value = "";
});

videoInput?.addEventListener("change", event => {
    addFiles(event.target.files, "video");
    event.target.value = "";
});

audioInput?.addEventListener("change", event => {
    addFiles(event.target.files, "audio");
    event.target.value = "";
});

/* ==========================================
   MEDIA RENDERING
   ========================================== */

function renderMedia(media = []) {
    if (!media.length) return "";

    return `
        <div class="post-media">
            ${media.map(item => {
                if (item.type === "image") {
                    return `<img src="${item.url}" alt="Publicación UNDERCHAOS">`;
                }

                if (item.type === "video") {
                    return `
                        <video controls playsinline preload="metadata">
                            <source src="${item.url}" type="${escapeHTML(item.mime || "video/mp4")}">
                        </video>
                    `;
                }

                return `
                    <div class="audio-card">
                        <div class="audio-icon">♫</div>
                        <div class="audio-info">
                            <strong>${escapeHTML(item.name)}</strong>
                            <audio controls preload="metadata">
                                <source src="${item.url}" type="${escapeHTML(item.mime || "audio/mpeg")}">
                            </audio>
                        </div>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

/* ==========================================
   CREATE POST
   ========================================== */

function publishPost() {
    const text = postInput?.value.trim() || "";

    if (!text && pendingFiles.length === 0) {
        showToast("Escribe algo o selecciona contenido multimedia.");
        return;
    }

    const media = pendingFiles.map(item => {
        temporaryUrls.push(item.url);

        return {
            type: item.type,
            url: item.url,
            name: item.file.name,
            mime: item.file.type
        };
    });

    const post = {
        id: createId(),
        owner: "me",
        author: profile.name,
        text,
        likes: 0,
        liked: false,
        comments: [],
        media,
        demo: false
    };

    posts.unshift(post);

    if (postInput) postInput.value = "";

    pendingFiles = [];
    renderPreview();

    renderAll();
    saveState();

    showToast("Publicación creada correctamente.");
}

publishBtn?.addEventListener("click", publishPost);

/* ==========================================
   POST TEMPLATE
   ========================================== */

function renderPost(post) {
    const isSaved = savedIds.has(post.id);
    const likedClass = post.liked ? "liked" : "";

    return `
        <article class="post" data-post-id="${escapeHTML(post.id)}"
            data-owner="${escapeHTML(post.owner)}"
            data-search="${escapeHTML(post.author + " " + post.text)}">

            <div class="post-header">
                <div class="avatar avatar-red">U</div>

                <div>
                    <strong class="post-author">${escapeHTML(post.author)}</strong>
                    <small>UNDERCHAOS · Comunidad</small>
                </div>

                <span class="post-menu">•••</span>
            </div>

            ${post.text ? `<div class="post-copy">${escapeHTML(post.text)}</div>` : ""}

            ${renderMedia(post.media)}

            <div class="post-actions">
                <button class="like-btn ${likedClass}" type="button">
                    ♥ <span class="like-count">${post.likes}</span>
                </button>

                <button class="comment-btn" type="button">
                    💬 ${post.comments.length}
                </button>

                <button class="share-btn" type="button">↗ Compartir</button>

                <button class="save-btn ${isSaved ? "saved" : ""}" type="button">
                    ${isSaved ? "★ Guardado" : "☆ Guardar"}
                </button>
            </div>

            <div class="comments-area">
                <div class="comments-list">
                    ${post.comments.map(comment => `
                        <div class="comment-item">
                            <strong>${escapeHTML(comment.author)}:</strong>
                            ${escapeHTML(comment.text)}
                        </div>
                    `).join("")}
                </div>

                <form class="comment-form">
                    <input type="text" name="comment"
                        placeholder="Escribe un comentario..."
                        maxlength="300" required>
                    <button type="submit">Enviar</button>
                </form>
            </div>
        </article>
    `;
}

/* ==========================================
   REELS
   ========================================== */

function renderReels() {
    if (!reelsFeed) return;

    const reels = posts.filter(post =>
        post.media?.some(item => item.type === "video")
    );

    reelsFeed.innerHTML = reels.length
        ? reels.map(post => {
            const video = post.media.find(item => item.type === "video");

            return `
                <article class="reel-card" data-post-id="${escapeHTML(post.id)}">
                    <video controls playsinline preload="metadata">
                        <source src="${video.url}" type="${escapeHTML(video.mime || "video/mp4")}">
                    </video>

                    <div class="reel-info">
                        <strong>@${escapeHTML(post.author)}</strong>
                        <p>${escapeHTML(post.text)}</p>
                        <span>♥ ${post.likes}</span>
                    </div>
                </article>
            `;
        }).join("")
        : `<p class="empty-state">Todavía no hay Reels. ¡Publica tu primer video!</p>`;
}

/* ==========================================
   SAVED POSTS
   ========================================== */

function renderSaved() {
    if (!savedFeed) return;

    const savedPosts = posts.filter(post => savedIds.has(post.id));

    savedFeed.innerHTML = savedPosts.length
        ? savedPosts.map(renderPost).join("")
        : `<p class="empty-state">Todavía no tienes publicaciones guardadas.</p>`;
}

/* ==========================================
   RENDER ALL
   ========================================== */

function renderAll() {
    if (feed) {
        const newPosts = posts.filter(post => !post.demo);

        const existingDemo = [...feed.querySelectorAll(".post")];

        feed.innerHTML = newPosts.map(renderPost).join("");

        existingDemo.forEach(element => {
            feed.appendChild(element);
        });

        // Restaurar estados de los posts iniciales
        existingDemo.forEach(element => {
            const post = getPost(element.dataset.postId);
            if (!post) return;

            const like = $(".like-btn", element);
            const count = $(".like-count", element);
            const save = $(".save-btn", element);

            if (like) like.classList.toggle("liked", !!post.liked);
            if (count) count.textContent = post.likes;

            if (save) {
                save.classList.toggle("saved", savedIds.has(post.id));
                save.textContent = savedIds.has(post.id)
                    ? "★ Guardado"
                    : "☆ Guardar";
            }
        });
    }

    renderReels();
    renderSaved();
    updateProfile();
}

/* ==========================================
   EVENT DELEGATION
   ========================================== */

document.addEventListener("click", event => {
    const postElement = event.target.closest(".post");

    if (postElement) {
        const post = getPost(postElement.dataset.postId);

        if (post) {
            if (event.target.closest(".like-btn")) {
                post.liked = !post.liked;
                post.likes += post.liked ? 1 : -1;

                renderAll();
                saveState();
                return;
            }

            if (event.target.closest(".save-btn")) {
                if (savedIds.has(post.id)) {
                    savedIds.delete(post.id);
                    showToast("Publicación eliminada de guardados.");
                } else {
                    savedIds.add(post.id);
                    showToast("Publicación guardada.");
                }

                renderAll();
                saveState();
                return;
            }

            if (event.target.closest(".comment-btn")) {
                const input = $(".comment-form input", postElement);
                input?.focus();
                return;
            }

            if (event.target.closest(".share-btn")) {
                const shareUrl = location.href.split("#")[0] +
                    "#post-" + encodeURIComponent(post.id);

                if (navigator.share) {
                    navigator.share({
                        title: "UNDERCHAOS",
                        text: post.text,
                        url: shareUrl
                    }).catch(() => {});
                } else if (navigator.clipboard) {
                    navigator.clipboard.writeText(shareUrl)
                        .then(() => showToast("Enlace copiado."));
                } else {
                    showToast("No se pudo compartir desde este navegador.");
                }
                return;
            }
        }
    }

    const followButton = event.target.closest(".follow-btn");

    if (followButton) {
        const username = followButton.dataset.username ||
            followButton.textContent.trim();

        if (following.has(username)) {
            following.delete(username);
            followButton.textContent = "Seguir";
            showToast("Has dejado de seguir.");
        } else {
            following.add(username);
            followButton.textContent = "Siguiendo";
            showToast("Ahora sigues a " + username);
        }

        updateProfile();
        saveState();
    }
});

/* ==========================================
   COMMENTS
   ========================================== */

document.addEventListener("submit", event => {
    const form = event.target.closest(".comment-form");
    if (!form) return;

    event.preventDefault();

    const postElement = form.closest(".post");
    const post = getPost(postElement?.dataset.postId);
    const input = form.querySelector('input[name="comment"]');

    if (!post || !input) return;

    const text = input.value.trim();
    if (!text) return;

    post.comments.push({
        author: profile.name,
        text
    });

    renderAll();
    saveState();

    showToast("Comentario publicado.");
});

/* ==========================================
   PROFILE EDITOR
   ========================================== */

const profileModal = $("#profileModal");

$("#editProfileBtn")?.addEventListener("click", () => {
    if ($("#editUsername")) {
        $("#editUsername").value = profile.name;
    }

    if ($("#editBio")) {
        $("#editBio").value = profile.bio;
    }

    profileModal?.classList.add("active");
});

$("#closeProfile")?.addEventListener("click", () => {
    profileModal?.classList.remove("active");
});

$("#saveProfile")?.addEventListener("click", () => {
    const username = $("#editUsername")?.value.trim();
    const bio = $("#editBio")?.value.trim();

    if (!username) {
        showToast("El nombre no puede estar vacío.");
        return;
    }

    const oldName = profile.name;

    profile.name = username.replace(/^@/, "");
    profile.bio = bio || "";

    posts.forEach(post => {
        if (post.owner === "me" && post.author === oldName) {
            post.author = profile.name;
        }
    });

    updateProfile();
    renderAll();
    saveState();

    profileModal?.classList.remove("active");
    showToast("Perfil actualizado.");
});

/* ==========================================
   SEARCH
   ========================================== */

$("#searchInput")?.addEventListener("input", event => {
    const query = event.target.value.toLowerCase().trim();

    document.querySelectorAll("#feed .post").forEach(post => {
        const content = post.dataset.search ||
            post.textContent.toLowerCase();

        post.style.display = content.toLowerCase().includes(query)
            ? ""
            : "none";
    });
});

/* ==========================================
   STORIES
   ========================================== */

$("#addStory")?.addEventListener("click", () => {
    showToast("Historias: siguiente módulo de UNDERCHAOS.");
});

/* ==========================================
   INITIALIZATION
   ========================================== */

loadState();

if (posts.length === 0) {
    initializeDemoPosts();
    saveState();
}

renderAll();
updateProfile();

console.log("UNDERCHAOS SOCIAL ENGINE ONLINE");
