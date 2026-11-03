const toast = document.getElementById('toast');
let toastTimer;
function notify(message){
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>toast.classList.remove('show'),2200);
}
document.querySelectorAll('.like-btn').forEach(button=>{
  button.addEventListener('click',()=>{
    const liked = button.classList.toggle('liked');
    const count = button.querySelector('b');
    const raw = count.textContent;
    count.textContent = liked ? (raw.includes('k') ? raw : String(Number(raw)+1)) : (raw.includes('k') ? raw : String(Math.max(0,Number(raw)-1)));
  });
});
document.querySelectorAll('.save-btn').forEach(button=>button.addEventListener('click',()=>{
  button.classList.toggle('saved'); notify(button.classList.contains('saved')?'PUBLICACIÓN GUARDADA':'PUBLICACIÓN QUITADA DE GUARDADOS');
}));
document.querySelectorAll('.comment-btn,.comment-preview').forEach(el=>el.addEventListener('click',()=>notify('MÓDULO DE COMENTARIOS — PRÓXIMAMENTE')));
document.querySelectorAll('.story').forEach(story=>story.addEventListener('click',()=>notify('HISTORIA ABIERTA · SKYNET SOCIAL')));
document.getElementById('publishBtn').addEventListener('click',()=>{
  const input=document.getElementById('postInput');
  const value=input.value.trim();
  if(!value){input.focus();notify('ESCRIBE ALGO ANTES DE PUBLICAR');return;}
  const post=document.createElement('article');
  post.className='post panel';
  post.dataset.search=value.toLowerCase();
  post.innerHTML=`<header class="post-header"><div class="avatar avatar-red">DC</div><div class="post-author"><strong>darkcode_2050 <span class="verified">✓</span></strong><small>Ahora · Chile</small></div><button class="more">•••</button></header><div class="post-copy"><strong>darkcode_2050</strong>${escapeHtml(value)}<br><span><a>#skynet</a> <a>#cyberreels</a></span></div><div class="post-actions"><button class="like-btn"><span>♥</span><b>0</b></button><button><span>◯</span><b>0</b></button><button><span>➤</span></button><button class="save-btn">♧</button></div>`;
  document.querySelector('.feed-heading').after(post);
  input.value=''; notify('PUBLICACIÓN TRANSMITIDA CORRECTAMENTE');
});
function escapeHtml(str){return str.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
document.getElementById('searchInput').addEventListener('input',e=>{
  const term=e.target.value.toLowerCase().trim();
  document.querySelectorAll('.post').forEach(post=>post.style.display=(!term||(post.dataset.search||post.innerText.toLowerCase()).includes(term))?'':'none');
});
document.getElementById('chatForm').addEventListener('submit',e=>{
  e.preventDefault(); const input=document.getElementById('chatMessage');
  if(!input.value.trim())return;
  const person=document.createElement('div');person.className='chat-person';
  person.innerHTML=`<div class="avatar avatar-red">DC</div><div><b>darkcode_2050</b><small>${escapeHtml(input.value.trim())}</small></div><time>ahora</time>`;
  document.querySelector('.chat-input').before(person);input.value='';
});
document.querySelectorAll('.product button').forEach(button=>button.addEventListener('click',()=>notify('DROP SELECCIONADO · CATÁLOGO DEMO')));
document.querySelectorAll('.icon-btn,.menu-link,.outline-button,.filter-button').forEach(button=>button.addEventListener('click',e=>{
  if(button.getAttribute('href')==='#') {e.preventDefault();notify('SECCIÓN SKYNET SOCIAL');}
}));
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();document.getElementById('searchInput').focus();}});
