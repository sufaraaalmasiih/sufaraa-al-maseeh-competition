// V9.4.8 Province Select + Editable History - cleaned flow
const TEAM_SESSION="sufaraaTeamSessionFirebaseV4";
const SYRIAN_GOVERNORATES=["دمشق", "ريف دمشق", "حلب", "حمص", "حماة", "اللاذقية", "طرطوس", "إدلب", "درعا", "السويداء", "القنيطرة", "دير الزور", "الحسكة", "الرقة"];
const stages=[
  {id:"intro1",title:"اجمعوا الكنوز",icon:"🥇",max:250,stage:"stage1"},
  {id:"intro2",title:"فتشوا الكتب",icon:"🥈",max:300,stage:"stage2"},
  {id:"intro3",title:"على المحك",icon:"🥉",max:380,stage:"stage3"},
  {id:"intro4",title:"اثبتوا بالحق",icon:"🏅",max:435,stage:"stage4"}
];
const stage2Types=["matching","complete","correct","truefalse"];
let session=JSON.parse(sessionStorage.getItem(TEAM_SESSION)||"{}");
let teamName=session.teamName||"";
let team=null, unsubTeam=null, unsubActive=null, unsubLocks=null, unsubTurn=null, activeStage3=null, stage3Locks={}, stage3Turn={team:null,index:0};
let timerInt=null;
let stage1Runtime={running:false,remaining:null,lastKey:null};
const $=id=>document.getElementById(id);
let isPaused=false, warningPlayed=false, lastCountdownAt=0;
let audioCtx=null;
let lastSeenScore=null;
function unlockAudio(){try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)(); if(audioCtx.state==='suspended')audioCtx.resume();}catch(e){}}
function tone(freq=660,duration=0.07,type='sine',gain=0.018){try{unlockAudio(); if(!audioCtx)return; const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.type=type; o.frequency.value=freq; g.gain.value=gain; o.connect(g); g.connect(audioCtx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+duration); o.stop(audioCtx.currentTime+duration);}catch(e){}}
function sound(kind){
  if(kind==='hover') tone(520,.045,'sine',.010);
  if(kind==='click') tone(650,.055,'triangle',.020);
  if(kind==='congrats'){tone(520,.10,'sine',.035); setTimeout(()=>tone(720,.12,'triangle',.032),90); setTimeout(()=>tone(940,.16,'sine',.03),210)}
}
function bindUiSounds(){document.addEventListener('pointerover',e=>{if(e.target.closest('button,.btn,.stage,.answer,.match-left,.match-right'))sound('hover')},{passive:true});document.addEventListener('click',e=>{if(e.target.closest('button,.btn,.stage,.answer,.match-left,.match-right'))sound('click')},{passive:true});}
function ensureOverlay(id,html){let el=$(id); if(!el){el=document.createElement('div'); el.id=id; document.body.appendChild(el);} el.innerHTML=html; return el;}
function showPauseOverlay(show){let el=$('pauseOverlay'); if(show){el=ensureOverlay('pauseOverlay','<div class="pause-box"><div class="icon-3d big">⏸️</div><h2>المسابقة متوقفة مؤقتًا</h2><p>يرجى انتظار الميسر لاستئناف اللعب.</p></div>'); el.className='pause-overlay active';}else if(el){el.className='pause-overlay';}}
function showCountdown(stageId,done){done();}
function showAchievement(stageId,next){
  // V9.6.61: لا نعرض رسالة المباركة القديمة كـ overlay نهائيًا.
  // نهاية المرحلة عند المتسابق يجب أن تكون شاشة انتظار واحدة فقط، وتختفي بأمر الميسر.
  const stage=Number(String(stageId||'').replace('stage',''))||0;
  try{
    const old=$('achievementOverlay');
    if(old){ old.className='achievement-overlay'; old.remove(); }
  }catch(e){}
  if(typeof renderWaiting==='function') return renderWaiting('finished',stage);
  try{
    let sec=$('moderatorWaitV960');
    if(!sec){
      const app=$('appScreen');
      if(app){
        sec=document.createElement('section');
        sec.className='page card moderator-wait-v960';
        sec.id='moderatorWaitV960';
        app.appendChild(sec);
      }
    }
    if(sec){
      sec.innerHTML='<div class="wait-card-v960 stable"><div class="wait-icon-v960">🏆</div><h2>أحسنتم! انتهت المرحلة</h2><p>تبقى هذه الشاشة ظاهرة إلى أن ينقلكم الميسر إلى المرحلة التالية.</p></div>';
      if(typeof page==='function') page('moderatorWaitV960',false);
      else activatePage('moderatorWaitV960',false);
    }
  }catch(e){console.warn(e);}
}
function launchConfetti(){const wrap=document.createElement('div');wrap.className='confetti-wrap';document.body.appendChild(wrap);for(let i=0;i<55;i++){const c=document.createElement('span');c.style.left=Math.random()*100+'%';c.style.animationDelay=(Math.random()*1.3)+'s';c.style.setProperty('--x',(Math.random()*120-60)+'px');wrap.appendChild(c);}setTimeout(()=>wrap.remove(),4200)}

const teamId=n=>encodeURIComponent((n||"").trim());
const safeDecode=x=>{try{return decodeURIComponent(String(x||""))}catch(e){return String(x||"")}};
const sameTeam=(a,b)=>{
  const A=String(a||""), B=String(b||"");
  if(!A||!B)return false;
  return A===B || safeDecode(A)===B || A===teamId(B) || safeDecode(A)===safeDecode(B);
};
const myTeamDocId=()=>teamId(teamName);
const teamRef=()=>db.collection("teams").doc(myTeamDocId());

function teamIdentityKeys(){
  const keys=new Set();
  [teamName,myTeamDocId(),team?.name,teamId(team?.name||''),safeDecode(myTeamDocId())].forEach(v=>{if(v)keys.add(String(v));});
  return [...keys];
}
function isMyTeamDeleted(controlData){
  const deleted=Array.isArray(controlData?.deletedTeams)?controlData.deletedTeams.map(String):[];
  if(!deleted.length)return false;
  const keys=teamIdentityKeys();
  return keys.some(k=>deleted.includes(String(k)));
}
function forceBackToLogin(message='تم حذف بيانات هذا الفريق من لوحة الميسر.'){
  try{clearInterval(timerInt);}catch(e){}
  try{clearInterval(stage2TimerInt);}catch(e){}
  try{ if(unsubTeam){unsubTeam();unsubTeam=null;} }catch(e){}
  try{sessionStorage.removeItem(TEAM_SESSION);}catch(e){}
  try{localStorage.removeItem('sufaraa_last_game_status_v962');}catch(e){}
  team=null; teamName=''; session={}; lastSeenScore=null;
  try{
    document.body.classList.remove('app-active-v95106b','flow-waiting-active-v966');
    document.body.classList.add('login-active-v95106b');
  }catch(e){}
  const app=$('appScreen'), login=$('loginScreen');
  if(app){ app.classList.add('hidden'); app.style.display='none'; }
  if(login){ login.classList.remove('hidden'); login.style.display=''; }
  const wait=document.getElementById('moderatorWaitV960');
  if(wait){ wait.classList.remove('active'); wait.innerHTML=''; }
  const tn=$('teamNameInput'); if(tn)tn.value=''; const gv=$('governorateInput'); if(gv)gv.value='';
  ['p1','p2','p3','p4','p5'].forEach(id=>{const el=$(id); if(el) el.value='';});
  const old=document.getElementById('deletedTeamNotice'); if(old)old.remove();
  const notice=document.createElement('div');
  notice.id='deletedTeamNotice';
  notice.className='mini-card deleted-team-notice';
  notice.textContent=message;
  if(login)login.prepend(notice);
}

