document.fonts.ready.then(()=>{document.documentElement.classList.add("fonts-loaded")}),window.addEventListener("DOMContentLoaded",()=>{document.body.classList.add("loaded")});const FILES_BASE_URL=(()=>{const e=window.location.hostname;return["d2pfx.onrender.com","d2pfx.netlify.app","hrdq.codeberg.page","d2pfx.vercel.app","127.0.0.1"].some(n=>e===n||e.endsWith("."+n))?"":"https://raw.githubusercontent.com/h6rd/Dota2PornFxWeb/main"})(),GITHUB_TOOLS=[{repo:"h6rd/VPKTool",name:"VPKTool",icon:"bi-tools",hasLinux:!0},{repo:"h6rd/VPKMerge",name:"VPKMerge",icon:"bi-union",hasLinux:!0},{repo:"h6rd/Compiler",name:"Compiler",icon:"bi-cpu",hasLinux:!0},{repo:"h6rd/Patcher",name:"Patcher",icon:"bi-bandaid",hasLinux:!0},{repo:"h6rd/VPCF-Editor",name:"VPCF Editor",icon:"bi-palette",hasLinux:!0}],numberFormat=e=>new Intl.NumberFormat("en-US").format(e);function pct(e,t){return t?`${Math.round(e/t*100)}%`:"0%"}function escapeHtml(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function collectMods(e,t){Array.isArray(e)?e.forEach(n=>collectMods(n,t)):e&&typeof e=="object"&&(Array.isArray(e.groups)?e.groups.forEach(n=>collectMods(n,t)):Array.isArray(e.mods)?e.mods.forEach(n=>collectMods(n,t)):"name"in e&&"file"in e&&t.push(e))}function getLinks(e){return Array.isArray(e.links)?e.links:e.linkType&&e.linkUrl?[{type:e.linkType,url:e.linkUrl}]:[]}function getLinkNickname(e){return e.name||e.url||""}function buildStats(e,t){const n=t.translations||{},o=t.categories||[],c=t.MOD_AUTHOR||{},a=t.MOD_SENDER||{},r=[];let l=0,i=0,p=0,s=0,u=0;const d=new Map,h=new Map;o.forEach(m=>{const y=e[m.id];if(!y)return;const b=[];collectMods(y,b),r.push({id:m.id,emoji:m.emoji||"",label:n[m.key]||m.id,count:b.length}),b.forEach(w=>{l+=1;const $=getLinks(w),v=new Set($.map(g=>g.type));v.has("author")&&(i+=1,$.filter(g=>g.type==="author").forEach(g=>{const f=getLinkNickname(g);f&&d.set(f,(d.get(f)||0)+1)})),v.has("sender")&&(p+=1,$.filter(g=>g.type==="sender").forEach(g=>{const f=getLinkNickname(g);f&&h.set(f,(h.get(f)||0)+1)})),v.has("source")&&(s+=1),!v.has("author")&&!v.has("sender")&&!v.has("source")&&(u+=1)})});const E=(m,y)=>[...m.entries()].map(([b,w])=>({name:b,count:w,url:y[b]||""})).sort((b,w)=>w.count-b.count);return r.sort((m,y)=>y.count-m.count),{totalMods:l,withAuthor:i,withSender:p,withSource:s,withNothing:u,categoryCounts:r,categoriesCount:r.length,authors:E(d,c),senders:E(h,a)}}async function fetchRepoDownloads(e){let t=1,n=0,o=0,c=0,a=0,r=0;try{for(;t<=5;){const l=await fetch(`https://api.github.com/repos/${e}/releases?per_page=100&page=${t}`);if(!l.ok){if(t===1)throw new Error(`HTTP ${l.status}`);break}const i=await l.json();if(!Array.isArray(i)||i.length===0||(a+=i.length,i.forEach(p=>{(p.assets||[]).forEach(s=>{const u=s.download_count||0;n+=u,r+=1;const d=(s.name||"").toLowerCase();d.includes("-win")?o+=u:d.includes("-linux")?c+=u:o+=u})}),i.length<100))break;t+=1}return{ok:!0,totalDownloads:n,winDownloads:o,linuxDownloads:c,releaseCount:a,assetCount:r}}catch(l){return{ok:!1,error:l.message}}}function animateNumber(e,t,n=900){const c=performance.now();function a(r){const l=Math.min(1,(r-c)/n),i=1-Math.pow(1-l,3),p=Math.round(0+(t-0)*i);e.textContent=numberFormat(p),l<1?requestAnimationFrame(a):e.textContent=numberFormat(t)}requestAnimationFrame(a)}function observeAndAnimate(e,t){e.dataset.target=t;const n=new IntersectionObserver(o=>{o.forEach(c=>{c.isIntersecting&&(animateNumber(e,Number(e.dataset.target)),n.unobserve(e))})},{threshold:.2});n.observe(e)}function renderHero(e){document.getElementById("heroTotalLabel").textContent="Total mods on the site";const t=document.getElementById("heroTotalNumber");observeAndAnimate(t,e.totalMods),document.getElementById("heroCategoriesChip").innerHTML=`
    <span class="material-symbols-rounded">category</span>
    <span>
      <span class="stats-hero-chip-value">${e.categoriesCount}</span><br>
      <span class="stats-hero-chip-label">categories</span>
    </span>`,document.getElementById("heroAuthorsChip").innerHTML=`
    <span class="material-symbols-rounded">person</span>
    <span>
      <span class="stats-hero-chip-value">${e.authors.length}</span><br>
      <span class="stats-hero-chip-label">authors</span>
    </span>`,document.getElementById("heroSendersChip").innerHTML=`
    <span class="material-symbols-rounded">send</span>
    <span>
      <span class="stats-hero-chip-value">${e.senders.length}</span><br>
      <span class="stats-hero-chip-label">submitters</span>
    </span>`}function renderOverviewCards(e){const t=document.getElementById("overviewGrid"),n=[{icon:"person",value:e.withAuthor,label:"Mods with credited author"},{icon:"captive_portal",value:e.withSource,label:"Mods with original source link"},{icon:"send",value:e.withSender,label:"Mods with sender submitter"},{icon:"star",value:e.withNothing,label:"Self-made mods"}];t.innerHTML=n.map(o=>`
    <div class="stat-card">
      <div class="stat-card-top">
        <div class="stat-card-icon">
          <span class="material-symbols-rounded">${o.icon}</span>
        </div>
        <div class="stat-card-percent">${pct(o.value,e.totalMods)}</div>
      </div>
      <div class="stat-card-number" data-target="${o.value}">0</div>
      <div class="stat-card-label">${o.label}</div>
    </div>
  `).join(""),t.querySelectorAll(".stat-card-number").forEach(o=>{observeAndAnimate(o,Number(o.dataset.target))})}function renderCategoryBars(e){const t=document.getElementById("categoryBars"),n=e.categoryCounts[0]?.count||1,o=10;t.innerHTML=e.categoryCounts.map((a,r)=>`
    <div class="category-bar-row ${r>=o?"category-bar-hidden":""}" data-idx="${r}">
      <div class="category-bar-label">
        <span class="category-bar-emoji">${a.emoji}</span>
        <span>${escapeHtml(a.label)}</span>
      </div>
      <div class="category-bar-track">
        <div class="category-bar-fill" data-width="${a.count/n*100}"></div>
      </div>
      <div class="category-bar-count">${numberFormat(a.count)}</div>
    </div>
  `).join(""),requestAnimationFrame(()=>{t.querySelectorAll(".category-bar-fill").forEach(a=>{a.style.width=`${a.dataset.width}%`})});const c=document.getElementById("categoryBarsToggleWrap");if(e.categoryCounts.length>o){c.innerHTML=`
      <button class="category-bars-toggle" id="categoryBarsToggle">
        <span>Show all categories (${e.categoryCounts.length})</span>
        <span class="material-symbols-rounded">expand_more</span>
      </button>`;const a=document.getElementById("categoryBarsToggle");a.addEventListener("click",()=>{const r=a.classList.toggle("expanded");t.querySelectorAll(".category-bar-row").forEach(l=>{Number(l.dataset.idx)>=o&&l.classList.toggle("category-bar-hidden",!r)}),a.querySelector("span").textContent=r?"Hide":`Show all categories (${e.categoryCounts.length})`})}else c.innerHTML=""}function renderLeaderboard(e,t,n,o,c,a){const r=document.getElementById(e);if(document.getElementById(t).textContent=`${o.length}`,o.length===0){r.innerHTML=`<div class="leaderboard-empty">${c}</div>`,document.getElementById(n).innerHTML="";return}const l=8,i=o[0].count||1;r.innerHTML=o.map((s,u)=>{const d=u+1,h=d<=3?`rank-${d}`:"",E=u>=l;let m=d;return d===1?m=`<m3e-shape name="sunny">${d}</m3e-shape>`:d===2?m=`<m3e-shape name="4-sided-cookie">${d}</m3e-shape>`:d===3?m=`<m3e-shape name="pentagon">${d}</m3e-shape>`:m=`<m3e-shape name="square">${d}</m3e-shape>`,`
      <div class="leaderboard-item ${E?"leaderboard-item-hidden":""}" data-idx="${u}" data-url="${escapeHtml(s.url||"")}">
        <div class="leaderboard-rank ${h}">${m}</div>
        <div class="leaderboard-body">
          <div class="leaderboard-name">
            ${escapeHtml(s.name)}
            ${s.url?'<span class="material-symbols-rounded">open_in_new</span>':""}
          </div>
          <div class="leaderboard-bar-track">
            <div class="leaderboard-bar-fill" data-width="${s.count/i*100}"></div>
          </div>
        </div>
        <div class="leaderboard-count">${numberFormat(s.count)}</div>
      </div>`}).join(""),requestAnimationFrame(()=>{r.querySelectorAll(".leaderboard-bar-fill").forEach(s=>{s.style.width=`${s.dataset.width}%`})}),r.querySelectorAll(".leaderboard-item").forEach(s=>{const u=s.dataset.url;u&&(s.style.cursor="pointer",s.addEventListener("click",()=>window.open(u,"_blank","noopener")))});const p=document.getElementById(n);if(o.length>l){p.innerHTML=`
      <button class="leaderboard-toggle-btn" id="${e}Toggle">
        <span>Show all ${a} (${o.length})</span>
        <span class="material-symbols-rounded">expand_more</span>
      </button>`;const s=document.getElementById(`${e}Toggle`);s.addEventListener("click",()=>{const u=s.classList.toggle("expanded");r.querySelectorAll(".leaderboard-item").forEach(d=>{Number(d.dataset.idx)>=l&&d.classList.toggle("leaderboard-item-hidden",!u)}),s.querySelector("span").textContent=u?"Hide":`Show all ${a} (${o.length})`})}else p.innerHTML=""}async function renderToolDownloads(){const e=document.getElementById("toolsGrid");e.innerHTML=GITHUB_TOOLS.map(a=>`
    <a class="tool-card" href="https://github.com/${a.repo}" target="_blank" rel="noopener" id="tool-${a.name}">
      <div class="tool-card-head">
        <div class="tool-card-icon"><i class="bi ${a.icon}"></i></div>
        <span class="material-symbols-rounded tool-card-open">open_in_new</span>
      </div>
      <div class="tool-card-name">${a.name}</div>
      <div class="tool-card-number stat-skeleton">0</div>
      <div class="tool-card-sub stat-skeleton">Loading\u2026</div>
      <div class="tool-card-platforms">
        <div class="tool-platform-row">
          <span class="tool-platform-label"><i class="bi bi-windows"></i> Windows</span>
          <span class="tool-platform-val" id="tool-${a.name}-win">0</span>
        </div>
        ${a.hasLinux?`
        <div class="tool-platform-row">
          <span class="tool-platform-label"><i class="bi bi-tux"></i> Linux</span>
          <span class="tool-platform-val" id="tool-${a.name}-linux">0</span>
        </div>`:`
        <div class="tool-platform-row" style="opacity: 0; pointer-events: none;" aria-hidden="true">
          <span class="tool-platform-label"><i class="bi bi-tux"></i> Linux</span>
          <span class="tool-platform-val">0</span>
        </div>`}
      </div>
    </a>
  `).join("");const t=document.getElementById("toolsCombinedValue"),n=await Promise.all(GITHUB_TOOLS.map(a=>fetchRepoDownloads(a.repo)));let o=0,c=!1;n.forEach((a,r)=>{const l=GITHUB_TOOLS[r],i=document.getElementById(`tool-${l.name}`),p=i.querySelector(".tool-card-number"),s=i.querySelector(".tool-card-sub"),u=i.querySelector(".tool-card-platforms");if(p.classList.remove("stat-skeleton"),s.classList.remove("stat-skeleton"),a.ok){c=!0,o+=a.totalDownloads,p.textContent="0",observeAndAnimate(p,a.totalDownloads),s.textContent=`${numberFormat(a.releaseCount)} releases`,u.style.display="flex";const d=document.getElementById(`tool-${l.name}-win`);if(d&&observeAndAnimate(d,a.winDownloads),l.hasLinux){const h=document.getElementById(`tool-${l.name}-linux`);h&&observeAndAnimate(h,a.linuxDownloads)}}else p.textContent="\u2014",s.textContent="Unavailable (API Rate Limit)"}),c?observeAndAnimate(t,o):t.textContent="\u2014"}function initHeroShapeMorph(){const e=document.getElementById("heroBgShape");if(!e)return;const t=["4-sided-cookie","7-sided-cookie","pentagon","flower","square"];let n=0;setInterval(()=>{n=(n+1)%t.length,e.setAttribute("name",t[n])},4e3)}document.addEventListener("DOMContentLoaded",initHeroShapeMorph);async function loadStatsData(){const e=FILES_BASE_URL?`${FILES_BASE_URL}/assets/data`:"assets/data",t=new AbortController,n=setTimeout(()=>t.abort(),2e4);try{const[o,c]=await Promise.all([fetch(`${e}/mods.json`,{signal:t.signal}),fetch(`${e}/constants.json`,{signal:t.signal})]);if(clearTimeout(n),!o.ok)throw new Error(`HTTP ${o.status}`);if(!c.ok)throw new Error(`HTTP ${c.status}`);const a=await o.json(),r=await c.json(),l=a.modsData,i=buildStats(l,r);renderHero(i),renderOverviewCards(i),renderCategoryBars(i),renderLeaderboard("authorsLeaderboard","authorsCount","authorsToggleWrap",i.authors,"No author data available yet","authors"),renderLeaderboard("sendersLeaderboard","sendersCount","sendersToggleWrap",i.senders,"No submitter data available yet","submitters"),document.getElementById("statsContent").classList.remove("stats-hidden"),document.getElementById("statsLoading").remove(),renderToolDownloads()}catch(o){clearTimeout(n),console.error("Failed to load stats data:",o);const c=document.getElementById("statsLoading"),a=o.name==="AbortError";c.innerHTML=`
      <div class="stats-error">
        <span class="material-symbols-rounded">cloud_off</span>
        <div style="font-size:17px;font-weight:600;color:var(--md-sys-color-on-surface);margin-bottom:6px;">
          ${a?"Request timed out":"Failed to load data"}
        </div>
        <div>Please try refreshing the page later.</div>
      </div>`}}document.addEventListener("DOMContentLoaded",loadStatsData);
