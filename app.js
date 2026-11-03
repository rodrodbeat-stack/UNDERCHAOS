const feed = document.getElementById("feed");
const preview = document.getElementById("preview");

let selectedMedia = [];

function addMedia(file) {
  if (!file) return;

  const url = URL.createObjectURL(file);
  selectedMedia.push({ file, url });

  let element;

  if (file.type.startsWith("image/")) {
    element = document.createElement("img");
    element.src = url;
  } else if (file.type.startsWith("video/")) {
    element = document.createElement("video");
    element.src = url;
    element.controls = true;
  } else if (file.type.startsWith("audio/")) {
    element = document.createElement("audio");
    element.src = url;
    element.controls = true;
  } else {
    selectedMedia.pop();
    URL.revokeObjectURL(url);
    alert("Formato no compatible");
    return;
  }

  preview.appendChild(element);
}

["photoInput", "videoInput", "audioInput"].forEach(id => {
  document.getElementById(id).addEventListener("change", event => {
    [...event.target.files].forEach(addMedia);
    event.target.value = "";
  });
});

document.getElementById("publish").addEventListener("click", () => {
  const text = document.getElementById("postText").value.trim();

  if (!text && !selectedMedia.length) {
    alert("Escribe algo o selecciona contenido.");
    return;
  }

  const article = document.createElement("article");
  article.className = "post";

  const title = document.createElement("h3");
  title.textContent = "UnderChaos Creator · ahora";

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  article.append(title, paragraph);

  selectedMedia.forEach(({file, url}) => {
    let media;

    if (file.type.startsWith("image/")) {
      media = document.createElement("img");
      media.src = url;
    } else if (file.type.startsWith("video/")) {
      media = document.createElement("video");
      media.src = url;
      media.controls = true;
    } else {
      media = document.createElement("audio");
      media.src = url;
      media.controls = true;
    }

    media.style.maxWidth = "100%";
    media.style.display = "block";
    media.style.marginTop = "12px";
    article.appendChild(media);
  });

  const actions = document.createElement("div");
  actions.className = "actions";
  actions.innerHTML = `
    <button class="like">♡ Me gusta</button>
    <button class="comment">▢ Comentar</button>
    <button class="share">↗ Compartir</button>
  `;

  article.appendChild(actions);
  feed.prepend(article);

  document.getElementById("postText").value = "";
  preview.innerHTML = "";
  selectedMedia = [];

  alert("Publicación creada en esta sesión.");
});

feed.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.classList.contains("like")) {
    button.classList.toggle("liked");
    button.textContent = button.classList.contains("liked")
      ? "♥ Te gusta"
      : "♡ Me gusta";
  }

  if (button.classList.contains("comment")) {
    const comment = prompt("Escribe tu comentario:");
    if (comment?.trim()) alert("Comentario recibido en esta demostración.");
  }

  if (button.classList.contains("share")) {
    navigator.clipboard?.writeText(location.href);
    alert("Enlace copiado.");
  }
});

document.querySelectorAll("[data-filter]").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();

    const filter = link.dataset.filter;

    document.querySelectorAll(".post").forEach(post => {
      post.style.display =
        filter === "all" || post.dataset.type === filter
          ? "block"
          : "none";
    });
  });
});