// V9.5.33: deterministic order. Do not randomize per team, so all contestants see the same order.
const shuffle=a=>[...a];
// V9.3.1: Stable shuffle for Stage 1 so answer buttons do not jump/reorder during timer/team updates.
function hashSeed(str){let h=2166136261;for(let i=0;i<String(str).length;i++){h^=String(str).charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function seededShuffle(arr,seedText){const out=[...arr];let seed=hashSeed(seedText);for(let i=out.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[out[i],out[j]]=[out[j],out[i]];}return out;}
const norm=x=>(x||"").trim().replace(/[ًٌٍَُِّْـ]/g,"").replace(/أ|إ|آ/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/\s+/g," ");
function initTeamData(t){
  const base={name:teamName,governorate:"",score:0,stageScores:{stage1:0,stage2:0,stage3:0,stage4:0},current:"intro1",done:[],finished:false,progress:{stage1:{i:0,startedAt:0,remaining:420,ended:false},stage2:{answered:{},roles:{},matching:{}},stage3:{answered:{}},stage4:{i:0,streak:0,ended:false}},answerLog:[],players:[]};
  const out=Object.assign({},base,t||{});
  out.stageScores=Object.assign({},base.stageScores,(t||{}).stageScores||{});
  const pr=(t||{}).progress||{};
  out.progress={stage1:Object.assign({},base.progress.stage1,pr.stage1||{}),stage2:Object.assign({},base.progress.stage2,pr.stage2||{}),stage3:Object.assign({},base.progress.stage3,pr.stage3||{}),stage4:Object.assign({},base.progress.stage4,pr.stage4||{})};
  out.progress.stage2.answered=Object.assign({},base.progress.stage2.answered,(pr.stage2||{}).answered||{});
  out.progress.stage2.roles=Object.assign({},base.progress.stage2.roles,(pr.stage2||{}).roles||{});
  out.progress.stage3.answered=Object.assign({},base.progress.stage3.answered,(pr.stage3||{}).answered||{});
  return out;
}
function showApp(){ const login=$("loginScreen"), app=$("appScreen"); if(login){ login.classList.add("hidden"); login.style.display="none"; } if(app){ app.classList.remove("hidden"); app.style.display=""; } try{document.body.classList.add('app-active-v95106b');document.body.classList.remove('login-active-v95106b');}catch(e){} const old=document.getElementById("editTeamInfoBtn"); if(old)old.remove(); }
function ensurePlayerEditButton(){/* V9.4.4: تم إلغاء تعديل الاسم من طرف المتسابق فقط. التعديل متاح من لوحة الميسر. */}
async function editTeamInfo(){alert('تعديل الأسماء متاح من لوحة الميسر فقط.');}
function showScorePop(delta){if(!delta)return;const el=document.createElement('div');el.className='score-pop '+(delta>0?'plus':delta<0?'minus':'zero');el.textContent=(delta>0?'+':'')+delta+' نقطة';document.body.appendChild(el);setTimeout(()=>el.classList.add('show'),20);setTimeout(()=>el.remove(),1800);}
function makeLog(stage,question,selected,correct,ok,points,meta="",playerName="الفريق"){return {stage,question,selected,correct,ok,points,meta,playerName,time:new Date().toLocaleString('ar')}}
async function patchTeam(data){await teamRef().set(data,{merge:true})}
async function patchStage1Progress(fields){
  const payload={};
  Object.keys(fields||{}).forEach(k=>payload[`progress.stage1.${k}`]=fields[k]);
  if(Object.keys(payload).length) await teamRef().set(payload,{merge:true});
}
async function changeScore(delta,stage,log,extra={}){
  const d = Number(delta || 0);
  if(team){
    team.score = Math.max(0, Number(team.score || 0) + d);
    team.stageScores = team.stageScores || {stage1:0,stage2:0,stage3:0,stage4:0};
    team.stageScores[stage] = Math.max(0, Number(team.stageScores[stage] || 0) + d);
    if(extra && typeof extra === 'object') Object.assign(team, extra);
    const scoreEl = $('score');
    if(scoreEl) scoreEl.innerText = team.score || 0;
  }
  await db.runTransaction(async tx=>{
    const ref=teamRef(), snap=await tx.get(ref);
    let t=initTeamData(snap.data());
    t.score=Math.max(0,(t.score||0)+d);
    t.stageScores=t.stageScores||{};
    t.stageScores[stage]=Math.max(0,(t.stageScores[stage]||0)+d);
    t.answerLog=t.answerLog||[];
    if(log)t.answerLog.push(log);
    Object.assign(t,extra);
    tx.set(ref,t,{merge:true});
  });
}
function renderNav(){if(!$('stageNav')||!team)return;$("stageNav").innerHTML=stages.map(s=>{let cls="stage ";if((team.done||[]).includes(s.stage))cls+="done";else if(team.current===s.id||team.current===s.stage)cls+="active";else cls+="locked";return `<button class="${cls}" data-id="${s.id}"><span class="icon-3d">${s.icon}</span> ${s.title}</button>`}).join("");document.querySelectorAll("#stageNav button").forEach(b=>b.onclick=()=>{if(b.classList.contains("locked")||b.classList.contains("done"))return;page(b.dataset.id,false)});$("homeCards").innerHTML=stages.map(s=>{let open=team.current===s.id||team.current===s.stage, done=(team.done||[]).includes(s.stage);return `<div class="mini-card"><h3><span class="icon-3d">${s.icon}</span> ${s.title}</h3><p>الحد الأقصى: ${s.max} نقطة</p><span class="badge ${done?'green':''}">${done?'منتهية':open?'مفتوحة':'مقفلة'}</span></div>`}).join("")}
function renderPlayerHeaderV964(){
  const top=document.querySelector('.topbar'); if(!top||!team)return;
  let box=document.getElementById('playerHeaderV964');
  if(!box){box=document.createElement('div');box.id='playerHeaderV964';box.className='player-header-v964';top.appendChild(box);}
  const cur=String(team.current||'intro1');
  const ss=team.stageScores||{};
  const stageButtons=stages.map(st=>{
    const done=(team.done||[]).includes(st.stage);
    const active=cur===st.id||cur===st.stage;
    return `<span class="ph-stage-v964 ${active?'active':''} ${done?'done':''}"><b>${st.icon}</b>${st.title}</span>`;
  }).join('');
  box.innerHTML=`<div class="ph-team-v964"><span>الفريق</span><b>${String(team.name||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}</b></div><div class="ph-score-v964"><span>النقاط</span><strong>${Number(team.score||0)}</strong></div><div class="ph-stages-v964">${stageButtons}</div>`;
}

function renderFinal(){if($("finalText")&&team)$("finalText").innerText=`مبارك لفريق ${team.name}! لقد أنهيتم المسابقة وجمعتم ${team.score||0} نقطة. شكرًا لمشاركتكم الرائعة.`}
function resetContestantViewport(id){
  try{
    const app=document.getElementById('appScreen');
    const container=document.querySelector('#appScreen .container');
    window.scrollTo({top:0,left:0,behavior:'instant'});
    document.documentElement.scrollTop=0;
    document.body.scrollTop=0;
    if(app) app.scrollTop=0;
    if(container) container.scrollTop=0;
  }catch(e){
    try{ window.scrollTo(0,0); }catch(_e){}
  }
}
function activatePage(id, animated = true) {
  const next = $(id);
  if (!next) return;
  const current = document.querySelector(".page.active");
  const samePage = current === next;
  if (animated && current && current !== next) {
    current.classList.add("v93-exit");
    setTimeout(() => {
      current.classList.remove("active", "v93-exit");
      next.classList.add("active");
      resetContestantViewport(id);
      renderCurrentPage(id);
    }, 120);
  } else {
    if(!samePage){
      document.querySelectorAll(".page").forEach(p => p.classList.remove("active", "v93-exit"));
      next.classList.add("active");
      resetContestantViewport(id);
    }else{
      next.classList.add("active");
    }
    renderCurrentPage(id);
  }
}
function renderCurrentPage(id) {
  if (id === "stage1") render1();
  if (id === "stage2") render2();
  if (id === "stage3") render3();
  if (id === "stage4") render4();
  if (id === "final") renderFinal();
}
function updateUI(){
  if(!team)return;
  $("teamTitle").innerText=`فريق: ${team.name}`;
  $("score").innerText=team.score||0;
  renderNav();
  renderPlayerHeaderV964();
  const cur=team.current||"intro1";
  if(cur&&$(cur))activatePage(cur,false);
}
function saveSession(){sessionStorage.setItem(TEAM_SESSION,JSON.stringify(session));}
function listenTeam(){
  if(unsubTeam)unsubTeam();
  unsubTeam=teamRef().onSnapshot(doc=>{
    if(!doc.exists){
      forceBackToLogin('تم حذف هذا الفريق أو تغيير بياناته من لوحة الميسر. يرجى مراجعة الميسر قبل التسجيل من جديد.');
      return;
    }
    const incoming=initTeamData(doc.data());
    if(lastSeenScore!==null && Number(incoming.score||0)!==Number(lastSeenScore||0)){showScorePop(Number(incoming.score||0)-Number(lastSeenScore||0));}
    lastSeenScore=Number(incoming.score||0);
    team=incoming;
    showApp();
    updateUI();
  },err=>{alert("تعذر الاتصال بقاعدة البيانات. تأكد من Firestore Rules.");console.error(err);});

  db.collection("meta").doc("control").onSnapshot(doc=>{
    const d=doc.data()||{}; const r=Number(d.resetAt||0); isPaused=!!d.paused; showPauseOverlay(isPaused); if(isMyTeamDeleted(d)){forceBackToLogin('تم حذف هذا الفريق وكل بياناته من لوحة الميسر.');return;}
    if(session.resetAt===undefined || session.resetAt===null){
      session.resetAt=r;
      saveSession();
      return;
    }
    if(r && r>Number(session.resetAt||0)){
      session.resetAt=r;
      saveSession();
      sessionStorage.removeItem(TEAM_SESSION);
      clearInterval(timerInt);
      location.reload();
    }
  },err=>console.error(err));
  listenActiveStage3();
}
/* refactor: removed obsolete earlier definition of listenActiveStage3 from original line 167; final definition is kept later. */
function page(id,setCurrent=true){
  if(!$(id))return;
  activatePage(id,true);
  if(setCurrent)patchTeam({current:id});
}
async function finishStage(done,next){
  clearInterval(timerInt);
  try{clearInterval(stage2TimerInt)}catch(e){}
  const n=Number(String(done||'').replace('stage',''))||0;
  const doneArr=Array.from(new Set([...(team?.done||[]),done].filter(Boolean)));
  const nextProgress=Object.assign({},team?.progress||{});
  if(done) nextProgress[done]=Object.assign({},nextProgress[done]||{}, {ended:true});
  await patchTeam({done:doneArr,progress:nextProgress,current:'moderatorWaitV960'});
  if(team){team.done=doneArr;team.progress=nextProgress;team.current='moderatorWaitV960';}
  // V9.6.61: لا تستدعي overlay المباركة القديم؛ اعرض انتظار الميسر فقط.
  if(typeof renderWaiting==='function') renderWaiting('finished',n);
  else showAchievement(done,next);
}
async function finishAll(){let doneArr=Array.from(new Set([...(team.done||[]),"stage4"]));await patchTeam({done:doneArr,finished:true,current:"final"});setTimeout(()=>{renderFinal(); launchConfetti();},300)}
/* refactor: removed obsolete earlier definition of markOnly from original line 191; final definition is kept later. */
function playerNames(){return (team.players||[]).map(p=>p.name).filter(Boolean)}
/* refactor: removed obsolete earlier definition of login from original line 193; final definition is kept later. */
async function startStage(id){
  const intro={stage1:"intro1",stage2:"intro2",stage3:"intro3",stage4:"intro4"}[id];
  let doneArr=Array.from(new Set([...(team.done||[]),intro]));
  let extra={done:doneArr,current:id};
  if(id==='stage1'&&!team.progress?.stage1?.startedAt){
    const startedAt=Date.now();
    extra.progress=Object.assign({},team.progress,{stage1:{i:0,startedAt,remaining:420,ended:false,order:buildStage1Plan(startedAt)}});
  }
  if(id==='stage4'&&!team.progress?.stage4)extra.progress=Object.assign({},team.progress,{stage4:{i:0,streak:0,ended:false}});
  await patchTeam(extra);if(id==='stage3')ensureStage3Turn().catch(console.error);page(id,false);
}
// Stage 1
let stage1Busy=false;
let stage1PendingAdvance=false;
let stage1LocalI=null;
let stage1LocalKey=null;
let stage1TimerSaveBusy=false;
let stage1LastSavedRemaining=null;

function render1(){
  const p=team.progress?.stage1||{i:0,startedAt:Date.now(),remaining:420,ended:false};
  if(p.ended){clearInterval(timerInt);stage1Runtime.running=false;return finishStage('stage1','intro2');}
  const key=String(p.startedAt||'stage1');

  // V9.3.2: one timer only. Timer sync writes only remaining/ended,
  // so Firebase cannot roll the question index back and freeze Stage 1.
  if(!stage1Runtime.running || stage1Runtime.lastKey!==key){
    clearInterval(timerInt);
    stage1Runtime={running:true,remaining:Number.isFinite(Number(p.remaining))?Number(p.remaining):300,lastKey:key};
    stage1LastSavedRemaining=stage1Runtime.remaining;
    stage1LocalI=Number(p.i||0);
    stage1LocalKey=key;
    timerTick(stage1Runtime.remaining);
    timerInt=setInterval(()=>{
      if(isPaused)return;
      stage1Runtime.remaining=Math.max(0,(stage1Runtime.remaining??420)-1);
      timerTick(stage1Runtime.remaining);

      const shouldSave=(stage1Runtime.remaining%10===0 || stage1Runtime.remaining<=15) && stage1LastSavedRemaining!==stage1Runtime.remaining;
      if(shouldSave && !stage1TimerSaveBusy){
        stage1TimerSaveBusy=true;
        stage1LastSavedRemaining=stage1Runtime.remaining;
        patchStage1Progress({remaining:stage1Runtime.remaining}).catch(console.error).finally(()=>{stage1TimerSaveBusy=false;});
      }

      if(stage1Runtime.remaining<=0){
        clearInterval(timerInt);
        stage1Runtime.running=false;
        patchStage1Progress({remaining:0,ended:true}).then(()=>finishStage('stage1','intro2'));
      }
    },1000);
  }else{
    timerTick((stage1Runtime.remaining??Number(p.remaining)??420));
  }

  showQ1();
}

function timerTick(sec){const el=$("timer1"); if(!el)return; el.innerText=String(Math.floor(sec/60)).padStart(2,"0")+":"+String(sec%60).padStart(2,"0"); el.classList.toggle('timer-danger',sec<=30); if(sec<=30 && sec>0 && sec%5===0 && !warningPlayed){warningPlayed=true; setTimeout(()=>warningPlayed=false,1200)}}

const STAGE1_TYPES=['ماذا ينقص','اختر من متعدد','رتّب','فراغات'];

function buildStage1Plan(seed){
  // V9.5.33: fixed question order for every contestant.
  // The order follows the Excel/Firestore DATA.stage1 order exactly.
  const total=Math.min(50,DATA.stage1.length);
  return [...Array(total).keys()].map(idx=>({idx,type:stage1QuestionType(DATA.stage1[idx],idx)}));
}
function getStage1Plan(p){
  const total=Math.min(50,DATA.stage1.length);
  let order=Array.isArray(p?.order)?p.order:null;
  if(!order || order.length<total){
    order=buildStage1Plan(p?.startedAt||Date.now());
    patchStage1Progress({order}).catch(console.error);
  }
  return order.slice(0,total);
}
/* refactor: removed obsolete earlier definition of stage1QuestionType from original line 271; final definition is kept later. */
function stage4QuestionType(q){
  const text=String(q?.q||'');
  if(text.includes('الرابط العجيب'))return 'الرابط العجيب';
  if(text.includes('من أنا'))return 'من أنا';
  if(text.includes('صورة')||text.includes('انظر')||text.includes('الصورة'))return 'صور';
  return 'صور';
}
function stage1ArrangePrompt(answer,seed){
  const raw=String(answer||'').trim();
  const parts=raw.includes(' ')?raw.split(/\s+/):raw.split('');
  const mixed=seededShuffle(parts,`arrange|${seed}|${raw}`);
  return mixed.map(x=>`<span class="stage1-chip">${x}</span>`).join('');
}
/* refactor: removed obsolete earlier definition of renderStage1Input from original line 328; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderStage1Question from original line 286; final definition is kept later. */
/* refactor: removed obsolete earlier definition of bindStage1Answers from original line 293; final definition is kept later. */
/* refactor: removed obsolete earlier definition of showQ1 from original line 307; final definition is kept later. */

/* refactor: removed obsolete earlier definition of answerStage1 from original line 336; final definition is kept later. */

// Stage 2
function roleTitle(type){return (DATA.stage2.groups.find(g=>g.type===type)||{}).title||type}
function stage2GroupDone(g,p){return g.questions.every((_,i)=>(p.answered||{})[`${g.type}_${i}`]);}
function firstIncompleteStage2Type(p){const g=DATA.stage2.groups.find(g=>!stage2GroupDone(g,p));return g?g.type:null;}
/* refactor: removed obsolete earlier definition of render2 from original line 419; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderStage2Roles from original line 428; final definition is kept later. */
/* refactor: removed obsolete earlier definition of assignStage2Role from original line 437; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderStage2Sequential from original line 449; final definition is kept later. */
/* refactor: removed obsolete earlier definition of startStage2Turn from original line 466; final definition is kept later. */
function renderStage2Item(g,q,key,p){
  const done=p.answered?.[key];
  if(q.type==='choice')return `<div class="stage2-item ${done?'done':''}"><b>${q.q}</b><div class="answers">${shuffle(q.options).map(o=>`<button class="answer s2-choice" data-key="${key}" data-answer="${o}" data-correct="${q.answer}" data-points="15" data-title="${g.title}" ${done?'disabled':''}>${o}</button>`).join('')}</div></div>`;
  return `<div class="stage2-item ${done?'done':''}"><b>${q.q}</b><input data-key="${key}" placeholder="اكتب الإجابة" ${done?'disabled':''}><button class="btn s2-check" data-key="${key}" data-correct="${q.answer}" data-points="15" data-title="${g.title}" ${done?'disabled':''}>تسجيل الإجابة</button></div>`;
}
function renderMatchingGroup(g,p){
  const left=g.questions.map((q,i)=>({i,text:q.q,answer:q.answer,done:(p.answered||{})[`matching_${i}`]})); const right=shuffle(g.questions.map(q=>q.answer));
  return `<div class="matching-help">اختر عبارة من العمود الأول ثم اختر الإجابة المطابقة من العمود الثاني.</div><div class="matching-wrap"><div class="match-col"><h4>العمود الأول</h4>${left.map(x=>`<button class="match-left ${x.done?'matched':''}" data-i="${x.i}" data-q="${x.text}" data-answer="${x.answer}" ${x.done?'disabled':''}>${x.text}</button>`).join('')}</div><div class="match-col"><h4>العمود الثاني</h4>${right.map(r=>`<button class="match-right" data-a="${r}">${r}</button>`).join('')}</div></div>`;
}
let selectedMatch=null;
function selectMatchLeft(b){if(b.disabled)return;document.querySelectorAll('.match-left').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');selectedMatch=b}
/* refactor: removed obsolete earlier definition of answerMatch from original line 478; final definition is kept later. */
/* refactor: removed obsolete earlier definition of answer2 from original line 479; final definition is kept later. */
async function markStage2Answered(key,pts,log){const p=team.progress?.stage2||{answered:{},roles:{},matching:{}};const answered=Object.assign({},p.answered,{[key]:true});await changeScore(pts,'stage2',log,{progress:Object.assign({},team.progress,{stage2:Object.assign({},p,{answered})})});}
// Stage 3
function setStage3ActiveState(active){
  const pageEl=$('stage3');
  if(pageEl) pageEl.classList.toggle('stage3-has-active', !!active);
}
function focusStage3Question(){
  const box=$('stage3Box');
  if(!box || box.classList.contains('hidden')) return;
  setTimeout(()=>{try{box.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){box.scrollIntoView();}},80);
}
const stage3Points={"سهل":5,"متوسط":10,"صعب":15};
function teamDisplayName(id){
  if(sameTeam(id,teamName))return team?.name||teamName;
  return safeDecode(id)||'-';
}
async function getStage3TeamOrder(){
  const snap=await db.collection('teams').get();
  const list=[];
  snap.forEach(d=>{
    const data=d.data()||{};
    if(!data.finished)list.push({id:d.id,name:data.name||safeDecode(d.id),score:data.score||0});
  });
  return list.sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar')||String(a.id).localeCompare(String(b.id)));
}
async function ensureStage3Turn(){
  if(activeStage3?.id)return;
  const order=await getStage3TeamOrder();
  if(!order.length)return;
  const current=stage3Turn?.team;
  const valid=current && order.some(t=>sameTeam(t.id,current));
  if(valid)return;
  await db.collection('meta').doc('stage3Turn').set({team:order[0].id,teamName:order[0].name,index:0,updatedAt:FieldValue.serverTimestamp()},{merge:true});
}
async function advanceStage3Turn(ownerId=null){
  const order=await getStage3TeamOrder();
  if(!order.length)return;
  const cur=ownerId||stage3Turn?.team||myTeamDocId();
  let idx=order.findIndex(t=>sameTeam(t.id,cur));
  if(idx<0)idx=0;
  const next=order[(idx+1)%order.length];
  await db.collection('meta').doc('stage3Turn').set({team:next.id,teamName:next.name,index:(idx+1)%order.length,updatedAt:FieldValue.serverTimestamp()},{merge:true});
}
function render3(){
  ensureStage3Turn().catch(console.error);
  renderActive3();
  renderBoard3();
  setStage3ActiveState(!!(activeStage3 && activeStage3.id && !stage3Locks[activeStage3.id]?.answered));
}
/* refactor: removed obsolete earlier definition of renderActive3 from original line 439; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderBoard3 from original line 558; final definition is kept later. */
/* refactor: removed obsolete earlier definition of choose3 from original line 469; final definition is kept later. */
/* refactor: removed obsolete earlier definition of answer3 from original line 492; final definition is kept later. */
/* refactor: removed obsolete earlier definition of skip3 from original line 522; final definition is kept later. */
// Stage 4
/* refactor: removed obsolete earlier definition of render4 from original line 542; final definition is kept later. */
document.addEventListener("click",unlockAudio,{once:true});
document.addEventListener("DOMContentLoaded",()=>{
  bindUiSounds();
  const lb=$("loginBtn");
  if(lb)lb.onclick=login;
  const login=$("loginScreen"), app=$("appScreen");
  function showLoginFallback(){
    if(team) return;
    try{document.body.classList.remove('app-active-v95106b','flow-waiting-active-v966');document.body.classList.add('login-active-v95106b');}catch(e){}
    if(app){app.classList.add('hidden');app.style.display='none';}
    if(login){login.classList.remove('hidden');login.style.display='';}
  }
  if(teamName){
    if(login){login.classList.remove("hidden");login.style.display='';}
    listenTeam();
    setTimeout(showLoginFallback, 1800);
    setTimeout(showLoginFallback, 4500);
  }else{
    showLoginFallback();
  }
});
window.login=login;


/* ===== V9.4.9 Final Timing + Stage 2 Timer Overrides ===== */
const STAGE2_TURN_SECONDS_V949 = 150;
let stage2TimerInt = null;

function markOnly(btn, ok){
  if(btn) btn.classList.add('answer-locked');
  btn?.closest('.answers')?.querySelectorAll('button,input').forEach(el=>el.disabled=true);
}

function stage2SecondsLeft(type, p){
  const startedAt = Number((p.stage2TurnStartedAt||{})[type] || 0);
  if(!startedAt) return STAGE2_TURN_SECONDS_V949;
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  return Math.max(0, STAGE2_TURN_SECONDS_V949 - elapsed);
}

function stage2TimerText(sec){
  return String(Math.floor(sec/60)).padStart(2,'0') + ':' + String(sec%60).padStart(2,'0');
}

function renderStage2Timer(type, p){
  const el = document.getElementById('stage2TurnTimer');
  if(!el) return;
  const left = stage2SecondsLeft(type, p);
  el.textContent = stage2TimerText(left);
  el.classList.toggle('timer-danger', left <= 30);
}

function startStage2Timer(type){
  clearInterval(stage2TimerInt);
  stage2TimerInt = setInterval(()=>{
    if(team?.current !== 'stage2'){ clearInterval(stage2TimerInt); return; }
    const p = team.progress?.stage2 || {answered:{},roles:{},matching:{}};
    renderStage2Timer(type, p);
    if(stage2SecondsLeft(type, p) <= 0){
      clearInterval(stage2TimerInt);
      finishStage2TurnByTime(type).catch(console.error);
    }
  }, 1000);
}

async function finishStage2TurnByTime(type){
  const p = team.progress?.stage2 || {answered:{},roles:{},matching:{},startedTurns:{}};
  const g = DATA.stage2.groups.find(x=>x.type===type);
  if(!g || stage2GroupDone(g,p)) return;
  const answered = Object.assign({}, p.answered||{});
  const logs = [];
  g.questions.forEach((q,i)=>{
    const key = `${g.type}_${i}`;
    if(!answered[key]){
      answered[key] = true;
      logs.push(makeLog('فتشوا الكتب', q.q || q[0] || key, 'انتهى الوقت', q.answer || '', false, 0, g.title, p.roles?.[type] || ''));
    }
  });
  const nextProgress = Object.assign({}, team.progress, {stage2:Object.assign({}, p, {answered})});
  await db.runTransaction(async tx=>{
    const ref = teamRef();
    const snap = await tx.get(ref);
    let t = initTeamData(snap.data());
    t.progress = nextProgress;
    t.answerLog = t.answerLog || [];
    logs.forEach(l=>t.answerLog.push(l));
    tx.set(ref,t,{merge:true});
  });
}

const renderStage2SequentialBase_v949 = renderStage2Sequential;
function renderStage2Sequential(p){
  const currentType=firstIncompleteStage2Type(p);
  clearInterval(stage2TimerInt);
  if(!currentType){
    $('stage2List').innerHTML='<div class="handoff-card done"><h3>✅ انتهت كل أسئلة المرحلة الثانية</h3><p>انتظروا الميسر للانتقال إلى المرحلة التالية.</p></div>';
    if(!(team.done||[]).includes('stage2')){ finishStage('stage2','intro3').catch(console.error); }
    return;
  }
  const currentIndex=stage2Types.indexOf(currentType);
  const g=DATA.stage2.groups.find(x=>x.type===currentType);
  const player=p.roles[currentType];
  const started=(p.startedTurns||{})[currentType];
  if(!started){
    const title=currentIndex===0?`دور ${player}`:`أعطِ الجهاز إلى ${player}`;
    const msg=currentIndex===0?`سيبدأ ${player} الآن نوع <b>${g.title}</b>. المدة: دقيقتان ونصف.`:`انتهى دور اللاعب السابق. يرجى تمرير الجهاز الآن إلى <b>${player}</b> ليلعب نوع <b>${g.title}</b>. المدة: دقيقتان ونصف.`;
    $('stage2List').innerHTML=`<div class="handoff-card handoff-focus"><div class="handoff-icon">🤝</div><h3>${title}</h3><p>${msg}</p><button class="btn handoff-start" onclick="startStage2Turn('${currentType}')">بدأ ${player}</button></div>`;
    return;
  }
  const left = stage2SecondsLeft(currentType, p);
  $('stage2List').innerHTML=`<div class="handoff-card mini-handoff stage2-timer-card"><h3>دور ${player}</h3><p>النوع الحالي: <b>${g.title}</b></p><span class="timer" id="stage2TurnTimer">${stage2TimerText(left)}</span></div><div class="stage2-group active-type"><h3>${g.title} <span class="badge green">${player}</span></h3>${g.type==='matching'?renderMatchingGroup(g,p):g.questions.map((q,qi)=>renderStage2Item(g,q,`${g.type}_${qi}`,p)).join('')}</div>`;
  document.querySelectorAll('.s2-choice').forEach(b=>b.onclick=()=>answer2(b.dataset.key,b.dataset.answer,b.dataset.correct,b,Number(b.dataset.points),b.dataset.title));
  document.querySelectorAll('.s2-check').forEach(b=>b.onclick=()=>{const inp=document.querySelector(`input[data-key="${b.dataset.key}"]`);answer2(b.dataset.key,inp.value,b.dataset.correct,b,Number(b.dataset.points),b.dataset.title)});
  document.querySelectorAll('.match-left').forEach(b=>b.onclick=()=>selectMatchLeft(b));
  document.querySelectorAll('.match-right').forEach(b=>b.onclick=()=>answerMatch(b));
  renderStage2Timer(currentType, p);
  startStage2Timer(currentType);
}

async function startStage2Turn(type){
  const p=team.progress?.stage2||{answered:{},roles:{},matching:{},startedTurns:{},stage2TurnStartedAt:{}};
  const startedTurns=Object.assign({},p.startedTurns||{},{[type]:true});
  const stage2TurnStartedAt=Object.assign({},p.stage2TurnStartedAt||{},{[type]:Date.now()});
  await patchTeam({progress:Object.assign({},team.progress,{stage2:Object.assign({},p,{startedTurns,stage2TurnStartedAt})})});
}

/* ===== V9.4.10 Stage 1 compact + fixed Stage 2 roles + Stage 3 five categories ===== */
const STAGE3_VISIBLE_CATEGORY_COUNT_V9410 = 5;
const STAGE3_VISIBLE_CATEGORY_SEED_V9410 = 'sufaraa-stage3-visible-five-v9410';

function uniquePlayerNamesV9410(){
  const seen={};
  return (team?.players||[]).map(p=>String(p?.name||'').trim()).filter(Boolean).filter(n=>{
    if(seen[n]) return false;
    seen[n]=true;
    return true;
  });
}
function cleanStage2RolesV9410(p){
  const names=uniquePlayerNamesV9410();
  const used={};
  const roles={};
  stage2Types.forEach(t=>{
    const n=String((p.roles||{})[t]||'').trim();
    if(n && names.includes(n) && !used[n]){roles[t]=n; used[n]=true;}
  });
  return roles;
}
function validStage2RoleCountV9410(p){
  const roles=cleanStage2RolesV9410(p);
  return stage2Types.filter(t=>!!roles[t]).length;
}
/* refactor: removed obsolete earlier definition of render2 from original line 802; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderStage2Roles from original line 820; final definition is kept later. */
async function resetStage2RolesV9410(){
  if(!confirm('هل تريد إعادة اختيار لاعبي المرحلة الثانية؟ سيتم مسح توزيع اللاعبين فقط، وليس الإجابات المسجلة.'))return;
  const p=team.progress?.stage2||{answered:{},roles:{},matching:{}};
  await patchTeam({progress:Object.assign({},team.progress,{stage2:Object.assign({},p,{roles:{},startedTurns:{},stage2TurnStartedAt:{}})})});
}
/* refactor: removed obsolete earlier definition of assignStage2Role from original line 846; final definition is kept later. */
/* refactor: removed obsolete earlier definition of visibleStage3CategoryEntriesV9410 from original line 860; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderBoard3 from original line 865; final definition is kept later. */
const STAGE3_SELECTED_NAMES_V9411 = ['الشخصيات','المعجزات','الأمثال','الأماكن','من القائل'];
let STAGE3_FULL_DATA_V9411 = null;
function applyStage3FiveCategoriesV9411(){
  try{
    if(!window.DATA || !Array.isArray(DATA.stage3))return;
    if(!STAGE3_FULL_DATA_V9411)STAGE3_FULL_DATA_V9411=[...DATA.stage3];
    const selected=[];
    STAGE3_SELECTED_NAMES_V9411.forEach(name=>{
      const found=STAGE3_FULL_DATA_V9411.find(c=>String(c.cat||'').trim()===name);
      if(found)selected.push(found);
    });
    if(selected.length<5){
      STAGE3_FULL_DATA_V9411.forEach(c=>{if(selected.length<5 && !selected.includes(c))selected.push(c);});
    }
    DATA.stage3=selected.slice(0,5);
  }catch(e){console.error(e)}
}
applyStage3FiveCategoriesV9411();

/* refactor: removed obsolete earlier definition of visibleStage3CategoryEntriesV9410 from original line 911; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderBoard3 from original line 915; final definition is kept later. */
function exactDuplicateItemsV9411(list){
  const seen=new Set();
  const dup=[];
  list.forEach(x=>{const v=String(x||'').trim(); if(!v)return; if(seen.has(v))dup.push(v); seen.add(v);});
  return dup;
}

/* refactor: removed obsolete earlier definition of login from original line 945; final definition is kept later. */
async function login(){
  const btn=$('loginBtn');
  const name=($('teamNameInput')?.value||'').trim();
  const governorate=($('governorateInput')?.value||'').trim();
  const players=[$('p1')?.value,$('p2')?.value,$('p3')?.value,$('p4')?.value].map(x=>String(x||'').trim());
  if(!name)return alert('اكتب اسم الفريق');
  if(!governorate)return alert('اختر المحافظة');
  if(!SYRIAN_GOVERNORATES.includes(governorate))return alert('اختر محافظة من القائمة فقط');
  if(players.some(x=>!x))return alert('اكتب أسماء اللاعبين الأربعة');
  const duplicatedPlayers=exactDuplicateItemsV9411(players);
  if(duplicatedPlayers.length)return alert('لا يمكن تكرار اسم اللاعب نفسه داخل الفريق: '+duplicatedPlayers[0]);
  try{
    if(btn){btn.disabled=true;btn.textContent='جاري الدخول...';}
    teamName=name;
    let currentResetAt=0;
    const controlSnap=await db.collection('meta').doc('control').get().catch(()=>null);
    const controlData=controlSnap?.data?.()||{};
    currentResetAt=Number(controlData.resetAt||0);
    const deletedList=Array.isArray(controlData.deletedTeams)?controlData.deletedTeams.map(String):[];
    if(deletedList.includes(name)||deletedList.includes(teamId(name))){
      alert('هذا الفريق تم حذفه من لوحة الميسر. اطلب من الميسر إضافته من جديد قبل الدخول.');
      return;
    }
    const myId=teamId(name);
    const ref=db.collection('teams').doc(myId);
    const doc=await ref.get();
    const flowSnap=await db.collection('meta').doc('gameFlow').get().catch(()=>null);
    const flowStatus=(flowSnap?.data?.()||{}).status||'waiting_players';
    const sameSavedSession=session?.teamName===name;
    const gameActive=flowStatus && !['waiting_players','contest_finished','final_results'].includes(String(flowStatus));
    if(gameActive && !doc.exists && !sameSavedSession){
      alert('بدأت اللعبة بالفعل، ولا يمكن تسجيل فريق جديد حتى ينهي الميسر اللعبة أو يعيدها إلى انتظار الفرق.');
      return;
    }
    const exactNameSnap=await db.collection('teams').where('name','==',name).limit(1).get().catch(()=>null);
    const existingOther=exactNameSnap && !exactNameSnap.empty && exactNameSnap.docs.some(d=>d.id!==myId);
    if((doc.exists || existingOther) && !sameSavedSession){
      alert('اسم الفريق مستخدم بالفعل. اختر اسم فريق مختلف حتى لا تختلط النتائج.');
      return;
    }
    session={teamName:name,resetAt:currentResetAt};
    saveSession();
    let base=doc.exists?initTeamData(doc.data()):initTeamData({name,governorate,players:players.map((p,i)=>({name:p,order:i+1}))});
    base.name=name;
    base.governorate=governorate;
    base.players=players.map((p,i)=>({name:p,order:i+1}));
    if(!base.current)base.current='intro1';
    await ref.set(base,{merge:true});
    team=base;
    showApp();
    updateUI();
    listenTeam();
  }catch(e){
    console.error(e);
    alert('لم يتم الدخول. تأكد من تفعيل Firestore Rules ومن اتصال الإنترنت.');
  }finally{
    if(btn){btn.disabled=false;btn.textContent='البدء';}
  }
}

/* ===== V9.4.12 Final Stage & Contestant Layout Polish =====
   - Stage 3 categories are fixed to exactly the requested five.
   - Keeps the original question selection flow unchanged.
*/
const STAGE3_SELECTED_NAMES_V9412 = ['الشخصيات','المعجزات','الأمثال','أحداث','الأماكن'];
function applyStage3FiveCategoriesV9412(){
  try{
    if(!window.DATA || !Array.isArray(DATA.stage3))return;
    const source = STAGE3_FULL_DATA_V9411 || DATA.stage3;
    if(!STAGE3_FULL_DATA_V9411)STAGE3_FULL_DATA_V9411 = [...DATA.stage3];
    const selected=[];
    STAGE3_SELECTED_NAMES_V9412.forEach(name=>{
      const found=source.find(c=>String(c.cat||'').trim()===name);
      if(found)selected.push(found);
    });
    DATA.stage3=selected.slice(0,5);
  }catch(e){console.error(e)}
}
applyStage3FiveCategoriesV9412();

/* refactor: removed obsolete earlier definition of visibleStage3CategoryEntriesV9410 from original line 1071; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderBoard3 from original line 1075; final definition is kept later. */
function applyStage3FinalCategoriesV9413(){
  if(!window.DATA) return;
  DATA.stage3 = [
    {cat:'الشخصيات',qs:[
      ['سهل','من بنى الفلك؟','نوح'],
      ['سهل','من هزم جليات؟','داود'],
      ['متوسط','من فسر أحلام فرعون؟','يوسف'],
      ['متوسط','من كانت زوجة إبراهيم؟','سارة'],
      ['صعب','من صعد إلى السماء في مركبة نارية؟','إيليا'],
      ['صعب','من صار رسولًا بعد أن اضطهد الكنيسة؟','بولس']
    ]},
    {cat:'المعجزات',qs:[
      ['سهل','ما أول معجزة صنعها يسوع؟','تحويل الماء إلى خمر'],
      ['سهل','من أقامه يسوع بعد أربعة أيام؟','لعازر'],
      ['متوسط','أي بحر انشق أمام موسى؟','البحر الأحمر'],
      ['متوسط','من مشى على الماء؟','يسوع'],
      ['صعب','كم سلة امتلأت بعد إشباع الخمسة آلاف؟','12'],
      ['صعب','بماذا شفى يسوع الأعمى منذ ولادته؟','بالطين']
    ]},
    {cat:'الأمثال',qs:[
      ['سهل','في مثل السامري الصالح، من ساعد الرجل المجروح؟','السامري الصالح'],
      ['سهل','في مثل الخروف الضال، ماذا بحث الراعي عنه؟','الخروف الضال'],
      ['متوسط','في مثل الزارع، أين أعطت البذار ثمرًا؟','الأرض الجيدة'],
      ['متوسط','في مثل الابن الضال، إلى من عاد الابن؟','أبيه'],
      ['صعب','بماذا شُبّه ملكوت السماوات وهو صغير ثم يكبر؟','حبة الخردل'],
      ['صعب','في مثل العشر عذارى، ماذا كان ينقص الجاهلات؟','الزيت']
    ]},
    {cat:'أحداث',qs:[
      ['سهل','ما الحدث الذي يرمز إليه القبر الفارغ؟','قيامة يسوع'],
      ['سهل','ما الحدث الذي خرج فيه شعب إسرائيل من مصر؟','الخروج'],
      ['متوسط','ماذا حدث بعد دوران الشعب حول أريحا؟','سقطت الأسوار'],
      ['متوسط','ماذا حدث في يوم الخمسين؟','حل الروح القدس'],
      ['صعب','ماذا حدث عندما صلى إيليا على جبل الكرمل؟','نزلت نار من السماء'],
      ['صعب','ماذا حدث ليونان بعد أن هرب من دعوة الرب؟','ابتلعه الحوت']
    ]},
    {cat:'الأماكن',qs:[
      ['سهل','أين وُلد يسوع؟','بيت لحم'],
      ['سهل','أين نشأ يسوع؟','الناصرة'],
      ['متوسط','أين أخذ موسى الوصايا؟','سيناء'],
      ['متوسط','إلى أين أُرسل يونان؟','نينوى'],
      ['صعب','أين دُعي التلاميذ مسيحيين أولًا؟','أنطاكية'],
      ['صعب','أين صلى يسوع قبل القبض عليه؟','جثسيماني']
    ]}
  ];
}
applyStage3FinalCategoriesV9413();

/* refactor: removed obsolete earlier definition of visibleStage3CategoryEntriesV9410 from original line 1151; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderBoard3 from original line 1156; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderStage1Input from original line 1179; final definition is kept later. */
let stage2SuppressRenderUntilV9413 = 0;
let stage2SuppressTypeV9413 = null;
function stage2CurrentTypeV9413(p){return firstIncompleteStage2Type(p||team?.progress?.stage2||{});}
function markStage2ItemLocallyV9413(key, el){
  const item = el?.closest?.('.stage2-item') || el?.closest?.('.matching-wrap') || null;
  if(item) item.classList.add('done','stage2-local-done');
  if(item){
    item.querySelectorAll('button,input').forEach(x=>{x.disabled=true; x.classList.add('answer-locked');});
  }else if(el){
    el.disabled=true; el.classList.add('answer-locked');
  }
}

/* refactor: removed obsolete earlier definition of answer2 from original line 1201; final definition is kept later. */
/* refactor: removed obsolete earlier definition of answerMatch from original line 1218; final definition is kept later. */
const render2_v9413_original = render2;
/* refactor: removed obsolete earlier definition of render2 from original line 1238; final definition is kept later. */
const STAGE3_FINAL_CATEGORIES_V9414 = [
  {cat:'الشخصيات',qs:[
    ['سهل','من بنى الفلك؟','نوح'],
    ['سهل','من هزم جليات؟','داود'],
    ['متوسط','من فسر أحلام فرعون؟','يوسف'],
    ['متوسط','من كانت زوجة إبراهيم؟','سارة'],
    ['صعب','من صعد إلى السماء في مركبة نارية؟','إيليا'],
    ['صعب','من صار رسولًا بعد أن اضطهد الكنيسة؟','بولس']
  ]},
  {cat:'المعجزات',qs:[
    ['سهل','ما أول معجزة صنعها يسوع؟','تحويل الماء إلى خمر'],
    ['سهل','من أقامه يسوع بعد أربعة أيام؟','لعازر'],
    ['متوسط','أي بحر انشق أمام موسى؟','البحر الأحمر'],
    ['متوسط','من مشى على الماء؟','يسوع'],
    ['صعب','كم سلة امتلأت بعد إشباع الخمسة آلاف؟','12'],
    ['صعب','بماذا شفى يسوع الأعمى منذ ولادته؟','بالطين']
  ]},
  {cat:'الأمثال',qs:[
    ['سهل','في مثل السامري الصالح، من ساعد الرجل المجروح؟','السامري الصالح'],
    ['سهل','في مثل الخروف الضال، ماذا بحث الراعي عنه؟','الخروف الضال'],
    ['متوسط','في مثل الزارع، أين أعطت البذار ثمرًا؟','الأرض الجيدة'],
    ['متوسط','في مثل الابن الضال، إلى من عاد الابن؟','أبيه'],
    ['صعب','بماذا شُبّه ملكوت السماوات وهو صغير ثم يكبر؟','حبة الخردل'],
    ['صعب','في مثل العشر عذارى، ماذا كان ينقص الجاهلات؟','الزيت']
  ]},
  {cat:'أحداث',qs:[
    ['سهل','ما الحدث الذي يرمز إليه القبر الفارغ؟','قيامة يسوع'],
    ['سهل','ما الحدث الذي خرج فيه شعب إسرائيل من مصر؟','الخروج'],
    ['متوسط','ماذا حدث بعد دوران الشعب حول أريحا؟','سقطت الأسوار'],
    ['متوسط','ماذا حدث في يوم الخمسين؟','حل الروح القدس'],
    ['صعب','ماذا حدث عندما صلى إيليا على جبل الكرمل؟','نزلت نار من السماء'],
    ['صعب','ماذا حدث ليونان بعد أن هرب من دعوة الرب؟','ابتلعه الحوت']
  ]},
  {cat:'الأماكن',qs:[
    ['سهل','أين وُلد يسوع؟','بيت لحم'],
    ['سهل','أين نشأ يسوع؟','الناصرة'],
    ['متوسط','أين أخذ موسى الوصايا؟','سيناء'],
    ['متوسط','إلى أين أُرسل يونان؟','نينوى'],
    ['صعب','أين دُعي التلاميذ مسيحيين أولًا؟','أنطاكية'],
    ['صعب','أين صلى يسوع قبل القبض عليه؟','جثسيماني']
  ]}
];
function applyStage3FiveCategoriesV9414(){
  try{
    if(typeof DATA==='undefined')return;
    DATA.stage3 = STAGE3_FINAL_CATEGORIES_V9414.map(cat=>({cat:cat.cat, qs:cat.qs.map(q=>[...q])}));
  }catch(e){console.error(e)}
}
applyStage3FiveCategoriesV9414();
function visibleStage3CategoryEntriesV9410(){
  applyStage3FiveCategoriesV9414();
  return DATA.stage3.map((cat, originalIndex)=>({originalIndex, cat}));
}
function renderBoard3(){
  applyStage3FiveCategoriesV9414();
  const board=$('board');
  if(!board)return;
  const active=!!(activeStage3&&activeStage3.id);
  const turnTeam=stage3Turn?.team;
  const myTurn=!active&&(!turnTeam||sameTeam(turnTeam,teamName));
  const turnName=stage3Turn?.teamName||teamDisplayName(turnTeam);
  const visible=visibleStage3CategoryEntriesV9410();
  const visualEntries=visible.slice().reverse();
  try{
    board.scrollLeft=0;
    document.documentElement.scrollLeft=0;
    document.body.scrollLeft=0;
  }catch(e){}
  const note='<div class="stage3-turn-note '+(myTurn?'my-turn':'')+'">'+(active?'هناك سؤال مفتوح الآن — الإجابة تظهر في الصندوق أعلى لوحة الأسئلة.':(myTurn?'دوركم الآن: اختاروا سؤالًا خلال '+stage3TurnLeftContestantV957()+' ثانية.':'الدور الآن لفريق: '+turnName+' — اختيار السؤال خلال '+stage3TurnLeftContestantV957()+' ثانية'))+'</div>';
  board.innerHTML=note+'<div class="stage3-visible-hint">المجالات: '+visible.map(x=>x.cat.cat).join('، ')+'</div>'+visualEntries.map(entry=>{
    const ci=entry.originalIndex, cat=entry.cat;
    return '<div class="board-card stage3-five-card"><h3>'+cat.cat+'</h3>'+cat.qs.map((q,i)=>{
      const key=ci+'_'+i;
      const used=!!stage3Locks[key]?.answered;
      const isActive=activeStage3?.id===key;
      const disabled=(active||used||!myTurn);
      return '<button class="btn small-board-btn '+(used?'used-question':'')+' '+(isActive?'active-question':'')+'" data-ci="'+ci+'" data-i="'+i+'" '+(disabled?'disabled':'')+'>'+(used?'':q[0]+' '+(i+1))+'</button>';
    }).join('')+'</div>';
  }).join('');
  document.querySelectorAll('#board button').forEach(b=>b.onclick=()=>choose3(+b.dataset.ci,+b.dataset.i));
}

/* refactor: removed obsolete earlier definition of renderStage1Input from original line 953; final definition is kept later. */

function uniquePlayerNamesV9414(){
  const seen=new Set();
  return (team?.players||[]).map(p=>String(p?.name||'').trim()).filter(Boolean).filter(n=>{if(seen.has(n))return false;seen.add(n);return true;});
}
function cleanStage2RolesV9414(p){
  const names=uniquePlayerNamesV9414();
  const used=new Set();
  const roles={};
  stage2Types.forEach(t=>{
    const n=String((p.roles||{})[t]||'').trim();
    if(n && names.includes(n) && !used.has(n)){roles[t]=n; used.add(n);}
  });
  return roles;
}
function render2(){
  const p=team.progress?.stage2||{answered:{},roles:{},matching:{},startedTurns:{},stage2TurnStartedAt:{}};
  const roles=cleanStage2RolesV9414(p);
  if(JSON.stringify(roles)!==JSON.stringify(p.roles||{})){
    patchTeam({progress:Object.assign({},team.progress,{stage2:Object.assign({},p,{roles})})}).catch(console.error);
  }
  if($('passage')) $('passage').innerText=DATA.stage2.passage;
  if($('stage2Count')) $('stage2Count').innerText=`${Object.keys(p.answered||{}).length} / 20`;
  const p2=Object.assign({},p,{roles});
  renderStage2Roles(p2);
  if(stage2Types.some(t=>!roles[t])){
    $('stage2List').innerHTML='<div class="mini-card stage2-role-help"><b>اختاروا لاعبًا لكل نوع.</b><p class="muted">بعد اكتمال توزيع اللاعبين ستبدأ الأسئلة تلقائيًا وبشكل سلس.</p></div>';
    clearInterval(stage2TimerInt);
    return;
  }
  renderStage2Sequential(p2);
}
function renderStage2Roles(p){
  const names=uniquePlayerNamesV9414();
  const roles=cleanStage2RolesV9414(p);
  const complete=stage2Types.every(t=>roles[t]);
  if(!names.length){$('stage2RoleBox').innerHTML='<p class="muted">لا توجد أسماء لاعبين مسجلة.</p>';return;}
  const usedNames = new Set(Object.values(roles).filter(Boolean));
  $('stage2RoleBox').innerHTML=`<h3>توزيع لاعبي المرحلة الثانية</h3><p class="muted">اختاروا لاعبًا مختلفًا لكل نوع.</p><div class="stage2-role-grid v9414-role-grid">${stage2Types.map(t=>{
    const current=roles[t]||'';
    const opts=names.filter(n=>n===current || !usedNames.has(n));
    return `<div class="stage2-role-card ${current?'done':''}"><b>${roleTitle(t)}</b><select data-stage2-role="${t}" ${complete?'disabled':''}><option value="">اختر اللاعب</option>${opts.map(n=>`<option value="${n}" ${n===current?'selected':''}>${n}</option>`).join('')}</select></div>`;
  }).join('')}</div>${complete?'<button class="btn secondary stage2-reset-roles" onclick="resetStage2RolesV9410()">إعادة اختيار اللاعبين</button>':'<p class="muted stage2-role-note">المتبقي: '+stage2Types.filter(t=>!roles[t]).map(roleTitle).join('، ')+'</p>'}`;
  document.querySelectorAll('[data-stage2-role]').forEach(sel=>{
    sel.onchange=()=>assignStage2RoleV9414(sel.dataset.stage2Role, sel.value);
  });
}
async function assignStage2RoleV9414(type,name){
  name=String(name||'').trim();
  if(!name)return;
  const names=uniquePlayerNamesV9414();
  if(!names.includes(name))return alert('هذا اللاعب غير موجود ضمن أسماء الفريق.');
  const p=team.progress?.stage2||{answered:{},roles:{},matching:{},startedTurns:{},stage2TurnStartedAt:{}};
  const roles=cleanStage2RolesV9414(p);
  if(Object.entries(roles).some(([k,v])=>k!==type && v===name)) return alert('هذا اللاعب مستخدم لنوع آخر. اختر لاعبًا مختلفًا.');
  roles[type]=name;
  await patchTeam({progress:Object.assign({},team.progress,{stage2:Object.assign({},p,{roles})})});
}
async function assignStage2Role(type){
  const name=String($('rolePlayerSelect')?.value||'').trim();
  return assignStage2RoleV9414(type,name);
}
async function answer2(key,answer,correct,el,points,title){
  if(team.progress?.stage2?.answered?.[key])return;
  const cleanAnswer=String(answer||'').trim();
  if(!cleanAnswer)return alert('اكتب الإجابة أولًا');
  const ok=norm(cleanAnswer)===norm(correct);
  if(el){el.classList.add('answer-locked');el.disabled=true;}
  const item=el?.closest?.('.stage2-item');
  if(item)item.querySelectorAll('button,input').forEach(x=>{x.disabled=true;x.classList.add('answer-locked')});
  const pts=ok?points:0;
  const group=DATA.stage2.groups.find(g=>g.title===title);
  await markStage2Answered(key,pts,makeLog('فتشوا الكتب',document.querySelector(`[data-key="${key}"]`)?.closest('.stage2-item')?.querySelector('b')?.innerText||key,cleanAnswer,correct,ok,pts,title,team.progress.stage2.roles[group?.type]||''));
}
async function answerMatch(b){
  if(!selectedMatch)return alert('اختر عبارة من العمود الأول أولًا');
  const key=`matching_${selectedMatch.dataset.i}`;
  if(team.progress?.stage2?.answered?.[key])return;
  const ok=b.dataset.a===selectedMatch.dataset.answer;
  selectedMatch.classList.add('answer-locked');
  b.classList.add('answer-locked');
  selectedMatch.disabled=true;b.disabled=true;
  const pts=ok?15:0;
  await markStage2Answered(key,pts,makeLog('فتشوا الكتب',selectedMatch.dataset.q,b.dataset.a,selectedMatch.dataset.answer,ok,pts,'توصيل',team.progress.stage2.roles.matching));
  selectedMatch=null;
}

/* ===== V9.4.18 - Stage 1 arrange layout: show given items beside the question ===== */
function stage1EscV9418(x){
  return String(x ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
}

function renderStage1ArrangeQuestionV9418(q, i){
  return `
    <div class="stage1-question-row stage1-arrange-question-row">
      <div class="stage1-question-main">${stage1EscV9418(q.q)}</div>
      <div class="stage1-question-side">
        <div class="stage1-chips stage1-question-chips">${stage1ArrangePrompt(q.answer, `${teamName}|${i}`)}</div>
      </div>
    </div>
  `;
}

/* refactor: removed obsolete earlier definition of renderStage1Input from original line 1064; final definition is kept later. */

function showQ1(){
  const p = team.progress?.stage1 || {i:0};
  const remoteI = Number(p.i || 0);
  const currentKey = String((team.progress?.stage1 || {}).startedAt || 'stage1');
  if(stage1LocalKey !== currentKey){stage1LocalKey = currentKey; stage1LocalI = remoteI;}
  if(stage1LocalI === null || remoteI > stage1LocalI) stage1LocalI = remoteI;
  const i = Math.max(remoteI, Number(stage1LocalI || 0));
  const plan = getStage1Plan(p);
  const total = plan.length || Math.min(50, DATA.stage1.length);
  if(i >= total) return patchStage1Progress({ended:true}).then(() => finishStage('stage1','intro2'));
  const item = plan[i] || {idx:i, type:STAGE1_TYPES[i % STAGE1_TYPES.length]};
  const q = DATA.stage1[item.idx] || DATA.stage1[i % DATA.stage1.length];
  const type1 = item.type || stage1QuestionType(q, i);
  $('count1').innerText = `سؤال ${i+1} من ${total}`;
  if($('stage1Type')) $('stage1Type').innerText = type1;

  if(type1 === 'رتّب'){
    $('q1').innerHTML = renderStage1ArrangeQuestionV9418(q, i);
    $('q1').classList.add('stage1-arrange-question');
  }else{
    $('q1').textContent = q.q;
    $('q1').classList.remove('stage1-arrange-question');
  }

  $('progress1').style.width = (i / total * 100) + '%';
  const answersBox = $('a1');
  const qKey = `${i}|${item.idx}|${type1}`;
  if(answersBox.dataset.qIndex !== qKey){
    stage1Busy = false;
    stage1PendingAdvance = false;
    answersBox.dataset.qIndex = qKey;
    answersBox.innerHTML = renderStage1Question(q, i, type1);
    bindStage1Answers(i, q, p, type1);
  }
}

/* ===== V9.5 Audience Stage 3 + Stage 4 Rewrite from safe V9.4.24 ===== */
let stage4LiveV95 = null;
let stage4LiveTimerV95 = null;
let stage3AudienceTimerV95 = null;

function audienceNowMs(){return Date.now();}
/* refactor: removed obsolete earlier definition of liveTimeLeftSeconds from original line 1112; final definition is kept later. */

/* refactor: removed obsolete earlier definition of stage3TurnLeftContestantV957 from original line 1119; final definition is kept later. */
function liveRoundId(prefix, index){return prefix+'_'+String(index||0)+'_'+String((stage4LiveV95?.startedAtMs)||'');}
function activeStage3RoundId(){return activeStage3?.id ? 'stage3_'+activeStage3.id+'_'+String(activeStage3.startedAtMs||'') : '';}
function stage3BasePoints(level){return ({'سهل':5,'متوسط':10,'صعب':15})[level]||5;}
function stage3OwnerCorrectPoints(level){return ({'سهل':15,'متوسط':30,'صعب':45})[level]||15;}
function stage3CurrentQuestion(){
  if(!activeStage3?.id) return null;
  const [ci,i]=String(activeStage3.id).split('_').map(Number);
  const cat=DATA.stage3?.[ci], q=cat?.qs?.[i];
  if(!cat||!q) return null;
  return {ci,i,cat,q,level:q[0],text:q[1],correct:q[2],key:activeStage3.id};
}
function normalizeLiveAnswer(v){return norm(v||'');}
function teamLiveAnswer(stage, roundId){
  const pr=team?.progress?.[stage]||{};
  return (pr.liveAnswers||{})[roundId] || null;
}

// Rebind Stage 3 live listener with full metadata (startedAtMs, duration, status).
function listenActiveStage3(){
  if(unsubActive)unsubActive();
  if(unsubLocks)unsubLocks();
  if(unsubTurn)unsubTurn();
  unsubActive=db.collection('meta').doc('activeStage3').onSnapshot(doc=>{
    const d=doc.data()||{};
    activeStage3=d.id?Object.assign({answered:false,duration:(window.SUFARAA_GAME_FLOW?SUFARAA_GAME_FLOW.localDuration('stageQuestion',15):15),status:'asking'},d):null;
    if(team?.current==='stage3')render3();
  },e=>console.error(e));
  unsubLocks=db.collection('stage3Locks').onSnapshot(snap=>{
    stage3Locks={};
    snap.forEach(d=>stage3Locks[d.id]={id:d.id,...d.data()});
    if(team?.current==='stage3')render3();
  },e=>console.error(e));
  unsubTurn=db.collection('meta').doc('stage3Turn').onSnapshot(doc=>{
    stage3Turn=Object.assign({team:null,index:0,turnStartedAtMs:0,turnDuration:15},doc.data()||{});
    if(team?.current==='stage3')render3();
  },e=>console.error(e));
}

function listenStage4LiveV95(){
  db.collection('meta').doc('stage4Live').onSnapshot(doc=>{
    stage4LiveV95=Object.assign({status:'waiting',index:0,duration:(window.SUFARAA_GAME_FLOW?SUFARAA_GAME_FLOW.localDuration('stageQuestion',15):15)},doc.data()||{});
    if(team?.current==='stage4') render4();
  },console.error);
}
setTimeout(listenStage4LiveV95,0);

/* refactor: removed obsolete earlier definition of choose3 from original line 1171; final definition is kept later. */

function renderActive3(){
  const box=$('stage3Box'), answers=$('a3'), meta=$('stage3Meta'), question=$('q3'), note=$('stage3OwnerNote');
  if(!box||!answers||!meta||!question||!note)return;
  const info=stage3CurrentQuestion();
  if(!activeStage3||!activeStage3.id||!info||stage3Locks[activeStage3.id]?.answered){box.classList.add('hidden');setStage3ActiveState(false);return;}
  const owner=activeStage3.team;
  const ownerDisplay=activeStage3.teamName||teamDisplayName(owner);
  const isOwner=sameTeam(owner,teamName);
  const base=stage3BasePoints(info.level);
  const ownerGood=stage3OwnerCorrectPoints(info.level);
  const roundId=activeStage3RoundId();
  const answered=teamLiveAnswer('stage3',roundId);
  const left=liveTimeLeftSeconds(activeStage3);
  const locked=left<=0 || activeStage3.status==='locked' || activeStage3.status==='revealing';
  box.classList.remove('hidden');
  setStage3ActiveState(true);
  meta.innerText=`${info.cat.cat} - ${info.level} | صاحب السؤال: ${ownerDisplay}`;
  question.innerText=info.text;
  note.innerHTML=`<span class="timer ${left<=5?'timer-danger':''}" id="stage3LiveTimer">${left}s</span> ` + (isOwner?`هذا سؤالكم: لا يمكن التخطي. صح +${ownerGood} / خطأ أو عدم إجابة -${base}.`:`أجيبوا خلال 15 ثانية. صح +${base} / خطأ -${base} / تخطي 0.`);
  clearInterval(stage3AudienceTimerV95);
  stage3AudienceTimerV95=setInterval(()=>{if(team?.current!=='stage3'){clearInterval(stage3AudienceTimerV95);return;} const el=$('stage3LiveTimer'); if(el&&activeStage3){const l=liveTimeLeftSeconds(activeStage3); el.textContent=l+'s'; el.classList.toggle('timer-danger',l<=5); if(l<=0)renderActive3();}},500);
  if(answered){answers.innerHTML=`<p class="badge green">تم تسجيل إجابة فريقكم: ${answered.answer||'تخطي'} (${answered.points>0?'+':''}${answered.points})</p>`;return;}
  if(locked){answers.innerHTML='<p class="badge">انتهى وقت الإجابة. انتظروا عرض النتائج على شاشة الجمهور.</p>';return;}
  let opts=[info.correct,'يسوع','موسى','داود','بطرس','بولس','نوح'].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4);
  if(!opts.includes(info.correct))opts[0]=info.correct;
  answers.innerHTML=seededShuffle(opts,`${roundId}|opts`).map(o=>`<button class="answer" data-a="${o}">${o}</button>`).join('')+(isOwner?'':"<button class='btn secondary skip-stage3' id='skip3Btn'>تخطي الإجابة 0</button>");
  const skipBtn=document.getElementById('skip3Btn');
  if(skipBtn)skipBtn.onclick=()=>skip3(info.key);
  document.querySelectorAll('#a3 .answer').forEach(b=>b.onclick=()=>answer3(info.key,b));
}

async function answer3(key,b){
  const info=stage3CurrentQuestion();
  if(!info || key!==info.key)return alert('لا يوجد سؤال مفتوح الآن');
  if(liveTimeLeftSeconds(activeStage3)<=0)return alert('انتهى وقت الإجابة');
  const roundId=activeStage3RoundId();
  const ownerId=activeStage3?.team;
  const isOwner=sameTeam(ownerId,teamName);
  const ok=String(b.dataset.a||'')===String(info.correct||'');
  const base=stage3BasePoints(info.level);
  const pts=ok?(isOwner?stage3OwnerCorrectPoints(info.level):base):-base;
  document.querySelectorAll('#a3 .answer,#skip3Btn').forEach(x=>x.disabled=true);
  b.classList.add('answer-locked');
  try{
    await db.runTransaction(async tx=>{
      const ref=teamRef();
      const snap=await tx.get(ref);
      let t=initTeamData(snap.data());
      t.progress.stage3.liveAnswers=t.progress.stage3.liveAnswers||{};
      if(t.progress.stage3.liveAnswers[roundId])throw new Error('تمت الإجابة');
      t.progress.stage3.liveAnswers[roundId]={answer:b.dataset.a,ok,points:pts,skipped:false,teamName:t.name||teamName,time:Date.now(),isOwner};
      t.progress.stage3.answered=t.progress.stage3.answered||{};
      t.progress.stage3.answered[key]=true;
      t.score=Math.max(0,(t.score||0)+pts);
      t.stageScores.stage3=Math.max(0,(t.stageScores.stage3||0)+pts);
      t.answerLog=t.answerLog||[];
      t.answerLog.push(makeLog('على المحك',info.text,b.dataset.a,info.correct,ok,pts,info.cat.cat+' - '+info.level+(isOwner?' - صاحب الاختيار':' - فريق آخر')));
      tx.set(ref,t,{merge:true});
    });
    showScorePop(pts);
  }catch(e){alert(e.message||'تعذر تسجيل الإجابة')}
}

async function skip3(key){
  const info=stage3CurrentQuestion();
  if(!info || key!==info.key)return alert('لا يوجد سؤال مفتوح الآن');
  if(activeStage3?.team&&sameTeam(activeStage3.team,teamName))return alert('صاحب السؤال لا يستطيع التخطي');
  if(liveTimeLeftSeconds(activeStage3)<=0)return alert('انتهى وقت الإجابة');
  const roundId=activeStage3RoundId();
  const btn=document.getElementById('skip3Btn'); if(btn){btn.disabled=true;btn.textContent='تم التخطي';}
  try{
    await db.runTransaction(async tx=>{
      const ref=teamRef();
      let t=initTeamData((await tx.get(ref)).data());
      t.progress.stage3.liveAnswers=t.progress.stage3.liveAnswers||{};
      if(t.progress.stage3.liveAnswers[roundId])throw new Error('تم تسجيل اختياركم سابقًا');
      t.progress.stage3.liveAnswers[roundId]={answer:'تخطي',ok:null,points:0,skipped:true,teamName:t.name||teamName,time:Date.now(),isOwner:false};
      t.progress.stage3.answered[key]=true;
      t.answerLog=t.answerLog||[];
      t.answerLog.push(makeLog('على المحك',info.text,'تخطي',info.correct,true,0,info.cat.cat+' - '+info.level+' - تخطي',team?.name||'الفريق'));
      tx.set(ref,t,{merge:true});
    });
  }catch(e){alert(e.message||'تعذر التخطي')}
}

function render4(){
  const live=stage4LiveV95 || {status:'waiting',index:team?.progress?.stage4?.i||0};
  const idx=Number(live.index||0);
  const q=DATA.stage4?.[idx];
  const p=team.progress?.stage4||{i:0,streak:0};
  if(!q){return finishAll();}
  $('count4').innerText=`سؤال ${idx+1} من ${DATA.stage4.length}`;
  if($('stage4Type')) $('stage4Type').innerText=stage4QuestionType(q);
  $('streak').innerText='متتالية: '+(p.streak||0);
  $('progress4').style.width=(idx/DATA.stage4.length*100)+'%';
  const left=liveTimeLeftSeconds(live);
  const asking=live.status==='asking' && left>0;
  const roundId='stage4_'+idx+'_'+String(live.startedAtMs||'manual');
  const answered=teamLiveAnswer('stage4',roundId);
  $('q4').innerHTML=`${q.q}<div class="stage4-live-meta"><span class="timer ${left<=5?'timer-danger':''}" id="stage4LiveTimer">${asking?left:0}s</span></div>`;
  clearInterval(stage4LiveTimerV95);
  stage4LiveTimerV95=setInterval(()=>{if(team?.current!=='stage4'){clearInterval(stage4LiveTimerV95);return;} const el=$('stage4LiveTimer'); if(el&&stage4LiveV95){const l=liveTimeLeftSeconds(stage4LiveV95); el.textContent=(stage4LiveV95.status==='asking'?l:0)+'s'; el.classList.toggle('timer-danger',l<=5); if(l<=0)render4();}},500);
  if(!live.startedAtMs || live.status==='waiting'){
    $('a4').innerHTML='<div class="stage4-wait-card"><h3>انتظروا ظهور سؤال المرحلة الرابعة على شاشة الميسر.</h3><p>عندما يبدأ الميسر السؤال ستظهر خانة الإجابة والوقت هنا.</p></div>';return;
  }
  if(answered){$('a4').innerHTML=`<div class="stage4-wait-card"><h3>تم تسجيل إجابتكم</h3><p>إجابتكم: <b>${answered.answer}</b></p><span class="badge green">انتظروا عرض النتائج</span></div>`;return;}
  if(!asking){$('a4').innerHTML='<div class="stage4-wait-card"><h3>انتهى وقت الإجابة</h3><p>انتظروا عرض الإجابات على شاشة الجمهور.</p></div>';return;}
  $('a4').innerHTML=`<div class="stage4-input-card"><input id="stage4LiveAnswer" placeholder="اكتب إجابتك هنا"><button class="btn" id="stage4SendBtn">إرسال الإجابة</button><button class="btn secondary" id="stage4SkipBtn">تخطي</button></div>`;
  $('stage4SendBtn').onclick=()=>submitStage4LiveAnswer(false);
  $('stage4SkipBtn').onclick=()=>submitStage4LiveAnswer(true);
}

async function submitStage4LiveAnswer(skip=false){
  const live=stage4LiveV95;
  if(!live||live.status!=='asking'||liveTimeLeftSeconds(live)<=0)return alert('انتهى وقت الإجابة');
  const idx=Number(live.index||0), q=DATA.stage4?.[idx];
  if(!q)return;
  const answer=skip?'تخطي':String($('stage4LiveAnswer')?.value||'').trim();
  if(!skip&&!answer)return alert('اكتب الإجابة أو اختر تخطي');
  const roundId='stage4_'+idx+'_'+String(live.startedAtMs||'manual');
  const ok=!skip && normalizeLiveAnswer(answer)===normalizeLiveAnswer(q.answer);
  const p=team.progress?.stage4||{i:idx,streak:0,liveAnswers:{}};
  const newStreak=ok?(Number(p.streak||0)+1):0;
  const pts=ok?15+((newStreak-1)*2):0;
  ['stage4SendBtn','stage4SkipBtn','stage4LiveAnswer'].forEach(id=>{const el=$(id); if(el)el.disabled=true;});
  try{
    await db.runTransaction(async tx=>{
      const ref=teamRef();
      const snap=await tx.get(ref);
      let t=initTeamData(snap.data());
      const pr=Object.assign({i:idx,streak:0,liveAnswers:{}},t.progress.stage4||{});
      pr.liveAnswers=Object.assign({},pr.liveAnswers||{});
      if(pr.liveAnswers[roundId])throw new Error('تم إرسال إجابة فريقكم');
      pr.liveAnswers[roundId]={answer,ok,points:pts,skipped:skip,teamName:t.name||teamName,time:Date.now()};
      pr.streak=newStreak;
      pr.i=Math.max(Number(pr.i||0),idx);
      t.progress.stage4=pr;
      t.score=Math.max(0,(t.score||0)+pts);
      t.stageScores.stage4=Math.max(0,(t.stageScores.stage4||0)+pts);
      t.answerLog=t.answerLog||[];
      t.answerLog.push(makeLog('اثبتوا بالحق',q.q,answer,q.answer,ok,pts,`سؤال ${idx+1} - متتالية ${newStreak}`));
      tx.set(ref,t,{merge:true});
    });
    showScorePop(pts);
    render4();
  }catch(e){alert(e.message||'تعذر تسجيل الإجابة')}
}

/* ===== V9.5.18 Contestant pause compatibility for Stage 3 ===== */
function liveTimeLeftSeconds(live){
  if(!live || !live.startedAtMs) return live?.pausedRemaining ? Number(live.pausedRemaining) : 0;
  if(live.paused || live.status==='locked') return Math.max(0, Number(live.pausedRemaining ?? live.duration ?? 15));
  const dur = Number(live.duration || 15);
  const elapsed = Math.floor((Date.now() - Number(live.startedAtMs||0))/1000);
  return Math.max(0, dur - elapsed);
}
function stage3TurnLeftContestantV957(){
  if(!stage3Turn?.team)return 0;
  if(stage3Turn.paused) return Math.max(0, Number(stage3Turn.pausedRemaining ?? stage3Turn.turnDuration ?? 15));
  if(!stage3Turn.turnStartedAtMs)return 15;
  const elapsed=Math.floor((Date.now()-Number(stage3Turn.turnStartedAtMs||0))/1000);
  return Math.max(0,Number(stage3Turn.turnDuration||15)-elapsed);
}
const choose3BeforeV9518 = choose3;
async function choose3(ci,i){
  if(!stage3Turn?.phaseStarted) return alert('لم تبدأ المرحلة الثالثة بعد. انتظروا الميسر.');
  if(stage3Turn?.paused) return alert('المرحلة الثالثة متوقفة مؤقتًا. انتظروا استكمال الميسر.');
  return choose3BeforeV9518(ci,i);
}

/* ===== V9.5.19 Contestant Stage 3 Timer Visibility Fix ===== */
(function(){
  window.liveTimeLeftSeconds = function(live){
    if(!live) return 0;
    if(live.paused || live.status==='locked') return Math.max(0, Number(live.pausedRemaining ?? live.duration ?? 15));
    if(!live.startedAtMs) return 0;
    const elapsed=Math.floor((Date.now()-Number(live.startedAtMs||0))/1000);
    return Math.max(0, Number(live.duration||15)-elapsed);
  };
  window.stage3TurnLeftContestantV957 = function(){
    if(!stage3Turn?.team || !stage3Turn?.phaseStarted) return 0;
    if(stage3Turn.paused) return Math.max(0, Number(stage3Turn.pausedRemaining ?? stage3Turn.turnDuration ?? 15));
    if(!stage3Turn.turnStartedAtMs) return 0;
    const elapsed=Math.floor((Date.now()-Number(stage3Turn.turnStartedAtMs||0))/1000);
    return Math.max(0, Number(stage3Turn.turnDuration||15)-elapsed);
  };
  if(typeof renderBoard3==='function'){
    const previousRenderBoard3=renderBoard3;
    window.renderBoard3 = renderBoard3 = function(){
      applyStage3FiveCategoriesV9414?.();
      const board=$('board');
      if(!board)return;
      const active=!!(activeStage3&&activeStage3.id);
      const phaseStarted=!!stage3Turn?.phaseStarted;
      const paused=!!stage3Turn?.paused || activeStage3?.paused || activeStage3?.status==='locked';
      const turnTeam=stage3Turn?.team;
      const myTurn=phaseStarted&&!paused&&!active&&(!turnTeam||sameTeam(turnTeam,teamName));
      const turnName=stage3Turn?.teamName||teamDisplayName(turnTeam);
      const visible=visibleStage3CategoryEntriesV9410();
      let msg='انتظروا بداية المرحلة الثالثة من الميسر.';
      if(phaseStarted && paused) msg='المرحلة الثالثة متوقفة مؤقتًا.';
      else if(active) msg='هناك سؤال مفتوح الآن — الإجابة تظهر في الصندوق أعلى لوحة الأسئلة.';
      else if(myTurn) msg='دوركم الآن: اختاروا سؤالًا خلال '+stage3TurnLeftContestantV957()+' ثانية.';
      else if(phaseStarted) msg='الدور الآن لفريق: '+turnName+' — اختيار السؤال خلال '+stage3TurnLeftContestantV957()+' ثانية';
      const note='<div class="stage3-turn-note '+(myTurn?'my-turn':'')+'">'+msg+'</div>';
      board.innerHTML=note+'<div class="stage3-visible-hint">المجالات: '+visible.map(x=>x.cat.cat).join('، ')+'</div>'+visible.map(entry=>{
        const ci=entry.originalIndex, cat=entry.cat;
        return '<div class="board-card stage3-five-card"><h3>'+cat.cat+'</h3>'+cat.qs.map((q,i)=>{
          const key=ci+'_'+i;
          const used=!!stage3Locks[key]?.answered;
          const isActive=activeStage3?.id===key;
          const disabled=(active||used||!myTurn);
          return '<button class="btn small-board-btn '+(used?'used-question':'')+' '+(isActive?'active-question':'')+'" data-ci="'+ci+'" data-i="'+i+'" '+(disabled?'disabled':'')+'>'+(used?'':q[0]+' '+(i+1))+'</button>';
        }).join('')+'</div>';
      }).join('');
      document.querySelectorAll('#board button').forEach(b=>b.onclick=()=>choose3(+b.dataset.ci,+b.dataset.i));
    };
  }
})();

/* ===== V9.5.24 Stage 3 contestant turn selection fix ===== */
(function(){
  function sameTeamStrongV9524(a,b){
    try{
      const valsA=[a, safeDecode(a), teamId(a)].filter(Boolean).map(String);
      const valsB=[b, safeDecode(b), teamId(b), teamName, team?.name, myTeamDocId()].filter(Boolean).map(String);
      return valsA.some(x=>valsB.some(y=>x===y || safeDecode(x)===safeDecode(y) || x===teamId(y)));
    }catch(e){return sameTeam(a,b)}
  }
  window.renderBoard3 = function(){
    if(typeof applyStage3FiveCategoriesV9414==='function') applyStage3FiveCategoriesV9414();
    const board=$('board');
    if(!board)return;
    const active=!!(activeStage3&&activeStage3.id);
    const turnTeam=stage3Turn?.team;
    const myTurn=!active&&(!turnTeam||sameTeamStrongV9524(turnTeam,teamName)||sameTeamStrongV9524(stage3Turn?.teamName,teamName));
    const turnName=stage3Turn?.teamName||teamDisplayName(turnTeam);
    const visible=(typeof visibleStage3CategoryEntriesV9410==='function')?visibleStage3CategoryEntriesV9410():DATA.stage3.map((cat,originalIndex)=>({originalIndex,cat}));
    const left=(typeof stage3TurnLeftContestantV957==='function')?stage3TurnLeftContestantV957():0;
    const choiceText=left>0 ? (' خلال '+left+' ثانية') : '';
    const note='<div class="stage3-turn-note '+(myTurn?'my-turn':'')+'">'+(active?'هناك سؤال مفتوح الآن — الإجابة تظهر في الصندوق أعلى لوحة الأسئلة.':(myTurn?'دوركم الآن: اختاروا سؤالًا'+choiceText+'.':'الدور الآن لفريق: '+turnName+(left>0?' — اختيار السؤال خلال '+left+' ثانية':'')))+'</div>';
    board.innerHTML=note+'<div class="stage3-visible-hint">المجالات: '+visible.map(x=>x.cat.cat).join('، ')+'</div>'+visible.map(entry=>{
      const ci=entry.originalIndex, cat=entry.cat;
      return '<div class="board-card stage3-five-card"><h3>'+cat.cat+'</h3>'+cat.qs.map((q,i)=>{
        const key=ci+'_'+i;
        const used=!!stage3Locks[key]?.answered;
        const isActive=activeStage3?.id===key;
        const disabled=(active||used||!myTurn);
        return '<button class="btn small-board-btn '+(used?'used-question':'')+' '+(isActive?'active-question':'')+'" data-ci="'+ci+'" data-i="'+i+'" '+(disabled?'disabled':'')+'>'+(used?'':q[0]+' '+(i+1))+'</button>';
      }).join('')+'</div>';
    }).join('');
    document.querySelectorAll('#board button').forEach(b=>b.onclick=()=>choose3(+b.dataset.ci,+b.dataset.i));
  };
  window.choose3 = async function(ci,i){
    const key=ci+'_'+i, ref=db.collection('stage3Locks').doc(key);
    try{
      await ensureStage3Turn();
      await db.runTransaction(async tx=>{
        const activeRef=db.collection('meta').doc('activeStage3');
        const turnRef=db.collection('meta').doc('stage3Turn');
        const active=await tx.get(activeRef);
        const turn=await tx.get(turnRef);
        const lock=await tx.get(ref);
        const activeData=active.data()||{};
        const turnData=turn.data()||{};
        if(activeData.id)throw new Error('يوجد سؤال مفتوح الآن');
        const isMyTurn=!turnData.team || sameTeamStrongV9524(turnData.team,teamName) || sameTeamStrongV9524(turnData.teamName,teamName);
        if(!isMyTurn)throw new Error('ليس دور فريقكم الآن');
        if(lock.exists&&lock.data().answered)throw new Error('تم استخدام السؤال');
        const ownerId=myTeamDocId();
        const ownerName=team?.name||teamName;
        const startedAtMs=Date.now();
        tx.set(ref,{team:ownerId,teamName:ownerName,answered:false,createdAt:FieldValue.serverTimestamp(),startedAtMs},{merge:true});
        tx.set(activeRef,{id:key,team:ownerId,teamName:ownerName,status:'asking',duration:(window.SUFARAA_GAME_FLOW?SUFARAA_GAME_FLOW.localDuration('stageQuestion',15):15),startedAtMs,revealDone:false},{merge:true});
      });
    }catch(e){alert(e.message||'لا يمكن اختيار السؤال الآن')}
  };
})();

/* ===== V9.5.32 Load imported Excel question bank from Firestore ===== */
function applyQuestionBankDataContestantV9532(data){
  if(!data || typeof DATA==='undefined') return;
  if(data.stage1) DATA.stage1=data.stage1;
  if(data.stage2) DATA.stage2=data.stage2;
  if(data.stage3) DATA.stage3=data.stage3;
  if(data.stage4) DATA.stage4=data.stage4;
}
function listenQuestionBankContestantV9532(){
  try{
    db.collection('questionBanks').doc('active').onSnapshot(doc=>{
      if(doc.exists){
        applyQuestionBankDataContestantV9532((doc.data()||{}).data);
        if(team) updateUI();
      }
    },console.error);
  }catch(e){console.error('question bank listener failed',e);}
}
function acceptedListV9532(q){
  const arr=[];
  if(q?.answer) arr.push(q.answer);
  if(q?.correct) arr.push(q.correct);
  if(Array.isArray(q?.acceptedAnswers)) arr.push(...q.acceptedAnswers);
  return arr.filter(Boolean);
}
function isAcceptedAnswerV9532(answer,q){
  const a=norm(answer||'');
  return acceptedListV9532(q).some(x=>norm(x)===a);
}
function stage1QuestionTypeV9532(q,i){
  return q?.type || (typeof stage1QuestionType==='function'?stage1QuestionType(q,i):'اختر من متعدد');
}
if(typeof getStage1Plan==='function'){
  getStage1Plan=function(p){
    const total=Math.min(50,DATA.stage1.length);
    return [...Array(total).keys()].map(idx=>({idx,type:stage1QuestionTypeV9532(DATA.stage1[idx],idx)}));
  };
}
if(typeof answerStage1==='function'){
  const oldAnswerStage1V9532=answerStage1;
  answerStage1=async function(trigger,i,q,p,selected){
    if(stage1Busy || stage1PendingAdvance)return;
    const answer=String(selected||'').trim();
    if(!answer)return;
    // inline copy with accepted-answer support
    stage1Busy=true; stage1PendingAdvance=true;
    const ok=isAcceptedAnswerV9532(answer,q);
    if(trigger)trigger.classList.add('stage1-selected');
    document.querySelectorAll('#a1 button,#a1 input').forEach(x=>x.disabled=true);
    const pts=ok?5:0;
    const remaining=stage1Runtime.remaining??(()=>{const secText=($('timer1')?.innerText||'07:00').split(':');return (Number(secText[0]||0)*60)+Number(secText[1]||0);})();
    const nextI=i+1;
    stage1LocalI=nextI;
    stage1LocalKey=String((team.progress?.stage1||{}).startedAt||'stage1');
    const latestStage1=Object.assign({},team.progress?.stage1||p,{i:nextI,remaining});
    if(team?.progress?.stage1)team.progress.stage1=latestStage1;
    stage1Busy=false; stage1PendingAdvance=false; showQ1();
    try{ await changeScore(pts,'stage1',makeLog('اجمعوا الكنوز',q.q,answer,q.answer||q.correct,ok,pts),{progress:Object.assign({},team.progress,{stage1:latestStage1})}); }
    catch(e){ console.error(e); }
    finally{ stage1Busy=false; stage1PendingAdvance=false; }
  };
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(listenQuestionBankContestantV9532,300));

/* ===== V9.5.34 Hard fix: Excel imported choice types render correctly ===== */
(function(){
  function normalizeStage1TypeV9534(t){
    const raw=String(t||'').trim().toLowerCase();
    const compact=raw.replace(/[\sـ]+/g,'');
    if(['choice','multiple','select','mcq','اختيار','اخترمنمتعدد','اخترمنمتعدّد','اختر من متعدد'].includes(raw) || compact==='اخترمنمتعدد' || compact==='اخترمنمتعدّد') return 'اختر من متعدد';
    if(['missing','ماذا ينقص','ماذا ينقص؟'].includes(raw) || compact==='ماذايَنْقص' || compact==='ماذاينقص') return 'ماذا ينقص';
    if(['arrange','رتب','رتّب'].includes(raw) || compact==='رتب' || compact==='رتّب') return 'رتّب';
    if(['fill','blank','فراغات','أكمل الفراغات','اكمل الفراغات'].includes(raw) || compact==='أكملالفراغات' || compact==='اكملالفراغات') return 'فراغات';
    if(t==='اختر من متعدد' || t==='ماذا ينقص' || t==='رتّب' || t==='فراغات') return t;
    return t || 'اختر من متعدد';
  }
  function normalizeStage1QuestionV9534(q){
    if(!q) return q;
    const out=Object.assign({},q);
    out.type=normalizeStage1TypeV9534(out.type || out.typeName);
    out.q=out.q || out.question || '';
    out.answer=out.answer || out.correct || '';
    if(!Array.isArray(out.options)){
      out.options=[out.option1,out.option2,out.option3,out.option4].filter(Boolean);
    }
    if(out.type==='اختر من متعدد' && out.answer && !out.options.includes(out.answer)){
      out.options=[out.answer,...out.options].filter(Boolean).slice(0,4);
    }
    return out;
  }
  const oldApplyQB=typeof applyQuestionBankDataContestantV9532==='function' ? applyQuestionBankDataContestantV9532 : null;
  window.applyQuestionBankDataContestantV9532 = applyQuestionBankDataContestantV9532 = function(data){
    if(!data || typeof DATA==='undefined') return;
    if(data.stage1) DATA.stage1=data.stage1.map(normalizeStage1QuestionV9534);
    if(data.stage2) DATA.stage2=data.stage2;
    if(data.stage3) DATA.stage3=data.stage3;
    if(data.stage4) DATA.stage4=data.stage4;
  };
  window.stage1QuestionTypeV9532 = stage1QuestionTypeV9532 = function(q,i){
    return normalizeStage1TypeV9534(q?.type || q?.typeName || (typeof stage1QuestionType==='function'?stage1QuestionType(q,i):'اختر من متعدد'));
  };
  if(typeof stage1QuestionType==='function'){
    window.stage1QuestionType = stage1QuestionType = function(q,i){ return stage1QuestionTypeV9532(q,i); };
  }
  if(typeof getStage1Plan==='function'){
    window.getStage1Plan = getStage1Plan = function(p){
      const total=Math.min(50,DATA.stage1.length);
      return [...Array(total).keys()].map(idx=>({idx,type:stage1QuestionTypeV9532(DATA.stage1[idx],idx)}));
    };
  }
  if(typeof renderStage1Question==='function'){
    window.renderStage1Question = renderStage1Question = function(q,i,type){
      q=normalizeStage1QuestionV9534(q);
      type=normalizeStage1TypeV9534(type || q.type);
      if(type==='اختر من متعدد'){
        const stableOptions=[...(q.options||[])].filter(Boolean);
        return stableOptions.map(o=>`<button class="answer" data-a="${String(o).replace(/"/g,'&quot;')}">${o}</button>`).join('');
      }
      return renderStage1Input(q,i,type);
    };
  }
  if(typeof bindStage1Answers==='function'){
    window.bindStage1Answers = bindStage1Answers = function(i,q,p,type){
      q=normalizeStage1QuestionV9534(q);
      type=normalizeStage1TypeV9534(type || q.type);
      if(type==='اختر من متعدد'){
        document.querySelectorAll('#a1 .answer').forEach(b=>b.onclick=()=>answerStage1(b,i,q,p,b.dataset.a));
        return;
      }
      const input=$('stage1Input'), submit=$('stage1Submit');
      if(input){
        input.onfocus=()=>{input.dataset.placeholder=input.dataset.placeholder||input.placeholder;input.placeholder='';};
        input.onblur=()=>{if(!input.value)input.placeholder=input.dataset.placeholder||'اكتب الإجابة هنا';};
        input.focus();
        input.onkeydown=e=>{if(e.key==='Enter')submit?.click();};
      }
      if(submit)submit.onclick=()=>answerStage1(submit,i,q,p,input?.value||'');
    };
  }
})();

/* ===== V9.5.35 Hotfix: Stage 1 start button + robust Excel bank arrays ===== */
(function(){
  function asQuestionArrayV9535(value){
    if(Array.isArray(value)) return value;
    if(!value) return [];
    if(Array.isArray(value.questions)) return value.questions;
    if(Array.isArray(value.items)) return value.items;
    if(typeof value === 'object'){
      return Object.keys(value)
        .sort((a,b)=>String(a).localeCompare(String(b), undefined, {numeric:true}))
        .map(k=>value[k])
        .filter(v=>v && typeof v === 'object');
    }
    return [];
  }
  function normTypeV9535(t){
    const raw=String(t||'').trim();
    const low=raw.toLowerCase();
    const compact=raw.replace(/[\sـ]+/g,'');
    if(['choice','multiple','select','mcq'].includes(low) || compact==='اخترمنمتعدد' || compact==='اخترمنمتعدّد' || raw==='اختر من متعدد') return 'اختر من متعدد';
    if(['missing'].includes(low) || compact==='ماذاينقص' || raw==='ماذا ينقص؟') return 'ماذا ينقص';
    if(['arrange'].includes(low) || compact==='رتب' || compact==='رتّب') return 'رتّب';
    if(['fill','blank'].includes(low) || compact==='فراغات' || compact==='أكملالفراغات' || compact==='اكملالفراغات') return 'فراغات';
    return raw || 'اختر من متعدد';
  }
  function normalizeQuestionV9535(q){
    if(!q) return q;
    const out=Object.assign({},q);
    out.type=normTypeV9535(out.type || out.typeName || out.kind);
    out.q=out.q || out.question || out.text || '';
    out.answer=out.answer || out.correct || out.correctAnswer || '';
    if(!Array.isArray(out.options)){
      out.options=[out.option1,out.option2,out.option3,out.option4,out.A,out.B,out.C,out.D].filter(v=>v!==undefined && v!==null && String(v).trim()!=='').map(String);
    }
    if(out.type==='اختر من متعدد'){
      out.options=[...out.options].filter(Boolean);
      if(out.answer && !out.options.some(o=>norm(o)===norm(out.answer))) out.options.unshift(out.answer);
      out.options=out.options.slice(0,4);
    }
    return out;
  }
  function normalizeBankV9535(data){
    if(!data) return null;
    return {
      stage1: asQuestionArrayV9535(data.stage1).map(normalizeQuestionV9535),
      stage2: asQuestionArrayV9535(data.stage2),
      stage3: asQuestionArrayV9535(data.stage3),
      stage4: asQuestionArrayV9535(data.stage4).map(normalizeQuestionV9535)
    };
  }
  window.applyQuestionBankDataContestantV9532 = applyQuestionBankDataContestantV9532 = function(data){
    if(!data || typeof DATA==='undefined') return;
    const bank=normalizeBankV9535(data);
    if(bank.stage1.length) DATA.stage1=bank.stage1;
    if(bank.stage2.length) DATA.stage2=bank.stage2;
    if(bank.stage3.length) DATA.stage3=bank.stage3;
    if(bank.stage4.length) DATA.stage4=bank.stage4;
  };
  window.stage1QuestionType = stage1QuestionType = function(q,i){ return normTypeV9535(q?.type || q?.typeName || STAGE1_TYPES[i%STAGE1_TYPES.length]); };
  window.stage1QuestionTypeV9532 = stage1QuestionTypeV9532 = function(q,i){ return stage1QuestionType(q,i); };
  window.buildStage1Plan = buildStage1Plan = function(seed){
    const list=Array.isArray(DATA?.stage1)?DATA.stage1:[];
    const total=Math.min(50,list.length);
    return [...Array(total).keys()].map(idx=>({idx,type:stage1QuestionType(list[idx],idx)}));
  };
  window.getStage1Plan = getStage1Plan = function(p){
    const list=Array.isArray(DATA?.stage1)?DATA.stage1:[];
    const total=Math.min(50,list.length);
    return [...Array(total).keys()].map(idx=>({idx,type:stage1QuestionType(list[idx],idx)}));
  };
  const oldStartStageV9535 = window.startStage || startStage;
  window.startStage = startStage = async function(id){
    try{
      if(!team) return alert('يجب تسجيل الدخول أولًا.');
      if(id==='stage1'){
        if(!Array.isArray(DATA?.stage1) || DATA.stage1.length===0){
          return alert('لا توجد أسئلة للمرحلة الأولى. تحقق من بنك الأسئلة أو ملف Excel.');
        }
        DATA.stage1=DATA.stage1.map(normalizeQuestionV9535);
      }
      const intro={stage1:'intro1',stage2:'intro2',stage3:'intro3',stage4:'intro4'}[id];
      const doneArr=Array.from(new Set([...(team.done||[]),intro].filter(Boolean)));
      const progress=Object.assign({
        stage1:{i:0,startedAt:0,remaining:420,ended:false},
        stage2:{answered:{},roles:{},matching:{}},
        stage3:{answered:{}},
        stage4:{i:0,streak:0,ended:false}
      }, team.progress||{});
      const extra={done:doneArr,current:id,progress};
      if(id==='stage1'){
        const startedAt=Date.now();
        extra.progress=Object.assign({},progress,{stage1:{i:0,startedAt,remaining:420,ended:false,order:buildStage1Plan(startedAt)}});
        if(team) team.progress=extra.progress;
      }
      if(id==='stage4'&&!progress.stage4){
        extra.progress=Object.assign({},progress,{stage4:{i:0,streak:0,ended:false}});
      }
      await patchTeam(extra);
      if(id==='stage3') ensureStage3Turn().catch(console.error);
      if(team){team.current=id;team.done=doneArr;team.progress=extra.progress;}
      page(id,false);
    }catch(e){
      console.error('startStage failed',e);
      alert('تعذر بدء المرحلة. تم إصلاح السبب غالبًا، جرّب تحديث الصفحة ثم البدء مرة أخرى.\n' + (e.message||''));
    }
  };
})();

/* ===== V9.5.36 Excel Live Sync hard fix =====
   Ensures contestant pages always load the active Firestore question bank before starting stages,
   while preserving stage2/stage3 object structures. */
(function(){
  const QB_COLLECTION_V9536='questionBanks';
  const QB_DOC_V9536='active';
  let qbLoadedOnceV9536=false;
  let qbLoadingPromiseV9536=null;

  function arrV9536(v){
    if(Array.isArray(v)) return v;
    if(!v) return [];
    if(Array.isArray(v.questions)) return v.questions;
    if(Array.isArray(v.items)) return v.items;
    if(typeof v==='object'){
      return Object.keys(v).sort((a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true})).map(k=>v[k]).filter(x=>x&&typeof x==='object');
    }
    return [];
  }
  function typeV9536(t){
    const raw=String(t||'').trim(); const low=raw.toLowerCase(); const compact=raw.replace(/[\sـ]+/g,'');
    if(['choice','multiple','select','mcq'].includes(low)||compact==='اخترمنمتعدد'||compact==='اخترمنمتعدّد'||raw==='اختر من متعدد') return 'اختر من متعدد';
    if(['missing'].includes(low)||compact==='ماذاينقص'||raw==='ماذا ينقص'||raw==='ماذا ينقص؟') return 'ماذا ينقص';
    if(['arrange'].includes(low)||compact==='رتب'||compact==='رتّب') return 'رتّب';
    if(['fill','blank'].includes(low)||compact==='فراغات'||compact==='أكملالفراغات'||compact==='اكملالفراغات') return 'فراغات';
    return raw || 'اختر من متعدد';
  }
  function normalizeQuestionV9536(q){
    const out=Object.assign({},q||{});
    out.type=typeV9536(out.type||out.typeName||out.kind);
    out.q=out.q||out.question||out.text||'';
    out.answer=out.answer||out.correct||out.correctAnswer||'';
    if(!Array.isArray(out.options)){
      out.options=[out.option1,out.option2,out.option3,out.option4,out.A,out.B,out.C,out.D]
        .filter(v=>v!==undefined&&v!==null&&String(v).trim()!=='').map(String);
    }
    if(out.type==='اختر من متعدد'){
      out.options=[...out.options].filter(Boolean);
      if(out.answer && !out.options.some(o=>norm(o)===norm(out.answer))) out.options.unshift(out.answer);
      out.options=out.options.slice(0,4);
    }
    if(Array.isArray(out.acceptedAnswers)) out.acceptedAnswers=out.acceptedAnswers.filter(Boolean);
    return out;
  }
  function normalizeStage2V9536(stage2){
    if(stage2 && Array.isArray(stage2.groups)) return stage2;
    const rows=arrV9536(stage2);
    if(!rows.length) return null;
    const titles={matching:'توصيل',complete:'أكمل الآيات',correct:'صحح الخطأ',truefalse:'صح أو خطأ'};
    const groupsMap={};
    rows.forEach(r=>{
      const type=String(r.type||r.kind||'complete').trim().toLowerCase();
      const key=['matching','complete','correct','truefalse'].includes(type)?type:'complete';
      groupsMap[key]=groupsMap[key]||{type:key,title:r.category||titles[key]||key,points:Number(r.points||15),questions:[]};
      groupsMap[key].questions.push({q:r.q||r.question||'',answer:r.answer||r.correct||'',options:[r.option1,r.option2,r.option3,r.option4].filter(Boolean),type:key==='truefalse'?'choice':(r.inputType||'text')});
    });
    const groups=['matching','complete','correct','truefalse'].map(k=>groupsMap[k]).filter(Boolean);
    return {passage:(DATA.stage2&&DATA.stage2.passage)||'',groups};
  }
  function normalizeBankV9536(data){
    if(!data) return null;
    return {
      stage1: arrV9536(data.stage1).map(normalizeQuestionV9536),
      stage2: normalizeStage2V9536(data.stage2),
      stage3: (data.stage3 && Array.isArray(data.stage3) ? data.stage3 : null),
      stage4: arrV9536(data.stage4).map(normalizeQuestionV9536)
    };
  }
  window.applyQuestionBankDataContestantV9532 = applyQuestionBankDataContestantV9532 = function(data){
    if(!data || typeof DATA==='undefined') return;
    const bank=normalizeBankV9536(data);
    if(bank.stage1 && bank.stage1.length) DATA.stage1=bank.stage1;
    if(bank.stage2 && Array.isArray(bank.stage2.groups) && bank.stage2.groups.length) DATA.stage2=bank.stage2;
    if(bank.stage3 && bank.stage3.length) DATA.stage3=bank.stage3;
    if(bank.stage4 && bank.stage4.length) DATA.stage4=bank.stage4;
  };
  window.loadActiveQuestionBankOnceV9536 = async function(){
    if(qbLoadingPromiseV9536) return qbLoadingPromiseV9536;
    qbLoadingPromiseV9536=(async()=>{
      try{
        const doc=await db.collection(QB_COLLECTION_V9536).doc(QB_DOC_V9536).get();
        if(doc.exists) applyQuestionBankDataContestantV9532((doc.data()||{}).data);
      }catch(e){console.warn('Active question bank could not be loaded; using bundled questions.',e);}
      qbLoadedOnceV9536=true;
    })();
    return qbLoadingPromiseV9536;
  };
  try{
    db.collection(QB_COLLECTION_V9536).doc(QB_DOC_V9536).onSnapshot(doc=>{
      if(doc.exists){ applyQuestionBankDataContestantV9532((doc.data()||{}).data); qbLoadedOnceV9536=true; if(team) updateUI(); }
      else { qbLoadedOnceV9536=true; }
    },e=>{console.warn('question bank live listener failed',e); qbLoadedOnceV9536=true;});
  }catch(e){console.warn('question bank listener setup failed',e); qbLoadedOnceV9536=true;}

  window.stage1QuestionType = stage1QuestionType = function(q,i){ return typeV9536(q?.type||q?.typeName||STAGE1_TYPES[i%STAGE1_TYPES.length]); };
  window.stage1QuestionTypeV9532 = stage1QuestionTypeV9532 = function(q,i){ return stage1QuestionType(q,i); };
  window.buildStage1Plan = buildStage1Plan = function(seed){
    const list=Array.isArray(DATA?.stage1)?DATA.stage1:[];
    const total=Math.min(50,list.length);
    return [...Array(total).keys()].map(idx=>({idx,type:stage1QuestionType(list[idx],idx)}));
  };
  window.getStage1Plan = getStage1Plan = function(p){
    const list=Array.isArray(DATA?.stage1)?DATA.stage1:[];
    const total=Math.min(50,list.length);
    return [...Array(total).keys()].map(idx=>({idx,type:stage1QuestionType(list[idx],idx)}));
  };

  const previousStartStageV9536 = window.startStage || startStage;
  window.startStage = startStage = async function(id){
    if(id==='stage1' || id==='stage2' || id==='stage3' || id==='stage4'){
      await window.loadActiveQuestionBankOnceV9536();
      if(id==='stage1' && Array.isArray(DATA.stage1)) DATA.stage1=DATA.stage1.map(normalizeQuestionV9536);
    }
    return previousStartStageV9536(id);
  };
  document.addEventListener('DOMContentLoaded',()=>{ setTimeout(()=>window.loadActiveQuestionBankOnceV9536(),100); });
})();

/* ===== V9.5.37 Real Excel Live Sync Fix =====
   Contestant pages read imported questions from meta/questionBank first, then fallback to questionBanks/active. */
(function(){
  const QB_META_DOC='questionBank';
  const QB_COLLECTION='questionBanks';
  const QB_DOC='active';
  let activeBankAppliedV9537=false;

  function cloneV9537(x){try{return JSON.parse(JSON.stringify(x));}catch(e){return x;}}
  function asArrV9537(v){
    if(Array.isArray(v)) return v;
    if(!v) return [];
    if(Array.isArray(v.questions)) return v.questions;
    if(Array.isArray(v.items)) return v.items;
    if(typeof v==='object') return Object.keys(v).sort((a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true})).map(k=>v[k]).filter(x=>x&&typeof x==='object');
    return [];
  }
  function typeV9537(t){
    const raw=String(t||'').trim(); const low=raw.toLowerCase(); const compact=raw.replace(/[\sـ]+/g,'');
    if(['choice','multiple','select','mcq'].includes(low)||compact==='اخترمنمتعدد'||compact==='اخترمنمتعدّد'||raw==='اختر من متعدد') return 'اختر من متعدد';
    if(['missing'].includes(low)||compact==='ماذاينقص'||raw==='ماذا ينقص'||raw==='ماذا ينقص؟') return 'ماذا ينقص';
    if(['arrange'].includes(low)||compact==='رتب'||compact==='رتّب') return 'رتّب';
    if(['fill','blank'].includes(low)||compact==='فراغات'||compact==='أكملالفراغات'||compact==='اكملالفراغات') return 'فراغات';
    return raw || 'اختر من متعدد';
  }
  function normalizeQ9537(q){
    const out=Object.assign({},q||{});
    out.type=typeV9537(out.type||out.typeName||out.kind);
    out.q=out.q||out.question||out.text||'';
    out.answer=out.answer||out.correct||out.correctAnswer||'';
    if(!Array.isArray(out.options)) out.options=[out.option1,out.option2,out.option3,out.option4,out.A,out.B,out.C,out.D].filter(v=>v!==undefined&&v!==null&&String(v).trim()!=='').map(String);
    out.options=(out.options||[]).map(x=>String(x||'').trim()).filter(Boolean);
    if(out.type==='اختر من متعدد'){
      if(out.answer && !out.options.some(o=>norm(o)===norm(out.answer))) out.options.unshift(out.answer);
      out.options=out.options.slice(0,4);
    }
    return out;
  }
  function normalizeStage2V9537(stage2){
    if(stage2 && Array.isArray(stage2.groups)) return stage2;
    const rows=asArrV9537(stage2); if(!rows.length) return null;
    const titles={matching:'توصيل',complete:'أكمل الآيات',correct:'صحح الخطأ',truefalse:'صح أو خطأ'};
    const groupsMap={};
    rows.forEach(r=>{
      const type=String(r.type||r.kind||'complete').trim().toLowerCase();
      const key=['matching','complete','correct','truefalse'].includes(type)?type:'complete';
      groupsMap[key]=groupsMap[key]||{type:key,title:r.category||titles[key]||key,points:Number(r.points||15),questions:[]};
      groupsMap[key].questions.push({q:r.q||r.question||'',answer:r.answer||r.correct||'',options:[r.option1,r.option2,r.option3,r.option4].filter(Boolean),type:key==='truefalse'?'choice':(r.inputType||'text'),targetPart:r.targetPart||''});
    });
    return {passage:(DATA.stage2&&DATA.stage2.passage)||'',groups:['matching','complete','correct','truefalse'].map(k=>groupsMap[k]).filter(Boolean)};
  }
  function applyBankV9537(data){
    if(!data || typeof DATA==='undefined') return false;
    const d=cloneV9537(data);
    const s1=asArrV9537(d.stage1).map(normalizeQ9537).filter(q=>q.q&&q.answer);
    const s2=normalizeStage2V9537(d.stage2);
    const s3=Array.isArray(d.stage3)?d.stage3:null;
    const s4=asArrV9537(d.stage4).map(normalizeQ9537).filter(q=>q.q&&q.answer);
    if(s1.length) DATA.stage1=s1;
    if(s2 && Array.isArray(s2.groups) && s2.groups.length) DATA.stage2=s2;
    if(s3 && s3.length) DATA.stage3=s3;
    if(s4.length) DATA.stage4=s4;
    activeBankAppliedV9537=true;
    return true;
  }
  window.applyQuestionBankDataContestantV9532 = applyQuestionBankDataContestantV9532 = applyBankV9537;

  async function fetchBankV9537(){
    try{
      const metaDoc=await db.collection('meta').doc(QB_META_DOC).get();
      if(metaDoc.exists && applyBankV9537((metaDoc.data()||{}).data)) return true;
    }catch(e){console.warn('meta/questionBank read failed',e);}
    try{
      const qbDoc=await db.collection(QB_COLLECTION).doc(QB_DOC).get();
      if(qbDoc.exists && applyBankV9537((qbDoc.data()||{}).data)) return true;
    }catch(e){console.warn('questionBanks/active read failed',e);}
    return false;
  }
  window.loadActiveQuestionBankOnceV9536 = async function(){ return fetchBankV9537(); };
  try{
    db.collection('meta').doc(QB_META_DOC).onSnapshot(doc=>{
      if(doc.exists){ applyBankV9537((doc.data()||{}).data); if(team) updateUI(); }
    },e=>console.warn('meta/questionBank live listener failed',e));
  }catch(e){console.warn('meta/questionBank listener setup failed',e);}

  window.stage1QuestionType = stage1QuestionType = function(q,i){ return typeV9537(q?.type||q?.typeName||STAGE1_TYPES[i%STAGE1_TYPES.length]); };
  window.stage1QuestionTypeV9532 = stage1QuestionTypeV9532 = function(q,i){ return stage1QuestionType(q,i); };
  window.buildStage1Plan = buildStage1Plan = function(seed){
    const list=Array.isArray(DATA?.stage1)?DATA.stage1:[];
    return [...Array(Math.min(50,list.length)).keys()].map(idx=>({idx,type:stage1QuestionType(list[idx],idx)}));
  };
  window.getStage1Plan = getStage1Plan = function(p){
    const list=Array.isArray(DATA?.stage1)?DATA.stage1:[];
    return [...Array(Math.min(50,list.length)).keys()].map(idx=>({idx,type:stage1QuestionType(list[idx],idx)}));
  };
  const prevStartV9537=window.startStage || startStage;
  window.startStage = startStage = async function(id){
    if(['stage1','stage2','stage3','stage4'].includes(id)) await fetchBankV9537();
    return prevStartV9537(id);
  };
  document.addEventListener('DOMContentLoaded',()=>setTimeout(fetchBankV9537,50));
})();


/* ===== V9.5.38 Contestant Firestore-safe question bank reader ===== */
(function(){
  function parseBankPayloadV9538(docData){
    if(!docData) return null;
    if(docData.dataJson){
      try{return JSON.parse(docData.dataJson);}catch(e){console.warn('Failed to parse question bank JSON',e);}
    }
    return docData.data || null;
  }
  const oldApplyV9538 = window.applyQuestionBankDataContestantV9532 || applyQuestionBankDataContestantV9532;
  function applyBankV9538(data){
    return oldApplyV9538 ? oldApplyV9538(data) : false;
  }
  window.loadActiveQuestionBankOnceV9536 = async function(){
    try{
      const metaDoc=await db.collection('meta').doc('questionBank').get();
      if(metaDoc.exists && applyBankV9538(parseBankPayloadV9538(metaDoc.data()||{}))) return true;
    }catch(e){console.warn('meta/questionBank read failed',e);}
    try{
      const qbDoc=await db.collection('questionBanks').doc('active').get();
      if(qbDoc.exists && applyBankV9538(parseBankPayloadV9538(qbDoc.data()||{}))) return true;
    }catch(e){console.warn('questionBanks/active read failed',e);}
    return false;
  };
  try{
    db.collection('meta').doc('questionBank').onSnapshot(doc=>{
      if(doc.exists){
        const data=parseBankPayloadV9538(doc.data()||{});
        if(applyBankV9538(data) && team) updateUI();
      }
    },e=>console.warn('meta/questionBank live listener failed',e));
  }catch(e){console.warn('meta/questionBank listener setup failed',e);}
})();

/* ===== V9.5.39 Final Gameplay Tools: arrange click ordering + stable imported types ===== */
function normalizeStageQuestionTypeV9539(t){
  const s=String(t||'').trim().toLowerCase();
  if(['choice','choose','multiple','mcq','اختر من متعدد'].includes(s))return 'اختر من متعدد';
  if(['arrange','order','sort','رتب','رتّب'].includes(s))return 'رتّب';
  if(['missing','ماذا ينقص'].includes(s))return 'ماذا ينقص';
  if(['fill','blank','فراغات','أكمل الفراغات','اكمل الفراغات'].includes(s))return 'فراغات';
  return t||'اختر من متعدد';
}
function stage1QuestionType(q,i){return normalizeStageQuestionTypeV9539(q?.type||STAGE1_TYPES[i%STAGE1_TYPES.length]||'اختر من متعدد');}
function getArrangeItemsV9539(q){
  const opts=(q?.options||[]).filter(Boolean).map(x=>String(x).trim()).filter(Boolean);
  if(opts.length>=2)return opts.slice(0,6);
  const raw=String(q?.answer||q?.data||'').trim();
  if(raw.includes('|'))return raw.split('|').map(x=>x.trim()).filter(Boolean);
  if(raw.includes('،'))return raw.split('،').map(x=>x.trim()).filter(Boolean);
  if(raw.includes(','))return raw.split(',').map(x=>x.trim()).filter(Boolean);
  return raw.split(/\s+/).map(x=>x.trim()).filter(Boolean);
}
function getArrangeCorrectV9539(q){
  const raw=String(q?.answer||'').trim();
  if(raw.includes('|'))return raw.split('|').map(x=>x.trim()).filter(Boolean);
  if(raw.includes('،'))return raw.split('،').map(x=>x.trim()).filter(Boolean);
  if(raw.includes(','))return raw.split(',').map(x=>x.trim()).filter(Boolean);
  return raw.split(/\s+/).map(x=>x.trim()).filter(Boolean);
}
function renderStage1ArrangeClickV9539(q,i){
  const items=seededShuffle(getArrangeItemsV9539(q),`stage1-arrange-click|${i}|${q.q||''}`);
  return `<div class="stage1-arrange-click-card" data-arrange-question="${i}">
    <p class="muted"></p>
    <div class="arrange-click-options">${items.map((x,idx)=>`<button type="button" class="answer arrange-option" data-value="${stage1EscV9418(x)}" data-idx="${idx}">${stage1EscV9418(x)}</button>`).join('')}</div>
    <div class="arrange-selected-wrap"><b>ترتيبك:</b><div id="arrangeSelectedV9539" class="arrange-selected-list"><span class="muted">لم تختر بعد</span></div></div>
    <div class="arrange-actions"><button type="button" class="btn secondary" id="arrangeResetV9539">إعادة الترتيب</button><button type="button" class="btn" id="arrangeSubmitV9539" disabled>تأكيد الترتيب</button></div>
  </div>`;
}
/* refactor: removed obsolete earlier definition of renderStage1Question from original line 2015; final definition is kept later. */
/* refactor: removed obsolete earlier definition of bindStage1Answers from original line 2024; final definition is kept later. */
/* refactor: removed obsolete earlier definition of answerStage1 from original line 2050; final definition is kept later. */

/* ===== V9.5.40 Final requested fix: real click-to-order Stage 1 arrange ===== */
function stage1ArrangeItemsV9540(q,i){
  const raw=String(q?.answer||'').trim();
  let parts=[];
  if(Array.isArray(q?.arrangeOptions) && q.arrangeOptions.length>=4) parts=q.arrangeOptions.slice(0,4).map(String);
  else if(String(q?.arrange||'').trim()) parts=String(q.arrange).split(/\s*[|،,؛;]\s*/).filter(Boolean).slice(0,4);
  else{
    const words=raw.split(/\s+/).filter(Boolean);
    if(words.length===4) parts=words;
    else if(words.length>4){
      const size=Math.ceil(words.length/4);
      for(let x=0;x<4;x++) parts.push(words.slice(x*size,(x+1)*size).join(' '));
    }else{
      const chars=[...raw.replace(/\s+/g,'')];
      const size=Math.ceil(Math.max(chars.length,1)/4);
      for(let x=0;x<4;x++) parts.push(chars.slice(x*size,(x+1)*size).join(''));
    }
  }
  while(parts.length<4) parts.push('—');
  return parts.slice(0,4).map(x=>String(x||'—'));
}
function renderStage1ArrangeV9540(q,i){
  const items=seededShuffle(stage1ArrangeItemsV9540(q,i),`arrange-v9540|${teamName}|${i}|${q?.q||''}`);
  return `<div class="stage1-arrange-click" data-answer=""><p class="muted"></p><div class="arrange-options-v9540">${items.map((x,n)=>`<button class="answer arrange-option-v9540" type="button" data-value="${String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}">${String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}</button>`).join('')}</div><div class="arrange-picked-v9540"><b>الترتيب المختار:</b><div id="arrangePickedListV9540" class="arrange-picked-list-v9540">لم يتم اختيار شيء بعد</div></div><div class="arrange-actions-v9540"><button class="btn secondary" id="arrangeResetV9540" type="button">إعادة الترتيب</button><button class="btn stage1-submit" id="stage1Submit" type="button" disabled>تأكيد الترتيب</button></div></div>`;
}
/* refactor: removed obsolete earlier definition of renderStage1Input from original line 2099; final definition is kept later. */
/* refactor: removed obsolete earlier definition of bindStage1Answers from original line 2103; final definition is kept later. */

/* ===== V9.5.40 enforce 15s Stage 3 choice timer on contestant selection ===== */
window.choose3 = async function(ci,i){
  const key=ci+'_'+i, ref=db.collection('stage3Locks').doc(key);
  try{
    await ensureStage3Turn();
    await db.runTransaction(async tx=>{
      const activeRef=db.collection('meta').doc('activeStage3');
      const turnRef=db.collection('meta').doc('stage3Turn');
      const active=await tx.get(activeRef);
      const turn=await tx.get(turnRef);
      const lock=await tx.get(ref);
      const activeData=active.data()||{};
      const turnData=turn.data()||{};
      if(activeData.id)throw new Error('يوجد سؤال مفتوح الآن');
      if(turnData.turnStartedAtMs && (Date.now()-Number(turnData.turnStartedAtMs))>Number(turnData.turnDuration||15)*1000)throw new Error('انتهى وقت اختيار السؤال. انتظروا الدور التالي.');
      const isMyTurn=!turnData.team || sameTeam(turnData.team,teamName) || sameTeam(turnData.teamName,teamName) || sameTeam(turnData.team,myTeamDocId());
      if(!isMyTurn)throw new Error('ليس دور فريقكم الآن');
      if(lock.exists&&lock.data().answered)throw new Error('تم استخدام السؤال');
      const ownerId=myTeamDocId();
      const ownerName=team?.name||teamName;
      const startedAtMs=Date.now();
      tx.set(ref,{team:ownerId,teamName:ownerName,answered:false,createdAt:FieldValue.serverTimestamp(),startedAtMs},{merge:true});
      tx.set(activeRef,{id:key,team:ownerId,teamName:ownerName,status:'asking',duration:(window.SUFARAA_GAME_FLOW?SUFARAA_GAME_FLOW.localDuration('stageQuestion',15):15),startedAtMs,revealDone:false},{merge:true});
    });
  }catch(e){alert(e.message||'لا يمكن اختيار السؤال الآن')}
};


/* ===== V9.5.41 Final Stage 1 Arrange Fix: real click ordering, 4 equal options, correct comparison ===== */
function s1EscV9541(x){return String(x??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));}
function normalizeStageQuestionTypeV9541(t){
  const raw=String(t||'').trim(); const low=raw.toLowerCase(); const compact=raw.replace(/[\sـ]/g,'');
  if(['arrange','order','sort','رتب','رتّب'].includes(low)||compact==='رتب'||compact==='رتّب')return 'رتّب';
  if(['choice','multiple','اختر من متعدد','اختيار'].includes(low))return 'اختر من متعدد';
  if(['missing','ماذا ينقص','ماذا ينقص؟'].includes(low))return 'ماذا ينقص';
  if(['fill','blank','فراغات','أكمل الفراغات','اكمل الفراغات'].includes(low))return 'فراغات';
  return raw||'اختر من متعدد';
}
function splitArrangePartsV9541(v){return String(v||'').split(/\s*[|،,؛;\n]+\s*/).map(x=>x.trim()).filter(Boolean);}
function arrangePartsV9541(q){
  let parts=[];
  if(Array.isArray(q?.options)&&q.options.filter(Boolean).length>=4)parts=q.options.filter(Boolean).slice(0,4).map(String);
  else if(Array.isArray(q?.arrangeOptions)&&q.arrangeOptions.length>=4)parts=q.arrangeOptions.slice(0,4).map(String);
  else if(String(q?.arrange||'').trim())parts=splitArrangePartsV9541(q.arrange).slice(0,4);
  else if(splitArrangePartsV9541(q?.answer).length>=4)parts=splitArrangePartsV9541(q.answer).slice(0,4);
  else{
    const words=String(q?.answer||'').trim().split(/\s+/).filter(Boolean);
    if(words.length<=4)parts=words;
    else{const size=Math.ceil(words.length/4); for(let i=0;i<4;i++)parts.push(words.slice(i*size,(i+1)*size).join(' '));}
  }
  parts=parts.map(x=>String(x||'').trim()).filter(Boolean);
  while(parts.length<4)parts.push('—');
  return parts.slice(0,4);
}
function arrangeExpectedV9541(q){return arrangePartsV9541(q).join(' ');}
function renderStage1ArrangeV9541(q,i){
  const items=seededShuffle(arrangePartsV9541(q),`arrange-v9541|${teamName}|${i}|${q?.q||''}`);
  return `<div class="stage1-arrange-click-v9541"><p class="muted arrange-help-v9541"></p><div class="arrange-options-v9541">${items.map(x=>`<button class="answer arrange-option-v9541" type="button" data-value="${s1EscV9541(x)}">${s1EscV9541(x)}</button>`).join('')}</div><div class="arrange-picked-v9541"><b>الترتيب المختار:</b><div id="arrangePickedListV9541" class="arrange-picked-list-v9541"><span class="muted">لم تختر بعد</span></div></div><div class="arrange-actions-v9541"><button class="btn secondary" id="arrangeResetV9541" type="button">إعادة الترتيب</button><button class="btn stage1-submit" id="stage1Submit" type="button" disabled>تأكيد الترتيب</button></div></div>`;
}
/* refactor: removed obsolete earlier definition of renderStage1Input from original line 2197; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderStage1Question from original line 2202; final definition is kept later. */
/* refactor: removed obsolete earlier definition of bindStage1Answers from original line 2208; final definition is kept later. */
async function answerStage1(trigger,i,q,p,selected){
  if(stage1Busy || stage1PendingAdvance)return;
  const answer=String(selected||'').trim(); if(!answer)return;
  stage1Busy=true; stage1PendingAdvance=true;
  const qtype=normalizeStageQuestionTypeV9541(q?.type||STAGE1_TYPES[i%STAGE1_TYPES.length]||'اختر من متعدد');
  const expected=qtype==='رتّب'?arrangeExpectedV9541(q):String(q.answer||'');
  const ok=norm(answer)===norm(expected);
  if(trigger)trigger.classList.add('stage1-selected');
  document.querySelectorAll('#a1 button,#a1 input').forEach(x=>x.disabled=true);
  const pts=ok?5:0;
  const remaining=stage1Runtime.remaining??(()=>{const secText=($('timer1')?.innerText||'07:00').split(':');return (Number(secText[0]||0)*60)+Number(secText[1]||0);})();
  const nextI=i+1; stage1LocalI=nextI; stage1LocalKey=String((team.progress?.stage1||{}).startedAt||'stage1');
  const latestStage1=Object.assign({},team.progress?.stage1||p,{i:nextI,remaining});
  if(team?.progress?.stage1)team.progress.stage1=latestStage1;
  stage1Busy=false; stage1PendingAdvance=false; showQ1();
  try{await changeScore(pts,'stage1',makeLog('اجمعوا الكنوز',q.q,answer,expected,ok,pts),{progress:Object.assign({},team.progress,{stage1:latestStage1})});}
  catch(e){console.error(e);} finally{stage1Busy=false;stage1PendingAdvance=false;}
}


