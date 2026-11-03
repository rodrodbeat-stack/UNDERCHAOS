(() => {
  const toast = document.getElementById('toast');
  let toastTimer;
  let selectedFile = null;
  const MAX_FILE_SIZE = 100 * 1024 * 1024;
  const DB_NAME = 'underchaos_media_db';
  const STORE = 'posts';

  function notify(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function savePost(record) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(record);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  }

  async function getPosts() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => { db.close(); resolve(req.result || []); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  }

  function make(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .upload-tools{display:flex;align-items:center;gap:4px}
      .upload-preview{display:none;margin-top:-4px;padding:10px 14px;border:1px dashed #8f2635;border-radius:12px;background:#120b10;color:#cbd3dc;font:600 13px Rajdhani}
      .upload-preview.visible{display:flex;align-items:center;gap:10px}
      .upload-preview button{margin-left:auto;border:1px solid #71303b;background:#1b0d13;color:#ff8790;border-radius:7px;padding:5px 9px}
      .local-media{width:100%;max-height:620px;display:block;object-fit:contain;background:#030609;border-radius:12px}
      .local-audio{width:100%;margin:12px 0;filter:sepia(.15)}
      .local-post-caption{padding:10px 5px;color:#dce3e9;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}
      .local-post-caption strong{color:#fff;margin-right:8px}
      .local-post .post-header{margin-bottom:10px}
      .local-post .post-media-wrap{overflow:hidden;border-radius:12px;border:1px solid #343e49;background:#030609}
      .local-post .post-media-wrap img{max-width:100%;max-height:620px;display:block;margin:auto;object-fit:contain}
      .local-post .post-media-wrap video{width:100%;max-height:620px;display:block;background:#000}
      .local-post .post-media-wrap audio{width:calc(100% - 24px);margin:12px}
      .local-post .media-type{font:600 10px Orbitron;letter-spacing:1px;color:#ff6976;padding:9px 12px;border-bottom:1px solid #303b46}
      @media(max-width:760px){.upload-preview{font-size:12px}.local-post .post-media-wrap video{max-height:420px}}
    `;
    document.head.appendChild(style);
  }

  function setupUploader() {
    const composer = document.querySelector('.composer');
    const input = document.getElementById('postInput');
    const publish = document.getElementById('publishBtn');
    const tools = [...document.querySelectorAll('.compose-tool')];

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.hidden = true;
    fileInput.id = 'underchaosFileInput';
    composer.appendChild(fileInput);

    const audioButton = make('button', 'compose-tool', '♫');
    audioButton.type = 'button';
    audioButton.title = 'Añadir música o audio';
    audioButton.setAttribute('aria-label', audioButton.title);
    composer.insertBefore(audioButton, publish);

    const preview = make('div', 'upload-preview');
    preview.id = 'uploadPreview';
    preview.innerHTML = '<span>ARCHIVO SELECCIONADO</span><b></b><button type="button">QUITAR</button>';
    composer.insertAdjacentElement('afterend', preview);

    function choose(accept) {
      fileInput.accept = accept;
      fileInput.click();
    }
    if (tools[0]) tools[0].addEventListener('click', () => choose('image/*'));
    if (tools[1]) tools[1].addEventListener('click', () => choose('video/*'));
    audioButton.addEventListener('click', () => choose('audio/*'));

    fileInput.addEventListener('change', () => {
      selectedFile = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
      if (!selectedFile) return;
      if (selectedFile.size > MAX_FILE_SIZE) {
        notify('ARCHIVO SUPERIOR A 100 MB. ELIGE UNO MÁS PEQUEÑO.');
        selectedFile = null;
        fileInput.value = '';
        return;
      }
      preview.querySelector('b').textContent =
        `${selectedFile.name} · ${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`;
      preview.classList.add('visible');
    });

    preview.querySelector('button').addEventListener('click', () => {
      selectedFile = null;
      fileInput.value = '';
      preview.classList.remove('visible');
    });

    publish.addEventListener('click', async (event) => {
      event.preventDefault();
      const caption = input.value.trim();
      if (!selectedFile && !caption) {
        input.focus();
        notify('ESCRIBE ALGO O ADJUNTA UNA FOTO, VÍDEO O AUDIO');
        return;
      }
      try {
        if (selectedFile) {
          const record = {
            id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()),
            caption,
            file: selectedFile,
            fileName: selectedFile.name,
            fileType: selectedFile.type || 'application/octet-stream',
            createdAt: Date.now()
          };
          await savePost(record);
          renderPost(record, true);
          notify('PUBLICACIÓN GUARDADA EN ESTE DISPOSITIVO');
        } else {
          const post = make('article', 'post panel');
          post.dataset.search = caption.toLowerCase();
          const header = make('header', 'post-header');
          header.append(make('div', 'avatar avatar-red', 'DC'));
          const author = make('div', 'post-author');
          author.innerHTML = '<strong>darkcode_2050 <span class="verified">✓</span></strong><small>Ahora · Chile</small>';
          header.append(author);
          const copy = make('div', 'post-copy');
          const strong = make('strong', '', 'darkcode_2050');
          copy.append(strong, document.createTextNode(' ' + caption));
          post.append(header, copy);
          document.querySelector('.feed-heading').after(post);
          notify('PUBLICACIÓN TRANSMITIDA');
        }
        input.value = '';
        selectedFile = null;
        fileInput.value = '';
        preview.classList.remove('visible');
      } catch (error) {
        console.error(error);
        notify('NO SE PUDO GUARDAR. REVISA EL ESPACIO DEL NAVEGADOR.');
      }
    });
  }

  function renderPost(record, prepend = false) {
    const post = make('article', 'post panel local-post');
    post.dataset.search = `${record.caption || ''} ${record.fileName || ''}`.toLowerCase();

    const header = make('header', 'post-header');
    header.append(make('div', 'avatar avatar-red', 'DC'));
    const author = make('div', 'post-author');
    author.innerHTML = '<strong>darkcode_2050 <span class="verified">✓</span></strong><small>Publicación local · ' +
      new Date(record.createdAt).toLocaleString('es-CL') + '</small>';
    header.append(author);

    const mediaWrap = make('div', 'post-media-wrap');
    const type = record.fileType || '';
    const url = URL.createObjectURL(record.file);
    let media;
    if (type.startsWith('image/')) {
      media = make('img', 'local-media');
      media.alt = record.fileName || 'Imagen publicada';
      media.src = url;
    } else if (type.startsWith('video/')) {
      media = make('video', 'local-media');
      media.src = url;
      media.controls = true;
      media.playsInline = true;
      media.preload = 'metadata';
    } else if (type.startsWith('audio/')) {
      media = make('audio', 'local-audio');
      media.src = url;
      media.controls = true;
      media.preload = 'metadata';
    } else {
      media = make('a', '', 'Descargar archivo: ' + (record.fileName || 'archivo'));
      media.href = url;
      media.download = record.fileName || 'archivo';
    }
    const badge = make('div', 'media-type',
      type.startsWith('image/') ? 'IMAGE TRANSMISSION' :
      type.startsWith('video/') ? 'VIDEO TRANSMISSION' :
      type.startsWith('audio/') ? 'AUDIO TRANSMISSION' : 'FILE TRANSMISSION');
    mediaWrap.append(badge, media);

    post.append(header, mediaWrap);
    if (record.caption) {
      const caption = make('div', 'local-post-caption');
      caption.append(make('strong', '', 'darkcode_2050'), document.createTextNode(record.caption));
      post.append(caption);
    }
    const actions = make('div', 'post-actions');
    const like = make('button', 'like-btn');
    like.innerHTML = '<span>♥</span><b>0</b>';
    like.addEventListener('click', () => {
      const liked = like.classList.toggle('liked');
      like.querySelector('b').textContent = liked ? '1' : '0';
    });
    const share = make('button', '', '➤');
    share.addEventListener('click', async () => {
      try {
        if (navigator.share) await navigator.share({ title: 'UNDERCHAOS', text: record.caption || record.fileName });
        else notify('COMPARTIR ESTARÁ DISPONIBLE CON SUPABASE');
      } catch (_) {}
    });
    actions.append(like, share);
    post.append(actions);

    const feedHeading = document.querySelector('.feed-heading');
    const firstPost = feedHeading.nextElementSibling;
    if (prepend && firstPost) firstPost.before(post);
    else feedHeading.after(post);
  }

  async function restorePosts() {
    try {
      const posts = await getPosts();
      posts.sort((a, b) => b.createdAt - a.createdAt).forEach(post => renderPost(post, false));
    } catch (error) {
      console.error(error);
      notify('NO SE PUDO ABRIR EL ALMACENAMIENTO LOCAL');
    }
  }

  document.querySelectorAll('.like-btn').forEach(button => {
    button.addEventListener('click', () => {
      const liked = button.classList.toggle('liked');
      const count = button.querySelector('b');
      if (!count) return;
      const raw = count.textContent;
      if (!raw.includes('k')) count.textContent = liked ? String(Number(raw) + 1) : String(Math.max(0, Number(raw) - 1));
    });
  });
  document.querySelectorAll('.save-btn').forEach(button => button.addEventListener('click', () => {
    button.classList.toggle('saved');
    notify(button.classList.contains('saved') ? 'PUBLICACIÓN GUARDADA' : 'PUBLICACIÓN QUITADA DE GUARDADOS');
  }));
  document.querySelectorAll('.comment-btn,.comment-preview').forEach(el => el.addEventListener('click', () => notify('MÓDULO DE COMENTARIOS — PRÓXIMAMENTE')));
  document.querySelectorAll('.story').forEach(story => story.addEventListener('click', () => notify('HISTORIA ABIERTA · SKYNET SOCIAL')));

  document.getElementById('searchInput').addEventListener('input', e => {
    const term = e.target.value.toLowerCase().trim();
    document.querySelectorAll('.post').forEach(post => {
      post.style.display = (!term || (post.dataset.search || post.innerText.toLowerCase()).includes(term)) ? '' : 'none';
    });
  });

  document.getElementById('chatForm').addEventListener('submit', e => {
    e.preventDefault();
    const input = document.getElementById('chatMessage');
    if (!input.value.trim()) return;
    const person = make('div', 'chat-person');
    const avatar = make('div', 'avatar avatar-red', 'DC');
    const details = make('div');
    details.append(make('b', '', 'darkcode_2050'), make('small', '', input.value.trim()));
    person.append(avatar, details, make('time', '', 'ahora'));
    document.querySelector('.chat-input').before(person);
    input.value = '';
  });

  document.querySelectorAll('.product button').forEach(button => button.addEventListener('click', () => notify('DROP SELECCIONADO · CATÁLOGO DEMO')));
  document.querySelectorAll('.icon-btn,.menu-link,.outline-button,.filter-button').forEach(button => button.addEventListener('click', e => {
    if (button.getAttribute('href') === '#') { e.preventDefault(); notify('SECCIÓN SKYNET SOCIAL'); }
  }));
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      document.getElementById('searchInput').focus();
    }
  });

  addStyles();
  setupUploader();
  restorePosts();
})();