/* ===== V9.5.47 Contestant fixes ===== */
(function(){
  'use strict';
  function escH(v){return String(v??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));}
  window.render4 = render4 = function(){
    const live=stage4LiveV95 || {status:'waiting',index:team?.progress?.stage4?.i||0};
    const idx=Number(live.index||0);
    const q=DATA.stage4?.[idx];
    const p=team.progress?.stage4||{i:0,streak:0};
    if(!q){ return finishAll(); }
    $('count4').innerText=`سؤال ${idx+1} من ${DATA.stage4.length}`;
    if($('stage4Type')) $('stage4Type').innerText=stage4QuestionType(q);
    $('streak').innerText='متتالية: '+(p.streak||0);
    $('progress4').style.width=(idx/DATA.stage4.length*100)+'%';
    const left=liveTimeLeftSeconds(live);
    const asking=live.status==='asking' && left>0;
    const roundId='stage4_'+idx+'_'+String(live.startedAtMs||'manual');
    const answered=teamLiveAnswer('stage4',roundId);
    if(!live.startedAtMs || live.status==='waiting'){
      $('q4').innerHTML=`<div class="stage4-wait-card"><h3>بانتظار بداية المرحلة الرابعة</h3><p>لن يظهر السؤال إلا بعد أن يضغط الميسر زر <b>بداية المرحلة</b>.</p></div>`;
      $('a4').innerHTML='<div class="stage4-wait-card"><h3>انتظروا بداية السؤال من لوحة الميسر</h3><p>عند بدء السؤال ستظهر خانة الإجابة والوقت هنا.</p></div>';
      clearInterval(stage4LiveTimerV95);
      return;
    }
    $('q4').innerHTML=`${escH(q.q)}<div class="stage4-live-meta"><span class="timer ${left<=5?'timer-danger':''}" id="stage4LiveTimer">${asking?left:0}s</span></div>`;
    clearInterval(stage4LiveTimerV95);
    stage4LiveTimerV95=setInterval(()=>{ if(team?.current!=='stage4'){ clearInterval(stage4LiveTimerV95); return; } const el=$('stage4LiveTimer'); if(el&&stage4LiveV95){ const l=liveTimeLeftSeconds(stage4LiveV95); el.textContent=(stage4LiveV95.status==='asking'?l:0)+'s'; el.classList.toggle('timer-danger',l<=5); if(l<=0) render4(); } },500);
    if(answered){ $('a4').innerHTML=`<div class="stage4-wait-card"><h3>تم تسجيل إجابتكم</h3><p>إجابتكم: <b>${escH(answered.answer)}</b></p><span class="badge green">انتظروا عرض النتائج</span></div>`; return; }
    if(!asking){ $('a4').innerHTML='<div class="stage4-wait-card"><h3>انتهى وقت الإجابة</h3><p>انتظروا عرض الإجابات على شاشة الجمهور.</p></div>'; return; }
    $('a4').innerHTML=`<div class="stage4-input-card"><input id="stage4LiveAnswer" placeholder="اكتب إجابتك هنا"><button class="btn" id="stage4SendBtn">إرسال الإجابة</button><button class="btn secondary" id="stage4SkipBtn">تخطي</button></div>`;
    $('stage4SendBtn').onclick=()=>submitStage4LiveAnswer(false);
    $('stage4SkipBtn').onclick=()=>submitStage4LiveAnswer(true);
  };
})();


/* ===== V9.5.49 final arrange renderer ===== */
(function(){
  'use strict';
  if(typeof renderStage1ArrangeV9541==='function'){
    window.renderStage1ArrangeV9541 = renderStage1ArrangeV9541 = function(q,i){
      const items=seededShuffle(arrangePartsV9541(q),`arrange-v9549|${teamName}|${i}|${q?.q||''}`);
      return `<div class="stage1-arrange-click-v9549"><p class="muted arrange-help-v9549"></p><div class="arrange-options-v9549">${items.map(x=>`<button class="answer arrange-option-v9541 arrange-option-v9549" type="button" data-value="${s1EscV9541(x)}">${s1EscV9541(x)}</button>`).join('')}</div><div class="arrange-picked-v9549"><b>الترتيب المختار:</b><div id="arrangePickedListV9541" class="arrange-picked-list-v9541 arrange-picked-list-v9549"><span class="muted">لم تختر بعد</span></div></div><div class="arrange-actions-v9549"><button class="btn secondary" id="arrangeResetV9541" type="button">إعادة الترتيب</button><button class="btn stage1-submit" id="stage1Submit" type="button" disabled>تأكيد الترتيب</button></div></div>`;
    };
  }
})();


/* ===== V9.5.50 Deep fix: single final Stage 1 arrange renderer ===== */
function renderStage1ArrangeV9550(q,i){
  const parts=(typeof arrangePartsV9541==='function'?arrangePartsV9541(q):stage1ArrangeItemsV9540(q,i)).slice(0,4);
  const items=(typeof seededShuffle==='function'?seededShuffle(parts,`arrange-v9550|${teamName}|${i}|${q?.q||''}`):parts);
  const esc=(typeof s1EscV9541==='function')?s1EscV9541:(x=>String(x??''));
  return `<div class="stage1-arrange-v9550">
    <p class="arrange-help-v9550"></p>
    <div class="arrange-options-v9550">${items.map(x=>`<button class="answer arrange-option-v9550" type="button" data-value="${esc(x)}">${esc(x)}</button>`).join('')}</div>
    <div class="arrange-picked-v9550"><b>الترتيب المختار:</b><div id="arrangePickedListV9550" class="arrange-picked-list-v9550"><span class="muted">لم تختر بعد</span></div></div>
    <div class="arrange-action-bar-v9550"><button class="btn secondary arrange-reset-v9550" id="arrangeResetV9550" type="button">إعادة الترتيب</button><button class="btn stage1-submit arrange-submit-v9550" id="stage1Submit" type="button" disabled>تأكيد الترتيب</button></div>
  </div>`;
}
function renderStage1Input(q,i,type){
  type=(typeof normalizeStageQuestionTypeV9541==='function'?normalizeStageQuestionTypeV9541(type):type);
  if(type==='رتّب') return renderStage1ArrangeV9550(q,i);
  return `<div class="stage1-input-card"><input id="stage1Input" class="stage1-input" autocomplete="off" placeholder="اكتب الإجابة هنا"><button class="btn stage1-submit" id="stage1Submit" type="button">تسجيل الإجابة</button></div>`;
}
function renderStage1Question(q,i,type){
  type=(typeof normalizeStageQuestionTypeV9541==='function'?normalizeStageQuestionTypeV9541(type):type);
  const esc=(typeof s1EscV9541==='function')?s1EscV9541:(x=>String(x??''));
  if(type==='اختر من متعدد') return [...(q.options||[])].filter(Boolean).map(o=>`<button class="answer" data-a="${esc(o)}">${esc(o)}</button>`).join('');
  if(type==='رتّب') return renderStage1ArrangeV9550(q,i);
  return renderStage1Input(q,i,type);
}
function bindStage1Answers(i,q,p,type){
  type=(typeof normalizeStageQuestionTypeV9541==='function'?normalizeStageQuestionTypeV9541(type):type);
  if(type==='اختر من متعدد'){
    document.querySelectorAll('#a1 .answer').forEach(b=>b.onclick=()=>answerStage1(b,i,q,p,b.dataset.a));
    return;
  }
  if(type==='رتّب'){
    const expected=(typeof arrangePartsV9541==='function'?arrangePartsV9541(q):stage1ArrangeItemsV9540(q,i)).slice(0,4);
    const picked=[];
    const esc=(typeof s1EscV9541==='function')?s1EscV9541:(x=>String(x??''));
    const list=document.getElementById('arrangePickedListV9550');
    const submit=document.getElementById('stage1Submit');
    const reset=document.getElementById('arrangeResetV9550');
    const refresh=()=>{
      if(list) list.innerHTML=picked.length?picked.map((x,n)=>`<span class="arrange-picked-chip-v9550"><b>${n+1}</b>${esc(x)}</span>`).join(''):'<span class="muted">لم تختر بعد</span>';
      if(submit) submit.disabled=picked.length!==expected.length;
    };
    document.querySelectorAll('#a1 .arrange-option-v9550').forEach(btn=>{
      btn.onclick=()=>{ if(btn.disabled||picked.length>=expected.length)return; picked.push(btn.dataset.value||btn.textContent.trim()); btn.disabled=true; btn.classList.add('stage1-selected','picked'); refresh(); };
    });
    if(reset) reset.onclick=()=>{ picked.length=0; document.querySelectorAll('#a1 .arrange-option-v9550').forEach(b=>{b.disabled=false;b.classList.remove('stage1-selected','picked')}); refresh(); };
    if(submit) submit.onclick=()=>answerStage1(submit,i,q,p,picked.join(' '));
    refresh();
    return;
  }
  const input=document.getElementById('stage1Input'), submit=document.getElementById('stage1Submit');
  if(input){input.onfocus=()=>{input.dataset.placeholder=input.dataset.placeholder||input.placeholder;input.placeholder='';};input.onblur=()=>{if(!input.value)input.placeholder=input.dataset.placeholder||'اكتب الإجابة هنا';};input.focus();input.onkeydown=e=>{if(e.key==='Enter')submit?.click();};}
  if(submit)submit.onclick=()=>answerStage1(submit,i,q,p,input?.value||'');
}

/* ===== V9.5.54 CLEAN FINAL: no contestant correctness/score feedback ===== */
(function(){
  'use strict';
  window.showScorePop = showScorePop = function(){ return; };
  document.addEventListener('click',()=>{ setTimeout(()=>{document.querySelectorAll('.answer.correct,.answer.wrong,.match-left.correct,.match-right.correct,.match-left.wrong,.match-right.wrong').forEach(el=>{el.classList.remove('correct','wrong');el.classList.add('answer-locked');});},0); }, true);
})();

/* ===== V9.5.55 FINAL: contestant never sees correctness/points after stage 3/4 answers ===== */
(function(){
  'use strict';
  window.showScorePop = showScorePop = function(){ return; };
  function safe(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));}
  if(typeof renderActive3==='function'){
    window.renderActive3 = renderActive3 = function(){
      const box=$('stage3Box'), answers=$('a3'), meta=$('stage3Meta'), question=$('q3'), note=$('stage3OwnerNote');
      if(!box||!answers||!meta||!question||!note)return;
      const info=stage3CurrentQuestion();
      if(!activeStage3||!activeStage3.id||!info||stage3Locks[activeStage3.id]?.answered){box.classList.add('hidden');setStage3ActiveState(false);return;}
      const owner=activeStage3.team;
      const ownerDisplay=activeStage3.teamName||teamDisplayName(owner);
      const isOwner=sameTeam(owner,teamName);
      const roundId=activeStage3RoundId();
      const answered=teamLiveAnswer('stage3',roundId);
      const left=liveTimeLeftSeconds(activeStage3);
      const locked=left<=0 || activeStage3.status==='locked' || activeStage3.status==='revealing' || activeStage3.status==='paused';
      box.classList.remove('hidden');
      setStage3ActiveState(true);
      meta.innerText=`${info.cat.cat} - ${info.level} | صاحب السؤال: ${ownerDisplay}`;
      question.innerText=info.text;
      box.classList.toggle('stage3-reveal-active-v9615', activeStage3.status==='revealing' || activeStage3.revealDone);
      if(activeStage3.status==='revealing' || activeStage3.revealDone){
        note.innerHTML=`<span class="timer" id="stage3LiveTimer">عرض</span> يتم الآن إظهار الإجابات على شاشة الجمهور.`;
        answers.innerHTML=`<div class="stage3-public-reveal-note-v9615"><h3>الإجابات تظهر الآن على شاشة الجمهور</h3><p>انتظروا عودة الميسر إلى جدول الأسئلة.</p></div>`;
        clearInterval(stage3AudienceTimerV95);
        return;
      }
      note.innerHTML=`<span class="timer ${left<=5?'timer-danger':''}" id="stage3LiveTimer">${left}s</span> ` + (isOwner?'هذا سؤالكم: لا يمكن التخطي.':'أجيبوا خلال الوقت المحدد. تخطي الإجابة متاح للفرق غير صاحبة السؤال.');
      clearInterval(stage3AudienceTimerV95);
      stage3AudienceTimerV95=setInterval(()=>{if(team?.current!=='stage3'){clearInterval(stage3AudienceTimerV95);return;} const el=$('stage3LiveTimer'); if(el&&activeStage3){const l=liveTimeLeftSeconds(activeStage3); el.textContent=l+'s'; el.classList.toggle('timer-danger',l<=5); if(l<=0)renderActive3();}},500);
      if(answered){answers.innerHTML=`<p class="badge green">تم تسجيل إجابة فريقكم. انتظروا إعلان النتائج على شاشة الجمهور.</p>`;return;}
      if(locked){answers.innerHTML='<p class="badge">انتهى وقت الإجابة. انتظروا إعلان النتائج على شاشة الجمهور.</p>';return;}
      let opts=[info.correct,'يسوع','موسى','داود','بطرس','بولس','نوح'].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4);
      if(!opts.includes(info.correct))opts[0]=info.correct;
      answers.innerHTML=seededShuffle(opts,`${roundId}|opts`).map(o=>`<button class="answer" data-a="${safe(o)}">${safe(o)}</button>`).join('')+(isOwner?'':"<button class='btn secondary skip-stage3' id='skip3Btn'>تخطي الإجابة</button>");
      const skipBtn=document.getElementById('skip3Btn');
      if(skipBtn)skipBtn.onclick=()=>skip3(info.key);
      document.querySelectorAll('#a3 .answer').forEach(b=>b.onclick=()=>answer3(info.key,b));
    };
  }
  if(typeof render4==='function'){
    const previousRender4 = render4;
    window.render4 = render4 = function(){
      previousRender4();
      try{
        const live=stage4LiveV95 || {};
        const idx=Number(live.index||0);
        const roundId='stage4_'+idx+'_'+String(live.startedAtMs||'manual');
        const answered=teamLiveAnswer('stage4',roundId);
        if(answered && $('a4')){
          $('a4').innerHTML=`<div class="stage4-wait-card"><h3>تم تسجيل إجابتكم</h3><p>انتظروا إعلان النتائج على شاشة الجمهور.</p></div>`;
        }
      }catch(e){}
    };
  }
})();


/* ===== V9.5.89B CLEAN SOURCE: Stage 1 single renderer, Choice confirms from source ===== */
(function(){
  'use strict';

  function s1Esc(v){
    return String(v ?? '').replace(/[&<>"']/g, m => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[m]));
  }

  function s1Type(q, i, forcedType){
    const raw = forcedType || q?.type || q?.typeName || q?.kind ||
      (typeof stage1QuestionType === 'function' ? stage1QuestionType(q, i) : '') ||
      STAGE1_TYPES?.[i % STAGE1_TYPES.length] ||
      'اختر من متعدد';

    if (typeof normalizeStageQuestionTypeV9541 === 'function') {
      return normalizeStageQuestionTypeV9541(raw);
    }

    const text = String(raw || '').trim();
    const compact = text.replace(/[\sـ]+/g, '');
    const low = text.toLowerCase();

    if (['choice','multiple','select','mcq'].includes(low) || compact === 'اخترمنمتعدد' || compact === 'اخترمنمتعدّد') return 'اختر من متعدد';
    if (['arrange','order'].includes(low) || compact === 'رتب' || compact === 'رتّب') return 'رتّب';
    if (['missing'].includes(low) || compact === 'ماذاينقص') return 'ماذا ينقص';
    if (['fill','blank'].includes(low) || compact === 'فراغات' || compact === 'أكملالفراغات' || compact === 'اكملالفراغات') return 'فراغات';

    return text || 'اختر من متعدد';
  }


  function s1ChoiceOptions(q){
    if (!q) return [];

    const directArrays = [
      q.options,
      q.choices,
      q.answers,
      q.alternatives,
      q.opts
    ];

    for (const arr of directArrays) {
      if (Array.isArray(arr)) {
        const clean = arr.map(x => String(x ?? '').trim()).filter(Boolean);
        if (clean.length >= 2) return clean;
      }
    }

    const numbered = [
      q.option1, q.option2, q.option3, q.option4,
      q.choice1, q.choice2, q.choice3, q.choice4,
      q.a, q.b, q.c, q.d
    ].map(x => String(x ?? '').trim()).filter(Boolean);

    if (numbered.length >= 2) return numbered;

    return [];
  }

  function s1IsChoice(q, i, forcedType){
    const normalizedType = s1Type(q, i, forcedType);
    const hasOptions = s1ChoiceOptions(q).length >= 2;
    const raw = String(forcedType || q?.type || q?.typeName || q?.kind || '').trim();
    const compact = raw.replace(/[\sـ]+/g, '');
    const low = raw.toLowerCase();

    return normalizedType === 'اختر من متعدد' ||
      hasOptions ||
      compact === 'اختيارمنمتعدد' ||
      compact === 'اختيارمتعدد' ||
      compact === 'اخترمتعدد' ||
      compact === 'اخترمنمتعدد' ||
      compact === 'اخترمنمتعدّد' ||
      ['choice','multiple','select','mcq','quiz','options'].includes(low);
  }

  function s1Accepted(answer, q){
    if (typeof isAcceptedAnswerV9532 === 'function') return isAcceptedAnswerV9532(answer, q);

    const accepted = [];
    if (q?.answer) accepted.push(q.answer);
    if (q?.correct) accepted.push(q.correct);
    if (Array.isArray(q?.acceptedAnswers)) accepted.push(...q.acceptedAnswers);

    const normalized = norm(answer || '');
    return accepted.filter(Boolean).some(x => norm(x) === normalized);
  }

  function s1ArrangeParts(q){
    if (typeof arrangePartsV9541 === 'function') {
      return arrangePartsV9541(q).filter(Boolean).slice(0, 4);
    }

    const raw = String(q?.answer || q?.correct || '').trim();
    if (!raw) return [];
    return (raw.includes(' ') ? raw.split(/\s+/) : raw.split('')).filter(Boolean).slice(0, 4);
  }

  function s1ArrangeExpected(q){
    if (typeof arrangeExpectedV9541 === 'function') return arrangeExpectedV9541(q);
    return s1ArrangeParts(q).join(' ');
  }

  function s1SetStatus(message, tone){
    const el = document.getElementById('stage1CleanStatus');
    if (!el) return;
    el.className = 'stage1-clean-status' + (tone ? ' ' + tone : '');
    el.innerHTML = message;
  }

  function s1SetConfirmReady(button, ready){
    if (!button) return;
    button.disabled = !ready;
    button.classList.toggle('ready', !!ready);
  }

  function s1FitQuestion(){
    const qEl = document.getElementById('q1');
    if (!qEl) return;

    const text = String(qEl.textContent || '').trim();
    qEl.classList.add('stage1-clean-question');
    qEl.classList.toggle('stage1-clean-question-long', text.length > 95 && text.length <= 170);
    qEl.classList.toggle('stage1-clean-question-very-long', text.length > 170);

    qEl.style.overflow = '';
    qEl.style.overflowY = '';
    qEl.style.maxHeight = '';
  }

  function s1RenderChoice(q){
    const options = s1ChoiceOptions(q);
    return `
      <div class="stage1-clean-box stage1-clean-choice-box">
        <p class="stage1-clean-help">اختر إجابة ثم اضغط تأكيد الإجابة</p>
        <div class="stage1-clean-options">
          ${options.map(option => `
            <button class="answer stage1-clean-choice" type="button" data-answer="${s1Esc(option)}">
              ${s1Esc(option)}
            </button>
          `).join('')}
        </div>
        <div id="stage1CleanStatus" class="stage1-clean-status">اختر إجابة ثم اضغط تأكيد الإجابة</div>
        <button id="stage1CleanConfirm" class="btn stage1-clean-confirm" type="button" disabled>
          تأكيد الإجابة
        </button>
      </div>
    `;
  }

  function s1RenderInput(q, type){
    const placeholder = type === 'ماذا ينقص' ? 'اكتب الشيء الناقص هنا' : 'اكتب الإجابة هنا';
    return `
      <div class="stage1-clean-box stage1-clean-input-box">
        <p class="stage1-clean-help">اكتب الإجابة ثم اضغط تأكيد الإجابة</p>
        <input id="stage1CleanInput" class="stage1-input stage1-clean-input" autocomplete="off" placeholder="${s1Esc(placeholder)}">
        <div id="stage1CleanStatus" class="stage1-clean-status">اكتب الإجابة ثم اضغط تأكيد الإجابة</div>
        <button id="stage1CleanConfirm" class="btn stage1-clean-confirm" type="button" disabled>
          تأكيد الإجابة
        </button>
      </div>
    `;
  }

  function s1RenderArrange(q, i){
    const correctOrder = s1ArrangeParts(q);
    const visibleItems = typeof seededShuffle === 'function'
      ? seededShuffle(correctOrder.slice(), `stage1-clean-arrange|${teamName}|${i}|${q?.q || ''}`)
      : correctOrder.slice();

    return `
      <div class="stage1-clean-box stage1-clean-arrange-box">
        <div class="stage1-clean-options stage1-clean-arrange-options">
          ${visibleItems.map(item => `
            <button class="answer stage1-clean-arrange-option" type="button" data-value="${s1Esc(item)}">
              ${s1Esc(item)}
            </button>
          `).join('')}
        </div>
        <div id="stage1CleanStatus" class="stage1-clean-status stage1-clean-arrange-status">اختر الترتيب كاملًا ثم اضغط تأكيد الترتيب</div>
        <div class="stage1-clean-actions single-confirm">
          <button id="stage1CleanConfirm" class="btn stage1-clean-confirm" type="button" disabled>تأكيد الترتيب</button>
        </div>
      </div>
    `;
  }

  window.renderStage1Question = renderStage1Question = function(q, i, type){
    const normalizedType = s1Type(q, i, type);

    if (s1IsChoice(q, i, type)) return s1RenderChoice(q);
    if (normalizedType === 'رتّب') return s1RenderArrange(q, i);

    return s1RenderInput(q, normalizedType);
  };

  window.renderStage1Input = renderStage1Input = function(q, i, type){
    return renderStage1Question(q, i, type);
  };

  window.bindStage1Answers = bindStage1Answers = function(i, q, p, type){
    const normalizedType = s1Type(q, i, type);

    if (s1IsChoice(q, i, type)) {
      let selectedAnswer = '';
      const answers = Array.from(document.querySelectorAll('#a1 .stage1-clean-choice'));
      const confirm = document.getElementById('stage1CleanConfirm');

      function refresh(){
        answers.forEach(button => {
          const answer = String(button.dataset.answer || '').trim();
          button.classList.toggle('selected', !!selectedAnswer && answer === selectedAnswer);
        });

        if (selectedAnswer) {
          s1SetStatus('تم اختيار إجابة — اضغط تأكيد الإجابة', 'selected');
        } else {
          s1SetStatus('اختر إجابة ثم اضغط تأكيد الإجابة', '');
        }

        s1SetConfirmReady(confirm, !!selectedAnswer);
      }

      answers.forEach(button => {
        button.onclick = () => {
          if (stage1Busy || stage1PendingAdvance || button.disabled) return;
          selectedAnswer = String(button.dataset.answer || '').trim();
          refresh();
        };
      });

      if (confirm) {
        confirm.onclick = () => answerStage1(confirm, i, q, p, selectedAnswer);
      }

      refresh();
      return;
    }

    if (normalizedType === 'رتّب') {
      const correctOrder = s1ArrangeParts(q);
      const selectedOrder = [];
      const options = Array.from(document.querySelectorAll('#a1 .stage1-clean-arrange-option'));
      const confirm = document.getElementById('stage1CleanConfirm');

      function refresh(){
        options.forEach(button => {
          const value = String(button.dataset.value || '').trim();
          const index = selectedOrder.indexOf(value);

          button.classList.toggle('selected', index >= 0);
          button.querySelector('.stage1-clean-order')?.remove();

          if (index >= 0) {
            const badge = document.createElement('span');
            badge.className = 'stage1-clean-order';
            badge.textContent = String(index + 1);
            button.appendChild(badge);
          }
        });

        if (selectedOrder.length) {
          s1SetStatus(`الترتيب المختار: <b>${selectedOrder.map(s1Esc).join(' ← ')}</b>`, selectedOrder.length === correctOrder.length ? 'selected' : '');
        } else {
          s1SetStatus('اختر الترتيب كاملًا ثم اضغط تأكيد الترتيب', '');
        }

        const ready = selectedOrder.length === correctOrder.length && correctOrder.length > 0;
        s1SetConfirmReady(confirm, ready);
        if (ready && confirm) {
          confirm.setAttribute('data-ready', 'true');
        } else if (confirm) {
          confirm.removeAttribute('data-ready');
        }
      }

      options.forEach(button => {
        button.onclick = () => {
          if (stage1Busy || stage1PendingAdvance || button.disabled) return;

          const value = String(button.dataset.value || '').trim();
          const index = selectedOrder.indexOf(value);

          if (index >= 0) {
            selectedOrder.splice(index, 1);
          } else {
            if (selectedOrder.length >= correctOrder.length) {
              s1SetStatus('ألغِ اختيارًا أولًا إذا أردت التغيير', 'warning');
              return;
            }
            selectedOrder.push(value);
          }

          refresh();
        };
      });

      if (confirm) {
        confirm.onclick = () => answerStage1(confirm, i, q, p, selectedOrder.join(' '));
      }

      refresh();
      return;
    }

    const input = document.getElementById('stage1CleanInput');
    const confirm = document.getElementById('stage1CleanConfirm');

    function refreshInput(){
      const value = String(input?.value || '').trim();

      if (value) {
        s1SetStatus(`الإجابة المختارة: <b>${s1Esc(value)}</b>`, 'selected');
      } else {
        s1SetStatus('اكتب الإجابة ثم اضغط تأكيد الإجابة', '');
      }

      s1SetConfirmReady(confirm, !!value);
    }

    if (input) {
      input.oninput = refreshInput;
      input.onkeydown = event => {
        if (event.key === 'Enter') confirm?.click();
      };
      input.focus();
      refreshInput();
    }

    if (confirm) {
      confirm.onclick = () => answerStage1(confirm, i, q, p, input?.value || '');
    }
  };

  window.answerStage1 = answerStage1 = async function(trigger, i, q, p, selected){
    if (stage1Busy || stage1PendingAdvance) return;

    const answer = String(selected || '').trim();
    if (!answer) {
      s1SetStatus('اختر أو اكتب إجابة أولًا', 'warning');
      return;
    }

    stage1Busy = true;
    stage1PendingAdvance = true;

    const normalizedType = s1Type(q, i);
    const expected = normalizedType === 'رتّب' ? s1ArrangeExpected(q) : String(q.answer || q.correct || '');
    const ok = normalizedType === 'رتّب' ? (norm(answer) === norm(expected)) : s1Accepted(answer, q);
    const points = ok ? 5 : 0;

    document.querySelectorAll('#a1 button,#a1 input').forEach(element => {
      element.disabled = true;
      element.classList.add('stage1-clean-sent');
    });

    if (trigger) trigger.classList.add('sent');
    s1SetStatus('تم إرسال الإجابة', 'sent');

    const remaining = stage1Runtime.remaining ?? (() => {
      const parts = ($('timer1')?.innerText || '07:00').split(':');
      return (Number(parts[0] || 0) * 60) + Number(parts[1] || 0);
    })();

    const nextI = i + 1;
    stage1LocalI = nextI;
    stage1LocalKey = String((team.progress?.stage1 || {}).startedAt || 'stage1');

    const totalStage1 = Math.min(50, Array.isArray(DATA?.stage1) ? DATA.stage1.length : 50);
    const stage1FinishedNow = nextI >= totalStage1;
    const latestStage1 = Object.assign({}, team.progress?.stage1 || p, {i: nextI, remaining, ended: stage1FinishedNow});
    if (team?.progress) team.progress.stage1 = latestStage1;

    const doneArr = stage1FinishedNow ? Array.from(new Set([...(team?.done||[]),'stage1'])) : null;
    if(stage1FinishedNow){
      try{ clearInterval(timerInt); stage1Runtime.running=false; }catch(e){}
      if(team){
        team.done = doneArr;
        team.current = 'moderatorWaitV960';
        team.progress = Object.assign({}, team.progress || {}, {stage1: latestStage1});
      }
      if(typeof renderWaiting==='function') renderWaiting('finished',1);
    } else setTimeout(() => {
      stage1Busy = false;
      stage1PendingAdvance = false;
      try { showQ1(); } catch (error) { console.error(error); }
    }, 650);

    try {
      await changeScore(points, 'stage1', makeLog('اجمعوا الكنوز', q.q, answer, expected, ok, points), {
        progress: Object.assign({}, team.progress, {stage1: latestStage1}),
        ...(stage1FinishedNow ? {done: doneArr, current:'moderatorWaitV960'} : {})
      });
      if(stage1FinishedNow){
        if(typeof renderWaiting==='function') renderWaiting('finished',1);
        else await finishStage('stage1','intro2');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => {
        stage1Busy = false;
        stage1PendingAdvance = false;
      }, 700);
    }
  };

  const previousShowQ1Clean = typeof showQ1 === 'function' ? showQ1 : null;
  if (previousShowQ1Clean) {
    window.showQ1 = showQ1 = function(){
      const result = previousShowQ1Clean.apply(this, arguments);
      setTimeout(s1FitQuestion, 0);
      return result;
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(s1FitQuestion, 100);
  });
})();



/* ===== V9.5.93 FINAL GUARD: Stage 1 Choice by options uses source renderer ===== */
(function(){
  'use strict';

  function hasStage1ChoiceOptionsGuard(q){
    if(!q) return false;
    const arrays = [q.options, q.choices, q.answers, q.alternatives, q.opts];
    for(const arr of arrays){
      if(Array.isArray(arr) && arr.map(x=>String(x??'').trim()).filter(Boolean).length >= 2) return true;
    }
    const numbered = [
      q.option1, q.option2, q.option3, q.option4,
      q.choice1, q.choice2, q.choice3, q.choice4,
      q.a, q.b, q.c, q.d
    ].map(x=>String(x??'').trim()).filter(Boolean);
    return numbered.length >= 2;
  }

  const oldShowQ1GuardV9593 = typeof showQ1 === 'function' ? showQ1 : null;
  if(oldShowQ1GuardV9593){
    window.showQ1 = showQ1 = function(){
      const result = oldShowQ1GuardV9593.apply(this, arguments);

      try{
        const p = team.progress?.stage1 || {i:0};
        const remoteI = Number(p.i || 0);
        const i = Math.max(remoteI, Number(stage1LocalI || 0));
        const plan = getStage1Plan(p);
        const item = plan[i] || {idx:i, type:STAGE1_TYPES[i % STAGE1_TYPES.length]};
        const q = DATA.stage1[item.idx] || DATA.stage1[i % DATA.stage1.length];

        if(hasStage1ChoiceOptionsGuard(q)){
          const a1 = document.getElementById('a1');
          const hasCleanChoice = !!a1?.querySelector?.('.stage1-clean-choice');
          const hasConfirm = !!a1?.querySelector?.('#stage1CleanConfirm');

          if(a1 && (!hasCleanChoice || !hasConfirm)){
            a1.innerHTML = renderStage1Question(q, i, 'اختر من متعدد');
            bindStage1Answers(i, q, p, 'اختر من متعدد');
          }
        }
      }catch(e){
        console.warn('Stage1 choice guard skipped:', e);
      }

      return result;
    };
  }
})();


/* ===== V9.5.96 CLEAN SOURCE: Stage 2 matching lock + confirm before submit ===== */
(function(){
  'use strict';

  let selectedLeftV9596 = null;
  const pairsV9596 = {};

  function escV9596(v){
    return String(v ?? '').replace(/[&<>"']/g, m => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[m]));
  }

  function currentStage2ProgressV9596(){
    return team?.progress?.stage2 || {answered:{}, roles:{}, matching:{}, startedTurns:{}};
  }

  function matchingKeyV9596(i){
    return `matching_${i}`;
  }

  function matchingGroupV9596(){
    return (DATA.stage2.groups || []).find(g => g.type === 'matching');
  }

  function matchingReadyV9596(g, p){
    const questions = g?.questions || [];
    return questions.length > 0 && questions.every((q, i) => (p.answered || {})[matchingKeyV9596(i)] || pairsV9596[i]);
  }

  function syncPairClassesV9596(){
    const p = currentStage2ProgressV9596();

    document.querySelectorAll('#stage2 .match-left-v9596').forEach(btn => {
      const i = btn.dataset.i;
      const key = matchingKeyV9596(i);
      const used = !!(p.answered || {})[key] || !!pairsV9596[i];

      btn.classList.toggle('paired', used);
      btn.disabled = !!(p.answered || {})[key];
      btn.classList.toggle('selected', selectedLeftV9596 === btn && !used);
    });

    document.querySelectorAll('#stage2 .match-right-v9596').forEach(btn => {
      const value = String(btn.dataset.a || '');
      const used = Object.values(pairsV9596).map(String).includes(value) || btn.classList.contains('submitted');
      btn.classList.toggle('paired', used);
      btn.disabled = btn.classList.contains('submitted');
    });

    const g = matchingGroupV9596();
    const confirm = document.getElementById('matchingConfirmV9596');
    const status = document.getElementById('matchingStatusV9596');
    const ready = matchingReadyV9596(g, p);

    if (confirm) {
      confirm.disabled = !ready;
      confirm.classList.toggle('ready', ready);
    }

    if (status) {
      status.className = 'matching-status-v9596' + (ready ? ' selected' : '');
      status.textContent = ready ? 'تم إكمال التوصيل — اضغط تأكيد الإجابة' : 'أكمل توصيل كل العناصر أولًا';
    }
  }

  window.renderMatchingGroup = renderMatchingGroup = function(g, p){
    pairsV9596 && Object.keys(pairsV9596).forEach(k => {
      if ((p.answered || {})[matchingKeyV9596(k)]) delete pairsV9596[k];
    });

    const questions = g.questions || [];
    const left = questions.map((q, i) => ({
      i,
      text: q.q,
      answer: q.answer,
      done: !!(p.answered || {})[matchingKeyV9596(i)]
    }));

    const submittedAnswers = new Set(
      left
        .filter(x => x.done)
        .map(x => String(x.answer))
    );

    const right = shuffle(questions.map(q => q.answer));

    return `
      <div class="matching-card-v9596">
        <div class="matching-help matching-help-v9596">
          اختر عبارة من العمود الأول ثم اختر الإجابة المطابقة من العمود الثاني. بعد اكتمال التوصيل اضغط تأكيد الإجابة.
        </div>

        <div class="matching-wrap matching-wrap-v9596">
          <div class="match-col match-col-v9596">
            <h4>العمود الأول</h4>
            ${left.map(x => {
              const paired = pairsV9596[x.i];
              return `
                <button class="match-left match-left-v9596 ${x.done ? 'matched paired' : ''} ${paired ? 'paired' : ''}"
                  type="button"
                  data-i="${x.i}"
                  data-q="${escV9596(x.text)}"
                  data-answer="${escV9596(x.answer)}"
                  ${x.done ? 'disabled' : ''}>
                  ${escV9596(x.text)}
                  ${paired ? `<small>↔ ${escV9596(paired)}</small>` : ''}
                </button>
              `;
            }).join('')}
          </div>

          <div class="match-col match-col-v9596">
            <h4>العمود الثاني</h4>
            ${right.map(r => {
              const isUsed = submittedAnswers.has(String(r)) || Object.values(pairsV9596).map(String).includes(String(r));
              return `
                <button class="match-right match-right-v9596 ${isUsed ? 'paired' : ''} ${submittedAnswers.has(String(r)) ? 'submitted' : ''}"
                  type="button"
                  data-a="${escV9596(r)}"
                  ${submittedAnswers.has(String(r)) ? 'disabled' : ''}>
                  ${escV9596(r)}
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <div class="matching-confirm-wrap-v9596">
          <div id="matchingStatusV9596" class="matching-status-v9596">
            ${matchingReadyV9596(g, p) ? 'تم إكمال التوصيل — اضغط تأكيد الإجابة' : 'أكمل توصيل كل العناصر أولًا'}
          </div>
          <button id="matchingConfirmV9596" class="btn matching-confirm-v9596" type="button" ${matchingReadyV9596(g, p) ? '' : 'disabled'}>
            تأكيد الإجابة
          </button>
        </div>
      </div>
    `;
  };

  function unpairMatchingV964(index){
    if(index===undefined || index===null) return;
    delete pairsV9596[String(index)];
    selectedLeftV9596=null;
    const status=document.getElementById('matchingStatusV9596');
    if(status){status.className='matching-status-v9596 warning';status.textContent='تم التراجع عن الاختيار. اختر توصيلًا جديدًا.';}
    const p=currentStage2ProgressV9596();
    const g=matchingGroupV9596();
    const container=document.querySelector('#stage2 .stage2-group.active-type');
    if(container && g){ const title=container.querySelector('h3')?.outerHTML || ''; container.innerHTML=`${title}${renderMatchingGroup(g,p)}`; bindMatchingEventsV964(); }
  }

  function bindMatchingEventsV964(){
    document.querySelectorAll('#stage2 .match-left-v9596').forEach(button => { button.onclick = () => selectMatchLeft(button); });
    document.querySelectorAll('#stage2 .match-right-v9596').forEach(button => { button.onclick = () => answerMatch(button); });
    const confirm = document.getElementById('matchingConfirmV9596');
    if (confirm) confirm.onclick = () => submitMatchingV9596();
    syncPairClassesV9596();
  }

  window.selectMatchLeft = selectMatchLeft = function(button){
    if (!button || button.disabled) return;
    const i=String(button.dataset.i||'');
    if(pairsV9596[i]){ unpairMatchingV964(i); return; }

    document.querySelectorAll('#stage2 .match-left-v9596').forEach(x => x.classList.remove('selected'));
    selectedLeftV9596 = button;
    button.classList.add('selected');

    const status = document.getElementById('matchingStatusV9596');
    if (status) {
      status.className = 'matching-status-v9596 selected';
      status.innerHTML = `اختر الإجابة المناسبة لـ: <b>${escV9596(button.dataset.q || button.textContent)}</b>`;
    }
  };

  window.answerMatch = answerMatch = function(button){
    if (!button || button.disabled) return;
    const valueNow=String(button.dataset.a || '').trim();
    const existingIndex=Object.keys(pairsV9596).find(k=>String(pairsV9596[k])===valueNow);
    if(existingIndex!==undefined && !selectedLeftV9596){ unpairMatchingV964(existingIndex); return; }

    if (!selectedLeftV9596 || selectedLeftV9596.disabled) {
      const status = document.getElementById('matchingStatusV9596');
      if (status) {
        status.className = 'matching-status-v9596 warning';
        status.textContent = 'اختر عبارة من العمود الأول أولًا';
      }
      return;
    }

    const left = selectedLeftV9596;
    const i = String(left.dataset.i);
    const value = String(button.dataset.a || '').trim();

    if (!value) return;

    if(existingIndex!==undefined) delete pairsV9596[existingIndex];
    pairsV9596[i] = value;

    left.classList.add('paired');
    left.disabled = true;
    left.insertAdjacentHTML('beforeend', `<small>↔ ${escV9596(value)}</small>`);

    button.classList.add('paired');
    button.disabled = true;

    selectedLeftV9596 = null;
    syncPairClassesV9596();
  };

  async function submitMatchingV9596(){
    const g = matchingGroupV9596();
    const p = currentStage2ProgressV9596();
    const questions = g?.questions || [];

    const missing = questions.some((q, i) => !(p.answered || {})[matchingKeyV9596(i)] && !pairsV9596[i]);
    if (missing) {
      const status = document.getElementById('matchingStatusV9596');
      if (status) {
        status.className = 'matching-status-v9596 warning';
        status.textContent = 'أكمل كل التوصيلات قبل التأكيد';
      }
      return;
    }

    document.querySelectorAll('#stage2 .match-left-v9596,#stage2 .match-right-v9596,#stage2 #matchingConfirmV9596').forEach(el => {
      el.disabled = true;
      el.classList.add('sent');
    });

    const status = document.getElementById('matchingStatusV9596');
    if (status) {
      status.className = 'matching-status-v9596 sent';
      status.textContent = 'تم إرسال الإجابة';
    }

    for (let i = 0; i < questions.length; i++) {
      const key = matchingKeyV9596(i);
      if ((p.answered || {})[key]) continue;

      const q = questions[i];
      const answer = pairsV9596[i];
      const correct = q.answer;
      const ok = String(answer) === String(correct);
      const points = ok ? Number(g.points || 15) : 0;

      await markStage2Answered(
        key,
        points,
        makeLog(
          'فتشوا الكتب',
          q.q,
          answer,
          correct,
          ok,
          points,
          'توصيل',
          team.progress?.stage2?.roles?.matching || ''
        )
      );

      delete pairsV9596[i];
    }
  }

  const oldRenderStage2SequentialV9596 = typeof renderStage2Sequential === 'function' ? renderStage2Sequential : null;
  if (oldRenderStage2SequentialV9596) {
    window.renderStage2Sequential = renderStage2Sequential = function(p){
      oldRenderStage2SequentialV9596.apply(this, arguments);

      const g = matchingGroupV9596();
      const currentType = typeof firstIncompleteStage2Type === 'function' ? firstIncompleteStage2Type(p) : null;

      if (g && currentType === 'matching') {
        const container = document.querySelector('#stage2 .stage2-group.active-type');
        if (container && !container.querySelector('.matching-card-v9596')) {
          const title = container.querySelector('h3')?.outerHTML || '';
          container.innerHTML = `${title}${renderMatchingGroup(g, p)}`;
        }

        bindMatchingEventsV964();
      }
    };
  }
})();


/* ===== V9.5.97 CLEAN SOURCE: Stage 2 lock players, keep answers visible, auto intro3 ===== */
(function(){
  'use strict';

  function escV9597(v){
    return String(v ?? '').replace(/[&<>"']/g, m => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[m]));
  }

  function stage2ProgressV9597(){
    return team?.progress?.stage2 || {answered:{}, roles:{}, matching:{}, startedTurns:{}};
  }

  function stage2HasStartedV9597(p){
    p = p || stage2ProgressV9597();
    return Object.keys(p.answered || {}).length > 0 ||
      Object.keys(p.startedTurns || {}).length > 0 ||
      Object.keys(p.stage2TurnStartedAt || {}).length > 0;
  }

  function stage2RoleNamesV9597(){
    const names = typeof uniquePlayerNamesV9414 === 'function'
      ? uniquePlayerNamesV9414()
      : (typeof uniquePlayerNamesV9410 === 'function' ? uniquePlayerNamesV9410() : playerNames());
    return names.map(x => String(x || '').trim()).filter(Boolean);
  }

  function cleanRolesV9597(p){
    const names = stage2RoleNamesV9597();
    const used = new Set();
    const roles = {};

    stage2Types.forEach(type => {
      const name = String((p.roles || {})[type] || '').trim();
      if (name && names.includes(name) && !used.has(name)) {
        roles[type] = name;
        used.add(name);
      }
    });

    return roles;
  }

  function stage2AllRolesCompleteV9597(roles){
    return stage2Types.every(type => !!roles[type]);
  }

  function groupDoneV9597(g, p){
    if (!g) return true;
    return (g.questions || []).every((q, i) => !!(p.answered || {})[`${g.type}_${i}`]);
  }

  function allStage2DoneV9597(p){
    p = p || stage2ProgressV9597();
    return (DATA.stage2.groups || []).every(g => groupDoneV9597(g, p));
  }

  function firstIncompleteTypeV9597(p){
    p = p || stage2ProgressV9597();
    const g = (DATA.stage2.groups || []).find(group => !groupDoneV9597(group, p));
    return g ? g.type : null;
  }

  function groupByTypeV9597(type){
    return (DATA.stage2.groups || []).find(g => g.type === type);
  }

  function lockItemV9597(item, answerText){
    if (!item) return;
    item.classList.add('stage2-sent-v9597', 'done');

    const input = item.querySelector('input, textarea');
    if (input) {
      if (answerText !== undefined) input.value = answerText;
      input.disabled = true;
      input.classList.add('stage2-answer-sent-v9597');
    }

    item.querySelectorAll('button').forEach(button => {
      button.disabled = true;
      button.classList.add('stage2-answer-sent-v9597');
    });

    let status = item.querySelector('.stage2-item-status-v9597');
    if (!status) {
      status = document.createElement('div');
      status.className = 'stage2-item-status-v9597 sent';
      item.appendChild(status);
    }
    status.textContent = 'تم إرسال الإجابة';
  }

  function maybeAutoIntro3V9597(){
    const p = stage2ProgressV9597();
    if (!allStage2DoneV9597(p)) return;
    setTimeout(() => {
      try {
        finishStage('stage2', 'intro3');
      } catch (e) {
        console.error('Stage 2 auto transition failed:', e);
      }
    }, 650);
  }

  window.renderStage2Roles = renderStage2Roles = function(p){
    p = p || stage2ProgressV9597();
    const names = stage2RoleNamesV9597();
    const roles = cleanRolesV9597(p);
    const complete = stage2AllRolesCompleteV9597(roles);
    const locked = complete || stage2HasStartedV9597(p);

    if (!names.length) {
      $('stage2RoleBox').innerHTML = '<p class="muted">لا توجد أسماء لاعبين مسجلة.</p>';
      return;
    }

    if (locked) {
      const currentType = firstIncompleteTypeV9597(p);
      $('stage2RoleBox').innerHTML = `
        <div class="stage2-role-locked-v9597">
          <h3>توزيع اللاعبين ثابت</h3>
          <p class="muted">
            تم تثبيت لاعبي المرحلة الثانية. إذا أعادكم الميسر إلى بداية المرحلة، يمكنكم تعديل التوزيع من جديد.
          </p>
          <div class="player-turns">
            ${stage2Types.map(type => {
              const g = groupByTypeV9597(type);
              const done = g ? groupDoneV9597(g, p) : false;
              return `
                <span class="turn-chip ${type === currentType ? 'current' : ''} ${done ? 'done' : ''}">
                  <span class="icon-3d">${type === currentType ? '🎯' : '👤'}</span>
                  ${roleTitle(type)}: ${escV9597(roles[type] || '-')}
                </span>
              `;
            }).join('')}
          </div>
        </div>
      `;
      return;
    }

    const nextType = stage2Types.find(type => !roles[type]);
    const available = names;

    $('stage2RoleBox').innerHTML = `
      <div class="stage2-role-select-v9597">
        <h3>اختيار لاعبي المرحلة الثانية</h3>
        <p class="muted">اختاروا لاعبًا لكل نوع. يمكن استخدام نفس اللاعب لأكثر من نوع إذا كان الفريق قليل العدد.</p>
        <div class="stage2-role-grid">
          ${stage2Types.map(type => `
            <div class="stage2-role-card ${roles[type] ? 'done' : ''} ${type === nextType ? 'current' : ''}">
              <b>${roleTitle(type)}</b>
              <span>${roles[type] ? escV9597(roles[type]) : 'بانتظار الاختيار'}</span>
            </div>
          `).join('')}
        </div>
        <div class="stage2-next-role">
          <label>النوع التالي: ${roleTitle(nextType)}</label>
          <select id="rolePlayerSelect">
            <option value="">اختر اللاعب</option>
            ${available.map(name => `<option value="${escV9597(name)}">${escV9597(name)}</option>`).join('')}
          </select>
          <button class="btn role-btn" onclick="assignStage2Role('${nextType}')">تثبيت اللاعب</button>
        </div>
      </div>
    `;
  };

  window.assignStage2Role = assignStage2Role = async function(type){
    const p = stage2ProgressV9597();
    if (stage2HasStartedV9597(p)) {
      alert('تم بدء المرحلة الثانية، ولا يمكن تغيير اللاعبين إلا إذا أعادكم الميسر إلى بداية المرحلة.');
      return;
    }

    const select = $('rolePlayerSelect');
    const name = String(select?.value || '').trim();
    if (!name) return alert('اختر لاعبًا');

    const names = stage2RoleNamesV9597();
    const roles = cleanRolesV9597(p);

    if (!names.includes(name)) return alert('هذا اللاعب غير موجود ضمن أسماء الفريق.');

    roles[type] = name;

    await patchTeam({
      progress: Object.assign({}, team.progress, {
        stage2: Object.assign({}, p, {roles})
      })
    });
  };

  window.renderStage2Item = renderStage2Item = function(g, q, key, p){
    const done = !!(p.answered || {})[key];
    const points = Number(g.points || 15);

    if (q.type === 'choice') {
      return `
        <div class="stage2-item stage2-item-v9597 ${done ? 'done stage2-sent-v9597' : ''}">
          <b>${escV9597(q.q)}</b>
          <div class="answers">
            ${shuffle(q.options || []).map(option => `
              <button class="answer s2-choice ${done ? 'stage2-answer-sent-v9597' : ''}"
                data-key="${escV9597(key)}"
                data-answer="${escV9597(option)}"
                data-correct="${escV9597(q.answer)}"
                data-points="${points}"
                data-title="${escV9597(g.title)}"
                ${done ? 'disabled' : ''}>
                ${escV9597(option)}
              </button>
            `).join('')}
          </div>
          ${done ? '<div class="stage2-item-status-v9597 sent">تم إرسال الإجابة</div>' : ''}
        </div>
      `;
    }

    return `
      <div class="stage2-item stage2-item-v9597 ${done ? 'done stage2-sent-v9597' : ''}">
        <b>${escV9597(q.q)}</b>
        <input data-key="${escV9597(key)}" placeholder="اكتب الإجابة" ${done ? 'disabled' : ''} class="${done ? 'stage2-answer-sent-v9597' : ''}">
        <button class="btn s2-check ${done ? 'stage2-answer-sent-v9597' : ''}"
          data-key="${escV9597(key)}"
          data-correct="${escV9597(q.answer)}"
          data-points="${points}"
          data-title="${escV9597(g.title)}"
          ${done ? 'disabled' : ''}>
          تسجيل الإجابة
        </button>
        ${done ? '<div class="stage2-item-status-v9597 sent">تم إرسال الإجابة</div>' : ''}
      </div>
    `;
  };

  window.answer2 = answer2 = async function(key, answer, correct, el, points, title){
    if (team.progress?.stage2?.answered?.[key]) return;

    const item = el?.closest?.('.stage2-item');
    const input = item?.querySelector?.(`input[data-key="${key}"]`);
    const cleanAnswer = String(answer || input?.value || '').trim();

    if (!cleanAnswer) {
      if (input) input.focus();
      return alert('اكتب الإجابة أولًا');
    }

    const ok = norm(cleanAnswer) === norm(correct);
    const pts = ok ? Number(points || 15) : 0;
    const group = DATA.stage2.groups.find(g => g.title === title);

    lockItemV9597(item, cleanAnswer);

    await markStage2Answered(
      key,
      pts,
      makeLog(
        'فتشوا الكتب',
        document.querySelector(`[data-key="${key}"]`)?.closest('.stage2-item')?.querySelector('b')?.innerText || key,
        cleanAnswer,
        correct,
        ok,
        pts,
        title,
        team.progress?.stage2?.roles?.[group?.type] || ''
      )
    );

    maybeAutoIntro3V9597();
  };

  const oldRenderStage2SequentialV9597 = typeof renderStage2Sequential === 'function' ? renderStage2Sequential : null;
  if (oldRenderStage2SequentialV9597) {
    window.renderStage2Sequential = renderStage2Sequential = function(p){
      if (allStage2DoneV9597(p)) {
        $('stage2List').innerHTML = `
          <div class="handoff-card done stage2-auto-next-v9597">
            <h3>✅ انتهت المرحلة الثانية</h3>
            <p>سيتم الانتقال إلى شرح المرحلة الثالثة...</p>
          </div>
        `;
        maybeAutoIntro3V9597();
        return;
      }

      oldRenderStage2SequentialV9597.apply(this, arguments);

      document.querySelectorAll('.s2-choice').forEach(button => {
        button.onclick = () => answer2(
          button.dataset.key,
          button.dataset.answer,
          button.dataset.correct,
          button,
          Number(button.dataset.points || 15),
          button.dataset.title
        );
      });

      document.querySelectorAll('.s2-check').forEach(button => {
        button.onclick = () => {
          const input = document.querySelector(`input[data-key="${button.dataset.key}"]`);
          answer2(
            button.dataset.key,
            input?.value || '',
            button.dataset.correct,
            button,
            Number(button.dataset.points || 15),
            button.dataset.title
          );
        };
      });

      // Ensure the old "end stage 2" wording is not visible if any previous markup produces it.
      document.querySelectorAll('#stage2 *').forEach(node => {
        if (node.childNodes && node.childNodes.length === 1 && node.textContent?.includes('إنهاء المرحلة الثانية')) {
          node.textContent = node.textContent.replace('إنهاء المرحلة الثانية', 'الانتقال إلى المرحلة الثالثة');
        }
      });
    };
  }

  const oldMarkStage2AnsweredV9597 = typeof markStage2Answered === 'function' ? markStage2Answered : null;
  if (oldMarkStage2AnsweredV9597) {
    window.markStage2Answered = markStage2Answered = async function(key, pts, log){
      const result = await oldMarkStage2AnsweredV9597.apply(this, arguments);
      setTimeout(maybeAutoIntro3V9597, 150);
      return result;
    };
  }
})();


/* ===== V9.5.98 CLEAN SOURCE: Stage 2 correction parts + silent sent states ===== */
(function(){
  'use strict';

  let selectedCorrectionPartV9598 = '';

  function escV9598(v){
    return String(v ?? '').replace(/[&<>"']/g, m => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[m]));
  }

  function stage2ProgressV9598(){
    return team?.progress?.stage2 || {answered:{}, roles:{}, matching:{}, startedTurns:{}};
  }

  function groupDoneV9598(g, p){
    if (!g) return true;
    return (g.questions || []).every((q, i) => !!(p.answered || {})[`${g.type}_${i}`]);
  }

  function allStage2DoneV9598(p){
    p = p || stage2ProgressV9598();
    return (DATA.stage2.groups || []).every(g => groupDoneV9598(g, p));
  }

  function maybeAutoIntro3V9598(){
    const p = stage2ProgressV9598();
    if (!allStage2DoneV9598(p)) return;
    setTimeout(() => {
      try { finishStage('stage2', 'intro3'); }
      catch(e){ console.error('Stage 2 auto transition failed:', e); }
    }, 450);
  }

  function getQuestionPartsV9598(q){
    if (Array.isArray(q.parts) && q.parts.length) return q.parts.map(String).filter(Boolean);
    if (Array.isArray(q.segments) && q.segments.length) return q.segments.map(String).filter(Boolean);
    if (Array.isArray(q.words) && q.words.length) return q.words.map(String).filter(Boolean);

    const text = String(q.fullText || q.text || q.q || '').trim();
    return text.split(/\s+/).filter(Boolean);
  }

  function isCorrectQuestionV9598(g, q){
    const t = String(g?.type || q?.type || q?.kind || '').replace(/[\sـ]+/g, '').toLowerCase();
    return t.includes('correct') || t.includes('fix') || t === 'صححالخطأ' || t === 'تصحيحالخطأ' || t === 'صحح';
  }

  function isTrueFalseV9598(g, q){
    const t = String(g?.type || q?.type || q?.kind || '').replace(/[\sـ]+/g, '').toLowerCase();
    return t.includes('true') || t.includes('false') || t.includes('صحخطأ') || t.includes('صحاوخطأ') || t.includes('صحأوخطأ');
  }

  function lockItemSilentV9598(item, answerText, mode){
    if (!item) return;
    item.classList.add('stage2-sent-v9598', 'done');

    const input = item.querySelector('input, textarea');
    if (input) {
      if (answerText !== undefined) input.value = answerText;
      input.disabled = true;
      input.classList.add('stage2-answer-sent-v9598');
    }

    item.querySelectorAll('button').forEach(button => {
      button.disabled = true;
      button.classList.add(mode === 'choice' ? 'stage2-choice-muted-v9598' : 'stage2-answer-sent-v9598');
    });

    if (mode === 'choice') {
      item.querySelectorAll('.stage2-selected-v9598, .s2-choice.selected, .stage2-tf-option-v9598.selected').forEach(button => {
        button.classList.remove('stage2-choice-muted-v9598');
        button.classList.add('stage2-choice-final-v9598');
      });
    }

    item.querySelectorAll('.stage2-item-status-v9597,.stage2-item-status-v9598').forEach(x => x.remove());
  }

  window.renderStage2Item = renderStage2Item = function(g, q, key, p){
    const done = !!(p.answered || {})[key];
    const points = Number(g.points || 15);

    if (isCorrectQuestionV9598(g, q)) {
      const parts = getQuestionPartsV9598(q);
      return `
        <div class="stage2-item stage2-item-v9598 stage2-correction-v9598 ${done ? 'done stage2-sent-v9598' : ''}">
          <b>${escV9598(q.q)}</b>
          <p class="stage2-help-v9598">اختر الجزء الذي تريد تصحيحه، ثم اكتب التصحيح فقط</p>
          <div class="stage2-correction-parts-v9598">
            ${parts.map((part, idx) => `
              <button class="stage2-correction-part-v9598"
                type="button"
                data-part="${escV9598(part)}"
                data-idx="${idx}"
                ${done ? 'disabled' : ''}>
                ${escV9598(part)}
              </button>
            `).join('')}
          </div>
          <input data-key="${escV9598(key)}" placeholder="اكتب التصحيح الصحيح فقط" ${done ? 'disabled' : ''} class="${done ? 'stage2-answer-sent-v9598' : ''}">
          <button class="btn s2-check ${done ? 'stage2-answer-sent-v9598' : ''}"
            data-key="${escV9598(key)}"
            data-correct="${escV9598(q.answer || q.correct || q.correctAnswer || '')}"
            data-points="${points}"
            data-title="${escV9598(g.title)}"
            data-mode="correct"
            ${done ? 'disabled' : ''}>
            تسجيل الإجابة
          </button>
        </div>
      `;
    }

    if (q.type === 'choice' || isTrueFalseV9598(g, q)) {
      const options = (q.options && q.options.length) ? q.options : ['صح', 'خطأ'];
      return `
        <div class="stage2-item stage2-item-v9598 stage2-choice-v9598 ${done ? 'done stage2-sent-v9598' : ''}">
          <b>${escV9598(q.q)}</b>
          <div class="answers">
            ${shuffle(options || []).map(option => `
              <button class="answer s2-choice stage2-tf-option-v9598 ${done ? 'stage2-choice-muted-v9598' : ''}"
                data-key="${escV9598(key)}"
                data-answer="${escV9598(option)}"
                data-correct="${escV9598(q.answer)}"
                data-points="${points}"
                data-title="${escV9598(g.title)}"
                ${done ? 'disabled' : ''}>
                ${escV9598(option)}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    return `
      <div class="stage2-item stage2-item-v9598 ${done ? 'done stage2-sent-v9598' : ''}">
        <b>${escV9598(q.q)}</b>
        <input data-key="${escV9598(key)}" placeholder="اكتب الإجابة" ${done ? 'disabled' : ''} class="${done ? 'stage2-answer-sent-v9598' : ''}">
        <button class="btn s2-check ${done ? 'stage2-answer-sent-v9598' : ''}"
          data-key="${escV9598(key)}"
          data-correct="${escV9598(q.answer)}"
          data-points="${points}"
          data-title="${escV9598(g.title)}"
          ${done ? 'disabled' : ''}>
          تسجيل الإجابة
        </button>
      </div>
    `;
  };

  function bindStage2ItemsV9598(){
    document.querySelectorAll('#stage2 .stage2-correction-part-v9598').forEach(button => {
      button.onclick = () => {
        if (button.disabled) return;
        const item = button.closest('.stage2-item');
        selectedCorrectionPartV9598 = String(button.dataset.part || '').trim();
        item.querySelectorAll('.stage2-correction-part-v9598').forEach(x => x.classList.remove('selected'));
        button.classList.add('selected');
      };
    });

    document.querySelectorAll('#stage2 .s2-choice').forEach(button => {
      button.onclick = () => {
        if (button.disabled) return;
        const item = button.closest('.stage2-item');
        item.querySelectorAll('.s2-choice').forEach(x => x.classList.remove('selected', 'stage2-selected-v9598'));
        button.classList.add('selected', 'stage2-selected-v9598');
        answer2(
          button.dataset.key,
          button.dataset.answer,
          button.dataset.correct,
          button,
          Number(button.dataset.points || 15),
          button.dataset.title
        );
      };
    });

    document.querySelectorAll('#stage2 .s2-check').forEach(button => {
      button.onclick = () => {
        const input = document.querySelector(`input[data-key="${button.dataset.key}"]`);
        answer2(
          button.dataset.key,
          input?.value || '',
          button.dataset.correct,
          button,
          Number(button.dataset.points || 15),
          button.dataset.title
        );
      };
    });
  }

  window.answer2 = answer2 = async function(key, answer, correct, el, points, title){
    if (team.progress?.stage2?.answered?.[key]) return;

    const preserveYV9630 = Math.max(window.scrollY || 0, document.documentElement.scrollTop || 0, document.body.scrollTop || 0);
    const item = el?.closest?.('.stage2-item');
    const input = item?.querySelector?.(`input[data-key="${key}"]`);
    const isCorrection = item?.classList?.contains('stage2-correction-v9598');
    const isChoice = el?.classList?.contains('s2-choice');

    let cleanAnswer = String(answer || input?.value || '').trim();

    if (isCorrection) {
      const selectedPart = String(item.querySelector('.stage2-correction-part-v9598.selected')?.dataset.part || selectedCorrectionPartV9598 || '').trim();
      if (!selectedPart) return alert('اختر الجزء الذي تريد تصحيحه أولًا');
      if (!cleanAnswer) {
        if (input) input.focus();
        return alert('اكتب التصحيح الصحيح فقط');
      }
      cleanAnswer = `${selectedPart} ← ${cleanAnswer}`;
    } else if (!cleanAnswer) {
      if (input) input.focus();
      return alert('اكتب الإجابة أولًا');
    }

    const correctionOnly = isCorrection ? String(input?.value || '').trim() : cleanAnswer;
    const ok = norm(correctionOnly) === norm(correct);
    const pts = ok ? Number(points || 15) : 0;
    const group = DATA.stage2.groups.find(g => g.title === title);

    if (isChoice && el) {
      el.classList.add('selected', 'stage2-selected-v9598');
      lockItemSilentV9598(item, cleanAnswer, 'choice');
    } else {
      lockItemSilentV9598(item, isCorrection ? correctionOnly : cleanAnswer, 'input');
    }

    await markStage2Answered(
      key,
      pts,
      makeLog(
        'فتشوا الكتب',
        item?.querySelector('b')?.innerText || key,
        cleanAnswer,
        correct,
        ok,
        pts,
        title,
        team.progress?.stage2?.roles?.[group?.type] || ''
      )
    );

    maybeAutoIntro3V9598();
    // حافظ على موضع المتسابق داخل المرحلة الثانية بعد تسجيل الإجابة، ولا تصعد الصفحة تلقائيًا.
    setTimeout(() => {
      try{
        if(document.querySelector('#stage2.page.active')) window.scrollTo({top: preserveYV9630, left:0, behavior:'auto'});
      }catch(e){}
    }, 0);
    setTimeout(() => {
      try{
        if(document.querySelector('#stage2.page.active')) window.scrollTo({top: preserveYV9630, left:0, behavior:'auto'});
      }catch(e){}
    }, 180);
  };

  const oldRenderStage2SequentialV9598 = typeof renderStage2Sequential === 'function' ? renderStage2Sequential : null;
  if (oldRenderStage2SequentialV9598) {
    window.renderStage2Sequential = renderStage2Sequential = function(p){
      if (allStage2DoneV9598(p)) {
        $('stage2List').innerHTML = '';
        maybeAutoIntro3V9598();
        return;
      }

      oldRenderStage2SequentialV9598.apply(this, arguments);
      bindStage2ItemsV9598();

      document.querySelectorAll('#stage2 *').forEach(node => {
        if (node.childNodes && node.childNodes.length === 1) {
          const txt = node.textContent || '';
          if (txt.includes('تم إرسال الإجابة') || txt.includes('الانتقال إلى المرحلة الثالثة') || txt.includes('سيتم الانتقال إلى شرح المرحلة الثالثة')) {
            node.textContent = '';
            node.classList.add('hidden');
          }
        }
      });
    };
  }
})();


/* ===== V9.5.99 CLEAN SOURCE: Stage 2 persist displayed answers + unlock roles after reset ===== */
(function(){
  'use strict';

  let selectedCorrectionPartV9599 = '';

  function escV9599(v){
    return String(v ?? '').replace(/[&<>"']/g, m => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[m]));
  }

  function progressV9599(){
    return team?.progress?.stage2 || {answered:{},roles:{},matching:{},startedTurns:{},answers:{}};
  }

  function hasStartedV9599(p){
    p = p || progressV9599();
    return Object.keys(p.answered || {}).length > 0 ||
      Object.keys(p.startedTurns || {}).length > 0 ||
      Object.keys(p.stage2TurnStartedAt || {}).length > 0;
  }

  function roleNamesV9599(){
    const names = typeof uniquePlayerNamesV9414 === 'function'
      ? uniquePlayerNamesV9414()
      : (typeof uniquePlayerNamesV9410 === 'function' ? uniquePlayerNamesV9410() : playerNames());
    return names.map(x => String(x || '').trim()).filter(Boolean);
  }

  function cleanRolesV9599(p){
    const names = roleNamesV9599();
    const used = new Set();
    const roles = {};
    stage2Types.forEach(type => {
      const name = String((p.roles || {})[type] || '').trim();
      if (name && names.includes(name) && !used.has(name)) {
        roles[type] = name;
        used.add(name);
      }
    });
    return roles;
  }

  function groupByTypeV9599(type){
    return (DATA.stage2.groups || []).find(g => g.type === type);
  }

  function groupDoneV9599(g,p){
    if(!g) return true;
    return (g.questions || []).every((q,i) => !!(p.answered || {})[`${g.type}_${i}`]);
  }

  function firstIncompleteTypeV9599(p){
    p = p || progressV9599();
    const g = (DATA.stage2.groups || []).find(group => !groupDoneV9599(group,p));
    return g ? g.type : null;
  }

  function allDoneV9599(p){
    p = p || progressV9599();
    return (DATA.stage2.groups || []).every(g => groupDoneV9599(g,p));
  }

  function isCorrectQuestionV9599(g,q){
    const t = String(g?.type || q?.type || q?.kind || '').replace(/[\sـ]+/g,'').toLowerCase();
    return t.includes('correct') || t.includes('fix') || t === 'صححالخطأ' || t === 'تصحيحالخطأ' || t === 'صحح';
  }

  function isTrueFalseV9599(g,q){
    const t = String(g?.type || q?.type || q?.kind || '').replace(/[\sـ]+/g,'').toLowerCase();
    return t.includes('true') || t.includes('false') || t.includes('صحخطأ') || t.includes('صحاوخطأ') || t.includes('صحأوخطأ');
  }

  function partsV9599(q){
    if (Array.isArray(q.parts) && q.parts.length) return q.parts.map(String).filter(Boolean);
    if (Array.isArray(q.segments) && q.segments.length) return q.segments.map(String).filter(Boolean);
    if (Array.isArray(q.words) && q.words.length) return q.words.map(String).filter(Boolean);
    const text = String(q.fullText || q.text || q.q || '').trim();
    return text.split(/\s+/).filter(Boolean);
  }

  function maybeAutoIntro3V9599(){
    const p = progressV9599();
    if (!allDoneV9599(p)) return;
    setTimeout(() => {
      try { finishStage('stage2','intro3'); }
      catch(e){ console.error('Stage 2 auto transition failed:', e); }
    }, 450);
  }

  async function saveDisplayedAnswerV9599(key, answer){
    const p = progressV9599();
    const answers = Object.assign({}, p.answers || {}, {[key]: String(answer || '')});
    if (team?.progress) {
      team.progress.stage2 = Object.assign({}, p, {answers});
    }
    await patchTeam({
      progress: Object.assign({}, team.progress, {
        stage2: Object.assign({}, p, {answers})
      })
    });
  }

  function lockItemSilentV9599(item, answerText, mode){
    if(!item) return;
    item.classList.add('stage2-sent-v9599','done');

    const input = item.querySelector('input,textarea');
    if(input){
      if(answerText !== undefined) input.value = answerText;
      input.disabled = true;
      input.classList.add('stage2-answer-sent-v9599');
      input.removeAttribute('placeholder');
    }

    item.querySelectorAll('button').forEach(btn => {
      btn.disabled = true;
      btn.classList.add(mode === 'choice' ? 'stage2-choice-muted-v9599' : 'stage2-answer-sent-v9599');
    });

    if(mode === 'choice'){
      item.querySelectorAll('.selected,.stage2-selected-v9598,.stage2-selected-v9599').forEach(btn => {
        btn.classList.remove('stage2-choice-muted-v9599','stage2-choice-muted-v9598');
        btn.classList.add('stage2-choice-final-v9599');
      });
    }

    item.querySelectorAll('.stage2-item-status-v9597,.stage2-item-status-v9598,.stage2-item-status-v9599').forEach(x => x.remove());
  }

  window.resetStage2RolesFromContestantV9599 = async function(){
    const p = progressV9599();
    if (hasStartedV9599(p)) {
      alert('لا يمكن إعادة توزيع اللاعبين بعد بداية المرحلة الثانية إلا إذا أعادكم الميسر إلى بداية المرحلة.');
      return;
    }
    await patchTeam({
      progress: Object.assign({}, team.progress, {
        stage2: Object.assign({}, p, {roles:{}})
      })
    });
  };

  window.renderStage2Roles = renderStage2Roles = function(p){
    p = p || progressV9599();
    const names = roleNamesV9599();
    const roles = cleanRolesV9599(p);
    const started = hasStartedV9599(p);
    const complete = stage2Types.every(type => !!roles[type]);

    if(!names.length){
      $('stage2RoleBox').innerHTML = '<p class="muted">لا توجد أسماء لاعبين مسجلة.</p>';
      return;
    }

    if(started){
      const currentType = firstIncompleteTypeV9599(p);
      $('stage2RoleBox').innerHTML = `
        <div class="stage2-role-locked-v9599">
          <h3>توزيع اللاعبين ثابت</h3>
          <p class="muted">تم بدء المرحلة الثانية، ولا يمكن تغيير اللاعبين إلا إذا أعادكم الميسر إلى بداية المرحلة.</p>
          <div class="player-turns">
            ${stage2Types.map(type => {
              const g = groupByTypeV9599(type);
              const done = g ? groupDoneV9599(g,p) : false;
              return `<span class="turn-chip ${type === currentType ? 'current' : ''} ${done ? 'done' : ''}">
                <span class="icon-3d">${type === currentType ? '🎯' : '👤'}</span>
                ${roleTitle(type)}: ${escV9599(roles[type] || '-')}
              </span>`;
            }).join('')}
          </div>
        </div>
      `;
      return;
    }

    if(complete){
      $('stage2RoleBox').innerHTML = `
        <div class="stage2-role-select-v9599">
          <h3>توزيع اللاعبين جاهز</h3>
          <p class="muted">لم تبدأ المرحلة الثانية بعد. يمكنكم إعادة توزيع اللاعبين إذا أعادكم الميسر إلى بداية المرحلة.</p>
          <div class="player-turns">
            ${stage2Types.map(type => `<span class="turn-chip done">${roleTitle(type)}: ${escV9599(roles[type] || '-')}</span>`).join('')}
          </div>
          <button class="btn secondary stage2-reset-roles-v9599" onclick="resetStage2RolesFromContestantV9599()">إعادة توزيع اللاعبين</button>
        </div>
      `;
      return;
    }

    const nextType = stage2Types.find(type => !roles[type]);
    const usedNames = new Set(Object.values(roles).filter(Boolean));
    const available = names.filter(name => !usedNames.has(name));

    $('stage2RoleBox').innerHTML = `
      <div class="stage2-role-select-v9599">
        <h3>اختيار لاعبي المرحلة الثانية</h3>
        <p class="muted">اختاروا لاعبًا مختلفًا لكل نوع.</p>
        <div class="stage2-role-grid">
          ${stage2Types.map(type => `
            <div class="stage2-role-card ${roles[type] ? 'done' : ''} ${type === nextType ? 'current' : ''}">
              <b>${roleTitle(type)}</b>
              <span>${roles[type] ? escV9599(roles[type]) : 'بانتظار الاختيار'}</span>
            </div>
          `).join('')}
        </div>
        <div class="stage2-next-role">
          <label>النوع التالي: ${roleTitle(nextType)}</label>
          <select id="rolePlayerSelect">
            <option value="">اختر اللاعب</option>
            ${available.map(name => `<option value="${escV9599(name)}">${escV9599(name)}</option>`).join('')}
          </select>
          <button class="btn role-btn" onclick="assignStage2Role('${nextType}')">تثبيت اللاعب</button>
        </div>
      </div>
    `;
  };

  window.assignStage2Role = assignStage2Role = async function(type){
    const p = progressV9599();
    if(hasStartedV9599(p)){
      alert('تم بدء المرحلة الثانية، ولا يمكن تغيير اللاعبين إلا إذا أعادكم الميسر إلى بداية المرحلة.');
      return;
    }
    const name = String($('rolePlayerSelect')?.value || '').trim();
    if(!name) return alert('اختر لاعبًا');
    const names = roleNamesV9599();
    const roles = cleanRolesV9599(p);
    if(!names.includes(name)) return alert('هذا اللاعب غير موجود ضمن أسماء الفريق.');
    if(Object.entries(roles).some(([k,v]) => k !== type && v === name)) return alert('هذا اللاعب مستخدم لنوع آخر. اختر لاعبًا مختلفًا.');
    roles[type] = name;
    await patchTeam({progress:Object.assign({}, team.progress, {stage2:Object.assign({}, p, {roles, rolesLocked:false})})});
  };

  window.renderStage2Item = renderStage2Item = function(g,q,key,p){
    const done = !!(p.answered || {})[key];
    const points = Number(g.points || 15);
    const saved = String((p.answers || {})[key] || '');

    if(isCorrectQuestionV9599(g,q)){
      const parts = partsV9599(q);
      return `
        <div class="stage2-item stage2-item-v9599 stage2-correction-v9599 ${done ? 'done stage2-sent-v9599' : ''}">
          <b>${escV9599(q.q)}</b>
          <p class="stage2-help-v9599">اختر الجزء الذي تريد تصحيحه، ثم اكتب التصحيح فقط</p>
          <div class="stage2-correction-parts-v9599">
            ${parts.map((part,idx) => `<button class="stage2-correction-part-v9599" type="button" data-part="${escV9599(part)}" data-idx="${idx}" ${done ? 'disabled' : ''}>${escV9599(part)}</button>`).join('')}
          </div>
          <input data-key="${escV9599(key)}" value="${escV9599(saved)}" placeholder="اكتب التصحيح الصحيح فقط" ${done ? 'disabled' : ''} class="${done ? 'stage2-answer-sent-v9599' : ''}">
          <button class="btn s2-check ${done ? 'stage2-answer-sent-v9599' : ''}"
            data-key="${escV9599(key)}"
            data-correct="${escV9599(q.answer || q.correct || q.correctAnswer || '')}"
            data-points="${points}"
            data-title="${escV9599(g.title)}"
            data-mode="correct"
            ${done ? 'disabled' : ''}>تسجيل الإجابة</button>
        </div>
      `;
    }

    if(q.type === 'choice' || isTrueFalseV9599(g,q)){
      const options = (q.options && q.options.length) ? q.options : ['صح','خطأ'];
      return `
        <div class="stage2-item stage2-item-v9599 stage2-choice-v9599 ${done ? 'done stage2-sent-v9599' : ''}">
          <b>${escV9599(q.q)}</b>
          <div class="answers">
            ${shuffle(options || []).map(option => {
              const selected = done && saved && String(option) === saved;
              return `<button class="answer s2-choice stage2-tf-option-v9599 ${selected ? 'stage2-choice-final-v9599 selected' : ''} ${done && !selected ? 'stage2-choice-muted-v9599' : ''}"
                data-key="${escV9599(key)}"
                data-answer="${escV9599(option)}"
                data-correct="${escV9599(q.answer)}"
                data-points="${points}"
                data-title="${escV9599(g.title)}"
                ${done ? 'disabled' : ''}>${escV9599(option)}</button>`;
            }).join('')}
          </div>
        </div>
      `;
    }

    return `
      <div class="stage2-item stage2-item-v9599 ${done ? 'done stage2-sent-v9599' : ''}">
        <b>${escV9599(q.q)}</b>
        <input data-key="${escV9599(key)}" value="${escV9599(saved)}" placeholder="اكتب الإجابة" ${done ? 'disabled' : ''} class="${done ? 'stage2-answer-sent-v9599' : ''}">
        <button class="btn s2-check ${done ? 'stage2-answer-sent-v9599' : ''}"
          data-key="${escV9599(key)}"
          data-correct="${escV9599(q.answer)}"
          data-points="${points}"
          data-title="${escV9599(g.title)}"
          ${done ? 'disabled' : ''}>تسجيل الإجابة</button>
      </div>
    `;
  };

  function bindStage2V9599(){
    document.querySelectorAll('#stage2 .stage2-correction-part-v9599').forEach(btn => {
      btn.onclick = () => {
        if(btn.disabled) return;
        const item = btn.closest('.stage2-item');
        selectedCorrectionPartV9599 = String(btn.dataset.part || '').trim();
        item.querySelectorAll('.stage2-correction-part-v9599').forEach(x => x.classList.remove('selected'));
        btn.classList.add('selected');
      };
    });

    document.querySelectorAll('#stage2 .s2-choice').forEach(btn => {
      btn.onclick = () => {
        if(btn.disabled) return;
        const item = btn.closest('.stage2-item');
        item.querySelectorAll('.s2-choice').forEach(x => x.classList.remove('selected','stage2-selected-v9599'));
        btn.classList.add('selected','stage2-selected-v9599');
        answer2(btn.dataset.key, btn.dataset.answer, btn.dataset.correct, btn, Number(btn.dataset.points || 15), btn.dataset.title);
      };
    });

    document.querySelectorAll('#stage2 .s2-check').forEach(btn => {
      btn.onclick = () => {
        const input = document.querySelector(`input[data-key="${btn.dataset.key}"]`);
        answer2(btn.dataset.key, input?.value || '', btn.dataset.correct, btn, Number(btn.dataset.points || 15), btn.dataset.title);
      };
    });
  }

  window.answer2 = answer2 = async function(key,answer,correct,el,points,title){
    if(team.progress?.stage2?.answered?.[key]) return;

    const item = el?.closest?.('.stage2-item');
    const input = item?.querySelector?.(`input[data-key="${key}"]`);
    const isCorrection = item?.classList?.contains('stage2-correction-v9599');
    const isChoice = el?.classList?.contains('s2-choice');

    let cleanAnswer = String(answer || input?.value || '').trim();

    if(isCorrection){
      const selectedPart = String(item.querySelector('.stage2-correction-part-v9599.selected')?.dataset.part || selectedCorrectionPartV9599 || '').trim();
      if(!selectedPart) return alert('اختر الجزء الذي تريد تصحيحه أولًا');
      if(!cleanAnswer){
        if(input) input.focus();
        return alert('اكتب التصحيح الصحيح فقط');
      }
    } else if(!cleanAnswer){
      if(input) input.focus();
      return alert('اكتب الإجابة أولًا');
    }

    const ok = norm(cleanAnswer) === norm(correct);
    const pts = ok ? Number(points || 15) : 0;
    const group = DATA.stage2.groups.find(g => g.title === title);

    if(isChoice && el){
      el.classList.add('selected','stage2-choice-final-v9599');
      lockItemSilentV9599(item, cleanAnswer, 'choice');
    }else{
      lockItemSilentV9599(item, cleanAnswer, 'input');
    }

    await saveDisplayedAnswerV9599(key, cleanAnswer);

    await markStage2Answered(
      key,
      pts,
      makeLog(
        'فتشوا الكتب',
        item?.querySelector('b')?.innerText || key,
        cleanAnswer,
        correct,
        ok,
        pts,
        title,
        team.progress?.stage2?.roles?.[group?.type] || ''
      )
    );

    maybeAutoIntro3V9599();
  };

  const oldRenderStage2SequentialV9599 = typeof renderStage2Sequential === 'function' ? renderStage2Sequential : null;
  if(oldRenderStage2SequentialV9599){
    window.renderStage2Sequential = renderStage2Sequential = function(p){
      if(allDoneV9599(p)){
        $('stage2List').innerHTML = '';
        maybeAutoIntro3V9599();
        return;
      }
      oldRenderStage2SequentialV9599.apply(this, arguments);
      bindStage2V9599();
      document.querySelectorAll('#stage2 *').forEach(node => {
        if(node.childNodes && node.childNodes.length === 1){
          const txt = node.textContent || '';
          if(txt.includes('تم إرسال الإجابة') || txt.includes('الانتقال إلى المرحلة الثالثة') || txt.includes('سيتم الانتقال')){
            node.textContent = '';
            node.classList.add('hidden');
          }
        }
      });
    };
  }
})();


/* ===== V9.5.101: Stage 2 no-flicker transition + correction input usability ===== */
(function(){
  'use strict';

  function progressV95101(){
    return team?.progress?.stage2 || {answered:{}, roles:{}, matching:{}, startedTurns:{}, answers:{}};
  }

  function matchingGroupV95101(){
    return (DATA.stage2.groups || []).find(g => g.type === 'matching');
  }

  function matchingKeyV95101(i){
    return `matching_${i}`;
  }

  function groupDoneV95101(g, p){
    if(!g) return true;
    return (g.questions || []).every((q,i) => !!(p.answered || {})[`${g.type}_${i}`]);
  }

  function allDoneV95101(p){
    p = p || progressV95101();
    return (DATA.stage2.groups || []).every(g => groupDoneV95101(g,p));
  }

  function maybeIntro3V95101(){
    if(!allDoneV95101(progressV95101())) return;
    setTimeout(() => {
      try { finishStage('stage2','intro3'); }
      catch(e){ console.error(e); }
    }, 350);
  }

  // Make correction input always writable before submission, even before selecting a part.
  function unlockCorrectionInputsV95101(){
    document.querySelectorAll('#stage2 .stage2-correction-v9599:not(.done):not(.stage2-sent-v9599) input, #stage2 .stage2-correction-v9598:not(.done):not(.stage2-sent-v9598) input').forEach(input => {
      input.disabled = false;
      input.readOnly = false;
      input.style.pointerEvents = 'auto';
    });
  }

  // Replace matching confirm with one batched update to avoid several Firestore renders/flicker.
  async function submitMatchingBatchV95101(){
    if(typeof pairsV9596 === 'undefined') return false;

    const g = matchingGroupV95101();
    const p = progressV95101();
    const questions = g?.questions || [];
    if(!g || !questions.length) return false;

    const missing = questions.some((q,i) => !(p.answered || {})[matchingKeyV95101(i)] && !pairsV9596[i]);
    if(missing){
      const status = document.getElementById('matchingStatusV9596');
      if(status){
        status.className = 'matching-status-v9596 warning';
        status.textContent = 'أكمل كل التوصيلات قبل التأكيد';
      }
      return true;
    }

    document.querySelectorAll('#stage2 .match-left-v9596,#stage2 .match-right-v9596,#stage2 #matchingConfirmV9596').forEach(el => {
      el.disabled = true;
      el.classList.add('sent');
    });

    const pNow = progressV95101();
    const answered = Object.assign({}, pNow.answered || {});
    let totalDelta = 0;
    const logs = [];

    for(let i=0; i<questions.length; i++){
      const key = matchingKeyV95101(i);
      if(answered[key]) continue;

      const q = questions[i];
      const answer = pairsV9596[i];
      const correct = q.answer;
      const ok = String(answer) === String(correct);
      const pts = ok ? Number(g.points || 15) : 0;

      answered[key] = true;
      totalDelta += pts;
      logs.push(makeLog(
        'فتشوا الكتب',
        q.q,
        answer,
        correct,
        ok,
        pts,
        'توصيل',
        team.progress?.stage2?.roles?.matching || ''
      ));
      delete pairsV9596[i];
    }

    const nextProgress = Object.assign({}, team.progress, {
      stage2: Object.assign({}, pNow, {answered})
    });

    if(team) {
      team.score = (Number(team.score || 0) + totalDelta);
      team.progress = nextProgress;
    }

    const update = {
      score: (Number(team.score || 0)),
      logs: FieldValue.arrayUnion(...logs),
      progress: nextProgress
    };

    await patchTeam(update);

    setTimeout(() => {
      try { render2(); } catch(e) {}
      maybeIntro3V95101();
    }, 80);

    return true;
  }

  const oldRenderStage2SequentialV95101 = typeof renderStage2Sequential === 'function' ? renderStage2Sequential : null;
  if(oldRenderStage2SequentialV95101){
    window.renderStage2Sequential = renderStage2Sequential = function(){
      const result = oldRenderStage2SequentialV95101.apply(this, arguments);

      unlockCorrectionInputsV95101();

      const confirm = document.getElementById('matchingConfirmV9596');
      if(confirm){
        confirm.onclick = async () => {
          const handled = await submitMatchingBatchV95101();
          if(!handled && typeof submitMatchingV9596 === 'function') submitMatchingV9596();
        };
      }

      return result;
    };
  }

  document.addEventListener('click', function(e){
    const stage = document.getElementById('stage2');
    if(!stage || !stage.contains(e.target)) return;
    setTimeout(unlockCorrectionInputsV95101, 0);
  }, true);

  document.addEventListener('DOMContentLoaded', () => setTimeout(unlockCorrectionInputsV95101, 200));
})();


/* ===== V9.5.102: Stage 2 remove end button + repair matching confirm ===== */
(function(){
  'use strict';

  const matchPairsV95102 = {};
  let selectedLeftV95102 = null;

  function escV95102(v){
    return String(v ?? '').replace(/[&<>"']/g, m => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[m]));
  }

  function progressV95102(){
    return team?.progress?.stage2 || {answered:{}, roles:{}, matching:{}, startedTurns:{}, answers:{}};
  }

  function matchingGroupV95102(){
    return (DATA.stage2.groups || []).find(g => g.type === 'matching');
  }

  function matchKeyV95102(i){
    return `matching_${i}`;
  }

  function groupDoneV95102(g,p){
    if(!g) return true;
    return (g.questions || []).every((q,i) => !!(p.answered || {})[`${g.type}_${i}`]);
  }

  function allStage2DoneV95102(p){
    p = p || progressV95102();
    return (DATA.stage2.groups || []).every(g => groupDoneV95102(g,p));
  }

  function firstIncompleteTypeV95102(p){
    p = p || progressV95102();
    const g = (DATA.stage2.groups || []).find(group => !groupDoneV95102(group,p));
    return g ? g.type : null;
  }

  function maybeIntro3V95102(){
    if(!allStage2DoneV95102(progressV95102())) return;
    setTimeout(() => {
      try { finishStage('stage2','intro3'); }
      catch(e){ console.error('Stage 2 auto transition failed:', e); }
    }, 350);
  }

  function matchingReadyV95102(g,p){
    const questions = g?.questions || [];
    return questions.length > 0 && questions.every((q,i) => (p.answered || {})[matchKeyV95102(i)] || matchPairsV95102[i]);
  }

  function answeredRightValuesV95102(g,p){
    const answered = new Set();
    (g?.questions || []).forEach((q,i) => {
      if((p.answered || {})[matchKeyV95102(i)]) answered.add(String(q.answer));
    });
    return answered;
  }

  function usedRightValuesV95102(g,p){
    const used = answeredRightValuesV95102(g,p);
    Object.values(matchPairsV95102).forEach(v => used.add(String(v)));
    return used;
  }

  function refreshMatchingPanelV95102(g,p){
    g = g || matchingGroupV95102();
    p = p || progressV95102();
    const container = document.querySelector('#stage2 .stage2-group.active-type');
    if(container && g){
      const title = container.querySelector('h3')?.outerHTML || '';
      container.innerHTML = `${title}${renderMatchingGroup(g,p)}`;
      bindMatchingPanelV95102();
    }
  }

  function unpairMatchV95102(index){
    if(index === undefined || index === null) return;
    delete matchPairsV95102[String(index)];
    selectedLeftV95102 = null;
    refreshMatchingPanelV95102();
    const status = document.getElementById('matchingStatusV95102');
    if(status){
      status.className = 'matching-status-v9596 warning';
      status.textContent = 'تم التراجع عن التوصيل. اختر توصيلًا جديدًا.';
    }
  }

  window.renderMatchingGroup = renderMatchingGroup = function(g,p){
    p = p || progressV95102();

    Object.keys(matchPairsV95102).forEach(i => {
      if((p.answered || {})[matchKeyV95102(i)]) delete matchPairsV95102[i];
    });

    const questions = g.questions || [];
    const usedRights = usedRightValuesV95102(g,p);
    const answeredRights = answeredRightValuesV95102(g,p);
    const right = shuffle(questions.map(q => q.answer));

    return `
      <div class="matching-card-v9596 matching-card-v95102">
        <div class="matching-help matching-help-v9596">
          اختر عبارة من العمود الأول ثم اختر الإجابة المطابقة من العمود الثاني. بعد اكتمال التوصيل اضغط تأكيد الإجابة.
        </div>

        <div class="matching-wrap matching-wrap-v9596">
          <div class="match-col match-col-v9596">
            <h4>العمود الأول</h4>
            ${questions.map((q,i) => {
              const done = !!(p.answered || {})[matchKeyV95102(i)];
              const paired = matchPairsV95102[i];
              return `
                <button class="match-left match-left-v9596 match-left-v95102 ${done || paired ? 'paired matched' : ''}"
                  type="button"
                  data-i="${i}"
                  data-q="${escV95102(q.q)}"
                  data-answer="${escV95102(q.answer)}"
                  ${done ? 'disabled' : ''}>
                  ${escV95102(q.q)}
                  ${paired ? `<small>↔ ${escV95102(paired)}</small>` : ''}
                </button>
              `;
            }).join('')}
          </div>

          <div class="match-col match-col-v9596">
            <h4>العمود الثاني</h4>
            ${right.map(value => {
              const used = usedRights.has(String(value));
              const answered = answeredRights.has(String(value));
              return `
                <button class="match-right match-right-v9596 match-right-v95102 ${used ? 'paired matched' : ''}"
                  type="button"
                  data-a="${escV95102(value)}"
                  ${answered ? 'disabled' : ''}>
                  ${escV95102(value)}
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <div class="matching-confirm-wrap-v9596">
          <div id="matchingStatusV95102" class="matching-status-v9596 ${matchingReadyV95102(g,p) ? 'selected' : ''}">
            ${matchingReadyV95102(g,p) ? 'تم إكمال التوصيل — اضغط تأكيد الإجابة' : 'أكمل توصيل كل العناصر أولًا'}
          </div>
          <button id="matchingConfirmV95102" class="btn matching-confirm-v9596" type="button" ${matchingReadyV95102(g,p) ? '' : 'disabled'}>
            تأكيد الإجابة
          </button>
        </div>
      </div>
    `;
  };

  window.selectMatchLeft = selectMatchLeft = function(button){
    if(!button || button.disabled) return;

    const index = String(button.dataset.i || '');
    if(matchPairsV95102[index]){
      unpairMatchV95102(index);
      return;
    }

    document.querySelectorAll('#stage2 .match-left-v95102').forEach(x => x.classList.remove('selected'));
    selectedLeftV95102 = button;
    button.classList.add('selected');

    const status = document.getElementById('matchingStatusV95102');
    if(status){
      status.className = 'matching-status-v9596 selected';
      status.innerHTML = `اختر الإجابة المناسبة لـ: <b>${escV95102(button.dataset.q || button.textContent)}</b>`;
    }
  };

  window.answerMatch = answerMatch = function(button){
    if(!button || button.disabled) return;

    const clickedValue = String(button.dataset.a || '').trim();
    const existingIndex = Object.keys(matchPairsV95102).find(i => String(matchPairsV95102[i]) === clickedValue);

    if(existingIndex !== undefined && !selectedLeftV95102){
      unpairMatchV95102(existingIndex);
      return;
    }

    if(!selectedLeftV95102 || selectedLeftV95102.disabled){
      const status = document.getElementById('matchingStatusV95102');
      if(status){
        status.className = 'matching-status-v9596 warning';
        status.textContent = 'اختر عبارة من العمود الأول أولًا';
      }
      return;
    }

    const left = selectedLeftV95102;
    const index = String(left.dataset.i);
    const value = String(button.dataset.a || '').trim();
    if(!value) return;

    if(matchPairsV95102[index] && String(matchPairsV95102[index]) === value){
      unpairMatchV95102(index);
      return;
    }

    if(existingIndex !== undefined && existingIndex !== index){
      delete matchPairsV95102[existingIndex];
    }

    matchPairsV95102[index] = value;

    left.classList.add('paired','matched');
    left.disabled = false;
    left.title = 'اضغط مرة ثانية للتراجع عن هذا التوصيل';
    if(!left.querySelector('small')) left.insertAdjacentHTML('beforeend', `<small>↔ ${escV95102(value)}</small>`);

    button.classList.add('paired','matched');
    button.disabled = false;
    button.title = 'اضغط مرة ثانية للتراجع عن هذا التوصيل';

    selectedLeftV95102 = null;

    const g = matchingGroupV95102();
    const p = progressV95102();
    const ready = matchingReadyV95102(g,p);
    const confirm = document.getElementById('matchingConfirmV95102');
    const status = document.getElementById('matchingStatusV95102');

    if(confirm){
      confirm.disabled = !ready;
      confirm.classList.toggle('ready', ready);
    }
    if(status){
      status.className = 'matching-status-v9596' + (ready ? ' selected' : '');
      status.textContent = ready ? 'تم إكمال التوصيل — اضغط تأكيد الإجابة' : 'أكمل توصيل كل العناصر أولًا';
    }
  };

  async function submitMatchingV95102(){
    const g = matchingGroupV95102();
    const p = progressV95102();
    const questions = g?.questions || [];
    if(!g || !questions.length) return;

    const missing = questions.some((q,i) => !(p.answered || {})[matchKeyV95102(i)] && !matchPairsV95102[i]);
    if(missing){
      const status = document.getElementById('matchingStatusV95102');
      if(status){
        status.className = 'matching-status-v9596 warning';
        status.textContent = 'أكمل كل التوصيلات قبل التأكيد';
      }
      return;
    }

    document.querySelectorAll('#stage2 .match-left-v95102,#stage2 .match-right-v95102,#stage2 #matchingConfirmV95102').forEach(el => {
      el.disabled = true;
      el.classList.add('sent');
    });

    const answered = Object.assign({}, p.answered || {});
    const logs = [];
    let totalDelta = 0;

    for(let i=0; i<questions.length; i++){
      const key = matchKeyV95102(i);
      if(answered[key]) continue;

      const q = questions[i];
      const answer = matchPairsV95102[i];
      const correct = q.answer;
      const ok = String(answer) === String(correct);
      const pts = ok ? Number(g.points || 15) : 0;

      answered[key] = true;
      totalDelta += pts;
      logs.push(makeLog(
        'فتشوا الكتب',
        q.q,
        answer,
        correct,
        ok,
        pts,
        'توصيل',
        team.progress?.stage2?.roles?.matching || ''
      ));
      delete matchPairsV95102[i];
    }

    const nextScore = Number(team.score || 0) + totalDelta;
    const nextProgress = Object.assign({}, team.progress, {
      stage2: Object.assign({}, p, {answered})
    });

    if(team){
      team.score = nextScore;
      team.progress = nextProgress;
    }

    const update = {
      score: nextScore,
      progress: nextProgress
    };
    if(logs.length) update.logs = FieldValue.arrayUnion(...logs);

    await patchTeam(update);

    const status = document.getElementById('matchingStatusV95102');
    if(status){
      status.className = 'matching-status-v9596 sent';
      status.textContent = '';
    }

    setTimeout(() => {
      try { render2(); } catch(e) {}
      maybeIntro3V95102();
    }, 120);
  }

  function bindMatchingPanelV95102(){
    document.querySelectorAll('#stage2 .match-left-v95102').forEach(btn => btn.onclick = () => selectMatchLeft(btn));
    document.querySelectorAll('#stage2 .match-right-v95102').forEach(btn => btn.onclick = () => answerMatch(btn));
    const confirm = document.getElementById('matchingConfirmV95102');
    if(confirm) confirm.onclick = () => submitMatchingV95102();
  }

  const previousRenderStage2SequentialV95102 = typeof renderStage2Sequential === 'function' ? renderStage2Sequential : null;
  if(previousRenderStage2SequentialV95102){
    window.renderStage2Sequential = renderStage2Sequential = function(p){
      if(allStage2DoneV95102(p)){
        $('stage2List').innerHTML = '';
        maybeIntro3V95102();
        return;
      }

      previousRenderStage2SequentialV95102.apply(this, arguments);

      // Remove any end-stage wording/button produced by older code.
      document.querySelectorAll('#stage2 *').forEach(node => {
        const txt = node.textContent || '';
        if(txt.includes('إنهاء المرحلة الثانية') || txt.includes('الانتقال إلى المرحلة الثالثة') || txt.includes('سيتم الانتقال')){
          if(node.tagName === 'BUTTON') node.remove();
          else {
            node.textContent = '';
            node.classList.add('hidden');
          }
        }
      });

      const currentType = firstIncompleteTypeV95102(p);
      if(currentType === 'matching'){
        const g = matchingGroupV95102();
        const container = document.querySelector('#stage2 .stage2-group.active-type');
        if(container && g){
          const title = container.querySelector('h3')?.outerHTML || '';
          container.innerHTML = `${title}${renderMatchingGroup(g,p)}`;
        }

        bindMatchingPanelV95102();
      }
    };
  }
})();


/* ===== V9.5.103 FINAL: Stage 2 hide end button + no-flicker answer submit ===== */
(function(){
  'use strict';

  function removeStage2EndButtonV95103(){
    const btn = document.getElementById('finish2Btn');
    if(btn) btn.remove();

    document.querySelectorAll('#stage2 button,#stage2 .btn,#stage2 p,#stage2 h3').forEach(node => {
      const txt = (node.textContent || '').trim();
      if(txt.includes('إنهاء المرحلة الثانية') || txt.includes('انهاء المرحلة الثانية') || txt.toLowerCase().includes('finish stage 2')){
        node.remove();
      }
      if(txt.includes('يمكنكم الآن الضغط على') || txt.includes('الانتقال إلى المرحلة الثالثة') || txt.includes('سيتم الانتقال')){
        node.textContent = '';
        node.classList.add('hidden');
      }
    });
  }

  function progressV95103(){
    return team?.progress?.stage2 || {answered:{},roles:{},matching:{},startedTurns:{},answers:{}};
  }

  function groupDoneV95103(g,p){
    if(!g) return true;
    return (g.questions || []).every((q,i) => !!(p.answered || {})[`${g.type}_${i}`]);
  }

  function allDoneV95103(p){
    p = p || progressV95103();
    return (DATA.stage2.groups || []).every(g => groupDoneV95103(g,p));
  }

  function maybeIntro3V95103(){
    if(!allDoneV95103(progressV95103())) return;
    setTimeout(() => {
      try { finishStage('stage2','intro3'); }
      catch(e){ console.error('Stage 2 auto transition failed:', e); }
    }, 300);
  }

  function currentGroupTypeFromKeyV95103(key){
    return String(key || '').split('_')[0];
  }

  function groupByTypeV95103(type){
    return (DATA.stage2.groups || []).find(g => g.type === type);
  }

  function currentTypeDoneV95103(type,p){
    return groupDoneV95103(groupByTypeV95103(type), p || progressV95103());
  }

  function lockStage2ItemLocalV95103(item, answerText, isChoice){
    if(!item) return;

    item.classList.add('stage2-sent-v9599','stage2-sent-v95103','done');

    const input = item.querySelector('input, textarea');
    if(input){
      input.value = answerText || input.value || '';
      input.disabled = true;
      input.removeAttribute('placeholder');
      input.classList.add('stage2-answer-sent-v9599','stage2-answer-sent-v95103');
    }

    item.querySelectorAll('button').forEach(btn => {
      btn.disabled = true;
      if(isChoice){
        if(btn.classList.contains('selected') || btn.classList.contains('stage2-selected-v9599')){
          btn.classList.add('stage2-choice-final-v9599','stage2-choice-final-v95103');
        }else{
          btn.classList.add('stage2-choice-muted-v9599','stage2-choice-muted-v95103');
        }
      }else{
        btn.classList.add('stage2-answer-sent-v9599','stage2-answer-sent-v95103');
      }
    });

    item.querySelectorAll('.stage2-item-status-v9597,.stage2-item-status-v9598,.stage2-item-status-v9599,.stage2-item-status-v95103').forEach(x => x.remove());
  }

  window.answer2 = answer2 = async function(key, answer, correct, el, points, title){
    if(team.progress?.stage2?.answered?.[key]) return;

    const item = el?.closest?.('.stage2-item');
    const input = item?.querySelector?.(`input[data-key="${key}"]`);
    const isCorrection = !!item?.classList?.contains('stage2-correction-v9599') || !!item?.classList?.contains('stage2-correction-v9598');
    const isChoice = !!el?.classList?.contains('s2-choice');

    let cleanAnswer = String(answer || input?.value || '').trim();

    if(isCorrection){
      const selectedPart = String(item?.querySelector?.('.stage2-correction-part-v9599.selected,.stage2-correction-part-v9598.selected')?.dataset?.part || '').trim();
      if(!selectedPart) return alert('اختر الجزء الذي تريد تصحيحه أولًا');
      if(!cleanAnswer){
        if(input) input.focus();
        return alert('اكتب التصحيح الصحيح فقط');
      }
    }else if(!cleanAnswer){
      if(input) input.focus();
      return alert('اكتب الإجابة أولًا');
    }

    if(isChoice && el){
      item?.querySelectorAll?.('.s2-choice').forEach(x => x.classList.remove('selected','stage2-selected-v9599'));
      el.classList.add('selected','stage2-selected-v9599','stage2-choice-final-v95103');
    }

    lockStage2ItemLocalV95103(item, cleanAnswer, isChoice);

    const ok = norm(cleanAnswer) === norm(correct);
    const pts = ok ? Number(points || 15) : 0;
    const group = DATA.stage2.groups.find(g => g.title === title);
    const type = group?.type || currentGroupTypeFromKeyV95103(key);

    const p = progressV95103();
    const answered = Object.assign({}, p.answered || {}, {[key]: true});
    const answers = Object.assign({}, p.answers || {}, {[key]: cleanAnswer});
    const nextProgress = Object.assign({}, team.progress, {
      stage2: Object.assign({}, p, {answered, answers})
    });
    const nextScore = Number(team.score || 0) + pts;
    const nextStageScores = Object.assign({}, team.stageScores || {}, {stage2:Number(team.stageScores?.stage2 || 0) + pts});

    if(team){
      team.score = nextScore;
      team.stageScores = nextStageScores;
      team.progress = nextProgress;
    }

    await patchTeam({
      score: nextScore,
      stageScores: nextStageScores,
      answerLog: FieldValue.arrayUnion(makeLog(
        'فتشوا الكتب',
        item?.querySelector('b')?.innerText || key,
        cleanAnswer,
        correct,
        ok,
        pts,
        title,
        p.roles?.[type] || ''
      )),
      progress: nextProgress
    });

    removeStage2EndButtonV95103();

    // Do not manually re-render the current answered item; that caused visible flicker.
    // Only move when the whole current type is complete or the whole stage is complete.
    if(allDoneV95103(nextProgress.stage2)){
      setTimeout(() => finishStage('stage2','intro3'), 300);
    }else if(currentTypeDoneV95103(type, nextProgress.stage2)){
      setTimeout(() => {
        try { render2(); }
        catch(e){ console.error(e); }
      }, 220);
    }
  };

  const previousRenderStage2SequentialV95103 = typeof renderStage2Sequential === 'function' ? renderStage2Sequential : null;
  if(previousRenderStage2SequentialV95103){
    window.renderStage2Sequential = renderStage2Sequential = function(){
      const result = previousRenderStage2SequentialV95103.apply(this, arguments);
      removeStage2EndButtonV95103();
      setTimeout(removeStage2EndButtonV95103, 60);
      return result;
    };
  }

  const previousRender2V95103 = typeof render2 === 'function' ? render2 : null;
  if(previousRender2V95103){
    window.render2 = render2 = function(){
      const result = previousRender2V95103.apply(this, arguments);
      removeStage2EndButtonV95103();
      setTimeout(removeStage2EndButtonV95103, 60);
      return result;
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    removeStage2EndButtonV95103();
    setTimeout(removeStage2EndButtonV95103, 250);
  });
})();


/* ===== V9.5.104: Stage 2 true/false confirm + remove stage3 end button ===== */
(function(){
  'use strict';

  const tfSelectedV95104 = {};

  function escV95104(v){
    return String(v ?? '').replace(/[&<>"']/g, m => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[m]));
  }

  function removeStage3EndButtonV95104(){
    document.querySelectorAll('#stage3 button,#stage3 .btn,#stage3 p,#stage3 h3').forEach(node => {
      const txt = (node.textContent || '').trim();
      if(txt.includes('إنهاء المرحلة الثالثة') || txt.includes('انهاء المرحلة الثالثة') || txt.toLowerCase().includes('finish stage 3')){
        node.remove();
      }
    });
  }

  function isStage2TrueFalseItemV95104(item){
    if(!item) return false;
    const choices = [...item.querySelectorAll('.s2-choice')].map(b => String(b.dataset.answer || b.textContent || '').trim());
    if(choices.length !== 2) return false;
    const compact = choices.map(x => x.replace(/\s+/g,''));
    return compact.includes('صح') && compact.includes('خطأ');
  }

  function ensureTFConfirmV95104(item){
    if(!item || item.classList.contains('done') || item.classList.contains('stage2-sent-v9599') || item.classList.contains('stage2-sent-v95103')) return;
    if(!isStage2TrueFalseItemV95104(item)) return;

    item.classList.add('stage2-tf-confirm-item-v95104');

    const key = item.querySelector('.s2-choice')?.dataset?.key || '';
    if(!key) return;

    let confirm = item.querySelector('.stage2-tf-confirm-v95104');
    if(!confirm){
      confirm = document.createElement('button');
      confirm.type = 'button';
      confirm.className = 'btn stage2-tf-confirm-v95104';
      confirm.textContent = 'تأكيد الإجابة';
      confirm.disabled = true;
      item.appendChild(confirm);
    }

    confirm.onclick = () => {
      const selected = tfSelectedV95104[key];
      if(!selected) return;
      answer2(
        selected.key,
        selected.answer,
        selected.correct,
        selected.button,
        Number(selected.points || 15),
        selected.title
      );
    };
  }

  function bindTFConfirmV95104(){
    // تم تعطيل زر التأكيد القديم الخاص بـ V9.5.104 لأن المرحلة الثانية الآن تستخدم
    // زرًا واحدًا فقط من نظام V9.6.31 لأسئلة صح/خطأ. الإبقاء على القديم كان يسبب
    // ظهور زر رمادي مكرر تحت الزر الأزرق.
    document.querySelectorAll('#stage2 .stage2-tf-confirm-v95104').forEach(btn => btn.remove());
    document.querySelectorAll('#stage2 .stage2-tf-confirm-item-v95104').forEach(item => {
      item.classList.remove('stage2-tf-confirm-item-v95104');
    });
  }

  const previousRenderStage2SequentialV95104 = typeof renderStage2Sequential === 'function' ? renderStage2Sequential : null;
  if(previousRenderStage2SequentialV95104){
    window.renderStage2Sequential = renderStage2Sequential = function(){
      const result = previousRenderStage2SequentialV95104.apply(this, arguments);
      bindTFConfirmV95104();
      removeStage3EndButtonV95104();
      setTimeout(bindTFConfirmV95104, 80);
      return result;
    };
  }

  const previousRender2V95104 = typeof render2 === 'function' ? render2 : null;
  if(previousRender2V95104){
    window.render2 = render2 = function(){
      const result = previousRender2V95104.apply(this, arguments);
      bindTFConfirmV95104();
      removeStage3EndButtonV95104();
      setTimeout(bindTFConfirmV95104, 80);
      return result;
    };
  }

  document.addEventListener('click', function(event){
    const stage2 = document.getElementById('stage2');
    if(stage2 && stage2.contains(event.target)) setTimeout(bindTFConfirmV95104, 0);

    const stage3 = document.getElementById('stage3');
    if(stage3 && stage3.contains(event.target)) setTimeout(removeStage3EndButtonV95104, 0);
  }, true);

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(bindTFConfirmV95104, 200);
    setTimeout(removeStage3EndButtonV95104, 200);
  });
})();



/* ===== V9.6.16: Stage 2 professional split layout - roles / handoff / question ===== */
(function(){
  'use strict';

  const S2_TYPES_V9616 = ['matching','complete','correct','truefalse'];
  const tfSelectedV9616 = {};
  const matchPairsV9616 = {};
  let selectedLeftV9616 = null;

  function esc(v){
    return String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function p2(){
    return team?.progress?.stage2 || {answered:{}, roles:{}, matching:{}, startedTurns:{}, stage2TurnStartedAt:{}, answers:{}};
  }

  function playerNamesClean(){
    const src = (typeof uniquePlayerNamesV9414 === 'function') ? uniquePlayerNamesV9414() : (typeof playerNames === 'function' ? playerNames() : []);
    const seen = new Set();
    return src.map(x => String(x || '').trim()).filter(Boolean).filter(x => { if(seen.has(x)) return false; seen.add(x); return true; });
  }

  function cleanRoles(p){
    const names = playerNamesClean();
    const used = new Set();
    const roles = {};
    S2_TYPES_V9616.forEach(type => {
      const name = String((p.roles || {})[type] || '').trim();
      if(name && names.includes(name) && !used.has(name)){
        roles[type] = name;
        used.add(name);
      }
    });
    return roles;
  }

  function group(type){
    return (DATA?.stage2?.groups || []).find(g => g.type === type);
  }

  function groupDone(g,p){
    if(!g) return true;
    return (g.questions || []).every((q,i) => !!(p.answered || {})[`${g.type}_${i}`]);
  }

  function allDone(p){
    return (DATA?.stage2?.groups || []).length > 0 && (DATA.stage2.groups || []).every(g => groupDone(g,p));
  }

  function firstIncomplete(p){
    const g = (DATA?.stage2?.groups || []).find(x => !groupDone(x,p));
    return g ? g.type : null;
  }

  function hasTurnStarted(p,type){
    return !!((p.startedTurns || {})[type] || (p.stage2TurnStartedAt || {})[type]);
  }

  function rolesComplete(roles){
    return S2_TYPES_V9616.every(type => !!roles[type]);
  }

  function stage2HasWorkStarted(p){
    p = p || p2();
    return Object.keys(p.startedTurns || {}).length > 0 || Object.keys(p.answered || {}).length > 0 || Object.keys(p.stage2TurnStartedAt || {}).length > 0;
  }

  function rolesLocked(p){
    p = p || p2();
    return !!p.rolesLocked || stage2HasWorkStarted(p);
  }

  function selectedRolesGrid(roles, names, disabled){
    const used = new Set(Object.values(roles || {}).filter(Boolean));
    return `<div class="stage2-role-grid-v9616 stage2-role-grid-confirm-v9627">
      ${S2_TYPES_V9616.map(type => {
        const current = roles[type] || '';
        const options = names.filter(n => n === current || !used.has(n));
        return `<label class="stage2-role-card-v9616 ${current ? 'done' : ''}">
          <span>${esc(roleTitle(type))}</span>
          <select data-stage2-role-v9616="${type}" ${disabled ? 'disabled' : ''}>
            <option value="">اختر اللاعب</option>
            ${options.map(n => `<option value="${esc(n)}" ${n === current ? 'selected' : ''}>${esc(n)}</option>`).join('')}
          </select>
        </label>`;
      }).join('')}
    </div>`;
  }

  function setMode(mode){
    const stage = document.getElementById('stage2');
    if(!stage) return;
    stage.classList.remove('stage2-mode-roles-v9616','stage2-mode-handoff-v9616','stage2-mode-question-v9616','stage2-mode-done-v9616');
    stage.classList.add(`stage2-mode-${mode}-v9616`);
  }

  function updatePassage(show){
    const passage = document.getElementById('passage');
    if(!passage) return;
    passage.textContent = show ? (DATA?.stage2?.passage || '') : '';
    passage.style.display = show && DATA?.stage2?.passage ? '' : 'none';
  }

  function updateCount(p){
    const count = document.getElementById('stage2Count');
    if(count) count.textContent = `${Object.keys(p.answered || {}).length} / 20`;
  }

  function roleChips(roles, currentType){
    return `<div class="stage2-role-chips-v9616">${S2_TYPES_V9616.map(type => {
      const g = group(type);
      const done = g ? groupDone(g, p2()) : false;
      return `<span class="stage2-role-chip-v9616 ${roles[type] ? 'done' : ''} ${type === currentType ? 'current' : ''} ${done ? 'finished' : ''}">
        <b>${esc(roleTitle(type))}</b><small>${esc(roles[type] || 'بانتظار الاختيار')}</small>
      </span>`;
    }).join('')}</div>`;
  }

  window.renderStage2Roles = renderStage2Roles = function(p){
    p = p || p2();
    const names = playerNamesClean();
    const roles = cleanRoles(p);
    const complete = rolesComplete(roles);
    const box = document.getElementById('stage2RoleBox');
    if(!box) return;

    if(!names.length){
      box.innerHTML = '<div class="stage2-empty-v9616">لا توجد أسماء لاعبين مسجلة.</div>';
      return;
    }

    if(complete){
      const currentType = firstIncomplete(Object.assign({}, p, {roles}));
      const locked = rolesLocked(p);
      const canEdit = !stage2HasWorkStarted(p);
      box.innerHTML = `
        <div class="stage2-roles-ready-v9616 ${locked ? 'locked-v9627' : 'review-v9627'}">
          <div class="stage2-role-title-v9616">
            <h3>${locked ? 'تم تثبيت توزيع اللاعبين' : 'راجعوا توزيع اللاعبين'}</h3>
            <p>${locked ? 'بانتظار بدء مهمة اللاعب من الشاشة.' : 'يمكنكم التعديل الآن، ثم اضغطوا تأكيد التوزيع.'}</p>
          </div>
          ${locked ? roleChips(roles, currentType) : selectedRolesGrid(roles, names, false)}
          <div class="stage2-role-actions-v9627">
            ${!locked ? '<button class="btn stage2-confirm-roles-v9627" type="button" onclick="confirmStage2RolesV9627()">تأكيد التوزيع</button>' : ''}
            ${(!locked && canEdit) ? '<button class="btn secondary stage2-reset-roles-v9616" type="button" onclick="resetStage2RolesFromContestantV9616()">إعادة التوزيع</button>' : ''}
          </div>
        </div>
      `;
      box.querySelectorAll('[data-stage2-role-v9616]').forEach(sel => {
        sel.onchange = () => assignStage2RoleV9616(sel.dataset.stage2RoleV9616, sel.value);
      });
      return;
    }

    box.innerHTML = `
      <div class="stage2-role-screen-v9616">
        <div class="stage2-role-title-v9616">
          <h3>توزيع لاعبي المرحلة الثانية</h3>
          <p>اختاروا لاعبًا مختلفًا لكل نوع، وبعدها اضغطوا تأكيد التوزيع.</p>
        </div>
        ${selectedRolesGrid(roles, names, false)}
      </div>
    `;

    box.querySelectorAll('[data-stage2-role-v9616]').forEach(sel => {
      sel.onchange = () => assignStage2RoleV9616(sel.dataset.stage2RoleV9616, sel.value);
    });
  };

  window.assignStage2RoleV9616 = async function(type,name){
    name = String(name || '').trim();
    if(!name) return;
    const p = p2();
    if(stage2HasWorkStarted(p)){
      alert('تم بدء المرحلة الثانية، لا يمكن تغيير توزيع اللاعبين الآن.');
      return;
    }
    const names = playerNamesClean();
    if(!names.includes(name)) return alert('هذا اللاعب غير موجود ضمن أسماء الفريق.');
    const roles = cleanRoles(p);
    if(Object.entries(roles).some(([k,v]) => k !== type && v === name)) return alert('هذا اللاعب مستخدم لنوع آخر. اختر لاعبًا مختلفًا.');
    roles[type] = name;
    await patchTeam({progress:Object.assign({}, team.progress, {stage2:Object.assign({}, p, {roles})})});
  };

  window.assignStage2Role = assignStage2Role = async function(type){
    const name = String(document.getElementById('rolePlayerSelect')?.value || '').trim();
    return window.assignStage2RoleV9616(type,name);
  };

  window.resetStage2RolesFromContestantV9616 = async function(){
    const p = p2();
    if(stage2HasWorkStarted(p)){
      alert('لا يمكن إعادة التوزيع بعد بداية المرحلة الثانية.');
      return;
    }
    await patchTeam({progress:Object.assign({}, team.progress, {stage2:Object.assign({}, p, {roles:{}, rolesLocked:false})})});
  };

  window.confirmStage2RolesV9627 = async function(){
    const p = p2();
    if(stage2HasWorkStarted(p)){
      alert('تم بدء المرحلة الثانية بالفعل.');
      return;
    }
    const roles = cleanRoles(p);
    if(!rolesComplete(roles)){
      alert('يجب اختيار لاعب مختلف لكل نوع قبل تثبيت التوزيع.');
      return;
    }
    await patchTeam({progress:Object.assign({}, team.progress, {stage2:Object.assign({}, p, {roles, rolesLocked:true})})});
  };

  window.editStage2RolesV9627 = async function(){
    const p = p2();
    if(stage2HasWorkStarted(p)){
      alert('لا يمكن تعديل التوزيع بعد بداية المرحلة الثانية.');
      return;
    }
    await patchTeam({progress:Object.assign({}, team.progress, {stage2:Object.assign({}, p, {rolesLocked:false})})});
  };

  function isTrueFalseStage2ItemV9631(item){
    if(!item) return false;
    const choices = [...item.querySelectorAll('.s2-choice')];
    if(choices.length !== 2) return false;
    const compact = choices.map(btn => String(btn.dataset.answer || btn.textContent || '').replace(/[\sـ]+/g,''));
    return compact.includes('صح') && compact.includes('خطأ');
  }

  function bindStage2QuestionControls(){
    document.querySelectorAll('#stage2 .s2-check').forEach(btn => {
      btn.onclick = () => {
        const input = document.querySelector(`input[data-key="${btn.dataset.key}"]`);
        answer2(btn.dataset.key, input?.value || '', btn.dataset.correct, btn, Number(btn.dataset.points || 15), btn.dataset.title);
      };
    });

    // صح أو خطأ يحتاج اختيارًا ثم زر تأكيد واحد فقط. باقي اختيارات المرحلة الثانية تبقى مباشرة كما كانت.
    document.querySelectorAll('#stage2 .stage2-item').forEach(item => {
      if(isTrueFalseStage2ItemV9631(item)) ensureTrueFalseConfirm(item);
    });

    document.querySelectorAll('#stage2 .s2-choice').forEach(btn => {
      const item = btn.closest('.stage2-item');
      if(isTrueFalseStage2ItemV9631(item)) return;
      btn.onclick = () => answer2(btn.dataset.key, btn.dataset.answer, btn.dataset.correct, btn, Number(btn.dataset.points || 15), btn.dataset.title);
    });

    bindStage2CorrectionPartsV9629();
    bindMatchingV9616();
  }

  function bindStage2CorrectionPartsV9629(){
    document.querySelectorAll('#stage2 .stage2-correction-part-v9599, #stage2 .stage2-correction-part-v9598').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        if(btn.disabled) return;
        const item = btn.closest('.stage2-item');
        if(!item) return;
        item.querySelectorAll('.stage2-correction-part-v9599, .stage2-correction-part-v9598').forEach(x => x.classList.remove('selected','stage2-correction-selected-v9629'));
        btn.classList.add('selected','stage2-correction-selected-v9629');
        const input = item.querySelector('input[data-key]');
        if(input){
          input.disabled = false;
          input.readOnly = false;
          input.style.pointerEvents = 'auto';
          input.placeholder = 'اكتب التصحيح لهذا الجزء';
          setTimeout(() => { try{ input.focus({preventScroll:true}); }catch(_e){ input.focus(); } }, 0);
        }
      };
    });
  }


  function matchKeyV9616(i){ return `matching_${i}`; }

  function renderMatchingGroupV9616(g,p){
    p = p || p2();
    Object.keys(matchPairsV9616).forEach(i => { if((p.answered || {})[matchKeyV9616(i)]) delete matchPairsV9616[i]; });
    const questions = g?.questions || [];
    const used = new Set();
    questions.forEach((q,i) => { if((p.answered || {})[matchKeyV9616(i)]) used.add(String(q.answer)); });
    Object.values(matchPairsV9616).forEach(v => used.add(String(v)));
    const rights = shuffle(questions.map(q => q.answer));
    const ready = questions.length > 0 && questions.every((q,i) => (p.answered || {})[matchKeyV9616(i)] || matchPairsV9616[i]);
    return `
      <div class="matching-card-v9616">
        <div class="matching-wrap-v9616">
          <div class="match-col-v9616">
            <h4>العمود الأول</h4>
            ${questions.map((q,i) => {
              const done = !!(p.answered || {})[matchKeyV9616(i)];
              const paired = matchPairsV9616[i];
              return `<button type="button" class="match-left-v9616 ${paired ? 'paired' : ''} ${done ? 'done' : ''}" data-i="${i}" data-q="${esc(q.q)}" data-answer="${esc(q.answer)}" ${done ? 'disabled' : ''}>
                <span>${esc(q.q)}</span>${paired ? `<small>↔ ${esc(paired)}</small>` : ''}
              </button>`;
            }).join('')}
          </div>
          <div class="match-col-v9616">
            <h4>العمود الثاني</h4>
            ${rights.map(value => {
              const taken = used.has(String(value));
              return `<button type="button" class="match-right-v9616 ${taken ? 'paired' : ''}" data-a="${esc(value)}"><span>${esc(value)}</span></button>`;
            }).join('')}
          </div>
        </div>
        <div class="matching-confirm-v9616">
          <div id="matchingStatusV9616" class="matching-status-v9616 ${ready ? 'ready' : ''}">${ready ? 'تم إكمال التوصيل' : 'أكمل توصيل كل العناصر'}</div>
          <button id="matchingConfirmV9616" class="btn" type="button" ${ready ? '' : 'disabled'}>تأكيد الإجابة</button>
        </div>
      </div>`;
  }

  function refreshMatchingV9616(){
    const p = p2();
    const g = group('matching');
    const box = document.querySelector('#stage2 .stage2-group-v9616');
    if(!box || !g) return;
    box.innerHTML = `<h3>${esc(g.title || roleTitle('matching'))}</h3>${renderMatchingGroupV9616(g,p)}`;
    bindMatchingV9616();
  }

  function unpairV9616(index){
    delete matchPairsV9616[String(index)];
    selectedLeftV9616 = null;
    refreshMatchingV9616();
  }

  function bindMatchingV9616(){
    document.querySelectorAll('#stage2 .match-left-v9616').forEach(btn => {
      btn.onclick = () => {
        if(btn.disabled) return;
        const i = String(btn.dataset.i || '');
        if(matchPairsV9616[i]){ unpairV9616(i); return; }
        document.querySelectorAll('#stage2 .match-left-v9616').forEach(x => x.classList.remove('selected'));
        selectedLeftV9616 = btn;
        btn.classList.add('selected');
        const st = document.getElementById('matchingStatusV9616');
        if(st) st.textContent = 'اختر الإجابة المطابقة';
      };
    });
    document.querySelectorAll('#stage2 .match-right-v9616').forEach(btn => {
      btn.onclick = () => {
        const value = String(btn.dataset.a || '').trim();
        const oldIndex = Object.keys(matchPairsV9616).find(i => String(matchPairsV9616[i]) === value);
        if(oldIndex !== undefined && !selectedLeftV9616){ unpairV9616(oldIndex); return; }
        if(!selectedLeftV9616){
          const st = document.getElementById('matchingStatusV9616');
          if(st) st.textContent = 'اختر عبارة من العمود الأول أولًا';
          return;
        }
        const i = String(selectedLeftV9616.dataset.i || '');
        if(oldIndex !== undefined && oldIndex !== i) delete matchPairsV9616[oldIndex];
        if(matchPairsV9616[i] === value){ unpairV9616(i); return; }
        matchPairsV9616[i] = value;
        selectedLeftV9616 = null;
        refreshMatchingV9616();
      };
    });
    const confirm = document.getElementById('matchingConfirmV9616');
    if(confirm) confirm.onclick = () => submitMatchingV9616();
  }

  async function submitMatchingV9616(){
    const p = p2();
    const g = group('matching');
    const qs = g?.questions || [];
    const missing = qs.some((q,i) => !(p.answered || {})[matchKeyV9616(i)] && !matchPairsV9616[i]);
    if(missing){
      const st = document.getElementById('matchingStatusV9616');
      if(st) st.textContent = 'أكمل كل التوصيلات قبل التأكيد';
      return;
    }
    document.querySelectorAll('#stage2 .match-left-v9616,#stage2 .match-right-v9616,#stage2 #matchingConfirmV9616').forEach(el => { el.disabled = true; el.classList.add('sent'); });
    const answered = Object.assign({}, p.answered || {});
    const logs = [];
    let total = 0;
    qs.forEach((q,i) => {
      const key = matchKeyV9616(i);
      if(answered[key]) return;
      const ans = matchPairsV9616[i];
      const ok = String(ans) === String(q.answer);
      const pts = ok ? Number(g.points || 15) : 0;
      answered[key] = true;
      total += pts;
      logs.push(makeLog('فتشوا الكتب', q.q, ans, q.answer, ok, pts, 'توصيل', p.roles?.matching || ''));
      delete matchPairsV9616[i];
    });
    const nextProgress = Object.assign({}, team.progress, {stage2:Object.assign({}, p, {answered})});
    const nextScore = Number(team.score || 0) + total;
    const nextStageScores = Object.assign({}, team.stageScores || {}, {stage2:Number(team.stageScores?.stage2 || 0) + total});
    if(team){ team.score = nextScore; team.stageScores = nextStageScores; team.progress = nextProgress; }
    const update = {score:nextScore, stageScores:nextStageScores, progress:nextProgress};
    if(logs.length) update.answerLog = FieldValue.arrayUnion(...logs);
    await patchTeam(update);
    // لا نعيد رسم المرحلة يدويًا هنا حتى لا تقفز الصفحة للأعلى؛ تحديث Firestore سيعرض الدور التالي بسلاسة.
  }

  function ensureTrueFalseConfirm(item){
    if(!item || item.classList.contains('done')) return;
    item.querySelectorAll('.stage2-tf-confirm-v95104').forEach(btn => btn.remove());
    item.classList.remove('stage2-tf-confirm-item-v95104');
    item.classList.add('stage2-tf-confirm-v9616');
    const key = item.querySelector('.s2-choice')?.dataset?.key || '';
    if(!key) return;
    let confirm = item.querySelector('.stage2-tf-confirm-btn-v9616');
    if(!confirm){
      confirm = document.createElement('button');
      confirm.type = 'button';
      confirm.className = 'btn stage2-tf-confirm-btn-v9616';
      confirm.textContent = 'تأكيد الإجابة';
      confirm.disabled = true;
      item.appendChild(confirm);
    }
    item.querySelectorAll('.s2-choice').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        item.querySelectorAll('.s2-choice').forEach(x => x.classList.remove('selected','stage2-selected-v9616'));
        btn.classList.add('selected','stage2-selected-v9616');
        tfSelectedV9616[key] = btn;
        confirm.disabled = false;
        confirm.classList.add('ready');
      };
    });
    confirm.onclick = () => {
      const btn = tfSelectedV9616[key];
      if(!btn) return;
      answer2(btn.dataset.key, btn.dataset.answer, btn.dataset.correct, btn, Number(btn.dataset.points || 15), btn.dataset.title);
    };
  }

  window.renderStage2Sequential = renderStage2Sequential = function(p){
    p = p || p2();
    const type = firstIncomplete(p);
    clearInterval(stage2TimerInt);

    if(!type){
      setMode('done');
      document.getElementById('stage2List').innerHTML = `
        <div class="stage2-state-card-v9616 done">
          <div class="stage2-state-icon-v9616">✅</div>
          <h3>انتهت المرحلة الثانية</h3>
          <p>انتظروا انتقال الميسر إلى المرحلة التالية.</p>
        </div>`;
      setTimeout(() => { try { finishStage('stage2','intro3'); } catch(e){ console.error(e); } }, 300);
      return;
    }

    const g = group(type);
    const player = p.roles?.[type] || '';
    const started = hasTurnStarted(p,type);

    if(!started){
      setMode('handoff');
      updatePassage(false);
      document.getElementById('stage2List').innerHTML = `
        <div class="stage2-state-card-v9616 handoff">
          <div class="stage2-state-icon-v9616">🤝</div>
          <h3>${S2_TYPES_V9616.indexOf(type) === 0 ? `دور ${esc(player)}` : `أعطِ الجهاز إلى ${esc(player)}`}</h3>
          <p>المهمة التالية: <b>${esc(g?.title || roleTitle(type))}</b></p>
          <button class="btn stage2-start-turn-v9616" type="button" onclick="startStage2Turn('${type}')">بدء مهمة ${esc(player)}</button>
        </div>`;
      // الصعود للأعلى مطلوب فقط عند ظهور بطاقة اللاعب/المهمة التالية، وليس عند كل تحديث أو أثناء الإجابة.
      requestAnimationFrame(() => {
        try{ window.scrollTo({top:0, left:0, behavior:'smooth'}); }
        catch(e){ window.scrollTo(0,0); }
      });
      return;
    }

    setMode('question');
    updatePassage(true);
    const left = stage2SecondsLeft(type,p);
    document.getElementById('stage2List').innerHTML = `
      <div class="stage2-question-shell-v9616">
        <div class="stage2-question-head-v9616">
          <div><span>اللاعب</span><b>${esc(player)}</b></div>
          <div><span>المهمة</span><b>${esc(g?.title || roleTitle(type))}</b></div>
          <div><span>الوقت</span><b id="stage2TurnTimer">${stage2TimerText(left)}</b></div>
        </div>
        <div class="stage2-group active-type stage2-group-v9616">
          <h3>${esc(g?.title || roleTitle(type))}</h3>
          ${g?.type === 'matching' ? renderMatchingGroupV9616(g,p) : (g?.questions || []).map((q,qi) => renderStage2Item(g,q,`${g.type}_${qi}`,p)).join('')}
        </div>
      </div>`;

    bindStage2QuestionControls();
    renderStage2Timer(type,p);
    startStage2Timer(type);
  };

  window.render2 = render2 = function(){
    const current = p2();
    const roles = cleanRoles(current);
    const p = Object.assign({}, current, {roles});
    if(JSON.stringify(roles) !== JSON.stringify(current.roles || {})){
      patchTeam({progress:Object.assign({}, team.progress, {stage2:Object.assign({}, current, {roles})})}).catch(console.error);
    }
    updateCount(p);

    const roleBox = document.getElementById('stage2RoleBox');
    const list = document.getElementById('stage2List');
    if(!roleBox || !list) return;

    if(!rolesComplete(roles) || !rolesLocked(p)){
      setMode('roles');
      updatePassage(false);
      if(roleBox) roleBox.style.display = '';
      renderStage2Roles(p);
      list.innerHTML = '';
      clearInterval(stage2TimerInt);
      return;
    }

    // بعد تثبيت التوزيع لا نعرض بطاقة التوزيع مرة ثانية؛ تظهر بطاقة الدور الحالي فقط.
    if(roleBox){
      roleBox.innerHTML = '';
      roleBox.style.display = 'none';
    }
    renderStage2Sequential(p);
  };
})();



/* ===== V9.6.28 Stage mode synchronizer: reliable CSS hooks for stage-specific layout fixes ===== */
(function(){
  'use strict';
  let lastActiveStageV9628 = '';
  function syncContestantStageModeV9628(){
    const active = document.querySelector('#appScreen:not(.hidden) .page.active');
    const id = active ? active.id : '';
    document.documentElement.classList.toggle('contestant-stage2-mode-v9628', id === 'stage2');
    document.body.classList.toggle('contestant-stage2-mode-v9628', id === 'stage2');
    if(id !== lastActiveStageV9628){
      lastActiveStageV9628 = id;
      if(id === 'stage2'){
        requestAnimationFrame(() => {
          try{
            document.documentElement.scrollLeft = 0;
            document.body.scrollLeft = 0;
          }catch(e){}
        });
      }
    }
  }
  const oldShowV9628 = typeof show === 'function' ? show : null;
  if(oldShowV9628){
    window.show = show = function(){
      const result = oldShowV9628.apply(this, arguments);
      syncContestantStageModeV9628();
      setTimeout(syncContestantStageModeV9628, 0);
      return result;
    };
  }
  const oldRender2V9628 = typeof render2 === 'function' ? render2 : null;
  if(oldRender2V9628){
    window.render2 = render2 = function(){
      const result = oldRender2V9628.apply(this, arguments);
      syncContestantStageModeV9628();
      setTimeout(syncContestantStageModeV9628, 0);
      return result;
    };
  }
  document.addEventListener('DOMContentLoaded', () => {
    syncContestantStageModeV9628();
    const app = document.getElementById('appScreen') || document.body;
    try{
      new MutationObserver(syncContestantStageModeV9628).observe(app, {subtree:true, attributes:true, attributeFilter:['class','style']});
    }catch(e){}
    setTimeout(syncContestantStageModeV9628, 100);
    setTimeout(syncContestantStageModeV9628, 600);
  });
})();


/* ===== V9.5.106B: Login screen only fix - prevent intro/app showing under registration ===== */
(function(){
  'use strict';

  function syncLoginVisibilityV95106B(){
    const login = document.getElementById('loginScreen');
    const app = document.getElementById('appScreen');
    if(!login || !app) return;

    const hasActiveSession = !!(typeof teamName !== 'undefined' && teamName) && !!(typeof team !== 'undefined' && team);

    if(hasActiveSession){
      login.classList.add('hidden'); login.style.display='none';
      app.classList.remove('hidden'); app.style.display='';
      document.body.classList.add('app-active-v95106b');
      document.body.classList.remove('login-active-v95106b');
    }else{
      login.classList.remove('hidden'); login.style.display='';
      app.classList.add('hidden'); app.style.display='none';
      document.body.classList.add('login-active-v95106b');
      document.body.classList.remove('app-active-v95106b');
    }
  }

  const previousShowAppV95106B = typeof showApp === 'function' ? showApp : null;
  if(previousShowAppV95106B){
    window.showApp = showApp = function(){
      const result = previousShowAppV95106B.apply(this, arguments);
      const login = document.getElementById('loginScreen');
      const app = document.getElementById('appScreen');
      if(login){ login.classList.add('hidden'); login.style.display='none'; }
      if(app){ app.classList.remove('hidden'); app.style.display=''; }
      document.body.classList.add('app-active-v95106b');
      document.body.classList.remove('login-active-v95106b');
      return result;
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    syncLoginVisibilityV95106B();
    setTimeout(syncLoginVisibilityV95106B, 100);
    setTimeout(syncLoginVisibilityV95106B, 500);
  });
})();



/* ===== V9.5.133 CLEAN FIX: Stage 1 imported Excel type priority ===== */
(function(){
  'use strict';
  function normalizeExcelStage1TypeV95133(t){
    const raw = String(t || '').trim();
    const low = raw.toLowerCase();
    const compact = raw.replace(/[\sـ]+/g,'').toLowerCase();

    if(['choice','choose','multiple','mcq','select'].includes(low) || compact==='اخترمنمتعدد' || compact==='اخترمنمتعدّد' || raw==='اختر من متعدد') return 'اختر من متعدد';
    if(['missing'].includes(low) || compact==='ماذاينقص' || raw==='ماذا ينقص' || raw==='ماذا ينقص؟') return 'ماذا ينقص';
    if(['arrange','order','sort'].includes(low) || compact==='رتب' || compact==='رتّب' || raw==='رتّب') return 'رتّب';
    if(['fill','blank'].includes(low) || compact==='فراغات' || compact==='أكملالفراغات' || compact==='اكملالفراغات' || raw==='فراغات') return 'فراغات';

    return raw || 'ماذا ينقص';
  }

  if(typeof window !== 'undefined'){
    window.stage1QuestionType = stage1QuestionType = function(q,i){
      return normalizeExcelStage1TypeV95133(q?.type || q?.typeName || '');
    };

    window.getStage1Plan = getStage1Plan = function(p){
      const list = Array.isArray(DATA?.stage1) ? DATA.stage1 : [];
      const total = Math.min(50, list.length);
      return [...Array(total).keys()].map(idx => ({
        idx,
        type: normalizeExcelStage1TypeV95133(list[idx]?.type || list[idx]?.typeName || '')
      }));
    };
  }
})();

/* ===== V9.6.13 STAGE 3 CONTESTANT DISPLAY NORMALIZATION ===== */
(function(){
  'use strict';
  function syncStage3ActiveLayoutV9613(){
    try{
      const page=document.getElementById('stage3');
      const box=document.getElementById('stage3Box');
      const hasActive=!!(box && !box.classList.contains('hidden') && typeof activeStage3!=='undefined' && activeStage3 && activeStage3.id);
      if(page) page.classList.toggle('stage3-has-active', hasActive);
    }catch(e){}
  }
  const previousSetStage3ActiveStateV9613=typeof setStage3ActiveState==='function'?setStage3ActiveState:null;
  if(previousSetStage3ActiveStateV9613){
    window.setStage3ActiveState=setStage3ActiveState=function(active){
      const result=previousSetStage3ActiveStateV9613.apply(this,arguments);
      syncStage3ActiveLayoutV9613();
      return result;
    };
  }
  const previousRenderActive3V9613=typeof renderActive3==='function'?renderActive3:null;
  if(previousRenderActive3V9613){
    window.renderActive3=renderActive3=function(){
      const result=previousRenderActive3V9613.apply(this,arguments);
      syncStage3ActiveLayoutV9613();
      return result;
    };
  }
  const previousRenderBoard3V9613=typeof renderBoard3==='function'?renderBoard3:null;
  if(previousRenderBoard3V9613){
    window.renderBoard3=renderBoard3=function(){
      const result=previousRenderBoard3V9613.apply(this,arguments);
      document.querySelectorAll('#stage3 .stage3-visible-hint').forEach(x=>x.remove());
      syncStage3ActiveLayoutV9613();
      return result;
    };
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(syncStage3ActiveLayoutV9613,100));
})();
