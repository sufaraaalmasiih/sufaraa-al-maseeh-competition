if(sessionStorage.getItem("sufaraaAdmin")!=="1") location.href="login.html";
function gameFlowDurationV960(key,fallback){try{return window.SUFARAA_GAME_FLOW?window.SUFARAA_GAME_FLOW.localDuration(key,fallback):Number(fallback||15)}catch(e){return Number(fallback||15)}}
const stageNames={stage1:"اجمعوا الكنوز",stage2:"فتشوا الكتب",stage3:"على المحك",stage4:"اثبتوا بالحق",final:"النهائي",intro1:"شرح 1",intro2:"شرح 2",intro3:"شرح 3",intro4:"شرح 4"};
let teams=[], lastLiveOrder="", history=[], controlState={paused:false};
let adminAudioCtx=null;
function adminTone(freq=620,duration=0.045,type='sine',gain=0.01){try{adminAudioCtx=adminAudioCtx||new (window.AudioContext||window.webkitAudioContext)(); if(adminAudioCtx.state==='suspended')adminAudioCtx.resume(); const o=adminAudioCtx.createOscillator(), g=adminAudioCtx.createGain(); o.type=type; o.frequency.value=freq; g.gain.value=gain; o.connect(g); g.connect(adminAudioCtx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001,adminAudioCtx.currentTime+duration); o.stop(adminAudioCtx.currentTime+duration);}catch(e){}}
function bindAdminUiSounds(){document.addEventListener('pointerover',e=>{if(e.target.closest('button,.btn,.stage'))adminTone(520,.04,'sine',.008)},{passive:true});document.addEventListener('click',e=>{if(e.target.closest('button,.btn,.stage'))adminTone(680,.055,'triangle',.018)},{passive:true});}
function logout(){sessionStorage.removeItem("sufaraaAdmin");location.href="login.html"}
function esc(x){return String(x??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
/* refactor: removed obsolete earlier definition of showAdmin from original line 9; final definition is kept later. */
function sortedTeams(){return [...teams].sort((a,b)=>(b.score||0)-(a.score||0))}
function listen(){db.collection('teams').onSnapshot(snap=>{teams=[];snap.forEach(d=>teams.push({id:d.id,...d.data()}));renderAll()});db.collection('history').orderBy('createdAt','desc').onSnapshot(snap=>{history=[];snap.forEach(d=>history.push({id:d.id,...d.data()}));renderHistory()});db.collection('meta').doc('control').onSnapshot(doc=>{controlState=Object.assign({paused:false},doc.data()||{});renderPauseButton();});}
/* refactor: removed obsolete earlier definition of renderAll from original line 12; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderSelectors from original line 13; final definition is kept later. */
/* refactor: removed obsolete earlier definition of ensureLiveTools from original line 24; final definition is kept later. */
function toggleLiveFullscreen(){document.body.classList.toggle('live-fullscreen-mode');const card=document.getElementById('live');if(document.body.classList.contains('live-fullscreen-mode')){if(card?.requestFullscreen) card.requestFullscreen().catch(()=>{});}else{if(document.fullscreenElement) document.exitFullscreen().catch(()=>{});}}
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement) document.body.classList.remove('live-fullscreen-mode');});
document.addEventListener('keydown',e=>{if(e.key==='Escape') document.body.classList.remove('live-fullscreen-mode');});
/* refactor: removed obsolete earlier definition of renderLive from original line 28; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderFinals from original line 29; final definition is kept later. */
/* refactor: removed obsolete earlier definition of selectedTeam from original line 30; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderControl from original line 31; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderPlayers from original line 32; final definition is kept later. */
/* refactor: removed obsolete earlier definition of saveTeamNames from original line 33; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderAnswerLog from original line 34; final definition is kept later. */
function blankProgress(stage){if(stage==='stage1')return {stage1:{i:0,startedAt:Date.now(),ended:false}};if(stage==='stage2')return {stage2:{answered:{},roles:{},matching:{}}};if(stage==='stage3')return {stage3:{answered:{}}};if(stage==='stage4')return {stage4:{i:0,streak:0,ended:false}};return {}}
/* refactor: removed obsolete earlier definition of restartTeamStage from original line 36; final definition is kept later. */
async function moveAllTeamsToStage(){const st=document.getElementById('moveAllStageSelect')?.value||'intro1';if(!confirm(`ترحيل كل الفرق إلى: ${stageNames[st]||st}؟ لن يتم تصفير النقاط.`))return;const snap=await db.collection('teams').get();const batch=db.batch();snap.forEach(d=>batch.set(d.ref,{current:st,finished:st==='final'?true:false},{merge:true}));if(st==='stage3'){const locks=await db.collection('stage3Locks').get();locks.forEach(d=>batch.delete(d.ref));batch.set(db.collection('meta').doc('activeStage3'),{id:null,team:null,teamName:null},{merge:true});const first=snap.docs.map(d=>({id:d.id,name:(d.data()||{}).name||d.id})).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'))[0];if(first)batch.set(db.collection('meta').doc('stage3Turn'),{team:first.id,teamName:first.name,index:0,turnStartedAtMs:Date.now(),turnDuration:gameFlowDurationV960('stage3Choice',15),updatedAt:FieldValue.serverTimestamp()},{merge:true});}await batch.commit();alert('تم ترحيل كل الفرق.');}
async function resetAll(){if(!confirm('هل تريد تصفير كل النتائج وإعادة المتسابقين للبداية؟'))return;const batch=db.batch();const teamDocs=await db.collection('teams').get();teamDocs.forEach(d=>batch.delete(d.ref));const lockDocs=await db.collection('stage3Locks').get();lockDocs.forEach(d=>batch.delete(d.ref));batch.set(db.collection('meta').doc('control'),{resetAt:String(Date.now())},{merge:true});batch.set(db.collection('meta').doc('activeStage3'),{id:null,team:null,teamName:null},{merge:true});batch.set(db.collection('meta').doc('stage3Turn'),{team:null,teamName:null,index:0},{merge:true});await batch.commit();alert('تم التصفير. صفحات المتسابقين ستعود للبداية تلقائيًا.');}
/* refactor: removed obsolete earlier definition of saveFinalResults from original line 39; final definition is kept later. */
async function deleteHistory(id){if(!confirm('حذف هذا السجل من تاريخ المسابقة؟'))return;await db.collection('history').doc(id).delete();}
/* refactor: removed obsolete earlier definition of renderHistory from original line 41; final definition is kept later. */
async function togglePause(){await db.collection('meta').doc('control').set({paused:!controlState.paused},{merge:true});}
/* refactor: removed obsolete earlier definition of renderPauseButton from original line 43; final definition is kept later. */
document.addEventListener('DOMContentLoaded',()=>{bindAdminUiSounds();listen();});

/* ===== V9.4.4 Admin team management + score control overrides ===== */
function teamDocIdFromName(n){return encodeURIComponent((n||'').trim());}

function safeDecodeTeamId(x){try{return decodeURIComponent(String(x||''));}catch(e){return String(x||'');}}
function teamDeleteKeys(t){
  const keys=new Set();
  [t?.id,t?.name,teamDocIdFromName(t?.name||''),safeDecodeTeamId(t?.id||'')].forEach(v=>{if(v)keys.add(String(v));});
  (t?.previousNames||[]).forEach(v=>{if(v){keys.add(String(v));keys.add(teamDocIdFromName(v));}});
  return [...keys];
}
function matchesDeletedTeam(row,keys){
  if(!row)return false;
  const rowKeys=new Set([row.id,row.name,teamDocIdFromName(row.name||''),safeDecodeTeamId(row.id||'')].filter(Boolean).map(String));
  return keys.some(k=>rowKeys.has(String(k)));
}
async function chooseNextStage3TurnAfterDelete(deletedKeys,batch){
  const snap=await db.collection('teams').get();
  const list=[];
  snap.forEach(d=>{
    const data=d.data()||{};
    const row={id:d.id,name:data.name||safeDecodeTeamId(d.id),finished:!!data.finished};
    if(!row.finished && !matchesDeletedTeam(row,deletedKeys)) list.push(row);
  });
  list.sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar')||String(a.id).localeCompare(String(b.id)));
  if(list.length) batch.set(db.collection('meta').doc('stage3Turn'),{team:list[0].id,teamName:list[0].name,index:0,updatedAt:FieldValue.serverTimestamp()},{merge:true});
  else batch.set(db.collection('meta').doc('stage3Turn'),{team:null,teamName:null,index:0,updatedAt:FieldValue.serverTimestamp()},{merge:true});
}

function defaultProgress(){return {stage1:{i:0,startedAt:0,remaining:300,ended:false},stage2:{answered:{},roles:{},matching:{}},stage3:{answered:{}},stage4:{i:0,streak:0,ended:false}};}
function cleanNumber(v){const n=Number(v);return Number.isFinite(n)?n:0;}
/* refactor: removed obsolete earlier definition of renderControl from original line 76; final definition is kept later. */
/* refactor: removed obsolete earlier definition of ensureAdminManagementPanels from original line 77; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderPlayers from original line 101; final definition is kept later. */
function renderScoreEditor(){
  const box=document.getElementById('scoreEditorBox');
  if(!box)return;
  const t=selectedTeam();
  if(!t){box.innerHTML='<p>اختر فريقًا لتعديل العلامات.</p>';return;}
  const ss=Object.assign({stage1:0,stage2:0,stage3:0,stage4:0},t.stageScores||{});
  box.innerHTML=`<h3>تعديل العلامات</h3><div class="admin-score-editor">
    <label>المرحلة الأولى</label><input type="number" id="score_stage1" value="${esc(ss.stage1)}">
    <label>المرحلة الثانية</label><input type="number" id="score_stage2" value="${esc(ss.stage2)}">
    <label>المرحلة الثالثة</label><input type="number" id="score_stage3" value="${esc(ss.stage3)}">
    <label>المرحلة الرابعة</label><input type="number" id="score_stage4" value="${esc(ss.stage4)}">
    <label>المجموع اليدوي</label><input type="number" id="score_total" value="${esc(t.score||0)}">
    <button class="btn" onclick="saveTeamScores(false)">حفظ المجموع اليدوي</button>
    <button class="btn secondary" onclick="saveTeamScores(true)">احسب المجموع من المراحل واحفظ</button>
  </div>`;
}
/* refactor: removed obsolete earlier definition of addTeamFromAdmin from original line 125; final definition is kept later. */
async function deleteSelectedTeam(){
  const t=selectedTeam();
  if(!t)return alert('اختر فريقًا أولًا');
  if(!confirm(`حذف فريق ${t.name} وكل بياناته؟ لا يمكن التراجع عن هذه العملية.`))return;

  const deleteKeys=teamDeleteKeys(t);
  const batch=db.batch();

  // حذف وثيقة الفريق الأساسية وأي وثيقة قديمة تحمل نفس الاسم/المعرّف.
  deleteKeys.forEach(k=>batch.delete(db.collection('teams').doc(k)));

  // حذف أقفال المرحلة الثالثة المرتبطة بالفريق سواء بالمعرّف القديم أو الاسم الجديد.
  for(const key of deleteKeys){
    const byTeam=await db.collection('stage3Locks').where('team','==',key).get();
    byTeam.forEach(d=>batch.delete(d.ref));
    const byTeamName=await db.collection('stage3Locks').where('teamName','==',key).get();
    byTeamName.forEach(d=>batch.delete(d.ref));
  }

  // إغلاق السؤال/الدور إذا كان الفريق المحذوف هو صاحب الدور أو السؤال المفتوح.
  const activeRef=db.collection('meta').doc('activeStage3');
  const turnRef=db.collection('meta').doc('stage3Turn');
  const controlRef=db.collection('meta').doc('control');
  const active=await activeRef.get();
  const turn=await turnRef.get();
  const activeData=active.data()||{};
  const turnData=turn.data()||{};
  if(deleteKeys.some(k=>activeData.team===k||activeData.teamName===k)){
    batch.set(activeRef,{id:null,team:null,teamName:null},{merge:true});
  }
  if(deleteKeys.some(k=>turnData.team===k||turnData.teamName===k)){
    await chooseNextStage3TurnAfterDelete(deleteKeys,batch);
  }

  // تنظيف تاريخ المسابقة من هذا الفريق حتى لا يظهر بعد الحذف.
  const historySnap=await db.collection('history').get();
  historySnap.forEach(d=>{
    const data=d.data()||{};
    const teamsList=Array.isArray(data.teams)?data.teams:[];
    const filtered=teamsList.filter(row=>!matchesDeletedTeam(row,deleteKeys));
    if(filtered.length!==teamsList.length){
      batch.set(d.ref,{teams:filtered,teamCount:filtered.length},{merge:true});
    }
  });

  // إبلاغ أجهزة المتسابقين التي كانت ما زالت فاتحة على الاسم القديم كي لا تعيد إنشاء الفريق.
  batch.set(controlRef,{deletedTeams:FieldValue.arrayUnion(...deleteKeys),deletedAt:String(Date.now())},{merge:true});

  await batch.commit();
  alert('تم حذف الفريق وكل بياناته المرتبطة. إذا كان جهاز الفريق مفتوحًا سيعود تلقائيًا إلى شاشة التسجيل ولن يعيد إنشاء البيانات القديمة.');
}
/* refactor: removed obsolete earlier definition of saveTeamScores from original line 189; final definition is kept later. */


/* ===== V9.4.6 Province + cleaner admin/live overrides ===== */
function teamProvince(t){return (t&&t.governorate)?String(t.governorate):'';}
function teamLabel(t){const g=teamProvince(t);return esc(t?.name||'')+(g?` <span class="province-chip">${esc(g)}</span>`:'');}
/* refactor: removed obsolete earlier definition of renderSelectors from original line 203; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderLive from original line 214; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderFinals from original line 215; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderHistory from original line 216; final definition is kept later. */
/* refactor: removed obsolete earlier definition of ensureAdminManagementPanels from original line 217; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderPlayers from original line 242; final definition is kept later. */
/* refactor: removed obsolete earlier definition of saveTeamNames from original line 250; final definition is kept later. */
/* refactor: removed obsolete earlier definition of addTeamFromAdmin from original line 251; final definition is kept later. */


/* ===== V9.4.8 Fixed Syrian Governorates + Editable History ===== */
const SYRIAN_GOVERNORATES = ["دمشق", "ريف دمشق", "حلب", "حمص", "حماة", "اللاذقية", "طرطوس", "إدلب", "درعا", "السويداء", "القنيطرة", "دير الزور", "الحسكة", "الرقة"];
const HISTORY_GOVERNORATES = ['سوريا', ...SYRIAN_GOVERNORATES];
function provinceSelectHtml(id, selected='', includeSyria=false){
  const list = includeSyria ? HISTORY_GOVERNORATES : SYRIAN_GOVERNORATES;
  return `<select id="${id}"><option value="">اختر المحافظة</option>${list.map(g=>`<option value="${esc(g)}" ${String(selected||'')===g?'selected':''}>${esc(g)}</option>`).join('')}</select>`;
}
function currentArabicDateTitle(){return 'مسابقة سفراء المسيح - ' + new Date().toLocaleDateString('ar');}

/* refactor: removed obsolete earlier definition of renderFinals from original line 276; final definition is kept later. */

async function saveFinalResults(){
  const list=sortedTeams();
  if(!list.length)return alert('لا توجد نتائج لحفظها');
  const title=(document.getElementById('historyTitleInput')?.value||currentArabicDateTitle()).trim();
  const governorate=(document.getElementById('historyProvinceSelect')?.value||'سوريا').trim();
  if(!HISTORY_GOVERNORATES.includes(governorate))return alert('اختر محافظة المسابقة من القائمة.');
  await db.collection('history').add({
    title,
    date:title,
    governorate,
    teamCount:list.length,
    teams:list,
    createdAt:FieldValue.serverTimestamp()
  });
  alert('تم حفظ النتائج في تاريخ المسابقة');
}

/* refactor: removed obsolete earlier definition of renderHistory from original line 302; final definition is kept later. */
async function editHistoryMeta(id,currentTitle,currentGov){
  const title=prompt('اكتب عنوان السجل مع التاريخ:', currentTitle||currentArabicDateTitle());
  if(title===null)return;
  const gov=prompt('اكتب محافظة المسابقة: سوريا أو إحدى المحافظات السورية', currentGov||'سوريا');
  if(gov===null)return;
  const cleanGov=String(gov||'').trim();
  if(!HISTORY_GOVERNORATES.includes(cleanGov))return alert('المحافظة يجب أن تكون سوريا أو محافظة سورية من القائمة.');
  await db.collection('history').doc(id).set({title:String(title).trim()||currentArabicDateTitle(),date:String(title).trim()||currentArabicDateTitle(),governorate:cleanGov},{merge:true});
}

function ensureAdminManagementPanels(){
  const control=document.getElementById('control');
  if(!control||document.getElementById('adminExtraTools'))return;
  const anchor=document.getElementById('playersBox');
  const panel=document.createElement('div');
  panel.id='adminExtraTools';
  panel.className='admin-management-grid';
  panel.innerHTML=`
    <div class="mini-card admin-tool-card">
      <h3>إضافة فريق جديد</h3>
      <label>اسم الفريق</label><input id="newTeamName" placeholder="اسم الفريق">
      <label>المحافظة</label>${provinceSelectHtml('newGovernorate','',false)}
      <div class="admin-players-grid">
        <input id="newPlayer0" placeholder="اللاعب 1"><input id="newPlayer1" placeholder="اللاعب 2">
        <input id="newPlayer2" placeholder="اللاعب 3"><input id="newPlayer3" placeholder="اللاعب 4">
      </div>
      <button class="btn" onclick="addTeamFromAdmin()">إضافة الفريق</button>
    </div>
    <div class="mini-card admin-tool-card">
      <h3>إدارة الفريق المحدد</h3>
      <p class="muted">اختر فريقًا من الأعلى، ثم يمكنك حذف الفريق أو تعديل علاماته عند حدوث خطأ.</p>
      <button class="btn danger" onclick="deleteSelectedTeam()">حذف الفريق وبياناته</button>
    </div>`;
  if(anchor) anchor.insertAdjacentElement('beforebegin',panel); else control.appendChild(panel);
}
/* refactor: removed obsolete earlier definition of renderPlayers from original line 348; final definition is kept later. */
async function saveTeamNames(){
  const t=selectedTeam();
  if(!t)return alert('اختر فريقًا أولًا');
  const name=(document.getElementById('editTeamName')?.value||t.name||'').trim();
  const governorate=(document.getElementById('editGovernorate')?.value||'').trim();
  if(!governorate||!SYRIAN_GOVERNORATES.includes(governorate))return alert('اختر محافظة الفريق من القائمة.');
  const players=[0,1,2,3].map(i=>({name:(document.getElementById('editPlayer'+i)?.value||`لاعب ${i+1}`).trim()||`لاعب ${i+1}`,order:i+1}));
  const nextName=name||t.name;
  const update={name:nextName,governorate,players};
  if(nextName!==t.name){update.previousNames=FieldValue.arrayUnion(t.name,safeDecodeTeamId(t.id),t.id);}
  await db.collection('teams').doc(t.id).set(update,{merge:true});
  alert('تم حفظ البيانات.');
}
async function addTeamFromAdmin(){
  const name=(document.getElementById('newTeamName')?.value||'').trim();
  const governorate=(document.getElementById('newGovernorate')?.value||'').trim();
  if(!name)return alert('اكتب اسم الفريق');
  if(!governorate||!SYRIAN_GOVERNORATES.includes(governorate))return alert('اختر محافظة الفريق من القائمة.');
  const players=[0,1,2,3].map(i=>({name:(document.getElementById('newPlayer'+i)?.value||`لاعب ${i+1}`).trim()||`لاعب ${i+1}`,order:i+1}));
  const id=teamDocIdFromName(name);
  const ref=db.collection('teams').doc(id);
  const exists=await ref.get();
  if(exists.exists&&!confirm('هذا الفريق موجود. هل تريد تحديث بياناته؟'))return;
  await ref.set({name,governorate,players,score:0,stageScores:{stage1:0,stage2:0,stage3:0,stage4:0},current:'intro1',done:[],finished:false,progress:defaultProgress(),answerLog:[]},{merge:true});
  await db.collection('meta').doc('control').set({deletedTeams:FieldValue.arrayRemove(id,name,teamDocIdFromName(name),safeDecodeTeamId(id))},{merge:true});
  ['newTeamName','newPlayer0','newPlayer1','newPlayer2','newPlayer3'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  const gv=document.getElementById('newGovernorate'); if(gv)gv.value='';
  alert('تمت إضافة الفريق.');
}


/* ===== V9.4.9 Final results + history editing overrides ===== */
/* refactor: removed obsolete earlier definition of renderFinals from original line 388; final definition is kept later. */

function historyTeamRow(r,t,i){
  const ss=Object.assign({stage1:0,stage2:0,stage3:0,stage4:0},t.stageScores||{});
  const total=Number(t.score||0);
  return `<tr data-history-row="${i}"><td>${i+1}</td><td><input id="h_${r.id}_${i}_name" value="${esc(t.name||'')}"></td><td>${provinceSelectHtml(`h_${r.id}_${i}_gov`,teamProvince(t),false)}</td><td class="history-players">${(t.players||[]).map(p=>esc(p.name)).join('<br>')}</td><td><input type="number" id="h_${r.id}_${i}_s1" value="${esc(ss.stage1)}"></td><td><input type="number" id="h_${r.id}_${i}_s2" value="${esc(ss.stage2)}"></td><td><input type="number" id="h_${r.id}_${i}_s3" value="${esc(ss.stage3)}"></td><td><input type="number" id="h_${r.id}_${i}_s4" value="${esc(ss.stage4)}"></td><td><input type="number" id="h_${r.id}_${i}_total" value="${esc(total)}"></td><td><button class="btn history-edit-btn" onclick="saveHistoryTeam('${r.id}',${i})">حفظ</button></td></tr>`;
}

/* refactor: removed obsolete earlier definition of renderHistory from original line 403; final definition is kept later. */

/* refactor: removed obsolete earlier definition of saveHistoryTeam from original line 415; final definition is kept later. */

/* ===== V9.4.10 Cleaner History Display + edit-on-demand ===== */
let historyEditingRowsV9410 = {};
function historyKeyV9410(id){return String(id||'').replace(/[^a-zA-Z0-9_\-]/g,'_')}
function historyTeamDisplayRowV9410(t,i){
  const ss=Object.assign({stage1:0,stage2:0,stage3:0,stage4:0},t.stageScores||{});
  return `<tr><td>${i+1}</td><td><b>${esc(t.name||'')}</b></td><td>${esc(teamProvince(t)||'-')}</td><td class="history-players">${(t.players||[]).map(p=>esc(p.name)).join('<br>')}</td><td>${ss.stage1||0}</td><td>${ss.stage2||0}</td><td>${ss.stage3||0}</td><td>${ss.stage4||0}</td><td><b>${t.score||0}</b></td></tr>`;
}
function historyTeamEditRowV9410(r,t,i){
  const ss=Object.assign({stage1:0,stage2:0,stage3:0,stage4:0},t.stageScores||{});
  const total=Number(t.score||0);
  const k=historyKeyV9410(r.id);
  return `<tr data-history-row="${i}"><td>${i+1}</td><td><input id="h_${k}_${i}_name" value="${esc(t.name||'')}"></td><td>${provinceSelectHtml(`h_${k}_${i}_gov`,teamProvince(t),false)}</td><td class="history-players">${(t.players||[]).map(p=>esc(p.name)).join('<br>')}</td><td><input type="number" id="h_${k}_${i}_s1" value="${esc(ss.stage1)}"></td><td><input type="number" id="h_${k}_${i}_s2" value="${esc(ss.stage2)}"></td><td><input type="number" id="h_${k}_${i}_s3" value="${esc(ss.stage3)}"></td><td><input type="number" id="h_${k}_${i}_s4" value="${esc(ss.stage4)}"></td><td><input type="number" id="h_${k}_${i}_total" value="${esc(total)}"></td><td><button class="btn history-edit-btn" onclick="saveHistoryTeam('${r.id}',${i})">حفظ</button></td></tr>`;
}
/* refactor: removed obsolete earlier definition of toggleHistoryTeamsEdit from original line 450; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderHistory from original line 454; final definition is kept later. */
/* refactor: removed obsolete earlier definition of saveHistoryTeam from original line 468; final definition is kept later. */

/* ===== V9.4.11 History edit UX override =====
   Keeps the opened history card open while editing, aligns actions, and shows a cleaner edit panel.
*/
let historyOpenCardsV9411 = {};
let historyEditingRowsV9411 = {};
function historySafeIdV9411(id){return String(id||'').replace(/[^a-zA-Z0-9_\-]/g,'_')}
function setHistoryOpenV9411(id,open){historyOpenCardsV9411[id]=!!open;}
function toggleHistoryTeamsEdit(historyId){
  historyEditingRowsV9411[historyId]=!historyEditingRowsV9411[historyId];
  historyOpenCardsV9411[historyId]=true;
  renderHistory();
}
/* refactor: removed obsolete earlier definition of historyTeamDisplayRowV9411 from original line 503; final definition is kept later. */
/* refactor: removed obsolete earlier definition of historyTeamEditCardV9411 from original line 507; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderHistory from original line 526; final definition is kept later. */
/* refactor: removed obsolete earlier definition of saveHistoryTeam from original line 541; final definition is kept later. */

/* ===== V9.4.12 History UI + Player Names Editing =====
   - Unified history action buttons.
   - Edit player names inside saved history records.
   - Keeps the history card open while saving edits.
*/
function historyTeamDisplayRowV9411(t,i){
  const ss=Object.assign({stage1:0,stage2:0,stage3:0,stage4:0},t.stageScores||{});
  return `<tr><td>${i+1}</td><td><b>${esc(t.name||'')}</b></td><td>${esc(teamProvince(t)||'-')}</td><td class="history-players">${(t.players||[]).map(p=>esc(p.name)).join('<br>')}</td><td>${ss.stage1||0}</td><td>${ss.stage2||0}</td><td>${ss.stage3||0}</td><td>${ss.stage4||0}</td><td><b>${t.score||0}</b></td></tr>`;
}
function historyTeamEditCardV9411(r,t,i){
  const ss=Object.assign({stage1:0,stage2:0,stage3:0,stage4:0},t.stageScores||{});
  const total=Number(t.score||0);
  const k=historySafeIdV9411(r.id);
  const players=t.players||[];
  return `<div class="history-team-edit-card">
    <div class="history-team-edit-head"><span class="final-rank">${i+1}</span><strong>${esc(t.name||'فريق')}</strong></div>
    <div class="history-edit-grid">
      <label>اسم الفريق<input id="h_${k}_${i}_name" value="${esc(t.name||'')}"></label>
      <label>المحافظة${provinceSelectHtml(`h_${k}_${i}_gov`,teamProvince(t),false)}</label>
      <label>المرحلة 1<input type="number" id="h_${k}_${i}_s1" value="${esc(ss.stage1)}"></label>
      <label>المرحلة 2<input type="number" id="h_${k}_${i}_s2" value="${esc(ss.stage2)}"></label>
      <label>المرحلة 3<input type="number" id="h_${k}_${i}_s3" value="${esc(ss.stage3)}"></label>
      <label>المرحلة 4<input type="number" id="h_${k}_${i}_s4" value="${esc(ss.stage4)}"></label>
      <label>المجموع<input type="number" id="h_${k}_${i}_total" value="${esc(total)}"></label>
    </div>
    <div class="history-player-editor">
      <b>تعديل أسماء المتسابقين</b>
      <div class="history-player-grid">
        ${[0,1,2,3].map(pi=>`<label>المتسابق ${pi+1}<input id="h_${k}_${i}_p${pi}" value="${esc(players[pi]?.name||'')}"></label>`).join('')}
      </div>
    </div>
    <button class="btn success history-save-team-btn" onclick="saveHistoryTeam('${r.id}',${i})">حفظ تعديل هذا الفريق</button>
  </div>`;
}
/* refactor: removed obsolete earlier definition of renderHistory from original line 600; final definition is kept later. */
async function saveHistoryTeam(historyId,index){
  const rec=history.find(h=>h.id===historyId);
  if(!rec)return alert('لم يتم العثور على السجل.');
  const teams=[...(rec.teams||[])];
  const t=Object.assign({},teams[index]||{});
  const k=historySafeIdV9411(historyId);
  const name=(document.getElementById(`h_${k}_${index}_name`)?.value||t.name||'').trim();
  const governorate=(document.getElementById(`h_${k}_${index}_gov`)?.value||teamProvince(t)||'').trim();
  if(!name)return alert('اسم الفريق مطلوب.');
  if(!governorate||!SYRIAN_GOVERNORATES.includes(governorate))return alert('اختر محافظة الفريق من القائمة.');
  const stageScores={
    stage1:cleanNumber(document.getElementById(`h_${k}_${index}_s1`)?.value),
    stage2:cleanNumber(document.getElementById(`h_${k}_${index}_s2`)?.value),
    stage3:cleanNumber(document.getElementById(`h_${k}_${index}_s3`)?.value),
    stage4:cleanNumber(document.getElementById(`h_${k}_${index}_s4`)?.value)
  };
  const total=cleanNumber(document.getElementById(`h_${k}_${index}_total`)?.value);
  const oldPlayers=Array.isArray(t.players)?t.players:[];
  const players=[0,1,2,3].map(pi=>({
    name:(document.getElementById(`h_${k}_${index}_p${pi}`)?.value||oldPlayers[pi]?.name||`لاعب ${pi+1}`).trim()||`لاعب ${pi+1}`,
    order:pi+1
  }));
  t.name=name;t.governorate=governorate;t.players=players;t.stageScores=stageScores;t.score=total;
  teams[index]=t;
  await db.collection('history').doc(historyId).set({teams},{merge:true});
  historyOpenCardsV9411[historyId]=true;
  historyEditingRowsV9411[historyId]=true;
  alert('تم حفظ تعديل الفريق والمتسابقين.');
}

/* ===== V9.5 Audience Stage 3 + Stage 4 Controls from safe V9.4.24 ===== */
let audienceModeV95='home';
let audienceActiveStage3V95=null, audienceStage3TurnV95={team:null,teamName:null,index:0}, audienceStage4LiveV95={status:'waiting',index:0,duration:gameFlowDurationV960('stageQuestion',15)};
let audienceStage3ControlV958={started:false,paused:true};
let audienceStage3LocksV95={};
let audienceTimerV95=null, audienceStage3RevealTimeoutV953=null, audienceStage4RevealTimeoutV953=null;
let audienceAutoRevealStage3V95=false, audienceAutoRevealStage4V95=false;
function safeDecodeAdminV95(x){try{return decodeURIComponent(String(x||''));}catch(e){return String(x||'')}}
function sameTeamAdminV95(a,b){const A=String(a||''),B=String(b||'');return A===B||safeDecodeAdminV95(A)===B||A===encodeURIComponent(B)||safeDecodeAdminV95(A)===safeDecodeAdminV95(B)}
function stage3BasePointsAdminV95(level){return ({'سهل':5,'متوسط':10,'صعب':15})[level]||5;}
function stage3OwnerCorrectPointsAdminV95(level){return ({'سهل':15,'متوسط':30,'صعب':45})[level]||15;}
function liveLeftAdminV95(live){if(!live)return 0;if(!live.startedAtMs&&Number.isFinite(Number(live.duration)))return Math.max(0,Number(live.duration||0));if(!live.startedAtMs)return 0;const elapsed=Math.floor((Date.now()-Number(live.startedAtMs||0))/1000);return Math.max(0,Number(live.duration||15)-elapsed)}

let stage3TurnPenaltyBusyV957=false;
/* refactor: removed obsolete earlier definition of stage3TurnLeftAdminV957 from original line 659; final definition is kept later. */
/* refactor: removed obsolete earlier definition of stage3TurnLabelAdminV957 from original line 667; final definition is kept later. */
function activeStage3InfoAdminV95(){
  const a=audienceActiveStage3V95; if(!a?.id || typeof DATA==='undefined' || !DATA.stage3)return null;
  const [ci,i]=String(a.id).split('_').map(Number); const cat=DATA.stage3?.[ci], q=cat?.qs?.[i];
  if(!cat||!q)return null; return {ci,i,cat,q,key:a.id,level:q[0],text:q[1],correct:q[2]};
}
function stage4InfoAdminV95(){const idx=Number(audienceStage4LiveV95?.index||0); const q=DATA.stage4?.[idx]; return q?{idx,q}:null;}
function normalizeAdminV95(v){return String(v||'').trim().replace(/[ًٌٍَُِّْـ]/g,'').replace(/أ|إ|آ/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/\s+/g,' ');}

const renderAllBaseV95=renderAll;
/* refactor: removed obsolete earlier definition of renderAll from original line 680; final definition is kept later. */

function listenAudienceV95(){
  db.collection('meta').doc('activeStage3').onSnapshot(doc=>{
    const d=doc.data()||{};
    audienceActiveStage3V95=d.id?Object.assign({duration:gameFlowDurationV960('stageQuestion',15),status:'asking'},d):null;
    scheduleStage3AutoRevealV953();
    renderAudiencePanelV95();
  },console.error);
  db.collection('meta').doc('stage3Turn').onSnapshot(doc=>{audienceStage3TurnV95=Object.assign({team:null,teamName:null,index:0,turnDuration:gameFlowDurationV960('stage3Choice',15)},doc.data()||{}); if(audienceStage3TurnV95.team&&!audienceStage3TurnV95.turnStartedAtMs&&!audienceActiveStage3V95?.id){db.collection('meta').doc('stage3Turn').set({turnStartedAtMs:Date.now(),turnDuration:gameFlowDurationV960('stage3Choice',15)},{merge:true}).catch(console.error);} renderAudiencePanelV95();},console.error);
  db.collection('stage3Locks').onSnapshot(snap=>{
    audienceStage3LocksV95={};
    snap.forEach(d=>audienceStage3LocksV95[d.id]=Object.assign({id:d.id},d.data()||{}));
    renderAudiencePanelV95(false);
  },console.error);
  db.collection('meta').doc('stage4Live').onSnapshot(doc=>{
    audienceStage4LiveV95=Object.assign({status:'waiting',index:0,duration:gameFlowDurationV960('stageQuestion',15)},doc.data()||{});
    scheduleStage4AutoRevealV953();
    renderAudiencePanelV95();
  },console.error);
  db.collection('meta').doc('stage3Control').onSnapshot(doc=>{
    audienceStage3ControlV958=Object.assign({started:false,paused:true},doc.data()||{});
    renderAudiencePanelV95(false);
  },console.error);
  clearInterval(audienceTimerV95);
  audienceTimerV95=setInterval(()=>{
    const aud=document.getElementById('audience');
    if(aud&&!aud.classList.contains('hidden'))renderAudiencePanelV95(false);
    autoRevealExpiredAudienceV95();
  },1000);
}
function scheduleStage3AutoRevealV953(){
  clearTimeout(audienceStage3RevealTimeoutV953);
  const a=audienceActiveStage3V95;
  if(!a?.id || a.status!=='asking' || a.revealDone || !a.startedAtMs)return;
  const ms=Math.max(0,(Number(a.duration||15)*1000)-(Date.now()-Number(a.startedAtMs||0)))+350;
  audienceStage3RevealTimeoutV953=setTimeout(()=>autoRevealExpiredAudienceV95(),ms);
}
function scheduleStage4AutoRevealV953(){
  clearTimeout(audienceStage4RevealTimeoutV953);
  const a=audienceStage4LiveV95;
  if(a?.status!=='asking' || a.revealDone || !a.startedAtMs)return;
  const ms=Math.max(0,(Number(a.duration||15)*1000)-(Date.now()-Number(a.startedAtMs||0)))+350;
  audienceStage4RevealTimeoutV953=setTimeout(()=>autoRevealExpiredAudienceV95(),ms);
}
setTimeout(listenAudienceV95,500);


async function autoRevealExpiredAudienceV95(){
  try{
    await autoPenalizeExpiredStage3TurnV957();
    if(!audienceStage3ControlV958?.paused && audienceActiveStage3V95?.id && audienceActiveStage3V95.status==='asking' && !audienceActiveStage3V95.revealDone && liveLeftAdminV95(audienceActiveStage3V95)<=0 && !audienceAutoRevealStage3V95){
      audienceAutoRevealStage3V95=true;
      await revealStage3AnswersV95(true);
      audienceAutoRevealStage3V95=false;
    }
    if(audienceStage4LiveV95?.status==='asking' && !audienceStage4LiveV95.revealDone && audienceStage4LiveV95.startedAtMs && liveLeftAdminV95(audienceStage4LiveV95)<=0 && !audienceAutoRevealStage4V95){
      audienceAutoRevealStage4V95=true;
      await revealStage4AnswersV95(true);
      audienceAutoRevealStage4V95=false;
    }
  }catch(e){console.error('auto reveal failed',e); audienceAutoRevealStage3V95=false; audienceAutoRevealStage4V95=false;}
}

/* refactor: removed obsolete earlier definition of renderAudiencePanelV95 from original line 744; final definition is kept later. */
function setAudienceModeV95(mode){
  audienceModeV95=mode;
  const aud=document.getElementById('audience');
  if(aud){aud.dataset.audienceMode=mode;}
  renderAudiencePanelV95();
}
function audienceFullscreenV95(){
  const el=document.getElementById('audience') || document.getElementById('audiencePanel') || document.documentElement;
  try{
    if(document.fullscreenElement){document.exitFullscreen?.();return;}
    (el.requestFullscreen||el.webkitRequestFullscreen||el.msRequestFullscreen||function(){return Promise.reject();}).call(el);
  }catch(e){alert('لم يتم تفعيل وضع الشاشة الكاملة. جرّب من المتصفح مباشرة.')}
}

function renderAudienceHomeV95(){
  const list=sortedTeams();
  return `<div class="audience-card"><h2>النتائج الحالية</h2><p class="muted">اضغط الزر لعرض النتائج بتسلسل حماسي على الشاشة الكبيرة.</p><button class="btn" onclick="showCurrentResultsPopupV95()">عرض النتائج الحالية</button><div class="audience-score-preview">${list.map((t,i)=>`<div><b>${i+1}. ${esc(t.name)}</b><span>${t.score||0} نقطة</span></div>`).join('')}</div></div>`;
}
function renderAudienceTeamsBarV95(){
  const cur=audienceStage3TurnV95?.team;
  return `<div class="audience-team-bar">${teams.map(t=>`<span class="audience-team-pill ${sameTeamAdminV95(t.id,cur)?'active':''}">${esc(t.name)}</span>`).join('')}</div>`;
}
/* refactor: removed obsolete earlier definition of renderAudienceStage3V95 from original line 780; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderAudienceStage4V95 from original line 807; final definition is kept later. */




/* refactor: removed obsolete earlier definition of ensureStage3FirstTurnV958 from original line 820; final definition is kept later. */
/* refactor: removed obsolete earlier definition of toggleStage3RunV958 from original line 831; final definition is kept later. */
function stageResultsRowsV958(stage,total=false){
  return sortedTeams().slice().reverse().map(t=>({name:t.name,answer:'',ok:null,points: total ? (t.score||0) : (t.stageScores?.[stage]||0)}));
}
async function finishAudienceStage3V958(){
  const rows=stageResultsRowsV958('stage3',false);
  await showRevealPopupV95('نتائج المرحلة الثالثة',rows,true);
  const batch=db.batch();
  teams.forEach(t=>batch.set(db.collection('teams').doc(t.id),{current:'intro4',done:Array.from(new Set([...(t.done||[]),'stage3']))},{merge:true}));
  batch.set(db.collection('meta').doc('stage3Control'),{started:false,paused:true},{merge:true});
  await batch.commit();
}
async function finishAudienceStage4V958(){
  const rows=stageResultsRowsV958('stage4',true);
  await showRevealPopupV95('النتائج النهائية لكل المراحل',rows,true);
  const batch=db.batch();
  teams.forEach(t=>batch.set(db.collection('teams').doc(t.id),{current:'final',finished:true,done:Array.from(new Set([...(t.done||[]),'stage4']))},{merge:true}));
  await batch.commit();
}
async function resetStage3AudienceV95(){
  if(!confirm('إعادة لوحة أسئلة المرحلة الثالثة من البداية؟ سيتم مسح الأسئلة المستخدمة والسؤال المفتوح فقط.'))return;
  const locks=await db.collection('stage3Locks').get();
  const batch=db.batch();
  locks.forEach(d=>batch.delete(d.ref));
  batch.set(db.collection('meta').doc('activeStage3'),{id:null,team:null,teamName:null,status:'waiting',revealDone:false},{merge:true});
  batch.set(db.collection('meta').doc('stage3Control'),{started:false,paused:true,updatedAt:FieldValue.serverTimestamp()},{merge:true});
  if(!audienceStage3TurnV95?.team){
    const first=[...teams].filter(t=>!t.finished).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'))[0];
    if(first)batch.set(db.collection('meta').doc('stage3Turn'),{team:first.id,teamName:first.name,index:0,turnStartedAtMs:Date.now(),turnDuration:gameFlowDurationV960('stage3Choice',15),updatedAt:FieldValue.serverTimestamp()},{merge:true});
  }
  await batch.commit();
  audienceModeV95='stage3';renderAudiencePanelV95(false);
}

async function adminChooseStage3QuestionV95(ci,i){
  const key=ci+'_'+i, q=DATA.stage3?.[ci]?.qs?.[i]; if(!q)return; if(audienceActiveStage3V95?.id)return alert('يوجد سؤال مفتوح الآن. انتظر انتهاءه أو أظهر الإجابات.'); if(audienceStage3LocksV95[key]?.answered)return alert('هذا السؤال مستخدم مسبقًا');
  try{
    const owner=audienceStage3TurnV95?.team || teams[0]?.id; const ownerName=audienceStage3TurnV95?.teamName || teams.find(t=>sameTeamAdminV95(t.id,owner))?.name || '';
    if(!owner)return alert('لا يوجد فريق صاحب دور.');
    await db.collection('stage3Locks').doc(key).set({team:owner,teamName:ownerName,answered:false,createdAt:FieldValue.serverTimestamp(),startedAtMs:Date.now()},{merge:true});
    await db.collection('meta').doc('activeStage3').set({id:key,team:owner,teamName:ownerName,status:'asking',duration:gameFlowDurationV960('stageQuestion',15),startedAtMs:Date.now(),revealDone:false},{merge:true});
    audienceModeV95='stage3';renderAudiencePanelV95();
  }catch(e){alert(e.message||'تعذر اختيار السؤال')}
}
async function getAllTeamDocsV95(){const snap=await db.collection('teams').get();const arr=[];snap.forEach(d=>arr.push({id:d.id,ref:d.ref,...d.data()}));return arr;}
async function applyMissingStage3PenaltiesV95(info, active){
  const roundId='stage3_'+active.id+'_'+String(active.startedAtMs||''); const owner=active.team; const base=stage3BasePointsAdminV95(info.level);
  const docs=await getAllTeamDocsV95();
  const batch=db.batch();
  docs.forEach(t=>{
    const pr=(t.progress&&t.progress.stage3)||{}; const liveAnswers=Object.assign({},pr.liveAnswers||{});
    if(liveAnswers[roundId])return;
    const isOwner=sameTeamAdminV95(t.id,owner); const pts=isOwner?-base:0;
    liveAnswers[roundId]={answer:isOwner?'لم يجب':'لم يجب',ok:false,points:pts,skipped:!isOwner,teamName:t.name,time:Date.now(),isOwner};
    const stageScores=Object.assign({stage1:0,stage2:0,stage3:0,stage4:0},t.stageScores||{}); stageScores.stage3=Math.max(0,(stageScores.stage3||0)+pts);
    const score=Math.max(0,(t.score||0)+pts);
    const progress=Object.assign({},t.progress||{}, {stage3:Object.assign({},pr,{liveAnswers})});
    const log={stage:'على المحك',question:info.text,selected:'لم يجب',correct:info.correct,ok:false,points:pts,meta:info.cat.cat+' - '+info.level+(isOwner?' - صاحب الاختيار':' - فريق آخر'),playerName:t.name,time:new Date().toLocaleString('ar')};
    batch.set(t.ref,{progress,stageScores,score,answerLog:[...(t.answerLog||[]),log]},{merge:true});
  });
  await batch.commit();
}
async function revealStage3AnswersV95(auto=false){
  const active=audienceActiveStage3V95; const info=activeStage3InfoAdminV95(); if(!active||!info)return alert('لا يوجد سؤال مفتوح');
  await applyMissingStage3PenaltiesV95(info,active);
  const docs=await getAllTeamDocsV95(); const roundId='stage3_'+active.id+'_'+String(active.startedAtMs||'');
  const rows=docs.map(t=>{const a=t.progress?.stage3?.liveAnswers?.[roundId]||{};return {name:t.name,answer:a.answer||'لم يجب',ok:a.ok,points:Number(a.points||0)}});
  audienceActiveStage3V95=Object.assign({},audienceActiveStage3V95,{revealDone:true,status:'revealing'});
  await db.collection('meta').doc('activeStage3').set({revealDone:true,status:'revealing'},{merge:true});
  await showRevealPopupV95('إجابات المرحلة الثالثة',rows);
  await db.collection('stage3Locks').doc(active.id).set({answered:true,answeredAt:FieldValue.serverTimestamp()},{merge:true});
  await db.collection('meta').doc('activeStage3').set({id:null,team:null,teamName:null,status:'waiting'},{merge:true});
  audienceModeV95='stage3'; renderAudiencePanelV95(false);
  await advanceStage3TurnAdminV95(active.team);
}
/* refactor: removed obsolete earlier definition of advanceStage3TurnAdminV95 from original line 929; final definition is kept later. */


async function advanceStage3TurnManualV95(){
  if(audienceActiveStage3V95?.id)return alert('لا يمكن تغيير الدور أثناء وجود سؤال مفتوح.');
  const cur=audienceStage3TurnV95?.team;
  await advanceStage3TurnAdminV95(cur);
  audienceModeV95='stage3';
  renderAudiencePanelV95(false);
}


async function autoPenalizeExpiredStage3TurnV957(){
  if(stage3TurnPenaltyBusyV957)return;
  if(!audienceStage3ControlV958?.started || audienceStage3ControlV958?.paused)return;
  const turn=audienceStage3TurnV95||{};
  if(!turn.team || audienceActiveStage3V95?.id)return;
  if(!turn.turnStartedAtMs){
    stage3TurnPenaltyBusyV957=true;
    try{await db.collection('meta').doc('stage3Turn').set({turnStartedAtMs:Date.now(),turnDuration:gameFlowDurationV960('stage3Choice',15)},{merge:true});}
    finally{stage3TurnPenaltyBusyV957=false;}
    return;
  }
  if(stage3TurnLeftAdminV957()>0)return;
  stage3TurnPenaltyBusyV957=true;
  try{
    const docs=await getAllTeamDocsV95();
    const t=docs.find(x=>sameTeamAdminV95(x.id,turn.team));
    if(t){
      const stageScores=Object.assign({stage1:0,stage2:0,stage3:0,stage4:0},t.stageScores||{});
      stageScores.stage3=Math.max(0,(stageScores.stage3||0)-5);
      const score=Math.max(0,(t.score||0)-5);
      const log={stage:'على المحك',question:'لم يتم اختيار سؤال ضمن الوقت',selected:'لم يختر سؤالًا',correct:'-',ok:false,points:-5,meta:'انتهى وقت اختيار السؤال',playerName:t.name||turn.teamName||'',time:new Date().toLocaleString('ar')};
      await t.ref.set({stageScores,score,answerLog:[...(t.answerLog||[]),log]},{merge:true});
      await showRevealPopupV95('انتهى وقت اختيار السؤال',[{name:t.name||turn.teamName||'الفريق',answer:'لم يختر سؤالًا خلال 15 ثانية',ok:false,points:-5}]);
    }
    await advanceStage3TurnAdminV95(turn.team);
    audienceModeV95='stage3';
    renderAudiencePanelV95(false);
  }catch(e){console.error('stage3 turn penalty failed',e)}
  finally{stage3TurnPenaltyBusyV957=false;}
}

async function startStage4QuestionV95(){
  const idx=Number(audienceStage4LiveV95?.index||0); if(!DATA.stage4?.[idx])return alert('لا يوجد سؤال');
  await db.collection('meta').doc('stage4Live').set({status:'asking',index:idx,duration:gameFlowDurationV960('stageQuestion',15),startedAtMs:Date.now(),revealDone:false},{merge:true});
  audienceModeV95='stage4';renderAudiencePanelV95();
}
async function nextStage4QuestionV95(){
  if(audienceStage4LiveV95?.startedAtMs && !audienceStage4LiveV95?.revealDone)return alert('يجب عرض نتائج السؤال الحالي قبل الانتقال للسؤال التالي.');
  const idx=Number(audienceStage4LiveV95?.index||0)+1;
  if(idx>=DATA.stage4.length)return alert('انتهت أسئلة المرحلة الرابعة');
  await db.collection('meta').doc('stage4Live').set({status:'asking',index:idx,duration:gameFlowDurationV960('stageQuestion',15),startedAtMs:Date.now(),revealDone:false},{merge:true});
  audienceModeV95='stage4';renderAudiencePanelV95();
}
async function resetStage4V95(){
  if(!confirm('إعادة المرحلة الرابعة من البداية؟'))return;
  await db.collection('meta').doc('stage4Live').set({status:'waiting',index:0,duration:gameFlowDurationV960('stageQuestion',15),startedAtMs:null,revealDone:false},{merge:true});
}
/* refactor: removed obsolete earlier definition of revealStage4AnswersV95 from original line 994; final definition is kept later. */

function showCurrentResultsPopupV95(){
  const rows=sortedTeams().slice().reverse().map(t=>({name:t.name,answer:'',ok:null,points:t.score||0}));
  showRevealPopupV95('النتائج الحالية',rows,true);
}
function sleepV95(ms){return new Promise(r=>setTimeout(r,ms));}
/* refactor: removed obsolete earlier definition of showRevealPopupV95 from original line 1010; final definition is kept later. */

/* ===== V9.5.9 Polish: stable stage 3 pause, compact audience, cleaner reveal ===== */
/* refactor: removed obsolete earlier definition of stage3TurnLeftAdminV957 from original line 1039; final definition is kept later. */
/* refactor: removed obsolete earlier definition of stage3TurnLabelAdminV957 from original line 1049; final definition is kept later. */
async function setStage3TurnToCurrentOrFirstV959(batch, duration=15){
  const list=[...teams].filter(t=>!t.finished).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'));
  if(!list.length)return null;
  const currentId=audienceStage3TurnV95?.team;
  let idx=list.findIndex(t=>sameTeamAdminV95(t.id,currentId));
  if(idx<0)idx=0;
  const t=list[idx];
  batch.set(db.collection('meta').doc('stage3Turn'),{
    team:t.id,teamName:t.name,index:idx,turnStartedAtMs:Date.now(),turnDuration:Math.max(1,Number(duration||15)),updatedAt:FieldValue.serverTimestamp()
  },{merge:true});
  return t;
}
/* refactor: removed obsolete earlier definition of toggleStage3RunV958 from original line 1065; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderAudienceStage3V95 from original line 1087; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderAudienceStage4V95 from original line 1115; final definition is kept later. */
/* refactor: removed obsolete earlier definition of showRevealPopupV95 from original line 1124; final definition is kept later. */


/* ===== V9.5.10 Final audience timing/layout polish ===== */
function stage3TurnLeftAdminV957(){
  const t=audienceStage3TurnV95||{};
  if(!t.team)return 0;
  if(!t.turnStartedAtMs){
    const d=Number(t.turnDuration);
    return Number.isFinite(d) && d>=0 ? Math.max(0,d) : 15;
  }
  const elapsed=Math.floor((Date.now()-Number(t.turnStartedAtMs||0))/1000);
  return Math.max(0,Number(t.turnDuration||15)-elapsed);
}
function stage3TurnLabelAdminV957(){
  const left=stage3TurnLeftAdminV957();
  const paused=!!audienceStage3ControlV958?.paused || !audienceStage3ControlV958?.started;
  return `<span class="stage3-turn-timer ${left<=5?'timer-danger':''} ${paused?'paused':''}">${paused?'متوقف':('اختيار السؤال: '+left+'s')}</span>`;
}
async function toggleStage3RunV958(){
  const started=!!audienceStage3ControlV958?.started;
  const paused=!!audienceStage3ControlV958?.paused || !started;
  const batch=db.batch();
  const turnRef=db.collection('meta').doc('stage3Turn');
  const ctrlRef=db.collection('meta').doc('stage3Control');
  const activeRef=db.collection('meta').doc('activeStage3');
  if(!started || paused){
    let turnLeft=Number(audienceStage3TurnV95?.turnDuration||15);
    if(audienceStage3TurnV95?.turnStartedAtMs) turnLeft=stage3TurnLeftAdminV957();
    if(!Number.isFinite(turnLeft)||turnLeft<=0)turnLeft=15;
    batch.set(ctrlRef,{started:true,paused:false,updatedAt:FieldValue.serverTimestamp()},{merge:true});
    if(audienceStage3TurnV95?.team){
      batch.set(turnRef,{turnStartedAtMs:Date.now(),turnDuration:turnLeft,updatedAt:FieldValue.serverTimestamp()},{merge:true});
    }else{
      await setStage3TurnToCurrentOrFirstV959(batch,turnLeft);
    }
    if(audienceActiveStage3V95?.id && audienceActiveStage3V95.status==='paused'){
      let qLeft=Number(audienceActiveStage3V95.duration||15);
      if(!Number.isFinite(qLeft)||qLeft<=0)qLeft=15;
      batch.set(activeRef,{status:'asking',startedAtMs:Date.now(),duration:qLeft},{merge:true});
    }
  }else{
    const turnLeft=stage3TurnLeftAdminV957();
    batch.set(ctrlRef,{started:true,paused:true,updatedAt:FieldValue.serverTimestamp()},{merge:true});
    batch.set(turnRef,{turnDuration:turnLeft,turnStartedAtMs:null,updatedAt:FieldValue.serverTimestamp()},{merge:true});
    if(audienceActiveStage3V95?.id && audienceActiveStage3V95.status==='asking'){
      const qLeft=liveLeftAdminV95(audienceActiveStage3V95);
      batch.set(activeRef,{status:'paused',duration:qLeft,startedAtMs:null},{merge:true});
    }
  }
  await batch.commit();
  audienceModeV95='stage3';renderAudiencePanelV95(false);
}
function renderAudienceStage3V95(){
  const active=activeStage3InfoAdminV95();
  const isStarted=!!audienceStage3ControlV958?.started;
  const isPaused=!!audienceStage3ControlV958?.paused || !isStarted;
  const mainBtnText=!isStarted?'بداية المرحلة الثالثة':(isPaused?'استكمال المرحلة الثالثة':'إيقاف مؤقت');
  const mainBtnClass=!isStarted||isPaused?'success':'danger';
  const turnControls=`<div class="audience-turn-panel stage-control-panel-v9510">
    <div class="turn-owner-line"><b>الدور الآن:</b> <span>${esc(audienceStage3TurnV95?.teamName||'بانتظار فريق')}</span> ${stage3TurnLabelAdminV957()}</div>
    <div class="audience-actions-line-v9510">
      <button class="btn ${mainBtnClass}" onclick="toggleStage3RunV958()">${mainBtnText}</button>
      <button class="btn secondary" ${isPaused||audienceActiveStage3V95?.id?'disabled':''} onclick="advanceStage3TurnManualV95()">تغيير الدور</button>
      <button class="btn success" ${audienceActiveStage3V95?.id?'':'disabled'} onclick="revealStage3AnswersV95()">إظهار الإجابات</button>
      <button class="btn secondary" onclick="finishAudienceStage3V958()">إنهاء المرحلة</button>
      <button class="btn danger" onclick="resetStage3AudienceV95()">إعادة المرحلة</button>
    </div>
  </div>`;
  let current='';
  if(active){
    const left=liveLeftAdminV95(audienceActiveStage3V95);
    const pausedLabel=isPaused||audienceActiveStage3V95?.status==='paused'?'<span class="badge">متوقفة مؤقتًا</span>':'';
    current=`<div class="audience-current-question audience-current-question-v9510"><div class="audience-question-topline"><span class="timer ${left<=5?'timer-danger':''}">${left}s</span>${pausedLabel}</div><h2>${esc(active.text)}</h2><p>${esc(active.cat.cat)} - ${esc(active.level)} | صاحب السؤال: ${esc(audienceActiveStage3V95.teamName||'')}</p></div>`;
  }else{
    current=`<div class="audience-current-question audience-current-question-v9510 idle"><h2>${isPaused?'اضغط بداية المرحلة الثالثة للبدء':'اختروا سؤالًا من الجدول'}</h2></div>`;
  }
  const cats=(DATA.stage3||[]).slice(0,5);
  const board=`<div class="audience-stage3-board audience-stage3-board-v9510">${cats.map((cat,ci)=>`<div class="audience-board-col"><h3>${esc(cat.cat)}</h3>${(cat.qs||[]).map((q,i)=>{const k=ci+'_'+i; const used=!!audienceStage3LocksV95[k]?.answered; const isActive=audienceActiveStage3V95?.id===k; const label=`${q[0]} ${i+1}`; return `<button type="button" class="audience-q-btn display-only ${used?'used-v954':''} ${isActive?'picked active-question-v95':''}" disabled aria-disabled="true"><span>${esc(label)}</span></button>`}).join('')}</div>`).join('')}</div>`;
  return `<div class="audience-card audience-stage3 audience-stage-mode-v9510">${renderAudienceTeamsBarV95()}${turnControls}${current}<h3 class="audience-board-title-v9510">جدول أسئلة المرحلة الثالثة</h3>${board}</div>`;
}
function renderAudienceStage4V95(){
  const info=stage4InfoAdminV95(); const live=audienceStage4LiveV95||{}; const left=liveLeftAdminV95(live);
  const isStarted=!!live.startedAtMs || Number(live.index||0)>0 || live.status==='revealed' || live.status==='revealing';
  const visibleQuestion=(live.status==='asking'||live.status==='revealing'||live.status==='revealed') && info;
  const qText=visibleQuestion?info.q.q:'اضغط بداية المرحلة لإظهار السؤال الأول';
  const canReveal=!!live.startedAtMs && !live.revealDone;
  const canNext=!!live.revealDone && (Number(live.index||0)+1)<(DATA.stage4||[]).length;
  const actions=`<div class="audience-actions-line-v9510 audience-stage4-actions stage4-actions-in-card"><button class="btn success" ${isStarted?'disabled':''} onclick="startStage4QuestionV95()">بداية المرحلة</button><button class="btn secondary" ${canReveal?'':'disabled'} onclick="revealStage4AnswersV95()">إظهار الإجابات</button><button class="btn secondary" ${canNext?'':'disabled'} onclick="nextStage4QuestionV95()">السؤال التالي</button><button class="btn secondary" onclick="finishAudienceStage4V958()">إنهاء المرحلة</button><button class="btn danger" onclick="resetStage4V95()">إعادة المرحلة</button></div>`;
  return `<div class="audience-card audience-stage4 audience-stage-mode-v9510"><h2>المرحلة الرابعة - اثبتوا بالحق</h2><div class="audience-stage4-status"><span class="badge green">سؤال ${(info?.idx||0)+1} من ${(DATA.stage4||[]).length}</span><span class="timer ${left<=5?'timer-danger':''}">${live.status==='asking'?left:0}s</span></div><div class="audience-current-question audience-current-question-v9510 stage4-question-card-v9525 ${visibleQuestion?'':'idle'}"><h2>${esc(qText)}</h2>${actions}</div></div>`;
}
/* refactor: removed obsolete earlier definition of showRevealPopupV95 from original line 1235; final definition is kept later. */

/* ===== V9.5.12 Clean + Polish + Export + Control Stability ===== */
function teamDisplayNameV9512(t){
  const raw=(t&&t.name)||safeDecodeTeamId(t&&t.id)||'فريق';
  return String(raw).trim()||'فريق';
}
function teamLabelV9512(t){
  const g=teamProvince(t);
  return esc(teamDisplayNameV9512(t))+(g?` <span class="province-chip">${esc(g)}</span>`:'');
}
function stageKeyFromCurrentV9512(cur){
  if(String(cur||'').includes('stage1')||String(cur||'').includes('intro1'))return 'stage1';
  if(String(cur||'').includes('stage2')||String(cur||'').includes('intro2'))return 'stage2';
  if(String(cur||'').includes('stage3')||String(cur||'').includes('intro3'))return 'stage3';
  if(String(cur||'').includes('stage4')||String(cur||'').includes('intro4'))return 'stage4';
  return '';
}
function stageArabicNameV9512(st){return {stage1:'اجمعوا الكنوز',stage2:'فتشوا الكتب',stage3:'على المحك',stage4:'اثبتوا بالحق'}[st]||st;}
function normalizeStageTargetV9512(v){return String(v||'stage1').replace('intro','stage');}
function ensureLiveTools(){
  const live=document.getElementById('live');
  if(!live||document.getElementById('liveToolsV9512'))return;
  const tools=document.createElement('div');
  tools.id='liveToolsV9512';
  tools.className='live-tools-v9512';
  tools.innerHTML=`<button class="btn" onclick="toggleLiveFullscreen()">وضع الشاشة الكاملة</button><button class="btn secondary" onclick="showCurrentResultsPopupV95&&showCurrentResultsPopupV95()">إظهار النتائج الحالية</button>`;
  live.insertBefore(tools, live.querySelector('#liveList'));
}
/* refactor: removed obsolete earlier definition of renderSelectors from original line 1284; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderLive from original line 1292; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderFinals from original line 1299; final definition is kept later. */
function renderPlayers(){
  const box=document.getElementById('playersBox');if(!box)return;const t=selectedTeam();
  if(!t){box.innerHTML='اختر فريقًا لعرض أسماء اللاعبين.';return;}
  const players=t.players||[];
  box.innerHTML=`<h3>تعديل أسماء الفريق واللاعبين</h3><div class="admin-name-editor"><label>اسم الفريق</label><input id="editTeamName" value="${esc(teamDisplayNameV9512(t))}"><label>المحافظة</label><input id="editGovernorate" value="${esc(teamProvince(t)||'')}">${[0,1,2,3].map(i=>`<label>اللاعب ${i+1}</label><input id="editPlayer${i}" value="${esc(players[i]?.name||'')}">`).join('')}<button class="btn" onclick="saveTeamNames()">حفظ الأسماء</button></div><div id="scoreEditorBox" class="mini-card score-editor-card"></div>`;
}
function ensureControlToolsV9512(){
  const control=document.getElementById('control'); if(!control||document.getElementById('controlToolsV9512'))return;
  const ref=control.querySelector('.stage2-grid');
  const panel=document.createElement('div');
  panel.id='controlToolsV9512';
  panel.className='control-tools-v9512 mini-card';
  const locks=(controlState&&controlState.stageLocks)||{};
  panel.innerHTML=`<h3>قفل وفتح المراحل</h3><div class="stage-lock-grid-v9512">${['stage1','stage2','stage3','stage4'].map(st=>`<button class="btn ${locks[st]===false?'danger':'success'}" onclick="toggleStageLockV9512('${st}')">${locks[st]===false?'فتح':'قفل'} ${stageNames[st]}</button>`).join('')}</div><hr><h3>ترحيل وإعادة المراحل</h3><div class="transfer-row-v9512"><select id="restartStageUnified"><option value="stage1">المرحلة الأولى</option><option value="stage2">المرحلة الثانية</option><option value="stage3">المرحلة الثالثة</option><option value="stage4">المرحلة الرابعة</option></select><button class="btn secondary" onclick="restartSelectedTeamStageV9512()">إعادة الفريق المختار</button><button class="btn secondary" onclick="restartAllTeamsStageV9512()">إعادة كل الفرق</button></div><hr><h3>الإيقاف المؤقت</h3><div class="transfer-row-v9512"><button class="btn danger" onclick="togglePause()">إيقاف/استكمال كل الفرق</button><button class="btn danger" onclick="toggleSelectedTeamPauseV9512()">إيقاف/استكمال الفريق المختار</button></div>`;
  if(ref) ref.insertAdjacentElement('beforebegin', panel); else control.prepend(panel);
}
const renderControlBaseV9512 = renderControl;
/* refactor: removed obsolete earlier definition of renderControl from original line 1320; final definition is kept later. */
async function toggleStageLockV9512(st){
  const locks=Object.assign({},controlState.stageLocks||{});locks[st]=locks[st]===false?true:false;
  await db.collection('meta').doc('control').set({stageLocks:locks},{merge:true});
  const panel=document.getElementById('controlToolsV9512'); if(panel)panel.remove(); renderControl();
}
async function toggleSelectedTeamPauseV9512(){
  const t=selectedTeam(); if(!t)return alert('اختر فريقًا أولًا');
  await db.collection('teams').doc(t.id).set({paused:!t.paused},{merge:true});
  alert(!t.paused?'تم إيقاف الفريق مؤقتًا.':'تم استكمال الفريق.');
}
function defaultProgressForStageV9512(stage){
  if(stage==='stage1')return {i:0,startedAt:Date.now(),remaining:420,ended:false};
  if(stage==='stage2')return {answered:{},roles:{},matching:{},startedTurns:{},timers:{}};
  if(stage==='stage3')return {answered:{},liveAnswers:{}};
  if(stage==='stage4')return {i:0,streak:0,ended:false,liveAnswers:{}};
  return {};
}
function resetTeamToStagePayloadV9512(t,st){
  const order=['stage1','stage2','stage3','stage4']; const idx=order.indexOf(st); const reset=new Set(order.slice(idx));
  const progress=Object.assign({},t.progress||{}); reset.forEach(k=>progress[k]=defaultProgressForStageV9512(k));
  const stageScores=Object.assign({stage1:0,stage2:0,stage3:0,stage4:0},t.stageScores||{}); reset.forEach(k=>stageScores[k]=0);
  const score=Object.values(stageScores).reduce((a,b)=>a+Number(b||0),0);
  const stageArabic={stage1:'اجمعوا الكنوز',stage2:'فتشوا الكتب',stage3:'على المحك',stage4:'اثبتوا بالحق'};
  const removeNames=new Set(order.slice(idx).map(k=>stageArabic[k]));
  const answerLog=(t.answerLog||[]).filter(l=>!removeNames.has(l.stage));
  const done=(t.done||[]).filter(x=>!reset.has(String(x).replace('intro','stage')));
  return {current:st,finished:false,done,progress,stageScores,score,answerLog};
}
async function restartSelectedTeamStageV9512(){const t=selectedTeam();if(!t)return alert('اختر فريقًا أولًا');const st=document.getElementById('restartStageUnified')?.value||document.getElementById('restartStageSelect')?.value||'stage1';if(!confirm(`إعادة ${teamDisplayNameV9512(t)} إلى بداية ${stageNames[st]}؟ سيتم حفظ نقاط المراحل السابقة فقط.`))return;await db.collection('teams').doc(t.id).set(resetTeamToStagePayloadV9512(t,st),{merge:true});alert('تمت إعادة الفريق مع ضبط الوقت والنقاط.');}
async function restartAllTeamsStageV9512(){const st=document.getElementById('restartStageUnified')?.value||'stage1';if(!confirm(`إعادة كل الفرق إلى بداية ${stageNames[st]}؟ سيتم حفظ نقاط المراحل السابقة فقط.`))return;const snap=await db.collection('teams').get();const batch=db.batch();snap.forEach(d=>batch.set(d.ref,resetTeamToStagePayloadV9512({id:d.id,...(d.data()||{})},st),{merge:true}));await batch.commit();alert('تمت إعادة كل الفرق مع ضبط الوقت والنقاط.');}
async function restartTeamStage(){return restartSelectedTeamStageV9512();}
/* refactor: removed obsolete earlier definition of exportNodeToPdfV9512 from original line 1352; final definition is kept later. */
/* refactor: removed obsolete earlier definition of downloadSelectedTeamAnswersPdfV9512 from original line 1359; final definition is kept later. */
function renderAnswerLog(){const box=document.getElementById('answerLogBox');if(!box)return;const t=selectedTeam();if(!t){box.innerHTML='<p>اختر فريقًا لعرض الإجابات.</p>';return}const filter=document.getElementById('logStageFilter')?.value||'all';let logs=t.answerLog||[];if(filter!=='all')logs=logs.filter(l=>l.stage===filter);const tools=`<div class="answer-tools-v9512"><button class="btn secondary" onclick="downloadSelectedTeamAnswersPdfV9512()">تحميل إجابات الفريق كصورة PNG</button></div>`;if(!logs.length){box.innerHTML=tools+'<p>لا توجد إجابات مسجلة حسب الاختيار الحالي.</p>';return}box.innerHTML=tools+`<table class="table answer-table-v9512"><thead><tr><th>#</th><th>اللاعب/الفريق</th><th>المرحلة</th><th>السؤال</th><th>إجابة الفريق</th><th>الجواب الصحيح</th><th>النتيجة</th><th>النقاط</th></tr></thead><tbody>${logs.map((l,i)=>`<tr><td>${i+1}</td><td>${esc(l.playerName||'الفريق')}</td><td>${esc(l.stage)}<br><small>${esc(l.meta)}</small></td><td>${esc(l.question)}</td><td>${esc(l.selected)}</td><td><b>${esc(l.correct||'-')}</b></td><td>${l.selected==='تخطي'?'تخطي':(l.ok?'صحيح':'خطأ')}</td><td>${Number(l.points||0)>0?'+'+l.points:l.points}</td></tr>`).join('')}</tbody></table>`;}
function historyHtmlTableV9512(list){return `<table class="table history-table-v9512"><thead><tr><th>الترتيب</th><th>الفريق</th><th>المحافظة</th><th>اللاعبون</th><th>المرحلة 1</th><th>المرحلة 2</th><th>المرحلة 3</th><th>المرحلة 4</th><th>المجموع</th></tr></thead><tbody>${list.map((t,i)=>`<tr><td>${i+1}</td><td>${esc(teamDisplayNameV9512(t))}</td><td>${esc(teamProvince(t)||'-')}</td><td>${(t.players||[]).map(p=>esc(p.name)).join('<br>')}</td><td>${t.stageScores?.stage1||0}</td><td>${t.stageScores?.stage2||0}</td><td>${t.stageScores?.stage3||0}</td><td>${t.stageScores?.stage4||0}</td><td><b>${t.score||0}</b></td></tr>`).join('')}</tbody></table>`;}
/* refactor: removed obsolete earlier definition of exportHistoryPdfV9512 from original line 1362; final definition is kept later. */
function exportHistoryExcelV9512(id){const r=history.find(x=>x.id===id);if(!r)return;const list=r.teams||[];const html=`<html><head><meta charset="UTF-8"></head><body>${historyHtmlTableV9512(list)}</body></html>`;const blob=new Blob([html],{type:'application/vnd.ms-excel;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`history-${r.date||'competition'}.xls`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);}
/* refactor: removed obsolete earlier definition of renderHistory from original line 1364; final definition is kept later. */

/* ===== V9.5.13 Emergency Admin Tabs Restore =====
   Restores the three core admin tabs (live/finals/control) with isolated rendering
   so one advanced audience/export error cannot break navigation. */
function escHtmlV9513(x){return String(x??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));}
function teamNameV9513(t){return String((t&&t.name)||safeDecodeTeamId?.(t&&t.id)||t?.id||'فريق').trim()||'فريق';}
function teamGovV9513(t){return String((t&&(t.governorate||t.province))||'').trim();}
/* refactor: removed obsolete earlier definition of selectedTeam from original line 1372; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderSelectors from original line 1373; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderLive from original line 1379; final definition is kept later. */
function renderFinals(){
  const box=document.getElementById('finalTable'); if(!box)return;
  const list=[...teams].sort((a,b)=>(Number(b.score||0)-Number(a.score||0))||teamNameV9513(a).localeCompare(teamNameV9513(b),'ar'));
  if(!list.length){box.innerHTML='<p>لا توجد نتائج.</p>';return;}
  box.innerHTML=`<div class="finals-polish-wrap"><table class="table final-table-v9512"><thead><tr><th>الترتيب</th><th>الفريق</th><th>المحافظة</th><th>المرحلة 1</th><th>المرحلة 2</th><th>المرحلة 3</th><th>المرحلة 4</th><th>المجموع</th></tr></thead><tbody>${list.map((t,i)=>`<tr><td>${i+1}</td><td>${escHtmlV9513(teamNameV9513(t))}</td><td>${escHtmlV9513(teamGovV9513(t)||'-')}</td><td>${Number(t.stageScores?.stage1||0)}</td><td>${Number(t.stageScores?.stage2||0)}</td><td>${Number(t.stageScores?.stage3||0)}</td><td>${Number(t.stageScores?.stage4||0)}</td><td><b>${Number(t.score||0)}</b></td></tr>`).join('')}</tbody></table></div>`;
}
/* refactor: removed obsolete earlier definition of renderControl from original line 1393; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderAll from original line 1401; final definition is kept later. */
/* refactor: removed obsolete earlier definition of showAdmin from original line 1409; final definition is kept later. */

/* ===== V9.5.20 Focused Admin Polish: global fullscreen, general results, clean control, audience buttons ===== */
let lastSelectedTeamIdV9520 = '';
function stageKeyFromCurrentV9520(cur){
  cur=String(cur||'');
  if(cur.includes('1'))return 'stage1';
  if(cur.includes('2'))return 'stage2';
  if(cur.includes('3'))return 'stage3';
  if(cur.includes('4'))return 'stage4';
  return 'stage1';
}
function teamStageScoreV9520(t){const st=stageKeyFromCurrentV9520(t?.current); return Number(t?.stageScores?.[st]||0);}
function totalScoreV9520(t){return Number(t?.score ?? ((Number(t?.stageScores?.stage1||0)+Number(t?.stageScores?.stage2||0)+Number(t?.stageScores?.stage3||0)+Number(t?.stageScores?.stage4||0))));}
function teamNameCleanV9520(t){return escHtmlV9513 ? escHtmlV9513(teamNameV9513(t)) : esc((t&&t.name)||'فريق');}
function toggleSiteFullscreenV9520(){
  const el=document.documentElement;
  try{
    if(document.fullscreenElement || document.webkitFullscreenElement){(document.exitFullscreen||document.webkitExitFullscreen).call(document);return;}
    (el.requestFullscreen||el.webkitRequestFullscreen||el.msRequestFullscreen).call(el);
  }catch(e){alert('لم يتم تفعيل ملء الشاشة من المتصفح.');}
}
/* refactor: removed obsolete earlier definition of renderLive from original line 1444; final definition is kept later. */
/* refactor: removed obsolete earlier definition of renderGeneralResultsV9520 from original line 1455; final definition is kept later. */
/* refactor: removed obsolete earlier definition of showGeneralResultsRevealV9520 from original line 1462; final definition is kept later. */
function showAdmin(id,btn){
  document.querySelectorAll('.admin-page').forEach(p=>p.classList.add('hidden'));
  const page=document.getElementById(id); if(page)page.classList.remove('hidden');
  document.querySelectorAll('.admin-tabs .stage').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  try{
    if(id==='live')renderLive();
    else if(id==='general'){renderGeneralResultsV9520();}
    else if(id==='finals')renderFinals();
    else if(id==='control')renderControl();
    else if(id==='history')renderHistory();
    else if(id==='audience'&&typeof renderAudiencePanelV95==='function')renderAudiencePanelV95(false);
    else renderAll();
  }catch(e){console.error('Admin tab render failed:',e);}
}
function renderAll(){
  try{renderSelectors();}catch(e){console.warn(e)}
  try{renderLive();}catch(e){console.warn(e)}
  try{renderGeneralResultsV9520();}catch(e){console.warn(e)}
  try{renderFinals();}catch(e){console.warn(e)}
  try{if(!document.getElementById('control')?.classList.contains('hidden'))renderControl();}catch(e){console.warn(e)}
  try{renderHistory();}catch(e){console.warn(e)}
  try{if(!document.getElementById('audience')?.classList.contains('hidden')&&typeof renderAudiencePanelV95==='function')renderAudiencePanelV95(false);}catch(e){console.warn(e)}
}
function renderAudiencePanelV95(resetAnim=true){
  const panel=document.getElementById('audiencePanel'); if(!panel)return;
  const aud=document.getElementById('audience'); if(aud)aud.dataset.audienceMode=audienceModeV95;
  if(typeof DATA==='undefined'){panel.innerHTML='<div class="audience-card"><h3>يتم تحميل الأسئلة...</h3></div>';return;}
  if(audienceModeV95==='home') audienceModeV95='stage3';
  const buttons=`<div class="audience-top-actions audience-top-actions-v9520"><button class="btn ${audienceModeV95==='stage3'?'success':'secondary'}" onclick="setAudienceModeV95('stage3')">المرحلة الثالثة</button><button class="btn ${audienceModeV95==='stage4'?'success':'secondary'}" onclick="setAudienceModeV95('stage4')">المرحلة الرابعة</button></div>`;
  const body=audienceModeV95==='stage4'?renderAudienceStage4V95():renderAudienceStage3V95();
  panel.innerHTML=buttons+body;
}
function renderSelectors(){
  const sel=document.getElementById('teamSelect'); if(!sel)return;
  const prev=lastSelectedTeamIdV9520 || sel.value || '';
  const list=[...teams].sort((a,b)=>teamNameV9513(a).localeCompare(teamNameV9513(b),'ar'));
  sel.innerHTML='<option value="">اختر فريقًا</option>'+list.map(t=>`<option value="${escHtmlV9513(t.id)}">${escHtmlV9513(teamNameV9513(t))}${teamGovV9513(t)?' - '+escHtmlV9513(teamGovV9513(t)):''}</option>`).join('');
  if(prev&&list.some(t=>String(t.id)===String(prev)))sel.value=prev;
}
function selectedTeam(){
  const id=document.getElementById('teamSelect')?.value || lastSelectedTeamIdV9520 || '';
  if(!id)return null;
  return teams.find(t=>String(t.id)===String(id))||null;
}
function stageOptionListV9520(){
  return `<option value="intro1">شرح المرحلة الأولى</option><option value="stage1">المرحلة الأولى</option><option value="intro2">شرح المرحلة الثانية</option><option value="stage2">المرحلة الثانية</option><option value="intro3">شرح المرحلة الثالثة</option><option value="stage3">المرحلة الثالثة</option><option value="intro4">شرح المرحلة الرابعة</option><option value="stage4">المرحلة الرابعة</option><option value="final">النهائي</option>`;
}
function renderControl(){
  const control=document.getElementById('control'); if(!control)return;
  const prev=lastSelectedTeamIdV9520 || document.getElementById('teamSelect')?.value || '';
  control.innerHTML=`<h2>التحكم والمتابعة</h2><div class="control-clean-grid-v9520"><section class="control-card-v9520 wide"><h3>اختيار الفريق</h3><select id="teamSelect" onchange="lastSelectedTeamIdV9520=this.value; renderControl();"></select></section><section class="control-card-v9520 wide" id="stageLocksBoxV9520"></section><section class="control-card-v9520 wide"><h3>الترحيل إلى مرحلة أو شرح مرحلة</h3><div class="control-row-v9520"><select id="moveStageUnifiedV9520">${stageOptionListV9520()}</select><button class="btn secondary" onclick="moveSelectedTeamToStageV9520()">ترحيل الفريق المختار</button><button class="btn secondary" onclick="moveAllTeamsToStageV9520()">ترحيل كل الفرق</button></div></section><section class="control-card-v9520 wide"><h3>الإيقاف المؤقت</h3><div class="control-row-v9520"><button class="btn danger" onclick="togglePause()" id="pauseAllBtnV9520">إيقاف/استكمال الجميع</button><button class="btn danger" onclick="toggleSelectedTeamPauseV9520()">إيقاف/استكمال الفريق المختار</button></div></section><section class="control-card-v9520 wide" id="teamEditorBoxV9520"></section><section class="control-card-v9520 wide"><h3>إجابات الفريق</h3><div class="control-row-v9520"><select id="logStageFilter" onchange="renderAnswerLog()"><option value="all">كل المراحل</option><option value="اجمعوا الكنوز">المرحلة الأولى</option><option value="فتشوا الكتب">المرحلة الثانية</option><option value="على المحك">المرحلة الثالثة</option><option value="اثبتوا بالحق">المرحلة الرابعة</option></select><button class="btn secondary" onclick="downloadSelectedTeamAnswersPdfV9512()">تحميل صورة PNG</button></div><div id="answerLogBox"></div></section></div>`;
  renderSelectors(); if(prev){const sel=document.getElementById('teamSelect'); if(sel&&[...sel.options].some(o=>o.value===prev)){sel.value=prev; lastSelectedTeamIdV9520=prev;}}
  renderStageLocksBoxV9520(); renderTeamEditorV9520(); renderAnswerLog(); renderPauseButton();
}
function renderStageLocksBoxV9520(){
  const box=document.getElementById('stageLocksBoxV9520'); if(!box)return; const locks=(controlState&&controlState.stageLocks)||{};
  box.innerHTML=`<h3>قفل وفتح المراحل</h3><div class="stage-lock-grid-v9520">${['stage1','stage2','stage3','stage4'].map(st=>`<button id="lock_${st}" class="btn ${locks[st]===false?'danger':'success'}" onclick="toggleStageLockV9520('${st}')">${locks[st]===false?'فتح':'قفل'} ${stageNames[st]}</button>`).join('')}</div>`;
}
async function toggleStageLockV9520(st){
  const locks=Object.assign({},controlState.stageLocks||{}); locks[st]=locks[st]===false?true:false;
  const b=document.getElementById('lock_'+st); if(b){b.disabled=true; b.textContent='جارٍ الحفظ...';}
  await db.collection('meta').doc('control').set({stageLocks:locks},{merge:true});
  controlState.stageLocks=locks; renderStageLocksBoxV9520();
}
async function moveSelectedTeamToStageV9520(){const t=selectedTeam(); if(!t)return alert('اختر فريقًا أولًا'); const st=document.getElementById('moveStageUnifiedV9520')?.value||'intro1'; await db.collection('teams').doc(t.id).set({current:st,finished:st==='final'},{merge:true}); alert('تم ترحيل الفريق.');}
async function moveAllTeamsToStageV9520(){const st=document.getElementById('moveStageUnifiedV9520')?.value||'intro1'; if(!confirm('ترحيل كل الفرق؟'))return; const snap=await db.collection('teams').get(); const batch=db.batch(); snap.forEach(d=>batch.set(d.ref,{current:st,finished:st==='final'},{merge:true})); await batch.commit(); alert('تم ترحيل كل الفرق.');}
async function toggleSelectedTeamPauseV9520(){const t=selectedTeam(); if(!t)return alert('اختر فريقًا أولًا'); await db.collection('teams').doc(t.id).set({paused:!t.paused},{merge:true}); alert(!t.paused?'تم إيقاف الفريق.':'تم استكمال الفريق.');}
function renderPauseButton(){const b=document.getElementById('pauseBtn')||document.getElementById('pauseAllBtnV9520'); if(b){b.textContent=controlState.paused?'استكمال الجميع ▶️':'إيقاف الجميع ⏸️';}}
function renderTeamEditorV9520(){
  const box=document.getElementById('teamEditorBoxV9520'); if(!box)return; const t=selectedTeam();
  if(!t){box.innerHTML='<h3>تعديل الفريق والعلامات</h3><p class="muted">اختر فريقًا من الأعلى لعرض أدوات التعديل.</p>';return;}
  const players=t.players||[]; const ss=Object.assign({stage1:0,stage2:0,stage3:0,stage4:0},t.stageScores||{});
  box.innerHTML=`<h3>تعديل الفريق والعلامات</h3><div class="editor-grid-v9520"><label>اسم الفريق</label><input id="editTeamName" value="${escHtmlV9513(teamNameV9513(t))}"><label>المحافظة</label><input id="editGovernorate" value="${escHtmlV9513(teamGovV9513(t))}">${[0,1,2,3].map(i=>`<label>اللاعب ${i+1}</label><input id="editPlayer${i}" value="${escHtmlV9513(players[i]?.name||'')}">`).join('')}<label>المرحلة 1</label><input type="number" id="score_stage1" value="${ss.stage1}"><label>المرحلة 2</label><input type="number" id="score_stage2" value="${ss.stage2}"><label>المرحلة 3</label><input type="number" id="score_stage3" value="${ss.stage3}"><label>المرحلة 4</label><input type="number" id="score_stage4" value="${ss.stage4}"></div><div class="control-row-v9520"><button class="btn" onclick="saveTeamNames()">حفظ الأسماء</button><button class="btn secondary" onclick="saveTeamScores(true)">حفظ العلامات</button><button class="btn danger" onclick="deleteSelectedTeam()">حذف الفريق وبياناته</button></div>`;
}
async function saveTeamScores(recalculate=true){
  const t=selectedTeam(); if(!t)return alert('اختر فريقًا أولًا');
  const ss={stage1:Number(document.getElementById('score_stage1')?.value||0),stage2:Number(document.getElementById('score_stage2')?.value||0),stage3:Number(document.getElementById('score_stage3')?.value||0),stage4:Number(document.getElementById('score_stage4')?.value||0)};
  const score=ss.stage1+ss.stage2+ss.stage3+ss.stage4; await db.collection('teams').doc(t.id).set({stageScores:ss,score},{merge:true}); alert('تم حفظ العلامات.');
}
function exportNodeToPdfV9512(node,filename){
  if(!node)return alert('لا يوجد محتوى للتصدير');
  const wrap=document.createElement('div'); wrap.dir='rtl'; wrap.className='pdf-export-v9520'; wrap.style.cssText='background:white;color:#111;padding:22px;font-family:Tahoma,Arial,sans-serif;width:1100px;';
  wrap.appendChild(node.cloneNode(true)); document.body.appendChild(wrap);
  const cleanup=()=>setTimeout(()=>wrap.remove(),500);
  if(window.html2pdf){html2pdf().set({margin:8,filename,html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff'},jsPDF:{unit:'mm',format:'a4',orientation:'landscape'}}).from(wrap).save().then(cleanup).catch(e=>{cleanup(); alert('تعذر إنشاء الصورة.'); console.error(e);});}
  else{const w=window.open('','_blank');w.document.write('<html dir="rtl"><head><title>'+filename+'</title><link rel="stylesheet" href="style.css"></head><body>'+wrap.innerHTML+'</body></html>');w.document.close();w.print();cleanup();}
}
function renderHistory(){
  const box=document.getElementById('historyList');if(!box)return;if(!history.length){box.innerHTML='<p>لا توجد نتائج محفوظة بعد. المعلومات هنا لا تتغير إلا بعد الضغط على حفظ النتائج.</p>';return}
  box.innerHTML=history.map(r=>{const list=r.teams||[];return `<details class="mini-card history-card"><summary><b>مسابقة بتاريخ: ${escHtmlV9513(r.date)}</b> <span class="badge green">عدد الفرق: ${list.length}</span></summary><div class="history-actions-v9512"><button class="btn secondary" onclick="exportHistoryExcelV9512('${r.id}')">تصدير Excel</button><button class="btn secondary" onclick="exportHistoryPdfV9512('${r.id}')">تصدير صورة PNG</button><button class="btn danger" onclick="deleteHistory('${r.id}')">حذف السجل</button></div>${historyHtmlTableV9512(list)}</details>`}).join('')
}

/* ===== V9.5.21 focused final overrides ===== */
(function(){
  const oldShowAdmin = window.showAdmin;
  window.showAdmin = function(id, btn){
    if (oldShowAdmin) oldShowAdmin(id, btn);
    if (id === 'audience') setTimeout(()=>renderAudiencePanelV95 && renderAudiencePanelV95(false), 30);
    if (id === 'control') setTimeout(()=>{ ensureControlToolsV9521(); ensureSeparateScoreEditorV9521(); renderScoreEditor(); }, 30);
  };
})();

function ensureSeparateScoreEditorV9521(){
  const control=document.getElementById('control');
  if(!control) return;
  let scoreBox=document.getElementById('scoreEditorBox');
  if(!scoreBox){
    scoreBox=document.createElement('div');
    scoreBox.id='scoreEditorBox';
    scoreBox.className='mini-card score-editor-card score-editor-standalone-v9521';
    const players=document.getElementById('playersBox');
    if(players) players.insertAdjacentElement('afterend', scoreBox); else control.appendChild(scoreBox);
  }
}

window.renderPlayers = function(){
  const box=document.getElementById('playersBox'); if(!box)return;
  const t=selectedTeam();
  if(!t){box.innerHTML='<div class="empty-control-v9521">اختر فريقًا لعرض وتعديل بياناته.</div>';return;}
  const players=t.players||[];
  box.innerHTML=`<div class="admin-section-head-v9521"><h3>تعديل بيانات الفريق واللاعبين</h3><p>هذا القسم للأسماء فقط، وتعديل العلامات في بطاقة منفصلة بالأسفل.</p></div><div class="admin-name-editor admin-name-editor-v9521"><label>اسم الفريق</label><input id="editTeamName" value="${esc(teamDisplayNameV9512?t.name?teamDisplayNameV9512(t):t.name:t.name||'')}"><label>المحافظة</label><input id="editGovernorate" value="${esc((typeof teamProvince==='function'?teamProvince(t):t.governorate)||'')}">${[0,1,2,3].map(i=>`<label>اللاعب ${i+1}</label><input id="editPlayer${i}" value="${esc(players[i]?.name||'')}">`).join('')}<button class="btn" onclick="saveTeamNames()">حفظ بيانات الفريق</button></div>`;
  ensureSeparateScoreEditorV9521();
};

window.renderScoreEditor = function(){
  ensureSeparateScoreEditorV9521();
  const box=document.getElementById('scoreEditorBox'); if(!box)return;
  const t=selectedTeam();
  if(!t){box.innerHTML='<h3>تعديل العلامات</h3><p>اختر فريقًا من الأعلى لتعديل علاماته.</p>';return;}
  const ss=Object.assign({stage1:0,stage2:0,stage3:0,stage4:0},t.stageScores||{});
  box.innerHTML=`<h3>تعديل العلامات</h3><div class="admin-score-editor admin-score-editor-v9521">
    <label>المرحلة الأولى</label><input type="number" id="score_stage1" value="${esc(ss.stage1)}">
    <label>المرحلة الثانية</label><input type="number" id="score_stage2" value="${esc(ss.stage2)}">
    <label>المرحلة الثالثة</label><input type="number" id="score_stage3" value="${esc(ss.stage3)}">
    <label>المرحلة الرابعة</label><input type="number" id="score_stage4" value="${esc(ss.stage4)}">
    <label>المجموع اليدوي</label><input type="number" id="score_total" value="${esc(t.score||0)}">
    <button class="btn" onclick="saveTeamScores(false)">حفظ المجموع اليدوي</button>
    <button class="btn secondary" onclick="saveTeamScores(true)">احسب المجموع من المراحل واحفظ</button>
  </div>`;
};

function ensureControlToolsV9521(){
  const old=document.getElementById('controlToolsV9512'); if(old) old.remove();
  const old2=document.getElementById('controlToolsV9520'); if(old2) old2.remove();
  const control=document.getElementById('control'); if(!control || document.getElementById('controlToolsV9521')) return;
  const panel=document.createElement('div');
  panel.id='controlToolsV9521';
  panel.className='control-tools-v9521 mini-card';
  const locks=(controlState&&controlState.stageLocks)||{};
  panel.innerHTML=`
    <div class="control-block-v9521">
      <h3>قفل وفتح المراحل</h3>
      <div class="stage-lock-grid-v9521">${['stage1','stage2','stage3','stage4'].map(st=>`<button class="btn ${locks[st]===false?'danger':'success'}" onclick="toggleStageLockV9512('${st}')">${locks[st]===false?'فتح':'قفل'} ${stageNames[st]}</button>`).join('')}</div>
    </div>
    <div class="control-block-v9521">
      <h3>ترحيل وإعادة المراحل</h3>
      <div class="transfer-row-v9521"><label>اختر المرحلة أو شرح المرحلة</label><select id="restartStageUnified">
        <option value="intro1">شرح المرحلة الأولى</option><option value="stage1">المرحلة الأولى</option>
        <option value="intro2">شرح المرحلة الثانية</option><option value="stage2">المرحلة الثانية</option>
        <option value="intro3">شرح المرحلة الثالثة</option><option value="stage3">المرحلة الثالثة</option>
        <option value="intro4">شرح المرحلة الرابعة</option><option value="stage4">المرحلة الرابعة</option><option value="final">النهائي</option>
      </select><button class="btn secondary" onclick="restartSelectedTeamStageV9521()">ترحيل الفريق المختار</button><button class="btn secondary" onclick="restartAllTeamsStageV9521()">ترحيل كل الفرق</button></div>
    </div>
    <div class="control-block-v9521">
      <h3>الإيقاف المؤقت</h3>
      <div class="pause-row-v9521 pause-row-v95124">
        <button class="btn danger" onclick="togglePause()">إيقاف/استكمال كل الفرق</button>
        <button class="btn danger" onclick="toggleSelectedTeamPauseV9512()">إيقاف/استكمال الفريق المختار</button>
        <button class="btn danger" onclick="clearCurrentTeamsOnlyV9541()">حذف بيانات كل الفرق</button>
        <button class="btn danger" onclick="deleteSelectedTeam()">حذف بيانات الفريق المختار</button>
      </div>
    </div>`;
  const ref=control.querySelector('.stage2-grid');
  if(ref) ref.insertAdjacentElement('beforebegin', panel); else control.prepend(panel);
}

function currentStageValueV9521(){return document.getElementById('restartStageUnified')?.value||'stage1'}
function normalizeRestartStageV9521(v){return String(v||'stage1').replace('intro','stage')==='final'?'stage4':String(v||'stage1').replace('intro','stage');}
window.restartSelectedTeamStageV9521 = async function(){
  const t=selectedTeam(); if(!t)return alert('اختر فريقًا أولًا');
  const raw=currentStageValueV9521(); const st=normalizeRestartStageV9521(raw);
  if(!confirm(`ترحيل ${teamDisplayNameV9512?t.name?teamDisplayNameV9512(t):t.name:t.name} إلى ${stageNames[raw]||stageNames[st]||raw}؟ سيتم حفظ نقاط المراحل السابقة فقط.`))return;
  const payload=resetTeamToStagePayloadV9512(t,st); payload.current=raw;
  await db.collection('teams').doc(t.id).set(payload,{merge:true}); alert('تم الترحيل.');
};
window.restartAllTeamsStageV9521 = async function(){
  const raw=currentStageValueV9521(); const st=normalizeRestartStageV9521(raw);
  if(!confirm(`ترحيل كل الفرق إلى ${stageNames[raw]||stageNames[st]||raw}؟`))return;
  const snap=await db.collection('teams').get(); const batch=db.batch();
  snap.forEach(d=>{const payload=resetTeamToStagePayloadV9512({id:d.id,...(d.data()||{})},st); payload.current=raw; batch.set(d.ref,payload,{merge:true});});
  await batch.commit(); alert('تم ترحيل كل الفرق.');
};
window.restartSelectedTeamStageV9512 = window.restartSelectedTeamStageV9521;
window.restartAllTeamsStageV9512 = window.restartAllTeamsStageV9521;

/* Audience: exactly two buttons. Selecting a stage opens fullscreen and fits content. */
window.renderAudiencePanelV95 = function(resetAnim=true){
  const panel=document.getElementById('audiencePanel'); if(!panel)return;
  const aud=document.getElementById('audience'); if(aud) aud.dataset.audienceMode=audienceModeV95;
  if(typeof DATA==='undefined'){panel.innerHTML='<div class="audience-card"><h3>يتم تحميل الأسئلة...</h3></div>';return;}
  const buttons=`<div class="audience-top-actions audience-top-actions-v9521"><button class="btn ${audienceModeV95==='stage3'?'success':'secondary'}" onclick="setAudienceModeV9521('stage3')">المرحلة الثالثة</button><button class="btn ${audienceModeV95==='stage4'?'success':'secondary'}" onclick="setAudienceModeV9521('stage4')">المرحلة الرابعة</button></div>`;
  let body='';
  if(audienceModeV95==='stage3') body=renderAudienceStage3V95();
  else if(audienceModeV95==='stage4') body=renderAudienceStage4V95();
  else body='<div class="audience-card audience-home-v9521"><h2>اختر مرحلة للعرض</h2><p>اختر المرحلة الثالثة أو الرابعة لعرضها على الشاشة الكبيرة.</p></div>';
  panel.innerHTML=buttons+body;
};
window.setAudienceModeV9521 = function(mode){
  audienceModeV95=mode;
  const aud=document.getElementById('audience'); if(aud) aud.dataset.audienceMode=mode;
  renderAudiencePanelV95(false);
  setTimeout(()=>{ const el=document.getElementById('audience'); if(el && !document.fullscreenElement){ try{el.requestFullscreen?.().catch(()=>{});}catch(e){} } },120);
};
window.setAudienceModeV95 = window.setAudienceModeV9521;

/* Better PDF: no blank first page, clean table layout. */
window.exportNodeToPdfV9512 = function(node,filename){
  if(!node)return alert('لا يوجد محتوى للتصدير');
  const wrap=document.createElement('div');
  wrap.dir='rtl';
  wrap.className='pdf-real-export-v9521';
  wrap.style.cssText='position:fixed;right:0;top:0;width:1120px;min-height:200px;background:#fff;color:#12324A;padding:18px;font-family:Tahoma,Arial,sans-serif;z-index:-1;opacity:1;';
  const clone=node.cloneNode(true);
  clone.classList.add('pdf-export-v9512','pdf-export-v9521');
  wrap.appendChild(clone);
  document.body.appendChild(wrap);
  const cleanup=()=>setTimeout(()=>wrap.remove(),1200);
  if(window.html2pdf){
    html2pdf().set({margin:[6,6,6,6],filename,html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff'},jsPDF:{unit:'mm',format:'a4',orientation:'landscape'},pagebreak:{mode:['avoid-all','css','legacy']}}).from(wrap).save().then(cleanup).catch(e=>{cleanup();console.error(e);alert('تعذر إنشاء الصورة. جرّب مرة أخرى.');});
  }else{
    const w=window.open('','_blank');w.document.write('<html dir="rtl"><head><title>'+filename+'</title><link rel="stylesheet" href="style.css"></head><body>'+wrap.innerHTML+'</body></html>');w.document.close();w.print();cleanup();
  }
};

/* ===== V9.5.22 targeted admin/audience polish ===== */
(function(){
  function safeName9522(t){
    try{return (typeof teamNameV9513==='function'?teamNameV9513(t):(t?.name||t?.id||''))||'';}catch(e){return t?.name||t?.id||'';}
  }
  function safeGov9522(t){
    try{return (typeof teamGovV9513==='function'?teamGovV9513(t):(t?.governorate||''))||'';}catch(e){return t?.governorate||'';}
  }
  function stageOptions9522(){
    return `<option value="intro1">شرح المرحلة الأولى</option><option value="stage1">المرحلة الأولى</option><option value="intro2">شرح المرحلة الثانية</option><option value="stage2">المرحلة الثانية</option><option value="intro3">شرح المرحلة الثالثة</option><option value="stage3">المرحلة الثالثة</option><option value="intro4">شرح المرحلة الرابعة</option><option value="stage4">المرحلة الرابعة</option><option value="final">النهائي</option>`;
  }
  function selectedId9522(){return document.getElementById('teamSelect')?.value || window.lastSelectedTeamIdV9520 || '';}
  window.renderControl = function(){
    const control=document.getElementById('control'); if(!control)return;
    const prev=selectedId9522();
    control.innerHTML=`
      <h2>التحكم والمتابعة</h2>
      <div class="control-shell-v9522">
        <section class="control-card-v9522 select-card-v9522">
          <h3>اختيار الفريق</h3>
          <select id="teamSelect" onchange="window.lastSelectedTeamIdV9520=this.value; renderControl();"></select>
        </section>
        <section class="control-card-v9522 lock-card-v9522" id="stageLocksBoxV9522"></section>
        <section class="control-card-v9522 transfer-card-v9522">
          <h3>الترحيل إلى مرحلة أو شرح مرحلة</h3>
          <div class="transfer-row-v9522">
            <select id="moveStageUnifiedV9522">${stageOptions9522()}</select>
            <button class="btn secondary" onclick="restartSelectedTeamStageV9522()">ترحيل الفريق المختار</button>
            <button class="btn secondary" onclick="restartAllTeamsStageV9522()">ترحيل كل الفرق</button>
          </div>
        </section>
        <section class="control-card-v9522 pause-card-v9522">
          <h3>الإيقاف المؤقت</h3>
          <div class="pause-row-v9522 pause-row-v95125">
            <button class="btn danger" onclick="togglePause()" id="pauseAllBtnV9522">إيقاف/استكمال كل الفرق</button>
            <button class="btn danger" onclick="toggleSelectedTeamPauseV9512 ? toggleSelectedTeamPauseV9512() : toggleSelectedTeamPauseV9520()">إيقاف/استكمال الفريق المختار</button>
            <button class="btn danger" onclick="clearCurrentTeamsOnlyV9541()">حذف بيانات كل الفرق</button>
            <button class="btn danger" onclick="deleteSelectedTeam()">حذف بيانات الفريق المختار</button>
          </div>
        </section>
        <section class="control-card-v9522 team-edit-card-v9522" id="playersBox"></section>
        <section class="control-card-v9522 score-card-v9522" id="scoreEditorBox"></section>
        <section class="control-card-v9522 answers-card-v9522">
          <h3>إجابات الفريق</h3>
          <div class="answer-tools-v9522">
            <select id="logStageFilter" onchange="renderAnswerLog()"><option value="all">كل المراحل</option><option value="اجمعوا الكنوز">المرحلة الأولى</option><option value="فتشوا الكتب">المرحلة الثانية</option><option value="على المحك">المرحلة الثالثة</option><option value="اثبتوا بالحق">المرحلة الرابعة</option></select>
            <button class="btn secondary" onclick="downloadSelectedTeamAnswersPdfV9512 ? downloadSelectedTeamAnswersPdfV9512() : window.print()">تحميل صورة PNG</button>
          </div>
          <div id="answerLogBox"></div>
        </section>
      </div>`;
    renderSelectors();
    const sel=document.getElementById('teamSelect');
    if(prev && sel && [...sel.options].some(o=>o.value===prev)){sel.value=prev; window.lastSelectedTeamIdV9520=prev;}
    renderStageLocksBoxV9522();
    renderPlayers();
    renderScoreEditor();
    renderAnswerLog();
    renderPauseButton();
  };
  window.renderStageLocksBoxV9522 = function(){
    const box=document.getElementById('stageLocksBoxV9522'); if(!box)return;
    const locks=(controlState&&controlState.stageLocks)||{};
    box.innerHTML=`<h3>قفل وفتح المراحل</h3><div class="stage-lock-grid-v9522">${['stage1','stage2','stage3','stage4'].map(st=>`<button id="lock_${st}" class="btn ${locks[st]===false?'danger':'success'}" onclick="toggleStageLockV9522('${st}')">${locks[st]===false?'فتح':'قفل'} ${stageNames[st]}</button>`).join('')}</div>`;
  };
  window.toggleStageLockV9522 = async function(st){
    const locks=Object.assign({},controlState.stageLocks||{});
    locks[st]=locks[st]===false?true:false;
    const b=document.getElementById('lock_'+st); if(b){b.disabled=true; b.classList.add('saving-v9522');}
    await db.collection('meta').doc('control').set({stageLocks:locks},{merge:true});
    controlState.stageLocks=locks;
    renderStageLocksBoxV9522();
  };
  function normalizeStage9522(raw){
    if(raw==='final')return 'stage4';
    if(String(raw||'').startsWith('intro'))return 'stage'+String(raw).replace('intro','');
    return raw||'stage1';
  }
  window.restartSelectedTeamStageV9522 = async function(){
    const t=selectedTeam(); if(!t)return alert('اختر فريقًا أولًا');
    const raw=document.getElementById('moveStageUnifiedV9522')?.value||'intro1';
    const st=normalizeStage9522(raw);
    const payload=(typeof resetTeamToStagePayloadV9512==='function')?resetTeamToStagePayloadV9512(t,st):{current:raw};
    payload.current=raw; payload.finished=raw==='final';
    await db.collection('teams').doc(t.id).set(payload,{merge:true});
    alert('تم ترحيل الفريق.');
  };
  window.restartAllTeamsStageV9522 = async function(){
    const raw=document.getElementById('moveStageUnifiedV9522')?.value||'intro1';
    const st=normalizeStage9522(raw);
    if(!confirm('ترحيل كل الفرق إلى المرحلة المختارة؟'))return;
    const snap=await db.collection('teams').get(); const batch=db.batch();
    snap.forEach(d=>{const data={id:d.id,...(d.data()||{})}; const payload=(typeof resetTeamToStagePayloadV9512==='function')?resetTeamToStagePayloadV9512(data,st):{current:raw}; payload.current=raw; payload.finished=raw==='final'; batch.set(d.ref,payload,{merge:true});});
    await batch.commit(); alert('تم ترحيل كل الفرق.');
  };
  window.renderPlayers = function(){
    const box=document.getElementById('playersBox'); if(!box)return;
    const t=selectedTeam();
    if(!t){box.innerHTML='<h3>تعديل بيانات الفريق</h3><p class="muted">اختر فريقًا من الأعلى.</p>';return;}
    const players=t.players||[];
    box.innerHTML=`<h3>تعديل بيانات الفريق</h3><div class="admin-name-editor-v9522"><label>اسم الفريق</label><input id="editTeamName" value="${esc(safeName9522(t))}"><label>المحافظة</label><input id="editGovernorate" value="${esc(safeGov9522(t))}">${[0,1,2,3].map(i=>`<label>اللاعب ${i+1}</label><input id="editPlayer${i}" value="${esc(players[i]?.name||'')}">`).join('')}<button class="btn" onclick="saveTeamNames()">حفظ بيانات الفريق</button></div>`;
  };
  window.renderScoreEditor = function(){
    const box=document.getElementById('scoreEditorBox'); if(!box)return;
    const t=selectedTeam();
    if(!t){box.innerHTML='<h3>تعديل العلامات</h3><p class="muted">اختر فريقًا لتعديل علاماته.</p>';return;}
    const ss=Object.assign({stage1:0,stage2:0,stage3:0,stage4:0},t.stageScores||{});
    box.innerHTML=`<h3>تعديل العلامات</h3><div class="admin-score-editor admin-score-editor-v9522"><label>المرحلة الأولى</label><input type="number" id="score_stage1" value="${esc(ss.stage1)}"><label>المرحلة الثانية</label><input type="number" id="score_stage2" value="${esc(ss.stage2)}"><label>المرحلة الثالثة</label><input type="number" id="score_stage3" value="${esc(ss.stage3)}"><label>المرحلة الرابعة</label><input type="number" id="score_stage4" value="${esc(ss.stage4)}"><label>المجموع اليدوي</label><input type="number" id="score_total" value="${esc(t.score||0)}"><button class="btn" onclick="saveTeamScores(false)">حفظ المجموع اليدوي</button><button class="btn secondary" onclick="saveTeamScores(true)">احسب المجموع من المراحل واحفظ</button></div>`;
  };
  window.renderSelectors = function(){
    const sel=document.getElementById('teamSelect'); if(!sel)return;
    const prev=window.lastSelectedTeamIdV9520 || sel.value || '';
    const list=[...teams].sort((a,b)=>safeName9522(a).localeCompare(safeName9522(b),'ar'));
    sel.innerHTML='<option value="">اختر فريقًا</option>'+list.map(t=>`<option value="${esc(t.id)}">${esc(safeName9522(t))}${safeGov9522(t)?' - '+esc(safeGov9522(t)):''}</option>`).join('');
    if(prev&&list.some(t=>String(t.id)===String(prev)))sel.value=prev;
  };
  window.selectedTeam = function(){const id=selectedId9522(); return id?teams.find(t=>String(t.id)===String(id)):null;};
  const oldShowAdmin9522=window.showAdmin;
  window.showAdmin=function(id,btn){
    if(oldShowAdmin9522) oldShowAdmin9522(id,btn);
    if(id==='control')setTimeout(()=>renderControl(),20);
  };
})();

/* Audience screen: only two buttons, stage view fills fullscreen while preserving V9.5.13 layout feel. */
(function(){
  window.renderAudiencePanelV95 = function(resetAnim=true){
    const panel=document.getElementById('audiencePanel'); if(!panel)return;
    const aud=document.getElementById('audience'); if(aud) aud.dataset.audienceMode=audienceModeV95;
    if(typeof DATA==='undefined'){panel.innerHTML='<div class="audience-card"><h3>يتم تحميل الأسئلة...</h3></div>';return;}
    const buttons=`<div class="audience-top-actions audience-top-actions-v9522"><button class="btn ${audienceModeV95==='stage3'?'success':'secondary'}" onclick="setAudienceModeV9522('stage3')">المرحلة الثالثة</button><button class="btn ${audienceModeV95==='stage4'?'success':'secondary'}" onclick="setAudienceModeV9522('stage4')">المرحلة الرابعة</button></div>`;
    let body='';
    if(audienceModeV95==='stage3') body=renderAudienceStage3V95();
    else if(audienceModeV95==='stage4') body=renderAudienceStage4V95();
    else body='<div class="audience-card audience-home-v9522"><h2>اختر مرحلة للعرض</h2></div>';
    panel.innerHTML=buttons+body;
  };
  window.setAudienceModeV9522=function(mode){
    audienceModeV95=mode;
    const aud=document.getElementById('audience'); if(aud)aud.dataset.audienceMode=mode;
    renderAudiencePanelV95(false);
    setTimeout(()=>{const el=document.getElementById('audience'); if(el&&!document.fullscreenElement){try{el.requestFullscreen?.().catch(()=>{});}catch(e){}}},80);
  };
  window.setAudienceModeV95=window.setAudienceModeV9522;
})();


/* ===== V9.5.23 final minor polish: general results buttons, readable transfer select, audience spacing ===== */
(function(){
  const oldRenderGeneral = window.renderGeneralResultsV9520;
  window.renderGeneralResultsV9520 = function(){
    if (oldRenderGeneral) oldRenderGeneral();
    const box=document.getElementById('generalList');
    if(box && !box.dataset.visible){ box.dataset.visible='1'; }
  };

  const oldShowAdmin = window.showAdmin;
  window.showAdmin = function(id, btn){
    if(oldShowAdmin) oldShowAdmin(id, btn);
    if(id==='general'){
      const tools=document.querySelector('#general .general-tools-v9520, #general .general-tools-v9523');
      if(tools){
        tools.className='general-tools-v9523';
        tools.innerHTML='<button class="btn secondary" onclick="renderGeneralResultsV9520()">إظهار النتائج</button><button class="btn" onclick="showGeneralResultsRevealV9520()">إظهار النتائج بحماس</button>';
      }
    }
    if(id==='audience'){
      setTimeout(()=>{
        const panel=document.getElementById('audiencePanel');
        const top=panel?.querySelector('.audience-top-actions, .audience-top-actions-v9520, .audience-top-actions-v9521');
        if(top){
          top.className='audience-top-actions-v9523';
          top.innerHTML='<button class="btn '+(audienceModeV95==='stage3'?'success':'secondary')+'" onclick="setAudienceModeV9521(\'stage3\')">المرحلة الثالثة</button><button class="btn '+(audienceModeV95==='stage4'?'success':'secondary')+'" onclick="setAudienceModeV9521(\'stage4\')">المرحلة الرابعة</button>';
        }
      },40);
    }
  };

  const oldRenderAudience = window.renderAudiencePanelV95;
  window.renderAudiencePanelV95 = function(resetAnim=true){
    if(oldRenderAudience) oldRenderAudience(resetAnim);
    const panel=document.getElementById('audiencePanel'); if(!panel)return;
    const top=panel.querySelector('.audience-top-actions, .audience-top-actions-v9520, .audience-top-actions-v9521');
    if(top){
      top.className='audience-top-actions-v9523';
      top.innerHTML='<button class="btn '+(audienceModeV95==='stage3'?'success':'secondary')+'" onclick="setAudienceModeV9521(\'stage3\')">المرحلة الثالثة</button><button class="btn '+(audienceModeV95==='stage4'?'success':'secondary')+'" onclick="setAudienceModeV9521(\'stage4\')">المرحلة الرابعة</button>';
    }
  };

  const oldRenderControl = window.renderControl;
  window.renderControl = function(){
    if(oldRenderControl) oldRenderControl();
    const sel=document.getElementById('moveStageUnifiedV9522') || document.getElementById('restartStageUnified') || document.getElementById('moveStageUnifiedV9520');
    if(sel){
      sel.classList.add('clear-stage-select-v9523');
      sel.setAttribute('title','اختر المرحلة أو شرح المرحلة للترحيل');
    }
    const row=sel?.closest('.transfer-row-v9522, .transfer-row-v9521, .control-row-v9520');
    if(row) row.classList.add('transfer-row-aligned-v9523');
  };
})();

/* ===== V9.5.24 Focused small polish ===== */
(function(){
  window.showGeneralResultsStaticV9524 = function(){
    try{ renderGeneralResultsV9520(); }
    catch(e){ console.error(e); alert('تعذر عرض النتائج العامة.'); }
  };
  window.prepareGeneralTabV9524 = function(){
    const tools=document.querySelector('#general .general-tools-v9520, #general .general-tools-v9523, #general .general-tools-v9524');
    const box=document.getElementById('generalList');
    if(tools){
      tools.className='general-tools-v9524';
      tools.innerHTML='<button class="btn secondary" onclick="showGeneralResultsStaticV9524()">إظهار النتائج</button><button class="btn" onclick="showGeneralResultsRevealV9520()">إظهار النتائج بحماس</button>';
    }
    if(box){
      box.innerHTML='<div class="general-empty-v9524"><h3>النتائج العامة جاهزة</h3><p>اختر طريقة العرض: عادي أو بحماس.</p></div>';
    }
  };
  const oldShowAdminV9524 = window.showAdmin;
  window.showAdmin = function(id, btn){
    if(oldShowAdminV9524) oldShowAdminV9524(id, btn);
    if(id==='general') setTimeout(()=>prepareGeneralTabV9524(), 30);
    if(id==='audience') setTimeout(()=>{
      const panel=document.getElementById('audiencePanel');
      const top=panel?.querySelector('.audience-top-actions, .audience-top-actions-v9520, .audience-top-actions-v9521, .audience-top-actions-v9522, .audience-top-actions-v9523');
      if(top){
        top.className='audience-top-actions-v9524';
        top.innerHTML='<button class="btn '+(audienceModeV95==='stage3'?'success':'secondary')+'" onclick="setAudienceModeV95(\'stage3\')">المرحلة الثالثة</button><button class="btn '+(audienceModeV95==='stage4'?'success':'secondary')+'" onclick="setAudienceModeV95(\'stage4\')">المرحلة الرابعة</button>';
      }
    },50);
  };
})();

/* ===== V9.5.26 JS overrides: stage turn order + compact reveal ===== */
function orderedStage3TeamsV9526(){
  return [...(teams||[])].filter(t=>!t.finished);
}

async function ensureStage3FirstTurnV958(batch=null){
  const list=orderedStage3TeamsV9526();
  if(!list.length)return null;
  const cur=audienceStage3TurnV95?.team;
  const found=list.find(t=>sameTeamAdminV95(t.id,cur));
  const t=found||list[0];
  const payload={team:t.id,teamName:t.name,index:list.findIndex(x=>sameTeamAdminV95(x.id,t.id)),turnStartedAtMs:Date.now(),turnDuration:gameFlowDurationV960('stage3Choice',15),updatedAt:FieldValue.serverTimestamp()};
  if(batch)batch.set(db.collection('meta').doc('stage3Turn'),payload,{merge:true});
  else await db.collection('meta').doc('stage3Turn').set(payload,{merge:true});
  return t;
}

async function advanceStage3TurnAdminV95(ownerId){
  const list=orderedStage3TeamsV9526();
  if(!list.length)return;
  let idx=list.findIndex(t=>sameTeamAdminV95(t.id,ownerId));
  if(idx<0)idx=0;
  const next=list[(idx+1)%list.length];
  await db.collection('meta').doc('stage3Turn').set({team:next.id,teamName:next.name,index:(idx+1)%list.length,turnStartedAtMs:Date.now(),turnDuration:gameFlowDurationV960('stage3Choice',15),updatedAt:FieldValue.serverTimestamp()},{merge:true});
}

/* refactor: removed obsolete earlier definition of showRevealPopupV95 from original line 1976; final definition is kept later. */

/* ===== V9.5.32 Question Bank Excel Import System ===== */
const QB_COLLECTION_V9532 = 'questionBanks';
const QB_DOC_V9532 = 'active';
let importedQuestionBankV9532 = null;
let questionBankPreviewV9532 = null;

function qbTrimV9532(v){ return String(v ?? '').trim(); }
function qbSplitV9532(v){ return qbTrimV9532(v).split(/[|،,؛;\n]+/).map(x=>x.trim()).filter(Boolean); }
function qbStageNameV9532(s){
  s = qbTrimV9532(s).toLowerCase();
  if(['1','stage1','المرحلة الأولى','المرحلة الاولى','اجمعوا الكنوز'].includes(s)) return 'stage1';
  if(['2','stage2','المرحلة الثانية','فتشوا الكتب'].includes(s)) return 'stage2';
  if(['3','stage3','المرحلة الثالثة','على المحك'].includes(s)) return 'stage3';
  if(['4','stage4','المرحلة الرابعة','اثبتوا بالحق'].includes(s)) return 'stage4';
  return s || '';
}
function qbTypeV9532(t, stage){
  const raw=qbTrimV9532(t).toLowerCase();
  const map={
    'choice':'choice','اختر من متعدد':'choice','اختيار':'choice','multiple':'choice',
    'missing':'missing','ماذا ينقص':'missing','ماذا ينقص؟':'missing',
    'arrange':'arrange','رتب':'arrange','رتّب':'arrange',
    'fill':'fill','فراغات':'fill','أكمل الفراغات':'fill','اكمل الفراغات':'fill',
    'matching':'matching','توصيل':'matching',
    'complete':'complete','أكمل':'complete','اكمل':'complete','أكمل الآيات':'complete','اكمل الآيات':'complete',
    'correct':'correct','صحح الخطأ':'correct',
    'truefalse':'truefalse','صح أو خطأ':'truefalse','صح او خطأ':'truefalse',
    'link':'link','الرابط العجيب':'link',
    'image':'image','صور':'image','صورة':'image',
    'whoami':'whoami','من أنا':'whoami','من انا':'whoami',
    'text':'text','كتابة':'text'
  };
  return map[raw] || raw || (stage==='stage1'?'choice':'text');
}
function qbStage1TypeLabelV9532(type){
  return ({choice:'اختر من متعدد',missing:'ماذا ينقص',arrange:'رتّب',fill:'فراغات'})[type] || 'اختر من متعدد';
}
function qbNormalizeHeaderV9532(h){
  h=qbTrimV9532(h).replace(/\s+/g,'').toLowerCase();
  const m={
    'رقمالسؤال':'id','id':'id','questionid':'id',
    'stage':'stage','المرحلة':'stage',
    'type':'type','نوعالسؤال':'type','النوع':'type',
    'category':'category','المجال':'category','التصنيف':'category',
    'level':'level','المستوى':'level','الصعوبة':'level',
    'question':'question','السؤال':'question','نصالسؤال':'question',
    'data':'data','المعطيات':'data',
    'option1':'option1','الخيار1':'option1','اختيار1':'option1',
    'option2':'option2','الخيار2':'option2','اختيار2':'option2',
    'option3':'option3','الخيار3':'option3','اختيار3':'option3',
    'option4':'option4','الخيار4':'option4','اختيار4':'option4',
    'correct':'correct','الإجابةالصحيحة':'correct','الاجابةالصحيحة':'correct','answer':'correct',
    'acceptedanswers':'acceptedAnswers','الإجاباتالمقبولة':'acceptedAnswers','الاجاباتالمقبولة':'acceptedAnswers',
    'points':'points','العلامة':'points','النقاط':'points',
    'imageurl':'imageUrl','رابطالصورة':'imageUrl','الصورة':'imageUrl',
    'videourl':'videoUrl','رابطالفيديو':'videoUrl',
    'targetpart':'targetPart','الجزءالمطلوبتصحيحه':'targetPart','الجزءالخاطئ':'targetPart',
    'notes':'notes','ملاحظات':'notes'
  };
  return m[h] || h;
}
function qbReadSheetRowsV9532(sheet){
  const raw = XLSX.utils.sheet_to_json(sheet,{header:1,defval:''});
  if(!raw.length) return [];
  const headers = raw[0].map(qbNormalizeHeaderV9532);
  return raw.slice(1).map(arr=>{
    const obj={}; headers.forEach((h,i)=>{ if(h) obj[h]=arr[i]; }); return obj;
  }).filter(r=>qbTrimV9532(r.question)||qbTrimV9532(r.correct)||qbTrimV9532(r.stage));
}
function qbDriveDirectUrlV9532(url){
  url=qbTrimV9532(url); if(!url) return '';
  const m=url.match(/\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/);
  return m ? `https://drive.google.com/uc?export=view&id=${m[1]}` : url;
}
function qbConvertRowsToDataV9532(rows){
  const result={stage1:[], stage2:{passage: DATA.stage2?.passage||'', groups:[]}, stage3:[], stage4:[]};
  const stage2Groups={
    matching:{type:'matching',title:'توصيل',points:15,questions:[]},
    complete:{type:'complete',title:'أكمل الآيات',points:15,questions:[]},
    correct:{type:'correct',title:'صحح الخطأ',points:15,questions:[]},
    truefalse:{type:'truefalse',title:'صح أو خطأ',points:15,questions:[]}
  };
  const stage3Map=new Map();
  for(const r of rows){
    const stage=qbStageNameV9532(r.stage); if(!stage) continue;
    const type=qbTypeV9532(r.type,stage);
    const q=qbTrimV9532(r.question); const correct=qbTrimV9532(r.correct);
    const options=[r.option1,r.option2,r.option3,r.option4].map(qbTrimV9532).filter(Boolean);
    const accepted=qbSplitV9532(r.acceptedAnswers);
    const base={id:qbTrimV9532(r.id), q, answer:correct, correct, acceptedAnswers:accepted, points:Number(r.points||0)||undefined, imageUrl:qbDriveDirectUrlV9532(r.imageUrl), videoUrl:qbTrimV9532(r.videoUrl), notes:qbTrimV9532(r.notes)};
    if(!q || !correct) continue;
    if(stage==='stage1'){
      const opts=options.length?options:[correct];
      result.stage1.push(Object.assign(base,{type:qbStage1TypeLabelV9532(type), data:qbTrimV9532(r.data), options:opts.includes(correct)?opts:[correct,...opts].slice(0,4)}));
    }else if(stage==='stage2'){
      const g=stage2Groups[type] || stage2Groups.complete;
      const item=Object.assign(base,{targetPart:qbTrimV9532(r.targetPart)});
      if(type==='truefalse') Object.assign(item,{type:'choice',options:options.length?options:['صح','خطأ']});
      else if(type==='matching') Object.assign(item,{options:options.length?options:[correct]});
      else Object.assign(item,{type:'input'});
      if(r.points) g.points=Number(r.points)||g.points;
      g.questions.push(item);
    }else if(stage==='stage3'){
      const cat=qbTrimV9532(r.category)||'عام'; const level=qbTrimV9532(r.level)||'سهل';
      if(!stage3Map.has(cat)) stage3Map.set(cat,[]);
      const arr=[level,q,correct]; arr.options=options; arr.acceptedAnswers=accepted; arr.imageUrl=qbDriveDirectUrlV9532(r.imageUrl);
      stage3Map.get(cat).push(arr);
    }else if(stage==='stage4'){
      result.stage4.push(Object.assign(base,{type,category:qbTrimV9532(r.category),options}));
    }
  }
  result.stage2.groups=Object.values(stage2Groups).filter(g=>g.questions.length);
  result.stage3=[...stage3Map.entries()].map(([cat,qs])=>({cat,qs}));
  if(!result.stage1.length) result.stage1=DATA.stage1;
  if(!result.stage2.groups.length) result.stage2=DATA.stage2;
  if(!result.stage3.length) result.stage3=DATA.stage3;
  if(!result.stage4.length) result.stage4=DATA.stage4;
  return result;
}
function applyQuestionBankDataV9532(data){
  if(!data) return;
  if(data.stage1) DATA.stage1=data.stage1;
  if(data.stage2) DATA.stage2=data.stage2;
  if(data.stage3) DATA.stage3=data.stage3;
  if(data.stage4) DATA.stage4=data.stage4;
}
function renderQuestionBankPanelV9532(){
  const box=document.getElementById('questionBankPanel'); if(!box) return;
  const active=importedQuestionBankV9532;
  const counts=active?.counts || {stage1:(DATA.stage1||[]).length,stage2:(DATA.stage2?.groups||[]).reduce((a,g)=>a+(g.questions?.length||0),0),stage3:(DATA.stage3||[]).reduce((a,c)=>a+(c.qs?.length||0),0),stage4:(DATA.stage4||[]).length};
  box.innerHTML=`
    <div class="question-import-card">
      <div class="question-import-head"><h3>استيراد ملف Excel للأسئلة</h3><a class="btn secondary" href="questions-template.xlsx" download>تحميل قالب Excel</a></div>
      <p class="muted">ارفع ملف Excel بنفس الأعمدة المتفق عليها. سيتم فحص الملف أولًا، ثم تضغط تطبيق الأسئلة ليتم حفظها في Firestore وتظهر لكل المتسابقين.</p>
      <input type="file" id="questionExcelInput" accept=".xlsx,.xls" />
      <div class="question-import-actions">
        <button class="btn" onclick="previewQuestionExcelV9532()">فحص الملف ومعاينة</button>
        <button class="btn success" id="applyQuestionBankBtn" onclick="applyQuestionBankPreviewV9532()" disabled>تطبيق الأسئلة على الموقع</button>
        <button class="btn danger" onclick="restoreStaticQuestionsV9532()">استعادة أسئلة النسخة الحالية</button>
      </div>
    </div>
    <div class="question-bank-status mini-card">
      <h3>الأسئلة المفعلة الآن</h3>
      <div class="question-count-grid">
        <span>المرحلة الأولى: <b>${counts.stage1||0}</b></span>
        <span>المرحلة الثانية: <b>${counts.stage2||0}</b></span>
        <span>المرحلة الثالثة: <b>${counts.stage3||0}</b></span>
        <span>المرحلة الرابعة: <b>${counts.stage4||0}</b></span>
      </div>
      <p class="muted">آخر تحديث: ${active?.updatedAtText || 'أسئلة النسخة الحالية'}</p>
    </div>
    <div id="questionImportPreview" class="question-preview-box"></div>`;
}
async function previewQuestionExcelV9532(){
  const input=document.getElementById('questionExcelInput'); const file=input?.files?.[0];
  if(!file) return alert('اختر ملف Excel أولًا');
  if(typeof XLSX==='undefined') return alert('مكتبة Excel لم تُحمّل. تأكد من اتصال الإنترنت ثم أعد المحاولة.');
  const buf=await file.arrayBuffer(); const wb=XLSX.read(buf,{type:'array'});
  let rows=[];
  const names=wb.SheetNames.filter(n=>!['README','Lists','القوائم','شرح'].includes(n));
  for(const name of names){
    const sheetRows=qbReadSheetRowsV9532(wb.Sheets[name]);
    rows.push(...sheetRows.map(r=>Object.assign({sheet:name},r)));
  }
  const data=qbConvertRowsToDataV9532(rows);
  const counts={stage1:data.stage1.length,stage2:data.stage2.groups.reduce((a,g)=>a+g.questions.length,0),stage3:data.stage3.reduce((a,c)=>a+c.qs.length,0),stage4:data.stage4.length};
  questionBankPreviewV9532={data,counts,sourceFile:file.name,rows:rows.length};
  const box=document.getElementById('questionImportPreview');
  box.innerHTML=`<div class="mini-card"><h3>معاينة الملف</h3><p>الملف: <b>${esc(file.name)}</b> | الصفوف المقروءة: <b>${rows.length}</b></p><div class="question-count-grid"><span>المرحلة الأولى: <b>${counts.stage1}</b></span><span>المرحلة الثانية: <b>${counts.stage2}</b></span><span>المرحلة الثالثة: <b>${counts.stage3}</b></span><span>المرحلة الرابعة: <b>${counts.stage4}</b></span></div><p class="muted">إذا الأعداد صحيحة اضغط تطبيق الأسئلة.</p></div>`;
  document.getElementById('applyQuestionBankBtn').disabled=false;
}
async function applyQuestionBankPreviewV9532(){
  if(!questionBankPreviewV9532) return alert('افحص ملف Excel أولًا');
  if(!confirm('تطبيق هذا الملف على الموقع كاملًا؟ ستظهر الأسئلة الجديدة لكل الأجهزة.')) return;
  const payload={...questionBankPreviewV9532, updatedAtText:new Date().toLocaleString('ar'), updatedAt:FieldValue.serverTimestamp(), version:'V9.5.32'};
  await db.collection(QB_COLLECTION_V9532).doc(QB_DOC_V9532).set(payload,{merge:false});
  await db.collection(QB_COLLECTION_V9532+'_backups').add(payload);
  applyQuestionBankDataV9532(payload.data);
  importedQuestionBankV9532=payload;
  questionBankPreviewV9532=null;
  renderQuestionBankPanelV9532();
  renderAll();
  alert('تم تطبيق الأسئلة بنجاح. افتح صفحات المتسابقين أو حدّثها للتأكد.');
}
async function restoreStaticQuestionsV9532(){
  if(!confirm('استعادة أسئلة النسخة الحالية وإلغاء بنك الأسئلة المستورد؟')) return;
  await db.collection(QB_COLLECTION_V9532).doc(QB_DOC_V9532).delete();
  location.reload();
}
function listenQuestionBankV9532(){
  db.collection(QB_COLLECTION_V9532).doc(QB_DOC_V9532).onSnapshot(doc=>{
    if(doc.exists){
      const d=doc.data()||{}; importedQuestionBankV9532=d; applyQuestionBankDataV9532(d.data); renderQuestionBankPanelV9532(); renderAll();
    }else{ importedQuestionBankV9532=null; renderQuestionBankPanelV9532(); }
  },console.error);
}

(function(){
  const oldShowAdmin=window.showAdmin;
  window.showAdmin=function(id,btn){
    if(oldShowAdmin) oldShowAdmin(id,btn);
    if(id==='questions') setTimeout(renderQuestionBankPanelV9532,20);
  };
  document.addEventListener('DOMContentLoaded',()=>{ setTimeout(()=>{renderQuestionBankPanelV9532(); listenQuestionBankV9532();},500); });
})();

/* ===== V9.5.34 Hard fix: robust Excel header detection + stage1 choice normalization ===== */
(function(){
  function qbTrim534(v){ return String(v ?? '').trim(); }
  function normalizeHeader534(h){
    if(typeof qbNormalizeHeaderV9532==='function') return qbNormalizeHeaderV9532(h);
    return qbTrim534(h).replace(/\s+/g,'').toLowerCase();
  }
  window.qbReadSheetRowsV9532 = qbReadSheetRowsV9532 = function(sheet){
    const raw=XLSX.utils.sheet_to_json(sheet,{header:1,defval:''});
    if(!raw.length) return [];
    let headerIndex=raw.findIndex(row=>{
      const hs=row.map(normalizeHeader534);
      return hs.includes('id') && hs.includes('stage') && hs.includes('type') && hs.includes('question');
    });
    if(headerIndex<0){
      headerIndex=raw.findIndex(row=>{
        const joined=row.map(x=>qbTrim534(x)).join('|');
        return /السؤال/.test(joined) && /المرحلة/.test(joined) && /نوع/.test(joined);
      });
    }
    if(headerIndex<0) headerIndex=0;
    const headers=raw[headerIndex].map(normalizeHeader534);
    return raw.slice(headerIndex+1).map(arr=>{
      const obj={}; headers.forEach((h,i)=>{ if(h) obj[h]=arr[i]; }); return obj;
    }).filter(r=>qbTrim534(r.question)||qbTrim534(r.correct)||qbTrim534(r.stage));
  };
  function normStage1Type534(t){
    const raw=qbTrim534(t).toLowerCase(); const compact=raw.replace(/[\sـ]+/g,'');
    if(['choice','multiple','mcq','اختيار','اختر من متعدد'].includes(raw) || compact==='اخترمنمتعدد' || compact==='اخترمنمتعدّد') return 'اختر من متعدد';
    if(['missing','ماذا ينقص','ماذا ينقص؟'].includes(raw) || compact==='ماذاينقص') return 'ماذا ينقص';
    if(['arrange','رتب','رتّب'].includes(raw) || compact==='رتب' || compact==='رتّب') return 'رتّب';
    if(['fill','blank','فراغات','أكمل الفراغات','اكمل الفراغات'].includes(raw) || compact==='أكملالفراغات' || compact==='اكملالفراغات') return 'فراغات';
    return t || 'اختر من متعدد';
  }
  const oldConvert=typeof qbConvertRowsToDataV9532==='function' ? qbConvertRowsToDataV9532 : null;
  window.qbConvertRowsToDataV9532 = qbConvertRowsToDataV9532 = function(rows){
    const data=oldConvert ? oldConvert(rows) : {stage1:[],stage2:{groups:[]},stage3:[],stage4:[]};
    if(Array.isArray(data.stage1)){
      data.stage1=data.stage1.map(q=>{
        q=Object.assign({},q);
        q.type=normStage1Type534(q.type || q.typeName);
        q.q=q.q || q.question || '';
        q.answer=q.answer || q.correct || '';
        if(!Array.isArray(q.options)) q.options=[q.option1,q.option2,q.option3,q.option4].filter(Boolean);
        if(q.type==='اختر من متعدد' && q.answer && !q.options.includes(q.answer)) q.options=[q.answer,...q.options].filter(Boolean).slice(0,4);
        return q;
      });
    }
    return data;
  };
  window.previewQuestionExcelV9532 = previewQuestionExcelV9532 = async function(){
    const input=document.getElementById('questionExcelInput'); const file=input?.files?.[0];
    if(!file) return alert('اختر ملف Excel أولًا');
    if(typeof XLSX==='undefined') return alert('مكتبة Excel لم تُحمّل. تأكد من اتصال الإنترنت ثم أعد المحاولة.');
    const buf=await file.arrayBuffer(); const wb=XLSX.read(buf,{type:'array'});
    let rows=[];
    const master=wb.SheetNames.find(n=>['all_questions','all questions','all_questions','كل_الأسئلة','كل الأسئلة','all_questions'].includes(String(n).toLowerCase()) || /all/i.test(n));
    const names=master ? [master] : wb.SheetNames.filter(n=>!['README','Lists','القوائم','شرح'].includes(n));
    for(const name of names){
      const sheetRows=qbReadSheetRowsV9532(wb.Sheets[name]);
      rows.push(...sheetRows.map(r=>Object.assign({sheet:name},r)));
    }
    const data=qbConvertRowsToDataV9532(rows);
    const counts={stage1:data.stage1.length,stage2:data.stage2.groups.reduce((a,g)=>a+g.questions.length,0),stage3:data.stage3.reduce((a,c)=>a+(c.qs?.length||0),0),stage4:data.stage4.length};
    questionBankPreviewV9532={data,counts,sourceFile:file.name,rows:rows.length};
    const box=document.getElementById('questionImportPreview');
    if(box) box.innerHTML=`<div class="mini-card"><h3>معاينة الملف</h3><p>الملف: <b>${esc(file.name)}</b> | الصفوف المقروءة: <b>${rows.length}</b></p><div class="question-count-grid"><span>المرحلة الأولى: <b>${counts.stage1}</b></span><span>المرحلة الثانية: <b>${counts.stage2}</b></span><span>المرحلة الثالثة: <b>${counts.stage3}</b></span><span>المرحلة الرابعة: <b>${counts.stage4}</b></span></div><p class="muted">إذا الأعداد صحيحة اضغط تطبيق الأسئلة.</p></div>`;
    const btn=document.getElementById('applyQuestionBankBtn'); if(btn) btn.disabled=false;
  };
})();

/* ===== V9.5.37 Real Excel Apply Sync Fix =====
   Save question bank to multiple Firestore locations and force all clients to reload the active bank. */
(function(){
  const QB_PRIMARY='questionBanks';
  const QB_DOC='active';
  const QB_META='questionBank';
  const QB_CONFIG='questionBankActive';

  function bankCountsV9537(data){
    return {
      stage1:Array.isArray(data?.stage1)?data.stage1.length:0,
      stage2:(data?.stage2?.groups||[]).reduce((a,g)=>a+(g.questions?.length||0),0),
      stage3:(data?.stage3||[]).reduce((a,c)=>a+(c.qs?.length||0),0),
      stage4:Array.isArray(data?.stage4)?data.stage4.length:0
    };
  }

  function normalizeApplyDataV9537(data){
    if(!data) return data;
    const copy=JSON.parse(JSON.stringify(data));
    if(Array.isArray(copy.stage1)){
      copy.stage1=copy.stage1.map(q=>{
        q=q||{};
        const raw=String(q.type||q.typeName||'').trim().toLowerCase();
        const compact=raw.replace(/[\sـ]+/g,'');
        if(['choice','multiple','mcq','select'].includes(raw)||compact==='اخترمنمتعدد'||compact==='اخترمنمتعدّد'||raw==='اختر من متعدد') q.type='اختر من متعدد';
        else if(['missing'].includes(raw)||compact==='ماذاينقص'||raw==='ماذا ينقص'||raw==='ماذا ينقص؟') q.type='ماذا ينقص';
        else if(['arrange'].includes(raw)||compact==='رتب'||compact==='رتّب') q.type='رتّب';
        else if(['fill','blank'].includes(raw)||compact==='فراغات'||compact==='أكملالفراغات'||compact==='اكملالفراغات') q.type='فراغات';
        else q.type=q.type||'اختر من متعدد';
        q.q=q.q||q.question||q.text||'';
        q.answer=q.answer||q.correct||q.correctAnswer||'';
        if(!Array.isArray(q.options)) q.options=[q.option1,q.option2,q.option3,q.option4,q.A,q.B,q.C,q.D].filter(Boolean);
        q.options=q.options.map(x=>String(x||'').trim()).filter(Boolean);
        if(q.type==='اختر من متعدد' && q.answer && !q.options.some(o=>String(o).trim()===String(q.answer).trim())) q.options.unshift(q.answer);
        q.options=q.options.slice(0,4);
        return q;
      });
    }
    return copy;
  }

  const oldApplyQuestionBankPreviewV9537 = window.applyQuestionBankPreviewV9532 || applyQuestionBankPreviewV9532;
  window.applyQuestionBankPreviewV9532 = applyQuestionBankPreviewV9532 = async function(){
    if(!questionBankPreviewV9532) return alert('افحص ملف Excel أولًا');
    if(!confirm('تطبيق هذا الملف على الموقع كاملًا؟ ستظهر الأسئلة الجديدة لكل الأجهزة.')) return;
    const data=normalizeApplyDataV9537(questionBankPreviewV9532.data);
    const counts=bankCountsV9537(data);
    const stamp=Date.now();
    const payload={
      data,
      counts,
      rows:questionBankPreviewV9532.rows||0,
      sourceFile:questionBankPreviewV9532.sourceFile||'',
      updatedAtText:new Date().toLocaleString('ar'),
      updatedAt:FieldValue.serverTimestamp(),
      updatedAtMs:stamp,
      version:'V9.5.37',
      status:'active'
    };
    try{
      await db.collection(QB_PRIMARY).doc(QB_DOC).set(payload,{merge:false});
      await db.collection('meta').doc(QB_META).set(payload,{merge:false});
      await db.collection('config').doc(QB_CONFIG).set(payload,{merge:false});
      await db.collection(QB_PRIMARY+'_backups').add(payload);
      await db.collection('meta').doc('control').set({questionBankUpdatedAt:stamp},{merge:true});
      applyQuestionBankDataV9532(payload.data);
      importedQuestionBankV9532=payload;
      questionBankPreviewV9532=null;
      renderQuestionBankPanelV9532();
      renderAll();
      alert('تم تطبيق الأسئلة فعليًا. حدّث صفحة المتسابق أو ابدأ مرحلة جديدة لترى الأسئلة الجديدة.');
    }catch(e){
      console.error('Question bank apply failed',e);
      alert('فشل تطبيق الأسئلة في Firestore: '+(e.message||e));
    }
  };

  // Prefer meta/questionBank because all contestant pages already read meta reliably.
  window.listenQuestionBankV9532 = listenQuestionBankV9532 = function(){
    const applyDoc=(doc)=>{
      if(doc && doc.exists){
        const d=doc.data()||{};
        importedQuestionBankV9532=d;
        applyQuestionBankDataV9532(d.data);
        renderQuestionBankPanelV9532();
        renderAll();
      }else{
        renderQuestionBankPanelV9532();
      }
    };
    db.collection('meta').doc(QB_META).onSnapshot(applyDoc,err=>console.error('meta/questionBank listener failed',err));
    db.collection(QB_PRIMARY).doc(QB_DOC).onSnapshot(doc=>{
      if(!importedQuestionBankV9532 && doc.exists) applyDoc(doc);
    },err=>console.error('questionBanks/active listener failed',err));
  };
})();


/* ===== V9.5.38 Firestore-safe question bank payload fix =====
   Firestore rejects nested arrays. Store the imported bank as JSON text,
   while keeping lightweight counts/metadata in Firestore fields. */
(function(){
  const QB_PRIMARY_SAFE='questionBanks';
  const QB_DOC_SAFE='active';
  const QB_META_SAFE='questionBank';
  const QB_CONFIG_SAFE='questionBankActive';

  function parseBankPayloadV9538(docData){
    if(!docData) return null;
    if(docData.dataJson){
      try{return JSON.parse(docData.dataJson);}catch(e){console.error('Failed to parse question bank JSON',e);}
    }
    return docData.data || null;
  }
  window.parseQuestionBankPayloadV9538 = parseBankPayloadV9538;

  function countsV9538(data){
    return {
      stage1:Array.isArray(data?.stage1)?data.stage1.length:0,
      stage2:(data?.stage2?.groups||[]).reduce((a,g)=>a+(g.questions?.length||0),0),
      stage3:(data?.stage3||[]).reduce((a,c)=>a+(c.qs?.length||0),0),
      stage4:Array.isArray(data?.stage4)?data.stage4.length:0
    };
  }
  function normalizeApplyDataV9538(data){
    const copy=JSON.parse(JSON.stringify(data||{}));
    if(Array.isArray(copy.stage1)){
      copy.stage1=copy.stage1.map(q=>{
        q=q||{};
        const raw=String(q.type||q.typeName||'').trim().toLowerCase();
        const compact=raw.replace(/[\sـ]+/g,'');
        if(['choice','multiple','mcq','select'].includes(raw)||compact==='اخترمنمتعدد'||compact==='اخترمنمتعدّد'||raw==='اختر من متعدد') q.type='اختر من متعدد';
        else if(['missing'].includes(raw)||compact==='ماذاينقص'||raw==='ماذا ينقص'||raw==='ماذا ينقص؟') q.type='ماذا ينقص';
        else if(['arrange'].includes(raw)||compact==='رتب'||compact==='رتّب') q.type='رتّب';
        else if(['fill','blank'].includes(raw)||compact==='فراغات'||compact==='أكملالفراغات'||compact==='اكملالفراغات') q.type='فراغات';
        else q.type=q.type||'اختر من متعدد';
        q.q=q.q||q.question||q.text||'';
        q.answer=q.answer||q.correct||q.correctAnswer||'';
        if(!Array.isArray(q.options)) q.options=[q.option1,q.option2,q.option3,q.option4,q.A,q.B,q.C,q.D].filter(Boolean);
        q.options=(q.options||[]).map(x=>String(x||'').trim()).filter(Boolean);
        if(q.type==='اختر من متعدد' && q.answer && !q.options.some(o=>String(o).trim()===String(q.answer).trim())) q.options.unshift(q.answer);
        q.options=q.options.slice(0,4);
        return q;
      });
    }
    return copy;
  }

  window.applyQuestionBankPreviewV9532 = applyQuestionBankPreviewV9532 = async function(){
    if(!questionBankPreviewV9532) return alert('افحص ملف Excel أولًا');
    if(!confirm('تطبيق هذا الملف على الموقع كاملًا؟ ستظهر الأسئلة الجديدة لكل الأجهزة.')) return;
    const data=normalizeApplyDataV9538(questionBankPreviewV9532.data);
    const dataJson=JSON.stringify(data);
    const counts=countsV9538(data);
    const stamp=Date.now();
    const payload={
      dataJson,
      counts,
      rows:questionBankPreviewV9532.rows||0,
      sourceFile:questionBankPreviewV9532.sourceFile||'',
      updatedAtText:new Date().toLocaleString('ar'),
      updatedAt:FieldValue.serverTimestamp(),
      updatedAtMs:stamp,
      version:'V9.5.38',
      status:'active'
    };
    try{
      await db.collection(QB_PRIMARY_SAFE).doc(QB_DOC_SAFE).set(payload,{merge:false});
      await db.collection('meta').doc(QB_META_SAFE).set(payload,{merge:false});
      await db.collection('config').doc(QB_CONFIG_SAFE).set(payload,{merge:false});
      await db.collection(QB_PRIMARY_SAFE+'_backups').add(payload);
      await db.collection('meta').doc('control').set({questionBankUpdatedAt:stamp},{merge:true});
      applyQuestionBankDataV9532(data);
      importedQuestionBankV9532=Object.assign({},payload,{data});
      questionBankPreviewV9532=null;
      renderQuestionBankPanelV9532();
      renderAll();
      alert('تم تطبيق الأسئلة بنجاح. حدّث صفحة المتسابق أو ابدأ مرحلة جديدة لترى الأسئلة الجديدة.');
    }catch(e){
      console.error('Question bank apply failed',e);
      alert('فشل تطبيق الأسئلة في Firestore: '+(e.message||e));
    }
  };

  window.listenQuestionBankV9532 = listenQuestionBankV9532 = function(){
    const applyDoc=(doc)=>{
      if(doc && doc.exists){
        const raw=doc.data()||{};
        const data=parseBankPayloadV9538(raw);
        importedQuestionBankV9532=Object.assign({},raw,{data});
        if(data) applyQuestionBankDataV9532(data);
        renderQuestionBankPanelV9532();
        renderAll();
      }else{
        renderQuestionBankPanelV9532();
      }
    };
    db.collection('meta').doc(QB_META_SAFE).onSnapshot(applyDoc,err=>console.error('meta/questionBank listener failed',err));
    db.collection(QB_PRIMARY_SAFE).doc(QB_DOC_SAFE).onSnapshot(doc=>{ if(!importedQuestionBankV9532 && doc.exists) applyDoc(doc); },err=>console.error('questionBanks/active listener failed',err));
  };
})();

/* ===== V9.5.39 Final Tools: data-built PDF + audience display link ===== */
function pdfEscV9539(x){return String(x??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function pdfTableV9539(title,headers,rows){
  return `<div class="pdf-v9539" dir="rtl"><h1>${pdfEscV9539(title)}</h1><table><thead><tr>${headers.map(h=>`<th>${pdfEscV9539(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${pdfEscV9539(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function exportHtmlToPdfV9539(html,filename){
  const wrap=document.createElement('div');
  wrap.style.cssText='position:fixed;left:-99999px;top:0;width:1120px;background:#fff;color:#111;padding:18px;font-family:Tahoma,Arial,sans-serif;direction:rtl;';
  wrap.innerHTML=`<style>.pdf-v9539{background:white;color:#111}.pdf-v9539 h1{font-size:22px;text-align:center;color:#12324A;margin:0 0 14px}.pdf-v9539 table{width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed}.pdf-v9539 th{background:#EAF6FC;color:#12324A;font-weight:900}.pdf-v9539 th,.pdf-v9539 td{border:1px solid #BFD4E3;padding:7px 6px;text-align:right;vertical-align:top;word-break:break-word}.pdf-v9539 tr:nth-child(even) td{background:#F8FCFF}</style>${html}`;
  document.body.appendChild(wrap);
  const clean=()=>setTimeout(()=>wrap.remove(),500);
  if(window.html2pdf){
    html2pdf().set({margin:[8,8,8,8],filename,html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff'},jsPDF:{unit:'mm',format:'a4',orientation:'landscape'},pagebreak:{mode:['css','legacy']}}).from(wrap).save().then(clean).catch(e=>{clean();console.error(e);alert('تعذر إنشاء الصورة.');});
  }else{
    const w=window.open('','_blank');w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>${filename}</title></head><body>${wrap.innerHTML}</body></html>`);w.document.close();w.print();clean();
  }
}
/* refactor: removed obsolete earlier definition of downloadSelectedTeamAnswersPdfV9512 from original line 2505; final definition is kept later. */
function exportHistoryPdfV9512(id){
  const r=history.find(x=>x.id===id); if(!r)return;
  const list=r.teams||[];
  const rows=list.map((t,i)=>[i+1,t.name||'',(t.players||[]).map(p=>p.name||p).join('، '),t.stageScores?.stage1||0,t.stageScores?.stage2||0,t.stageScores?.stage3||0,t.stageScores?.stage4||0,t.score||0]);
  const html=pdfTableV9539(`تاريخ المسابقة - ${r.date||''}`,['الترتيب','الفريق','اللاعبون','المرحلة 1','المرحلة 2','المرحلة 3','المرحلة 4','المجموع'],rows);
  exportHtmlToPdfV9539(html,`history-${(r.date||'competition').replace(/[\\/:*?"<>|]/g,'-')}.pdf`);
}
(function addAudienceDisplayOnlyLinkV9539(){
  const oldRender=window.renderAudiencePanelV95;
  if(typeof oldRender==='function'){
    window.renderAudiencePanelV95=function(resetAnim=true){
      oldRender(resetAnim);
      const panel=document.getElementById('audiencePanel');
      if(panel && !document.getElementById('audienceDisplayOnlyLinkV9539')){
        panel.insertAdjacentHTML('afterbegin',`<div id="audienceDisplayOnlyLinkV9539" class="audience-display-link-v9539"><a class="btn" href="audience.html" target="_blank">فتح شاشة الجمهور المنفصلة</a><p class="muted">افتح هذا الرابط على الشاشة الكبيرة. التحكم يبقى من لوحة الميسر هنا.</p></div>`);
      }
    };
  }
})();

/* ===== V9.5.40 Requested: audience links + PNG exports instead of PDF ===== */
function escapeFileNameV9540(x){return String(x||'export').replace(/[\\/:*?"<>|]/g,'-').slice(0,120);}
function tableHtmlV9540(title,headers,rows){
  return `<div class="image-export-v9540" dir="rtl"><h1>${pdfEscV9539?pdfEscV9539(title):esc(title)}</h1><table><thead><tr>${headers.map(h=>`<th>${pdfEscV9539?pdfEscV9539(h):esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${pdfEscV9539?pdfEscV9539(c):esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function exportHtmlToImageV9540(html,filename){
  const wrap=document.createElement('div');
  wrap.style.cssText='position:fixed;left:-10000px;top:0;width:1400px;background:#fff;color:#111;padding:26px;font-family:Tahoma,Arial,sans-serif;direction:rtl;z-index:-1;';
  wrap.innerHTML=`<style>.image-export-v9540{background:white;color:#111}.image-export-v9540 h1{text-align:center;color:#12324A;margin:0 0 18px;font-size:30px}.image-export-v9540 table{width:100%;border-collapse:collapse;font-size:17px;table-layout:fixed}.image-export-v9540 th{background:#EAF6FC;color:#12324A;font-weight:900}.image-export-v9540 th,.image-export-v9540 td{border:1px solid #BFD4E3;padding:10px 8px;text-align:right;vertical-align:top;word-break:break-word}.image-export-v9540 tr:nth-child(even) td{background:#F8FCFF}</style>${html}`;
  document.body.appendChild(wrap);
  const finish=()=>setTimeout(()=>wrap.remove(),500);
  if(!window.html2canvas){finish();return alert('تعذر التصدير كصورة: مكتبة html2canvas غير محملة. تأكد من الاتصال بالإنترنت ثم جرّب مرة أخرى.');}
  html2canvas(wrap,{scale:2,backgroundColor:'#ffffff',useCORS:true,logging:false}).then(canvas=>{
    const a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download=filename.endsWith('.png')?filename:filename+'.png';a.click();finish();
  }).catch(e=>{console.error(e);finish();alert('تعذر إنشاء الصورة.');});
}
function downloadSelectedTeamAnswersImageV9540(){
  const t=selectedTeam(); if(!t)return alert('اختر فريقًا أولًا');
  const logs=t.answerLog||[];
  const rows=logs.length?logs.map((l,i)=>[i+1,l.playerName||'الفريق',l.stage||'',l.question||'',l.selected||'',l.correct||'-',l.selected==='تخطي'?'تخطي':(l.ok?'صحيح':'خطأ'),Number(l.points||0)>0?'+'+l.points:(l.points||0),l.time||'']):[[1,'الفريق','','لا توجد إجابات مسجلة','','','','','']];
  const title=`إجابات فريق ${typeof teamDisplayNameV9512==='function'?teamDisplayNameV9512(t):(t.name||t.id)}`;
  exportHtmlToImageV9540(tableHtmlV9540(title,['#','اللاعب/الفريق','المرحلة','السؤال','إجابة الفريق','الجواب الصحيح','النتيجة','النقاط','الوقت'],rows),`answers-${escapeFileNameV9540(t.name||t.id||'team')}.png`);
}
function exportHistoryImageV9540(id){
  const r=history.find(x=>x.id===id); if(!r)return;
  const rows=(r.teams||[]).map((t,i)=>[i+1,t.name||'',t.governorate||teamProvince?.(t)||'-',(t.players||[]).map(p=>p.name||p).join('، '),t.stageScores?.stage1||0,t.stageScores?.stage2||0,t.stageScores?.stage3||0,t.stageScores?.stage4||0,t.score||0]);
  exportHtmlToImageV9540(tableHtmlV9540(`تاريخ المسابقة - ${r.title||r.date||''}`,['الترتيب','الفريق','المحافظة','اللاعبون','المرحلة 1','المرحلة 2','المرحلة 3','المرحلة 4','المجموع'],rows),`history-${escapeFileNameV9540(r.title||r.date||'competition')}.png`);
}
// Keep old function names working but export images, not PDF.
/* refactor: removed obsolete earlier definition of downloadSelectedTeamAnswersPdfV9512 from original line 2561; final definition is kept later. */
/* refactor: removed obsolete earlier definition of exportHistoryPdfV9512 from original line 2562; final definition is kept later. */
function audienceLinkBoxV9540(mode,label){
  return `<div class="audience-display-link-v9539 audience-result-link-v9540"><a class="btn" href="audience.html?mode=${encodeURIComponent(mode)}" target="_blank">${label}</a><p class="muted">افتح هذا الرابط على الشاشة الكبيرة. التحكم يبقى من لوحة الميسر هنا.</p></div>`;
}
(function wireAudienceResultLinksV9540(){
  const oldLive=window.renderLive;
  if(typeof oldLive==='function') window.renderLive=function(){oldLive();const live=document.getElementById('live'); if(live&&!document.getElementById('liveAudienceLinkV9540')){const h=live.querySelector('h2')||live.firstChild; const div=document.createElement('div'); div.id='liveAudienceLinkV9540'; div.innerHTML=audienceLinkBoxV9540('live','فتح شاشة الجمهور المنفصلة'); h?.insertAdjacentElement?h.insertAdjacentElement('afterend',div):live.prepend(div);}};
  const oldGeneral=window.renderGeneralResultsV9520;
  if(typeof oldGeneral==='function') window.renderGeneralResultsV9520=function(){oldGeneral();const tools=document.querySelector('.general-tools-v9523'); if(tools){tools.innerHTML=`<button class="btn secondary" onclick="renderGeneralResultsV9520()">إظهار النتائج</button><a class="btn" href="audience.html?mode=general" target="_blank">إظهار النتائج بحماس</a>`;} const general=document.getElementById('general'); if(general&&!document.getElementById('generalAudienceLinkV9540')){const p=general.querySelector('.muted')||general.querySelector('h2'); const div=document.createElement('div'); div.id='generalAudienceLinkV9540'; div.innerHTML=audienceLinkBoxV9540('general','فتح شاشة الجمهور المنفصلة'); p?.insertAdjacentElement?p.insertAdjacentElement('afterend',div):general.prepend(div);}};
  const oldHistory=window.renderHistory;
  if(typeof oldHistory==='function') window.renderHistory=function(){oldHistory();document.querySelectorAll('button[onclick^="exportHistoryPdfV9512"]').forEach(b=>{b.textContent='تصدير صورة';});};
  const oldAnswer=window.renderAnswerLog;
  if(typeof oldAnswer==='function') window.renderAnswerLog=function(){oldAnswer();document.querySelectorAll('button[onclick="downloadSelectedTeamAnswersPdfV9512()"],button[onclick="downloadSelectedTeamAnswersImageV9540() "]').forEach(b=>{b.textContent='تحميل إجابات الفريق كصورة';});};
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{try{renderLive();renderGeneralResultsV9520();renderAnswerLog();renderHistory();}catch(e){}},700);});
})();


/* ===== V9.5.41 Professional Final Fixes: current teams clear, PNG-only export, ordered displays, stage4 reveal ===== */
function escV9541(x){return String(x??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));}
function scoreTotalV9541(t){return Number(t?.score ?? ((Number(t?.stageScores?.stage1||0)+Number(t?.stageScores?.stage2||0)+Number(t?.stageScores?.stage3||0)+Number(t?.stageScores?.stage4||0))));}
function stageFromCurrentV9541(t){const c=String(t?.current||''); if(c.includes('4'))return 'stage4'; if(c.includes('3'))return 'stage3'; if(c.includes('2'))return 'stage2'; return 'stage1';}
function liveScoreV9541(t){return Number((t?.stageScores||{})[stageFromCurrentV9541(t)]||0);}
function nameV9541(t){return (typeof teamDisplayNameV9512==='function'?teamDisplayNameV9512(t):(t?.name||t?.id||'فريق')).trim();}
function provinceV9541(t){try{return (typeof teamProvince==='function'?teamProvince(t):(t?.governorate||t?.province||''))||'';}catch(e){return t?.governorate||'';}}

async function clearCurrentTeamsOnlyV9541(){
  if(!confirm('سيتم حذف أسماء الفرق الحالية ونقاطها وتقدمها فقط. لن يتم حذف الأسئلة أو تاريخ المسابقة. هل أنت متأكد؟'))return;
  const batch=db.batch();
  const teamDocs=await db.collection('teams').get();
  teamDocs.forEach(d=>batch.delete(d.ref));
  const lockDocs=await db.collection('stage3Locks').get();
  lockDocs.forEach(d=>batch.delete(d.ref));
  batch.set(db.collection('meta').doc('activeStage3'),{id:null,team:null,teamName:null,status:'waiting',startedAtMs:null,revealDone:false},{merge:true});
  batch.set(db.collection('meta').doc('stage3Turn'),{team:null,teamName:null,index:0,turnStartedAtMs:null,turnDuration:gameFlowDurationV960('stage3Choice',15),updatedAt:Date.now()},{merge:true});
  batch.set(db.collection('meta').doc('stage4Live'),{status:'waiting',index:0,duration:gameFlowDurationV960('stageQuestion',15),startedAtMs:null,revealDone:false},{merge:true});
  batch.set(db.collection('meta').doc('stage4Reveal'),{active:false,rows:[],index:0,updatedAt:Date.now()},{merge:true});
  batch.set(db.collection('meta').doc('control'),{currentTeamsClearedAt:String(Date.now())},{merge:true});
  await batch.commit();
  alert('تم حذف بيانات الفرق الحالية فقط. الأسئلة وتاريخ المسابقة لم يتم حذفهما.');
}

function renderLive(){
  const live=document.getElementById('liveList'); if(!live)return;
  const list=[...teams].sort((a,b)=>(liveScoreV9541(b)-liveScoreV9541(a)) || (scoreTotalV9541(b)-scoreTotalV9541(a)) || nameV9541(a).localeCompare(nameV9541(b),'ar'));
  if(!list.length){live.innerHTML='<p>لا توجد فرق بعد.</p>';return;}
  const max=Math.max(1,...list.map(liveScoreV9541));
  live.innerHTML=list.map((t,i)=>{
    const pts=liveScoreV9541(t), st=stageFromCurrentV9541(t), gov=provinceV9541(t);
    return `<div class="live-row live-row-v8 compact-live-row adaptive-live-row live-row-v9541 ${i===0?'first-place':''}"><div class="rank-badge">${i===0?'🏆':i+1}</div><div class="live-main"><h3>${i===0?'<span class="crown">👑</span> ':''}${escV9541(nameV9541(t))}${gov?` <span class="province-chip">${escV9541(gov)}</span>`:''}</h3><p>${escV9541(stageNames[st]||'-')} — نقاط المرحلة الحالية</p><div class="bar-track"><div class="bar-fill" style="width:${Math.round(pts/max*100)}%"></div></div></div><div class="score-number">${pts}<br><small>نقطة</small></div></div>`;
  }).join('');
}
function renderGeneralResultsV9520(){
  const box=document.getElementById('generalList'); if(!box)return;
  const list=[...teams].sort((a,b)=>(scoreTotalV9541(b)-scoreTotalV9541(a))||nameV9541(a).localeCompare(nameV9541(b),'ar'));
  if(!list.length){box.innerHTML='<p>لا توجد فرق بعد.</p>';return;}
  const max=Math.max(1,...list.map(scoreTotalV9541));
  box.innerHTML=`<div class="general-results-list-v9520 general-results-list-v9541">${list.map((t,i)=>`<div class="general-row-v9520 ${i===0?'winner':''}"><div class="rank-badge">${i===0?'🏆':i+1}</div><div class="general-main-v9520"><h3>${escV9541(nameV9541(t))}${provinceV9541(t)?` <span class="province-chip">${escV9541(provinceV9541(t))}</span>`:''}</h3><div class="bar-track"><div class="bar-fill" style="width:${Math.round(scoreTotalV9541(t)/max*100)}%"></div></div></div><div class="score-number">${scoreTotalV9541(t)}<br><small>مجموع</small></div></div>`).join('')}</div>`;
  const tools=document.querySelector('.general-tools-v9523');
  if(tools)tools.innerHTML=`<button class="btn secondary" onclick="renderGeneralResultsV9520()">إظهار النتائج</button><a class="btn" href="audience.html?mode=general" target="_blank">إظهار النتائج بحماس</a>`;
}
async function showGeneralResultsRevealV9520(){
  const rows=[...teams].sort((a,b)=>(scoreTotalV9541(a)-scoreTotalV9541(b))||nameV9541(a).localeCompare(nameV9541(b),'ar')).map((t,i,arr)=>({name:nameV9541(t),answer:'',ok:null,points:scoreTotalV9541(t),rank:arr.length-i}));
  if(!rows.length)return alert('لا توجد فرق بعد.');
  await showRevealPopupV95('النتائج العامة من الأقل إلى الأعلى',rows,true,{winnerLast:true});
}

async function revealStage4AnswersV95(auto=false){
  const live=audienceStage4LiveV95, info=stage4InfoAdminV95(); if(!info||!live?.startedAtMs)return alert('لا يوجد سؤال ظاهر');
  const docs=await getAllTeamDocsV95(); const roundId='stage4_'+info.idx+'_'+String(live.startedAtMs||'manual');
  const rows=docs.map(t=>{const a=t.progress?.stage4?.liveAnswers?.[roundId]||{}; return {name:nameV9541(t),answer:a.answer||'لم يجب',ok:(a.answer?!!a.ok:null),points:Number(a.points||0),teamId:t.id};})
    .sort((a,b)=>a.name.localeCompare(b.name,'ar'));
  audienceStage4LiveV95=Object.assign({},audienceStage4LiveV95,{status:'revealing',revealDone:true});
  await db.collection('meta').doc('stage4Live').set({status:'revealing',revealDone:true},{merge:true});
  await db.collection('meta').doc('stage4Reveal').set({active:true,title:'إجابات المرحلة الرابعة',rows,questionIndex:info.idx,startedAtMs:Date.now(),updatedAt:Date.now()},{merge:true});
  await showRevealPopupV95('إجابات المرحلة الرابعة',rows,false,{stage4:true});
  await db.collection('meta').doc('stage4Live').set({status:'revealed',revealDone:true},{merge:true});
  audienceModeV95='stage4'; renderAudiencePanelV95(false);
}
async function showRevealPopupV95(title,rows,scoreOnly=false,opts={}){
  let overlay=document.getElementById('audienceRevealOverlay');
  const fs=document.fullscreenElement || document.webkitFullscreenElement || null;
  const audienceEl=document.getElementById('audience');
  const host=(fs && (fs.id==='audience' || fs.contains(audienceEl))) ? fs : (audienceEl && document.body.classList.contains('audience-fullscreen-mode') ? audienceEl : document.body);
  if(!overlay){overlay=document.createElement('div');overlay.id='audienceRevealOverlay';}
  if(overlay.parentElement!==host)host.appendChild(overlay);
  overlay.className='audience-reveal-overlay active reveal-v9541';
  overlay.innerHTML=`<div class="audience-reveal-card reveal-card-v9541"><button class="reveal-close" onclick="const o=document.getElementById('audienceRevealOverlay'); if(o){o.className='audience-reveal-overlay'; o.remove();}">×</button><h2>${escV9541(title)}</h2><div id="revealCountdown" class="reveal-countdown reveal-countdown-v9541"></div><div id="revealRows" class="reveal-grid-v9541"></div></div>`;
  const cd=document.getElementById('revealCountdown');
  for(const n of [3,2,1]){cd.textContent=n; cd.classList.remove('pop'); void cd.offsetWidth; cd.classList.add('pop'); await sleepV95(n===1?520:680);}
  cd.textContent=''; cd.style.display='none';
  const box=document.getElementById('revealRows');
  for(let idx=0; idx<rows.length; idx++){
    const r=rows[idx], pts=Number(r.points||0), cls=pts>0?'plus':(pts<0?'minus':'zero');
    const okText=scoreOnly?'':(r.ok===null?'لم يجب':(r.ok?'صحيحة':'خاطئة'));
    const last=idx===rows.length-1;
    const card=document.createElement('div');
    card.className='reveal-card-item-v9541 '+cls+(last&&opts.winnerLast?' winner-last':'');
    card.innerHTML=`<div class="reveal-card-rank-v9541">${scoreOnly?(last?'🏆 المركز الأول':('المركز '+(rows.length-idx))):(idx+1)}</div><div class="reveal-card-team-v9541">${escV9541(r.name)}</div>${scoreOnly?'':`<div class="reveal-card-answer-v9541">${escV9541(r.answer||'لم يجب')}</div><div class="reveal-card-status-v9541">${okText}</div>`}<div class="reveal-card-points-v9541">${pts>0?'+':''}${pts}</div>`;
    box.appendChild(card); card.scrollIntoView({block:'nearest',behavior:'smooth'});
    try{adminTone?.(last&&opts.winnerLast?760:620,0.08,'triangle',0.02);}catch(e){}
    await sleepV95(opts.stage4?1050:900);
  }
}

// PNG only: keep compatibility names but remove PDF wording from rendered UI.
function downloadSelectedTeamAnswersPdfV9512(){return downloadSelectedTeamAnswersImageV9540();}
function exportHistoryPdfV9512(id){return exportHistoryImageV9540(id);}
(function pngOnlyUiV9541(){
  const oldHistory=window.renderHistory;
  if(typeof oldHistory==='function')window.renderHistory=function(){oldHistory();document.querySelectorAll('button').forEach(b=>{const t=(b.textContent||'').trim(); if(t.includes('PDF'))b.textContent=t.replace('PDF','صورة');});};
  const oldAnswer=window.renderAnswerLog;
  if(typeof oldAnswer==='function')window.renderAnswerLog=function(){oldAnswer();document.querySelectorAll('button').forEach(b=>{const t=(b.textContent||'').trim(); if(t.includes('PDF'))b.textContent='تحميل إجابات الفريق كصورة';});};
})();

/* ===== V9.5.44 Clean Final Overrides: synced audience reveals and timer state ===== */
(function(){
  'use strict';
  function n(v,d=0){return Number.isFinite(Number(v))?Number(v):d;}
  function teamTitleClean(t){try{return (typeof nameV9541==='function'?nameV9541(t):(t?.name||t?.id||'فريق')).trim();}catch(e){return (t?.name||t?.id||'فريق');}}
  async function allTeamsClean(){
    if(typeof getAllTeamDocsV95==='function') return await getAllTeamDocsV95();
    const snap=await db.collection('teams').get();
    const arr=[]; snap.forEach(d=>arr.push({id:d.id,ref:d.ref,...(d.data()||{})}));
    return arr;
  }
  async function setRevealDoc(name,payload){
    await db.collection('meta').doc(name).set(Object.assign({updatedAt:Date.now()},payload),{merge:true});
  }
  async function clearAudienceReveals(){
    const batch=db.batch();
    batch.set(db.collection('meta').doc('stage3Reveal'),{active:false,rows:[],title:'',updatedAt:Date.now()},{merge:true});
    batch.set(db.collection('meta').doc('stage4Reveal'),{active:false,rows:[],title:'',updatedAt:Date.now()},{merge:true});
    await batch.commit();
  }

  const previousStartStage4 = window.startStage4QuestionV95;
  window.startStage4QuestionV95 = async function(){
    const idx=n(audienceStage4LiveV95?.index,0);
    if(!DATA?.stage4?.[idx]) return alert('لا يوجد سؤال');
    await setRevealDoc('stage4Reveal',{active:false,rows:[],title:'',questionIndex:idx});
    await db.collection('meta').doc('stage4Live').set({status:'asking',index:idx,duration:gameFlowDurationV960('stageQuestion',15),startedAtMs:Date.now(),revealDone:false},{merge:true});
    audienceModeV95='stage4'; renderAudiencePanelV95?.();
  };

  window.nextStage4QuestionV95 = async function(){
    if(audienceStage4LiveV95?.startedAtMs && !audienceStage4LiveV95?.revealDone) return alert('يجب عرض نتائج السؤال الحالي قبل الانتقال للسؤال التالي.');
    const idx=n(audienceStage4LiveV95?.index,0)+1;
    if(idx>=(DATA?.stage4||[]).length) return alert('انتهت أسئلة المرحلة الرابعة');
    await setRevealDoc('stage4Reveal',{active:false,rows:[],title:'',questionIndex:idx});
    await db.collection('meta').doc('stage4Live').set({status:'asking',index:idx,duration:gameFlowDurationV960('stageQuestion',15),startedAtMs:Date.now(),revealDone:false},{merge:true});
    audienceModeV95='stage4'; renderAudiencePanelV95?.();
  };

  window.resetStage4V95 = async function(){
    if(!confirm('إعادة المرحلة الرابعة من البداية؟')) return;
    const batch=db.batch();
    batch.set(db.collection('meta').doc('stage4Live'),{status:'waiting',index:0,duration:gameFlowDurationV960('stageQuestion',15),startedAtMs:null,revealDone:false},{merge:true});
    batch.set(db.collection('meta').doc('stage4Reveal'),{active:false,rows:[],title:'',updatedAt:Date.now()},{merge:true});
    await batch.commit();
    audienceModeV95='stage4'; renderAudiencePanelV95?.(false);
  };

  window.revealStage4AnswersV95 = async function(auto=false){
    const live=audienceStage4LiveV95 || {};
    const info=(typeof stage4InfoAdminV95==='function') ? stage4InfoAdminV95() : null;
    if(!info || !live.startedAtMs) return alert('لا يوجد سؤال ظاهر');
    const docs=await allTeamsClean();
    const roundId='stage4_'+info.idx+'_'+String(live.startedAtMs||'manual');
    const rows=docs.map(t=>{
      const a=t.progress?.stage4?.liveAnswers?.[roundId] || {};
      const has=!!(a.answer || a.skipped || a.time);
      return {name:teamTitleClean(t),answer:has?(a.answer||'تخطي'):'لم يجب',ok:has?(a.ok===true?true:(a.ok===false?false:null)):null,points:n(a.points,0),teamId:t.id};
    }).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'));
    audienceStage4LiveV95=Object.assign({},audienceStage4LiveV95,{status:'revealing',revealDone:true});
    await db.collection('meta').doc('stage4Live').set({status:'revealing',revealDone:true},{merge:true});
    await setRevealDoc('stage4Reveal',{active:true,title:'إجابات المرحلة الرابعة',rows,questionIndex:info.idx,startedAtMs:Date.now()});
    if(typeof showRevealPopupV95==='function') await showRevealPopupV95('إجابات المرحلة الرابعة',rows,false,{stage4:true});
    await db.collection('meta').doc('stage4Live').set({status:'revealed',revealDone:true},{merge:true});
    audienceModeV95='stage4'; renderAudiencePanelV95?.(false);
  };

  window.revealStage3AnswersV95 = async function(auto=false){
    const active=audienceActiveStage3V95;
    const info=(typeof activeStage3InfoAdminV95==='function') ? activeStage3InfoAdminV95() : null;
    if(!active || !info) return alert('لا يوجد سؤال مفتوح');
    if(typeof applyMissingStage3PenaltiesV95==='function') await applyMissingStage3PenaltiesV95(info,active);
    const docs=await allTeamsClean();
    const roundId='stage3_'+active.id+'_'+String(active.startedAtMs||'');
    const rows=docs.map(t=>{
      const a=t.progress?.stage3?.liveAnswers?.[roundId] || {};
      const has=!!(a.answer || a.skipped || a.time);
      return {name:teamTitleClean(t),answer:has?(a.answer||'تخطي'):'لم يجب',ok:has?(a.ok===true?true:(a.ok===false?false:null)):null,points:n(a.points,0),teamId:t.id};
    }).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'));
    audienceActiveStage3V95=Object.assign({},audienceActiveStage3V95,{revealDone:true,status:'revealing'});
    await db.collection('meta').doc('activeStage3').set({revealDone:true,status:'revealing'},{merge:true});
    await setRevealDoc('stage3Reveal',{active:true,title:'إجابات المرحلة الثالثة',rows,questionId:active.id,startedAtMs:Date.now()});
    if(typeof showRevealPopupV95==='function') await showRevealPopupV95('إجابات المرحلة الثالثة',rows,false,{stage3:true});
    await db.collection('stage3Locks').doc(active.id).set({answered:true,answeredAt:FieldValue.serverTimestamp()},{merge:true});
    await db.collection('meta').doc('activeStage3').set({id:null,team:null,teamName:null,status:'waiting'},{merge:true});
    audienceModeV95='stage3'; renderAudiencePanelV95?.(false);
    if(typeof advanceStage3TurnAdminV95==='function') await advanceStage3TurnAdminV95(active.team);
  };

  const previousAdminChoose3 = window.adminChoose3V95;
  if(typeof previousAdminChoose3==='function'){
    window.adminChoose3V95 = async function(ci,i){
      await setRevealDoc('stage3Reveal',{active:false,rows:[],title:'',questionId:''});
      return previousAdminChoose3(ci,i);
    };
  }

  const previousResetStage3 = window.resetStage3AudienceV95;
  if(typeof previousResetStage3==='function'){
    window.resetStage3AudienceV95 = async function(){
      await setRevealDoc('stage3Reveal',{active:false,rows:[],title:'',questionId:''});
      return previousResetStage3();
    };
  }

  const previousClearTeams = window.clearCurrentTeamsOnlyV9541;
  if(typeof previousClearTeams==='function'){
    window.clearCurrentTeamsOnlyV9541 = async function(){
      const res=await previousClearTeams();
      await clearAudienceReveals().catch(console.error);
      return res;
    };
  }
})();

/* ===== V9.5.46 Remove Stage 3/4 Admin Popups + Inline Reveal Summary ===== */
(function(){
  'use strict';
  function num(v,d=0){return Number.isFinite(Number(v))?Number(v):d;}
  function cleanName(t){try{return (typeof nameV9541==='function'?nameV9541(t):(t?.name||t?.id||'فريق')).trim();}catch(e){return t?.name||t?.id||'فريق';}}
  function ensureAdminRevealPanel(){
    let host=document.getElementById('stageAudienceAdminRevealV9546');
    if(host) return host;
    const audience=document.getElementById('audience') || document.getElementById('control') || document.body;
    host=document.createElement('section');
    host.id='stageAudienceAdminRevealV9546';
    host.className='mini-card admin-inline-reveal-v9546';
    audience.appendChild(host);
    return host;
  }
  function paintAdminReveal(title,rows){
    const host=ensureAdminRevealPanel();
    host.innerHTML=`<h3>${escV9541(title)}</h3><p class="muted">تم إرسال النتائج إلى شاشة الجمهور. تظهر هنا كملخص داخل لوحة التحكم بدون نافذة منبثقة.</p><div class="admin-inline-reveal-grid-v9546">${rows.map(r=>{
      const pts=num(r.points,0), cls=pts>0?'plus':(pts<0?'minus':'zero');
      const status=r.ok===null||r.ok===undefined?'لم يجب':(r.ok?'صحيحة':'خاطئة');
      return `<div class="admin-inline-reveal-row-v9546 ${cls}"><b>${escV9541(r.name||'فريق')}</b><span>${escV9541(r.answer||'لم يجب')}</span><em>${status}</em><strong>${pts>0?'+':''}${pts}</strong></div>`;
    }).join('')}</div>`;
  }
  async function allTeams(){
    if(typeof getAllTeamDocsV95==='function') return await getAllTeamDocsV95();
    const snap=await db.collection('teams').get(); const arr=[]; snap.forEach(d=>arr.push({id:d.id,ref:d.ref,...(d.data()||{})})); return arr;
  }
  async function setRevealDoc(name,payload){ await db.collection('meta').doc(name).set(Object.assign({updatedAt:Date.now()},payload),{merge:true}); }
  window.revealStage3AnswersV95 = async function(auto=false){
    const active=audienceActiveStage3V95;
    const info=(typeof activeStage3InfoAdminV95==='function') ? activeStage3InfoAdminV95() : null;
    if(!active || !info) return alert('لا يوجد سؤال مفتوح');
    if(typeof applyMissingStage3PenaltiesV95==='function') await applyMissingStage3PenaltiesV95(info,active);
    const docs=await allTeams();
    const roundId='stage3_'+active.id+'_'+String(active.startedAtMs||'');
    const rows=docs.map(t=>{
      const a=t.progress?.stage3?.liveAnswers?.[roundId] || {};
      const has=!!(a.answer || a.skipped || a.time);
      return {name:cleanName(t),answer:has?(a.answer||'تخطي'):'لم يجب',ok:has?(a.ok===true?true:(a.ok===false?false:null)):null,points:num(a.points,0),teamId:t.id};
    }).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'));
    audienceActiveStage3V95=Object.assign({},audienceActiveStage3V95,{revealDone:true,status:'revealing'});
    await db.collection('meta').doc('activeStage3').set({revealDone:true,status:'revealing'},{merge:true});
    await setRevealDoc('stage3Reveal',{active:true,title:'إجابات المرحلة الثالثة',rows,questionId:active.id,startedAtMs:Date.now()});
    paintAdminReveal('إجابات المرحلة الثالثة',rows);
    await db.collection('stage3Locks').doc(active.id).set({answered:true,answeredAt:FieldValue.serverTimestamp()},{merge:true});
    await db.collection('meta').doc('activeStage3').set({id:null,team:null,teamName:null,status:'waiting'},{merge:true});
    audienceModeV95='stage3'; renderAudiencePanelV95?.(false);
    if(typeof advanceStage3TurnAdminV95==='function') await advanceStage3TurnAdminV95(active.team);
  };
  window.revealStage4AnswersV95 = async function(auto=false){
    const live=audienceStage4LiveV95 || {};
    const info=(typeof stage4InfoAdminV95==='function') ? stage4InfoAdminV95() : null;
    if(!info || !live.startedAtMs) return alert('لا يوجد سؤال ظاهر');
    const docs=await allTeams();
    const roundId='stage4_'+info.idx+'_'+String(live.startedAtMs||'manual');
    const rows=docs.map(t=>{
      const a=t.progress?.stage4?.liveAnswers?.[roundId] || {};
      const has=!!(a.answer || a.skipped || a.time);
      return {name:cleanName(t),answer:has?(a.answer||'تخطي'):'لم يجب',ok:has?(a.ok===true?true:(a.ok===false?false:null)):null,points:num(a.points,0),teamId:t.id};
    }).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'));
    audienceStage4LiveV95=Object.assign({},audienceStage4LiveV95,{status:'revealing',revealDone:true});
    await db.collection('meta').doc('stage4Live').set({status:'revealing',revealDone:true},{merge:true});
    await setRevealDoc('stage4Reveal',{active:true,title:'إجابات المرحلة الرابعة',rows,questionIndex:info.idx,startedAtMs:Date.now()});
    paintAdminReveal('إجابات المرحلة الرابعة',rows);
    await db.collection('meta').doc('stage4Live').set({status:'revealed',revealDone:true},{merge:true});
    audienceModeV95='stage4'; renderAudiencePanelV95?.(false);
  };
})();


/* ===== V9.5.47 Final admin reveal cleanup ===== */
(function(){
  'use strict';
  function escFix(v){ try{return String(v??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));}catch(e){return String(v??'');}}
  function removeRevealOverlay(){ document.querySelectorAll('#audienceRevealOverlay,.audience-reveal-overlay').forEach(el=>el.remove()); }
  function ensureInlineHost(){
    let host=document.getElementById('stageAudienceAdminRevealV9546');
    if(host) return host;
    const audience=document.getElementById('audience') || document.getElementById('control') || document.body;
    host=document.createElement('section');
    host.id='stageAudienceAdminRevealV9546';
    host.className='mini-card admin-inline-reveal-v9546';
    audience.appendChild(host);
    return host;
  }
  window.showRevealPopupV95 = async function(title,rows,scoreOnly=false,opts={}){
    removeRevealOverlay();
    const host=ensureInlineHost();
    rows=Array.isArray(rows)?rows:[];
    host.innerHTML=`<h3>${escFix(title||'النتائج')}</h3><p class="muted">تم إرسال النتائج إلى شاشة الجمهور. تظهر هنا كملخص داخل لوحة التحكم بدون نافذة منبثقة.</p><div class="admin-inline-reveal-grid-v9546">${rows.map(r=>{ const pts=Number(r?.points||0); const cls=pts>0?'plus':(pts<0?'minus':'zero'); const status=scoreOnly?'نقاط':(r?.ok===null||r?.ok===undefined?'لم يجب':(r.ok?'صحيحة':'خاطئة')); return `<div class="admin-inline-reveal-row-v9546 ${cls}"><b>${escFix(r?.name||'فريق')}</b><span>${escFix(scoreOnly?('المجموع: '+(r?.totalScore??r?.score??pts)): (r?.answer||'لم يجب'))}</span><em>${status}</em><strong>${pts>0?'+':''}${pts}</strong></div>`; }).join('')}</div>`;
    return true;
  };
  // also prevent old timeout helper from leaving popup on screen
  document.addEventListener('DOMContentLoaded', removeRevealOverlay);
})();


/* ===== V9.5.49 final admin cleanup ===== */
(function(){
  'use strict';
  function safeEsc(v){return String(v??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));}
  function num(v,d=0){return Number.isFinite(Number(v))?Number(v):d;}
  function cleanName(t){try{return (typeof nameV9541==='function'?nameV9541(t):(t?.name||t?.id||'فريق')).trim();}catch(e){return t?.name||t?.id||'فريق';}}
  function removeOldPopups(){document.querySelectorAll('#audienceRevealOverlay,.audience-reveal-overlay').forEach(x=>x.remove());}
  function dedupeClearTeamButtons(){
    const boxes=[...document.querySelectorAll('#clearTeamsToolV9541')];
    boxes.forEach((b,i)=>{if(i>0)b.remove();});
    const btns=[...document.querySelectorAll('#clearCurrentTeamsBtnV9541')];
    btns.forEach((b,i)=>{if(i>0){const p=b.closest('#clearTeamsToolV9541,.mini-card,.card,section,div'); if(p&&p.id!=='control')p.remove(); else b.remove();}});
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(dedupeClearTeamButtons,600));
  setInterval(dedupeClearTeamButtons,2500);
  const oldEnsure=window.ensureClearTeamsToolV9541;
  window.ensureClearTeamsToolV9541=function(){ const r=oldEnsure?.apply(this,arguments); setTimeout(dedupeClearTeamButtons,50); return r; };
  function inlineReveal(title,rows){
    removeOldPopups();
    let host=document.getElementById('stageAudienceAdminRevealV9546');
    if(!host){host=document.createElement('section');host.id='stageAudienceAdminRevealV9546';host.className='mini-card admin-inline-reveal-v9546';(document.getElementById('audience')||document.getElementById('control')||document.body).appendChild(host);}
    rows=Array.isArray(rows)?rows:[];
    host.innerHTML=`<h3>${safeEsc(title)}</h3><p class="muted">تم إرسال النتائج إلى شاشة الجمهور. تظهر هنا كملخص داخل لوحة التحكم بدون نافذة منبثقة.</p><div class="admin-inline-reveal-grid-v9546">${rows.map(r=>{const pts=num(r.points,0),cls=pts>0?'plus':(pts<0?'minus':'zero'),status=r.ok===null||r.ok===undefined?'لم يجب':(r.ok?'صحيحة':'خاطئة');return `<div class="admin-inline-reveal-row-v9546 ${cls}"><b>${safeEsc(r.name||'فريق')}</b><span>${safeEsc(r.answer||'لم يجب')}</span><em>${status}</em><strong>${pts>0?'+':''}${pts}</strong></div>`}).join('')}</div>`;
  }
  async function allTeams(){ if(typeof getAllTeamDocsV95==='function')return await getAllTeamDocsV95(); const snap=await db.collection('teams').get(); const arr=[]; snap.forEach(d=>arr.push({id:d.id,ref:d.ref,...(d.data()||{})})); return arr; }
  async function setReveal(name,payload){await db.collection('meta').doc(name).set(Object.assign({active:true,revealId:String(Date.now())+'_'+Math.random().toString(36).slice(2),startedAtMs:Date.now(),updatedAt:Date.now()},payload),{merge:true});}
  window.showRevealPopupV95=async function(title,rows){inlineReveal(title,rows);return true;};
  window.revealStage3AnswersV95=async function(auto=false){
    const active=audienceActiveStage3V95; const info=(typeof activeStage3InfoAdminV95==='function')?activeStage3InfoAdminV95():null;
    if(!active||!info)return alert('لا يوجد سؤال مفتوح');
    if(typeof applyMissingStage3PenaltiesV95==='function')await applyMissingStage3PenaltiesV95(info,active);
    const docs=await allTeams(); const roundId='stage3_'+active.id+'_'+String(active.startedAtMs||'');
    const rows=docs.map(t=>{const a=t.progress?.stage3?.liveAnswers?.[roundId]||{}; const has=!!(a.answer||a.skipped||a.time); return {name:cleanName(t),answer:has?(a.answer||'تخطي'):'لم يجب',ok:has?(a.ok===true?true:(a.ok===false?false:null)):null,points:num(a.points,0),teamId:t.id};}).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'));
    await db.collection('meta').doc('activeStage3').set({revealDone:true,status:'revealing'},{merge:true});
    await setReveal('stage3Reveal',{title:'إجابات المرحلة الثالثة',rows,questionId:active.id});
    inlineReveal('إجابات المرحلة الثالثة',rows);
    await db.collection('stage3Locks').doc(active.id).set({answered:true,answeredAt:FieldValue.serverTimestamp()},{merge:true});
    await db.collection('meta').doc('activeStage3').set({id:null,team:null,teamName:null,status:'waiting'},{merge:true});
    audienceModeV95='stage3'; renderAudiencePanelV95?.(false);
    if(typeof advanceStage3TurnAdminV95==='function')await advanceStage3TurnAdminV95(active.team);
  };
  window.revealStage4AnswersV95=async function(auto=false){
    const live=audienceStage4LiveV95||{}; const info=(typeof stage4InfoAdminV95==='function')?stage4InfoAdminV95():null;
    if(!info||!live.startedAtMs)return alert('لا يوجد سؤال ظاهر');
    const docs=await allTeams(); const roundId='stage4_'+info.idx+'_'+String(live.startedAtMs||'manual');
    const rows=docs.map(t=>{const a=t.progress?.stage4?.liveAnswers?.[roundId]||{}; const has=!!(a.answer||a.skipped||a.time); return {name:cleanName(t),answer:has?(a.answer||'تخطي'):'لم يجب',ok:has?(a.ok===true?true:(a.ok===false?false:null)):null,points:num(a.points,0),teamId:t.id};}).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'));
    await db.collection('meta').doc('stage4Live').set({status:'revealing',revealDone:true},{merge:true});
    await setReveal('stage4Reveal',{title:'إجابات المرحلة الرابعة',rows,questionIndex:info.idx});
    inlineReveal('إجابات المرحلة الرابعة',rows);
    await db.collection('meta').doc('stage4Live').set({status:'revealed',revealDone:true},{merge:true});
    audienceModeV95='stage4'; renderAudiencePanelV95?.(false);
  };
})();


/* ===== V9.5.51 FINAL: Stage 3 scoring/reveal cycle (10s hold before next choosing timer) ===== */
(function(){
  'use strict';
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
  const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const same=(a,b)=>{
    const x=String(a||'').trim(), y=String(b||'').trim();
    if(!x||!y)return false;
    if(typeof sameTeamAdminV95==='function')return sameTeamAdminV95(x,y);
    return x===y;
  };
  const cleanName=(t)=>String((typeof nameV9541==='function'?nameV9541(t):(t?.name||t?.id||'فريق'))||'فريق').trim();
  const esc=(x)=>String(x??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c));
  function basePoints(level){return ({'سهل':5,'متوسط':10,'صعب':15})[String(level||'').trim()]||5;}
  function ownerCorrect(level){return ({'سهل':15,'متوسط':30,'صعب':45})[String(level||'').trim()]||15;}
  window.stage3BasePointsAdminV95=basePoints;
  window.stage3OwnerCorrectPointsAdminV95=ownerCorrect;
  async function allTeams(){
    if(typeof getAllTeamDocsV95==='function')return await getAllTeamDocsV95();
    const snap=await db.collection('teams').get(); const arr=[]; snap.forEach(d=>arr.push({id:d.id,ref:d.ref,...(d.data()||{})})); return arr;
  }
  function inlineReveal(title,rows){
    let host=document.getElementById('stageAudienceAdminRevealV9546');
    if(!host){host=document.createElement('section');host.id='stageAudienceAdminRevealV9546';host.className='mini-card admin-inline-reveal-v9546';(document.getElementById('audience')||document.getElementById('control')||document.body).appendChild(host);}
    rows=Array.isArray(rows)?rows:[];
    host.innerHTML=`<h3>${esc(title)}</h3><p class="muted">تم إرسال النتائج إلى شاشة الجمهور. سيتم الرجوع للجدول بعد عرض النتائج.</p><div class="admin-inline-reveal-grid-v9546">${rows.map(r=>{const pts=num(r.points,0), cls=pts>0?'plus':(pts<0?'minus':'zero'), status=r.ok===null||r.ok===undefined?'لم يجب':(r.ok?'صحيحة':'خاطئة');return `<div class="admin-inline-reveal-row-v9546 ${cls}"><b>${esc(r.name||'فريق')}</b><span>${esc(r.answer||'لم يجب')}</span><em>${status}</em><strong>${pts>0?'+':''}${pts}</strong></div>`;}).join('')}</div>`;
  }
  window.applyMissingStage3PenaltiesV95 = async function(info,active){
    const roundId='stage3_'+active.id+'_'+String(active.startedAtMs||'');
    const owner=active.team;
    const base=basePoints(info.level);
    const docs=await allTeams();
    const batch=db.batch();
    docs.forEach(t=>{
      const pr=Object.assign({},t.progress?.stage3||{});
      const liveAnswers=Object.assign({},pr.liveAnswers||{});
      if(liveAnswers[roundId])return;
      const isOwner=same(t.id,owner)||same(t.name,owner)||same(t.id,active.teamName)||same(t.name,active.teamName);
      const pts=isOwner?-base:0;
      liveAnswers[roundId]={answer:'لم يجب',ok:isOwner?false:null,points:pts,skipped:!isOwner,teamName:t.name||cleanName(t),time:Date.now(),isOwner};
      const stageScores=Object.assign({stage1:0,stage2:0,stage3:0,stage4:0},t.stageScores||{});
      stageScores.stage3=Math.max(0,num(stageScores.stage3,0)+pts);
      const score=Math.max(0,num(t.score,0)+pts);
      const progress=Object.assign({},t.progress||{}, {stage3:Object.assign({},pr,{liveAnswers})});
      const log={stage:'على المحك',question:info.text,selected:'لم يجب',correct:info.correct,ok:isOwner?false:null,points:pts,meta:info.cat.cat+' - '+info.level+(isOwner?' - صاحب الاختيار - عدم إجابة':' - فريق آخر - عدم إجابة'),playerName:t.name||'',time:new Date().toLocaleString('ar')};
      batch.set(t.ref,{progress,stageScores,score,answerLog:[...(t.answerLog||[]),log]},{merge:true});
    });
    await batch.commit();
  };
  async function setReveal(name,payload){
    await db.collection('meta').doc(name).set(Object.assign({
      active:true,
      revealId:String(Date.now())+'_'+Math.random().toString(36).slice(2),
      startedAtMs:Date.now(),
      holdMs:10000,
      updatedAt:Date.now()
    },payload),{merge:true});
  }
  window.showRevealPopupV95=async function(title,rows){inlineReveal(title,rows);return true;};
  window.revealStage3AnswersV95=async function(auto=false){
    const active=audienceActiveStage3V95;
    const info=(typeof activeStage3InfoAdminV95==='function')?activeStage3InfoAdminV95():null;
    if(!active||!info)return alert('لا يوجد سؤال مفتوح');
    await window.applyMissingStage3PenaltiesV95(info,active);
    const docs=await allTeams();
    const roundId='stage3_'+active.id+'_'+String(active.startedAtMs||'');
    const rows=docs.map(t=>{
      const a=t.progress?.stage3?.liveAnswers?.[roundId]||{};
      const has=!!(a.answer||a.skipped||a.time);
      return {name:cleanName(t),answer:has?(a.answer||'لم يجب'):'لم يجب',ok:has?(a.ok===true?true:(a.ok===false?false:null)):null,points:num(a.points,0),teamId:t.id,isOwner:!!a.isOwner};
    }).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'));
    await db.collection('meta').doc('activeStage3').set({revealDone:true,status:'revealing'},{merge:true});
    await setReveal('stage3Reveal',{title:'إجابات المرحلة الثالثة',rows,questionId:active.id,questionText:info.text});
    inlineReveal('إجابات المرحلة الثالثة',rows);
    await db.collection('stage3Locks').doc(active.id).set({answered:true,answeredAt:FieldValue.serverTimestamp()},{merge:true});
    audienceModeV95='stage3'; renderAudiencePanelV95?.(false);
    await sleep(10000);
    await db.collection('meta').doc('activeStage3').set({id:null,team:null,teamName:null,status:'waiting',revealDone:false},{merge:true});
    if(typeof advanceStage3TurnAdminV95==='function')await advanceStage3TurnAdminV95(active.team);
    audienceModeV95='stage3'; renderAudiencePanelV95?.(false);
  };
  window.revealStage4AnswersV95=async function(auto=false){
    const live=audienceStage4LiveV95||{};
    const info=(typeof stage4InfoAdminV95==='function')?stage4InfoAdminV95():null;
    if(!info||!live.startedAtMs)return alert('لا يوجد سؤال ظاهر');
    const docs=await allTeams();
    const roundId='stage4_'+info.idx+'_'+String(live.startedAtMs||'manual');
    const rows=docs.map(t=>{
      const a=t.progress?.stage4?.liveAnswers?.[roundId]||{};
      const has=!!(a.answer||a.skipped||a.time);
      return {name:cleanName(t),answer:has?(a.answer||'لم يجب'):'لم يجب',ok:has?(a.ok===true?true:(a.ok===false?false:null)):null,points:num(a.points,0),teamId:t.id};
    }).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'));
    await db.collection('meta').doc('stage4Live').set({status:'revealing',revealDone:true},{merge:true});
    await setReveal('stage4Reveal',{title:'إجابات المرحلة الرابعة',rows,questionIndex:info.idx});
    inlineReveal('إجابات المرحلة الرابعة',rows);
    audienceModeV95='stage4'; renderAudiencePanelV95?.(false);
    await sleep(10000);
    await db.collection('meta').doc('stage4Live').set({status:'revealed',revealDone:true},{merge:true});
    renderAudiencePanelV95?.(false);
  };
})();

/* ===== V9.5.54 CLEAN FINAL: reliable public reveal docs for stage 3 and 4 ===== */
(function(){
  'use strict';
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
  const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const esc=(x)=>String(x??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  let stage3RevealBusyV9557=false;
  let stage4RevealBusyV9557=false;
  const same=(a,b)=>{const A=String(a||'').trim(),B=String(b||'').trim(); if(!A||!B)return false; try{if(typeof sameTeamAdminV95==='function')return sameTeamAdminV95(A,B);}catch(e){} return A===B;};
  const nameOf=(t)=>String((typeof nameV9541==='function'?nameV9541(t):(t?.name||t?.id||'فريق'))||'فريق').trim();
  const basePts=(level)=>({'سهل':5,'متوسط':10,'صعب':15})[String(level||'').trim()]||5;
  const ownerCorrect=(level)=>({'سهل':15,'متوسط':30,'صعب':45})[String(level||'').trim()]||15;
  window.stage3BasePointsAdminV95=basePts;
  window.stage3OwnerCorrectPointsAdminV95=ownerCorrect;
  async function teamsDocs(){if(typeof getAllTeamDocsV95==='function')return await getAllTeamDocsV95(); const snap=await db.collection('teams').get(); const arr=[]; snap.forEach(d=>arr.push({id:d.id,ref:d.ref,...(d.data()||{})})); return arr;}
  function inline(title,rows){let host=document.getElementById('stageAudienceAdminRevealV9546'); if(!host){host=document.createElement('section');host.id='stageAudienceAdminRevealV9546';host.className='mini-card admin-inline-reveal-v9546';(document.getElementById('audience')||document.getElementById('control')||document.body).appendChild(host);} rows=Array.isArray(rows)?rows:[]; host.innerHTML=`<h3>${esc(title)}</h3><p class="muted">تم إرسال الإجابات الآن إلى شاشة الجمهور. انتظروا انتهاء عرض الجمهور قبل الانتقال.</p><div class="admin-inline-reveal-grid-v9546">${rows.map(r=>{const pts=num(r.points,0),cls=pts>0?'plus':(pts<0?'minus':'zero'),status=r.ok===null||r.ok===undefined?'لم يجب':(r.ok?'صحيحة':'خاطئة');return `<div class="admin-inline-reveal-row-v9546 ${cls}"><b>${esc(r.name||'فريق')}</b><span>${esc(r.answer||'لم يجب')}</span><em>${status}</em><strong>${pts>0?'+':''}${pts}</strong></div>`}).join('')}</div>`;}
  async function setRevealDoc(docName,payload){await db.collection('meta').doc(docName).set(Object.assign({active:true,revealId:String(Date.now())+'_'+Math.random().toString(36).slice(2),startedAtMs:Date.now(),holdMs:12000,updatedAt:Date.now()},payload),{merge:true});}
  window.applyMissingStage3PenaltiesV95=async function(info,active){
    const roundId='stage3_'+active.id+'_'+String(active.startedAtMs||''); const owner=active.team; const base=basePts(info.level); const docs=await teamsDocs(); const batch=db.batch();
    docs.forEach(t=>{const pr=Object.assign({},t.progress?.stage3||{}); const liveAnswers=Object.assign({},pr.liveAnswers||{}); if(liveAnswers[roundId])return; const isOwner=same(t.id,owner)||same(t.name,owner)||same(t.id,active.teamName)||same(t.name,active.teamName); const pts=isOwner?-base:0; liveAnswers[roundId]={answer:'لم يجب',ok:isOwner?false:null,points:pts,skipped:!isOwner,teamName:t.name||nameOf(t),time:Date.now(),isOwner}; const stageScores=Object.assign({stage1:0,stage2:0,stage3:0,stage4:0},t.stageScores||{}); stageScores.stage3=Math.max(0,num(stageScores.stage3,0)+pts); const score=Math.max(0,num(t.score,0)+pts); const progress=Object.assign({},t.progress||{},{stage3:Object.assign({},pr,{liveAnswers})}); const log={stage:'على المحك',question:info.text,selected:'لم يجب',correct:info.correct,ok:isOwner?false:null,points:pts,meta:info.cat.cat+' - '+info.level+(isOwner?' - صاحب الاختيار - عدم إجابة':' - فريق آخر - عدم إجابة'),playerName:t.name||'',time:new Date().toLocaleString('ar')}; batch.set(t.ref,{progress,stageScores,score,answerLog:[...(t.answerLog||[]),log]},{merge:true});});
    await batch.commit();
  };
  window.showRevealPopupV95=async function(title,rows){inline(title,rows);return true;};
  window.revealStage3AnswersV95=async function(auto=false){
    const active=audienceActiveStage3V95; const info=(typeof activeStage3InfoAdminV95==='function')?activeStage3InfoAdminV95():null; if(!active||!info)return alert('لا يوجد سؤال مفتوح');
    await window.applyMissingStage3PenaltiesV95(info,active);
    const docs=await teamsDocs(); const roundId='stage3_'+active.id+'_'+String(active.startedAtMs||'');
    const rows=docs.map(t=>{const a=t.progress?.stage3?.liveAnswers?.[roundId]||{}; const has=!!(a.answer||a.skipped||a.time); return {name:nameOf(t),answer:has?(a.answer||'لم يجب'):'لم يجب',ok:has?(a.ok===true?true:(a.ok===false?false:null)):null,points:num(a.points,0),teamId:t.id,isOwner:!!a.isOwner};}).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'));
    await db.collection('meta').doc('activeStage3').set({revealDone:true,status:'revealing'},{merge:true});
    await setRevealDoc('stage3Reveal',{title:'إجابات المرحلة الثالثة',rows,questionId:active.id,questionText:info.text});
    inline('إجابات المرحلة الثالثة',rows);
    await db.collection('stage3Locks').doc(active.id).set({answered:true,answeredAt:FieldValue.serverTimestamp()},{merge:true});
    audienceModeV95='stage3'; renderAudiencePanelV95?.(false);
    setTimeout(async()=>{try{await db.collection('meta').doc('activeStage3').set({id:null,team:null,teamName:null,status:'waiting',revealDone:false},{merge:true}); if(typeof advanceStage3TurnAdminV95==='function')await advanceStage3TurnAdminV95(active.team); renderAudiencePanelV95?.(false);}catch(e){console.error(e)}},revealDelayMs(rows));
  };
  window.revealStage4AnswersV95=async function(auto=false){
    const live=audienceStage4LiveV95||{}; const info=(typeof stage4InfoAdminV95==='function')?stage4InfoAdminV95():null; if(!info||!live.startedAtMs)return alert('لا يوجد سؤال ظاهر');
    const docs=await teamsDocs(); const roundId='stage4_'+info.idx+'_'+String(live.startedAtMs||'manual');
    const rows=docs.map(t=>{const a=t.progress?.stage4?.liveAnswers?.[roundId]||{}; const has=!!(a.answer||a.skipped||a.time); return {name:nameOf(t),answer:has?(a.answer||'لم يجب'):'لم يجب',ok:has?(a.ok===true?true:(a.ok===false?false:null)):null,points:num(a.points,0),teamId:t.id};}).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'));
    await db.collection('meta').doc('stage4Live').set({status:'revealing',revealDone:true},{merge:true});
    await setRevealDoc('stage4Reveal',{title:'إجابات المرحلة الرابعة',rows,questionIndex:info.idx});
    inline('إجابات المرحلة الرابعة',rows);
    audienceModeV95='stage4'; renderAudiencePanelV95?.(false);
    setTimeout(async()=>{try{await db.collection('meta').doc('stage4Live').set({status:'revealed',revealDone:true},{merge:true});renderAudiencePanelV95?.(false);}catch(e){console.error(e)}},revealDelayMs(rows));
  };
})();

/* ===== V9.5.55 FINAL: stage 3 expired choice reveal + clean 12s result window ===== */
(function(){
  'use strict';
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
  const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const same=(a,b)=>{try{return typeof sameTeamAdminV95==='function'?sameTeamAdminV95(a,b):String(a||'')===String(b||'');}catch(e){return String(a||'')===String(b||'');}};
  const nameOf=(t)=>String((typeof nameV9541==='function'?nameV9541(t):(t?.name||t?.id||'فريق'))||'فريق').trim();
  function inline(title,rows){
    let host=document.getElementById('stageAudienceAdminRevealV9546');
    if(!host){host=document.createElement('section');host.id='stageAudienceAdminRevealV9546';host.className='mini-card admin-inline-reveal-v9546';(document.getElementById('audience')||document.getElementById('control')||document.body).appendChild(host);}
    rows=Array.isArray(rows)?rows:[];
    const esc=(x)=>String(x??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  let stage3RevealBusyV9557=false;
  let stage4RevealBusyV9557=false;
    host.innerHTML=`<h3>${esc(title)}</h3><p class="muted">تم إرسال الإجابات الآن إلى شاشة الجمهور. انتظروا انتهاء عرض الجمهور قبل الانتقال.</p><div class="admin-inline-reveal-grid-v9546">${rows.map(r=>{const pts=num(r.points,0),cls=pts>0?'plus':(pts<0?'minus':'zero'),status=r.ok===null||r.ok===undefined?'لم يجب':(r.ok?'صحيحة':'خاطئة');return `<div class="admin-inline-reveal-row-v9546 ${cls}"><b>${esc(r.name||'فريق')}</b><span>${esc(r.answer||'لم يجب')}</span><em>${status}</em><strong>${pts>0?'+':''}${pts}</strong></div>`}).join('')}</div>`;
  }
  async function teamsDocs(){if(typeof getAllTeamDocsV95==='function')return await getAllTeamDocsV95(); const snap=await db.collection('teams').get(); const arr=[]; snap.forEach(d=>arr.push({id:d.id,ref:d.ref,...(d.data()||{})})); return arr;}
  async function publicReveal(docName,payload){await db.collection('meta').doc(docName).set(Object.assign({active:true,revealId:String(Date.now())+'_'+Math.random().toString(36).slice(2),startedAtMs:Date.now(),holdMs:12000,updatedAt:Date.now()},payload),{merge:true});}

  window.autoPenalizeExpiredStage3TurnV957 = async function(){
    if(stage3RevealBusyV9557)return;
    if(stage3TurnPenaltyBusyV957)return;
    if(!audienceStage3ControlV958?.started || audienceStage3ControlV958?.paused)return;
    const turn=audienceStage3TurnV95||{};
    if(!turn.team || audienceActiveStage3V95?.id)return;
    if(!turn.turnStartedAtMs){stage3TurnPenaltyBusyV957=true;try{await db.collection('meta').doc('stage3Turn').set({turnStartedAtMs:Date.now(),turnDuration:gameFlowDurationV960('stage3Choice',15)},{merge:true});}finally{stage3TurnPenaltyBusyV957=false;}return;}
    if(stage3TurnLeftAdminV957()>0)return;
    stage3TurnPenaltyBusyV957=true;
    try{
      const docs=await teamsDocs();
      const t=docs.find(x=>same(x.id,turn.team)||same(x.name,turn.teamName));
      const row={name:turn.teamName||'الفريق',answer:'لم يختر سؤالًا خلال 15 ثانية',ok:false,points:-5,teamId:turn.team||''};
      if(t){
        const stageScores=Object.assign({stage1:0,stage2:0,stage3:0,stage4:0},t.stageScores||{});
        stageScores.stage3=Math.max(0,num(stageScores.stage3,0)-5);
        const score=Math.max(0,num(t.score,0)-5);
        const log={stage:'على المحك',question:'لم يتم اختيار سؤال ضمن الوقت',selected:'لم يختر سؤالًا',correct:'-',ok:false,points:-5,meta:'انتهى وقت اختيار السؤال',playerName:t.name||turn.teamName||'',time:new Date().toLocaleString('ar')};
        await t.ref.set({stageScores,score,answerLog:[...(t.answerLog||[]),log]},{merge:true});
        row.name=nameOf(t); row.teamId=t.id;
      }
      await db.collection('meta').doc('stage3Turn').set({turnStartedAtMs:null,turnDuration:0,paused:true},{merge:true});
      await publicReveal('stage3Reveal',{title:'انتهى وقت اختيار السؤال',rows:[row],questionId:'choice-timeout-'+Date.now(),questionText:'لم يتم اختيار سؤال'});
      inline('انتهى وقت اختيار السؤال',[row]);
      audienceModeV95='stage3';renderAudiencePanelV95?.(false);
      await sleep(12000);
      await db.collection('meta').doc('stage3Reveal').set({active:false,rows:[],updatedAt:Date.now()},{merge:true});
      await advanceStage3TurnAdminV95(turn.team);
      audienceModeV95='stage3';renderAudiencePanelV95?.(false);
    }catch(e){console.error('stage3 turn penalty failed',e)}
    finally{stage3TurnPenaltyBusyV957=false;}
  };

  const oldReveal3 = window.revealStage3AnswersV95;
  window.revealStage3AnswersV95 = async function(auto=false){
    if(typeof oldReveal3==='function') return await oldReveal3(auto);
  };
})();

/* ===== V9.5.56 FINAL: freeze timers during reveal and restart only after board returns ===== */
(function(){
  'use strict';
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
  const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const same=(a,b)=>{const A=String(a||'').trim(),B=String(b||'').trim(); if(!A||!B)return false; try{if(typeof sameTeamAdminV95==='function')return sameTeamAdminV95(A,B);}catch(e){} return A===B;};
  const nameOf=(t)=>String((typeof nameV9541==='function'?nameV9541(t):(t?.name||t?.id||'فريق'))||'فريق').trim();
  const esc=(x)=>String(x??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  let stage3RevealBusyV9557=false;
  let stage4RevealBusyV9557=false;
  async function teamsDocs(){ if(typeof getAllTeamDocsV95==='function')return await getAllTeamDocsV95(); const snap=await db.collection('teams').get(); const arr=[]; snap.forEach(d=>arr.push({id:d.id,ref:d.ref,...(d.data()||{})})); return arr; }
  function inline(title,rows){let host=document.getElementById('stageAudienceAdminRevealV9546'); if(!host){host=document.createElement('section');host.id='stageAudienceAdminRevealV9546';host.className='mini-card admin-inline-reveal-v9546';(document.getElementById('audience')||document.getElementById('control')||document.body).appendChild(host);} rows=Array.isArray(rows)?rows:[]; host.innerHTML=`<h3>${esc(title)}</h3><p class="muted">تم إرسال النتائج إلى شاشة الجمهور. المؤقتات متوقفة حتى انتهاء الإعلان.</p><div class="admin-inline-reveal-grid-v9546">${rows.map(r=>{const pts=n(r.points,0),cls=pts>0?'plus':(pts<0?'minus':'zero'),status=r.ok===null||r.ok===undefined?'لم يجب':(r.ok?'صحيحة':'خاطئة');return `<div class="admin-inline-reveal-row-v9546 ${cls}"><b>${esc(r.name||'فريق')}</b><span>${esc(r.answer||'لم يجب')}</span><em>${status}</em><strong>${pts>0?'+':''}${pts}</strong></div>`}).join('')}</div>`;}
  async function publicReveal(docName,payload){await db.collection('meta').doc(docName).set(Object.assign({active:true,revealId:String(Date.now())+'_'+Math.random().toString(36).slice(2),startedAtMs:Date.now(),holdMs:12000,updatedAt:Date.now()},payload),{merge:true});}
  async function stopStage3TimersForReveal(){
    const batch=db.batch();
    batch.set(db.collection('meta').doc('stage3Turn'),{paused:true,turnStartedAtMs:null,updatedAt:FieldValue.serverTimestamp()},{merge:true});
    batch.set(db.collection('meta').doc('activeStage3'),{status:'revealing',revealDone:true,startedAtMs:null},{merge:true});
    await batch.commit();
  }
  async function restartStage3TurnAfterReveal(ownerTeam){
    await db.collection('meta').doc('stage3Reveal').set({active:false,rows:[],updatedAt:Date.now()},{merge:true});
    await db.collection('meta').doc('activeStage3').set({id:null,team:null,teamName:null,status:'waiting',revealDone:false,startedAtMs:null},{merge:true});
    if(typeof advanceStage3TurnAdminV95==='function') await advanceStage3TurnAdminV95(ownerTeam);
    await db.collection('meta').doc('stage3Turn').set({paused:false,turnStartedAtMs:Date.now(),turnDuration:gameFlowDurationV960('stage3Choice',15),updatedAt:FieldValue.serverTimestamp()},{merge:true});
  }
  window.revealStage3AnswersV95 = async function(auto=false){
    const active=audienceActiveStage3V95; const info=(typeof activeStage3InfoAdminV95==='function')?activeStage3InfoAdminV95():null; if(!active||!info)return alert('لا يوجد سؤال مفتوح');
    if(typeof applyMissingStage3PenaltiesV95==='function') await applyMissingStage3PenaltiesV95(info,active);
    const docs=await teamsDocs(); const roundId='stage3_'+active.id+'_'+String(active.startedAtMs||'');
    const rows=docs.map(t=>{const a=t.progress?.stage3?.liveAnswers?.[roundId]||{}; const has=!!(a.answer||a.skipped||a.time); return {name:nameOf(t),answer:has?(a.answer||'لم يجب'):'لم يجب',ok:has?(a.ok===true?true:(a.ok===false?false:null)):null,points:n(a.points,0),teamId:t.id,isOwner:!!a.isOwner};}).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'));
    await stopStage3TimersForReveal();
    await publicReveal('stage3Reveal',{title:'إجابات المرحلة الثالثة',rows,questionId:active.id,questionText:info.text});
    inline('إجابات المرحلة الثالثة',rows);
    await db.collection('stage3Locks').doc(active.id).set({answered:true,answeredAt:FieldValue.serverTimestamp()},{merge:true});
    audienceModeV95='stage3'; renderAudiencePanelV95?.(false);
    setTimeout(async()=>{try{await restartStage3TurnAfterReveal(active.team); audienceModeV95='stage3'; renderAudiencePanelV95?.(false);}catch(e){console.error(e)}},revealDelayMs(rows));
  };
  window.revealStage4AnswersV95 = async function(auto=false){
    const live=audienceStage4LiveV95||{}; const info=(typeof stage4InfoAdminV95==='function')?stage4InfoAdminV95():null; if(!info||!live.startedAtMs)return alert('لا يوجد سؤال ظاهر');
    const docs=await teamsDocs(); const roundId='stage4_'+info.idx+'_'+String(live.startedAtMs||'manual');
    const rows=docs.map(t=>{const a=t.progress?.stage4?.liveAnswers?.[roundId]||{}; const has=!!(a.answer||a.skipped||a.time); return {name:nameOf(t),answer:has?(a.answer||'لم يجب'):'لم يجب',ok:has?(a.ok===true?true:(a.ok===false?false:null)):null,points:n(a.points,0),teamId:t.id};}).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'));
    await db.collection('meta').doc('stage4Live').set({status:'revealing',revealDone:true,startedAtMs:null},{merge:true});
    await publicReveal('stage4Reveal',{title:'إجابات المرحلة الرابعة',rows,questionIndex:info.idx});
    inline('إجابات المرحلة الرابعة',rows);
    audienceModeV95='stage4'; renderAudiencePanelV95?.(false);
    setTimeout(async()=>{try{await db.collection('meta').doc('stage4Reveal').set({active:false,rows:[],updatedAt:Date.now()},{merge:true});await db.collection('meta').doc('stage4Live').set({status:'revealed',revealDone:true,startedAtMs:null},{merge:true});renderAudiencePanelV95?.(false);}catch(e){console.error(e)}},revealDelayMs(rows));
  };
  const oldToggle = window.toggleStage3RunV958;
  if(typeof oldToggle==='function'){
    window.toggleStage3RunV958 = async function(){
      const res=await oldToggle.apply(this,arguments);
      try{
        if(audienceStage3ControlV958?.started && !audienceStage3ControlV958?.paused){
          await db.collection('meta').doc('stage3Turn').set({paused:false,turnStartedAtMs:Date.now(),turnDuration:Number(audienceStage3TurnV95?.turnDuration||15)||15,updatedAt:FieldValue.serverTimestamp()},{merge:true});
          if(audienceActiveStage3V95?.id && (audienceActiveStage3V95.status==='paused'||audienceActiveStage3V95.status==='locked')) await db.collection('meta').doc('activeStage3').set({status:'asking',paused:false,startedAtMs:Date.now(),duration:Number(audienceActiveStage3V95.duration||15)||15},{merge:true});
        }
      }catch(e){console.error(e)}
      return res;
    };
  }
  const oldAutoPenalty = window.autoPenalizeExpiredStage3TurnV957;
  if(typeof oldAutoPenalty==='function'){
    window.autoPenalizeExpiredStage3TurnV957 = async function(){
      const before=audienceStage3TurnV95?.team;
      const res=await oldAutoPenalty.apply(this,arguments);
      try{ if(before && audienceStage3ControlV958?.started && !audienceStage3ControlV958?.paused && !audienceActiveStage3V95?.id){ await db.collection('meta').doc('stage3Turn').set({paused:false,turnStartedAtMs:Date.now(),turnDuration:gameFlowDurationV960('stage3Choice',15),updatedAt:FieldValue.serverTimestamp()},{merge:true}); } }catch(e){console.error(e)}
      return res;
    };
  }
})();

/* ===== V9.5.57 FINAL: clean timer/reveal cycle, no immediate restart during reveal ===== */
(function(){
  'use strict';
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
  const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const same=(a,b)=>{const A=String(a||'').trim(),B=String(b||'').trim(); if(!A||!B)return false; try{if(typeof sameTeamAdminV95==='function')return sameTeamAdminV95(A,B);}catch(e){} return A===B;};
  const nameOf=(t)=>String((typeof nameV9541==='function'?nameV9541(t):(t?.name||t?.id||'فريق'))||'فريق').trim();
  const esc=(x)=>String(x??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  let stage3RevealBusyV9557=false;
  let stage4RevealBusyV9557=false;
  async function teamsDocs(){ if(typeof getAllTeamDocsV95==='function')return await getAllTeamDocsV95(); const snap=await db.collection('teams').get(); const arr=[]; snap.forEach(d=>arr.push({id:d.id,ref:d.ref,...(d.data()||{})})); return arr; }
  function basePoints(level){return ({'سهل':5,'متوسط':10,'صعب':15})[String(level||'').trim()]||5;}
  function inline(title,rows){
    let host=document.getElementById('stageAudienceAdminRevealV9546');
    if(!host){host=document.createElement('section');host.id='stageAudienceAdminRevealV9546';host.className='mini-card admin-inline-reveal-v9546';(document.getElementById('audience')||document.getElementById('control')||document.body).appendChild(host);}
    rows=Array.isArray(rows)?rows:[];
    host.innerHTML=`<h3>${esc(title)}</h3><p class="muted">تم إرسال النتائج إلى شاشة الجمهور. المؤقتات متوقفة حتى انتهاء الإعلان.</p><div class="admin-inline-reveal-grid-v9546">${rows.map(r=>{const pts=n(r.points,0),cls=pts>0?'plus':(pts<0?'minus':'zero'),status=r.ok===null||r.ok===undefined?'لم يجب':(r.ok?'صحيحة':'خاطئة');return `<div class="admin-inline-reveal-row-v9546 ${cls}"><b>${esc(r.name||'فريق')}</b><span>${esc(r.answer||'لم يجب')}</span><em>${status}</em><strong>${pts>0?'+':''}${pts}</strong></div>`}).join('')}</div>`;
  }
  async function publicReveal(docName,payload){
    await db.collection('meta').doc(docName).set(Object.assign({
      active:true,
      revealId:String(Date.now())+'_'+Math.random().toString(36).slice(2),
      startedAtMs:Date.now(),
      holdMs:12000,
      updatedAt:Date.now()
    },payload),{merge:true});
  }
  async function clearReveal(docName){await db.collection('meta').doc(docName).set({active:false,rows:[],updatedAt:Date.now()},{merge:true});}
  function revealDelayMs(rows){return 3000+(Math.max(1,Array.isArray(rows)?rows.length:1)*1800)+5000;}
  async function freezeStage3Timers(){
    const batch=db.batch();
    batch.set(db.collection('meta').doc('stage3Turn'),{paused:true,turnStartedAtMs:null,updatedAt:FieldValue.serverTimestamp()},{merge:true});
    batch.set(db.collection('meta').doc('activeStage3'),{status:'revealing',revealDone:true,startedAtMs:null,paused:true},{merge:true});
    await batch.commit();
  }
  async function restartStage3AfterReveal(ownerTeam){
    await clearReveal('stage3Reveal');
    await db.collection('meta').doc('activeStage3').set({id:null,team:null,teamName:null,status:'waiting',revealDone:false,startedAtMs:null,paused:false},{merge:true});
    if(typeof advanceStage3TurnAdminV95==='function') await advanceStage3TurnAdminV95(ownerTeam);
    await db.collection('meta').doc('stage3Turn').set({paused:false,turnStartedAtMs:Date.now(),turnDuration:gameFlowDurationV960('stage3Choice',15),updatedAt:FieldValue.serverTimestamp()},{merge:true});
  }
  async function buildStage3Rows(active,info){
    if(typeof applyMissingStage3PenaltiesV95==='function') await applyMissingStage3PenaltiesV95(info,active);
    const docs=await teamsDocs(); const roundId='stage3_'+active.id+'_'+String(active.startedAtMs||'');
    return docs.map(t=>{const a=t.progress?.stage3?.liveAnswers?.[roundId]||{}; const has=!!(a.answer||a.skipped||a.time); return {name:nameOf(t),answer:has?(a.answer||'لم يجب'):'لم يجب',ok:has?(a.ok===true?true:(a.ok===false?false:null)):null,points:n(a.points,0),teamId:t.id,isOwner:!!a.isOwner};}).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'));
  }
  window.revealStage3AnswersV95 = async function(auto=false){
    if(stage3RevealBusyV9557)return;
    stage3RevealBusyV9557=true;
    const active=audienceActiveStage3V95; const info=(typeof activeStage3InfoAdminV95==='function')?activeStage3InfoAdminV95():null;
    if(!active||!info){stage3RevealBusyV9557=false;return alert('لا يوجد سؤال مفتوح');}
    const rows=await buildStage3Rows(active,info);
    await freezeStage3Timers();
    await publicReveal('stage3Reveal',{title:'إجابات المرحلة الثالثة',rows,questionId:active.id,questionText:info.text});
    inline('إجابات المرحلة الثالثة',rows);
    await db.collection('stage3Locks').doc(active.id).set({answered:true,answeredAt:FieldValue.serverTimestamp()},{merge:true});
    audienceModeV95='stage3'; renderAudiencePanelV95?.(false);
    setTimeout(async()=>{try{await restartStage3AfterReveal(active.team); audienceModeV95='stage3'; renderAudiencePanelV95?.(false);}catch(e){console.error(e)}finally{stage3RevealBusyV9557=false;}},revealDelayMs(rows));
  };
  window.autoPenalizeExpiredStage3TurnV957 = async function(){
    if(stage3RevealBusyV9557)return;
    if(stage3TurnPenaltyBusyV957)return;
    if(!audienceStage3ControlV958?.started || audienceStage3ControlV958?.paused)return;
    if(audienceActiveStage3V95?.id)return;
    const turn=audienceStage3TurnV95||{};
    if(!turn.team)return;
    if(!turn.turnStartedAtMs){stage3TurnPenaltyBusyV957=true;try{await db.collection('meta').doc('stage3Turn').set({turnStartedAtMs:Date.now(),turnDuration:gameFlowDurationV960('stage3Choice',15),paused:false,updatedAt:FieldValue.serverTimestamp()},{merge:true});}finally{stage3TurnPenaltyBusyV957=false;}return;}
    if(typeof stage3TurnLeftAdminV957==='function' && stage3TurnLeftAdminV957()>0)return;
    stage3TurnPenaltyBusyV957=true;
    try{
      const docs=await teamsDocs();
      const t=docs.find(x=>same(x.id,turn.team)||same(x.name,turn.teamName));
      const row={name:turn.teamName||'الفريق',answer:'لم يختر سؤالًا خلال 15 ثانية',ok:false,points:-5,teamId:turn.team||''};
      if(t){
        const stageScores=Object.assign({stage1:0,stage2:0,stage3:0,stage4:0},t.stageScores||{});
        stageScores.stage3=Math.max(0,n(stageScores.stage3,0)-5);
        const score=Math.max(0,n(t.score,0)-5);
        const log={stage:'على المحك',question:'لم يتم اختيار سؤال ضمن الوقت',selected:'لم يختر سؤالًا',correct:'-',ok:false,points:-5,meta:'انتهى وقت اختيار السؤال',playerName:t.name||turn.teamName||'',time:new Date().toLocaleString('ar')};
        await t.ref.set({stageScores,score,answerLog:[...(t.answerLog||[]),log]},{merge:true});
        row.name=nameOf(t); row.teamId=t.id;
      }
      stage3RevealBusyV9557=true;
      await db.collection('meta').doc('stage3Turn').set({paused:true,turnStartedAtMs:null,turnDuration:0,updatedAt:FieldValue.serverTimestamp()},{merge:true});
      await publicReveal('stage3Reveal',{title:'انتهى وقت اختيار السؤال',rows:[row],questionId:'choice-timeout-'+Date.now(),questionText:'لم يتم اختيار سؤال'});
      inline('انتهى وقت اختيار السؤال',[row]);
      audienceModeV95='stage3'; renderAudiencePanelV95?.(false);
      setTimeout(async()=>{try{await restartStage3AfterReveal(turn.team); audienceModeV95='stage3'; renderAudiencePanelV95?.(false);}catch(e){console.error(e)}finally{stage3RevealBusyV9557=false;}},revealDelayMs(rows));
    }catch(e){console.error('stage3 turn penalty failed',e)}
    finally{stage3TurnPenaltyBusyV957=false;}
  };
  window.revealStage4AnswersV95 = async function(auto=false){
    if(stage4RevealBusyV9557)return;
    stage4RevealBusyV9557=true;
    const live=audienceStage4LiveV95||{}; const info=(typeof stage4InfoAdminV95==='function')?stage4InfoAdminV95():null;
    if(!info||!live.startedAtMs){stage4RevealBusyV9557=false;return alert('لا يوجد سؤال ظاهر');}
    const docs=await teamsDocs(); const roundId='stage4_'+info.idx+'_'+String(live.startedAtMs||'manual');
    const rows=docs.map(t=>{const a=t.progress?.stage4?.liveAnswers?.[roundId]||{}; const has=!!(a.answer||a.skipped||a.time); return {name:nameOf(t),answer:has?(a.answer||'لم يجب'):'لم يجب',ok:has?(a.ok===true?true:(a.ok===false?false:null)):null,points:n(a.points,0),teamId:t.id};}).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'));
    await db.collection('meta').doc('stage4Live').set({status:'revealing',revealDone:true,startedAtMs:null},{merge:true});
    await publicReveal('stage4Reveal',{title:'إجابات المرحلة الرابعة',rows,questionIndex:info.idx});
    inline('إجابات المرحلة الرابعة',rows);
    audienceModeV95='stage4'; renderAudiencePanelV95?.(false);
    setTimeout(async()=>{try{await clearReveal('stage4Reveal'); await db.collection('meta').doc('stage4Live').set({status:'revealed',revealDone:true,startedAtMs:null},{merge:true}); renderAudiencePanelV95?.(false);}catch(e){console.error(e)}finally{stage4RevealBusyV9557=false;}},revealDelayMs(rows));
  };
})();

// Global fallback for older reveal timers that may still reference this helper.
function revealDelayMs(rows){return 3000+(Math.max(1,Array.isArray(rows)?rows.length:1)*1800)+5000;}

/* ===== V9.5.59 QUICK FIX: Stage 3 reveal resumes turn timer and button always works ===== */
(function(){
  'use strict';
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
  const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const same=(a,b)=>{const A=String(a||'').trim(),B=String(b||'').trim(); if(!A||!B)return false; try{if(typeof sameTeamAdminV95==='function')return sameTeamAdminV95(A,B);}catch(e){} return A===B;};
  const esc=(x)=>String(x??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const teamTitle=(t)=>String((typeof nameV9541==='function'?nameV9541(t):(t?.name||t?.id||'فريق'))||'فريق').trim();
  let revealBusyV9559=false;
  let penaltyBusyV9559=false;
  function stage3RevealDuration(rows){return 3000 + Math.max(1,(Array.isArray(rows)?rows.length:1))*1900 + 3500;}
  async function teamDocs(){ if(typeof getAllTeamDocsV95==='function')return await getAllTeamDocsV95(); const snap=await db.collection('teams').get(); const arr=[]; snap.forEach(d=>arr.push({id:d.id,ref:d.ref,...(d.data()||{})})); return arr; }
  async function publishStage3Reveal(payload){
    await db.collection('meta').doc('stage3Reveal').set(Object.assign({
      active:true,
      revealId:'stage3_'+Date.now()+'_'+Math.random().toString(36).slice(2),
      startedAtMs:Date.now(),
      holdMs:12000,
      updatedAt:Date.now()
    },payload),{merge:true});
  }
  async function clearStage3Reveal(){await db.collection('meta').doc('stage3Reveal').set({active:false,rows:[],answers:[],results:[],updatedAt:Date.now()},{merge:true});}
  async function freezeStage3(){
    const batch=db.batch();
    batch.set(db.collection('meta').doc('stage3Turn'),{paused:true,turnStartedAtMs:null,updatedAt:FieldValue.serverTimestamp()},{merge:true});
    batch.set(db.collection('meta').doc('activeStage3'),{status:'revealing',revealDone:true,paused:true,startedAtMs:null},{merge:true});
    await batch.commit();
  }
  async function resumeStage3AfterReveal(ownerTeam){
    await clearStage3Reveal();
    await db.collection('meta').doc('activeStage3').set({id:null,team:null,teamName:null,status:'waiting',revealDone:false,paused:false,startedAtMs:null},{merge:true});
    if(typeof advanceStage3TurnAdminV95==='function') await advanceStage3TurnAdminV95(ownerTeam);
    await db.collection('meta').doc('stage3Turn').set({paused:false,turnStartedAtMs:Date.now(),turnDuration:gameFlowDurationV960('stage3Choice',15),updatedAt:FieldValue.serverTimestamp()},{merge:true});
    audienceModeV95='stage3';
    renderAudiencePanelV95?.(false);
  }
  function inlineReveal(title,rows){
    let host=document.getElementById('stageAudienceAdminRevealV9546');
    if(!host){host=document.createElement('section');host.id='stageAudienceAdminRevealV9546';host.className='mini-card admin-inline-reveal-v9546';(document.getElementById('audience')||document.getElementById('control')||document.body).appendChild(host);}
    rows=Array.isArray(rows)?rows:[];
    host.innerHTML=`<h3>${esc(title)}</h3><p class="muted">تم إرسال النتائج إلى شاشة الجمهور. سيبدأ مؤقت الاختيار بعد انتهاء العرض.</p><div class="admin-inline-reveal-grid-v9546">${rows.map(r=>{const pts=n(r.points,0),cls=pts>0?'plus':(pts<0?'minus':'zero'),status=r.ok===null||r.ok===undefined?'لم يجب':(r.ok?'صحيحة':'خاطئة');return `<div class="admin-inline-reveal-row-v9546 ${cls}"><b>${esc(r.name||'فريق')}</b><span>${esc(r.answer||'لم يجب')}</span><em>${status}</em><strong>${pts>0?'+':''}${pts}</strong></div>`}).join('')}</div>`;
  }
  async function buildRows(active,info){
    if(typeof applyMissingStage3PenaltiesV95==='function') await applyMissingStage3PenaltiesV95(info,active);
    const docs=await teamDocs();
    const roundId='stage3_'+active.id+'_'+String(active.startedAtMs||'');
    return docs.map(t=>{
      const a=t.progress?.stage3?.liveAnswers?.[roundId]||{};
      const has=!!(a.answer||a.skipped||a.time);
      return {name:teamTitle(t),answer:has?(a.answer||'لم يجب'):'لم يجب',ok:has?(a.ok===true?true:(a.ok===false?false:null)):null,points:n(a.points,0),teamId:t.id,isOwner:!!a.isOwner};
    }).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'));
  }
  window.revealStage3AnswersV95 = async function(auto=false){
    if(revealBusyV9559) return;
    const active=audienceActiveStage3V95;
    const info=(typeof activeStage3InfoAdminV95==='function')?activeStage3InfoAdminV95():null;
    if(!active||!active.id||!info) return alert('لا يوجد سؤال مفتوح');
    revealBusyV9559=true;
    try{
      const rows=await buildRows(active,info);
      await freezeStage3();
      await publishStage3Reveal({title:'إجابات المرحلة الثالثة',rows,answers:rows,results:rows,questionId:active.id,questionText:info.text});
      inlineReveal('إجابات المرحلة الثالثة',rows);
      await db.collection('stage3Locks').doc(active.id).set({answered:true,answeredAt:FieldValue.serverTimestamp()},{merge:true});
      audienceModeV95='stage3'; renderAudiencePanelV95?.(false);
      setTimeout(async()=>{
        try{ await resumeStage3AfterReveal(active.team); }
        catch(e){ console.error('resume stage3 after reveal failed',e); }
        finally{ revealBusyV9559=false; }
      }, stage3RevealDuration(rows));
    }catch(e){ revealBusyV9559=false; console.error(e); alert('تعذر إظهار علامات المرحلة الثالثة'); }
  };
  window.autoPenalizeExpiredStage3TurnV957 = async function(){
    if(revealBusyV9559||penaltyBusyV9559) return;
    if(!audienceStage3ControlV958?.started || audienceStage3ControlV958?.paused) return;
    if(audienceActiveStage3V95?.id) return;
    const turn=audienceStage3TurnV95||{};
    if(!turn.team) return;
    if(!turn.turnStartedAtMs){
      penaltyBusyV9559=true;
      try{await db.collection('meta').doc('stage3Turn').set({paused:false,turnStartedAtMs:Date.now(),turnDuration:Number(turn.turnDuration||15)||15,updatedAt:FieldValue.serverTimestamp()},{merge:true});}
      finally{penaltyBusyV9559=false;}
      return;
    }
    const left=(typeof stage3TurnLeftAdminV957==='function')?stage3TurnLeftAdminV957():Math.max(0,(Number(turn.turnDuration||15)||15)-Math.floor((Date.now()-Number(turn.turnStartedAtMs||0))/1000));
    if(left>0) return;
    penaltyBusyV9559=true; revealBusyV9559=true;
    try{
      const docs=await teamDocs();
      const t=docs.find(x=>same(x.id,turn.team)||same(x.name,turn.teamName));
      const row={name:turn.teamName||'الفريق',answer:'لم يختر سؤالًا خلال 15 ثانية',ok:false,points:-5,teamId:turn.team||''};
      if(t){
        const stageScores=Object.assign({stage1:0,stage2:0,stage3:0,stage4:0},t.stageScores||{});
        stageScores.stage3=Math.max(0,n(stageScores.stage3,0)-5);
        const score=Math.max(0,n(t.score,0)-5);
        const log={stage:'على المحك',question:'لم يتم اختيار سؤال ضمن الوقت',selected:'لم يختر سؤالًا',correct:'-',ok:false,points:-5,meta:'انتهى وقت اختيار السؤال',playerName:t.name||turn.teamName||'',time:new Date().toLocaleString('ar')};
        await t.ref.set({stageScores,score,answerLog:[...(t.answerLog||[]),log]},{merge:true});
        row.name=teamTitle(t); row.teamId=t.id;
      }
      await db.collection('meta').doc('stage3Turn').set({paused:true,turnStartedAtMs:null,turnDuration:0,updatedAt:FieldValue.serverTimestamp()},{merge:true});
      await publishStage3Reveal({title:'انتهى وقت اختيار السؤال',rows:[row],answers:[row],results:[row],questionId:'choice-timeout-'+Date.now(),questionText:'لم يتم اختيار سؤال'});
      inlineReveal('انتهى وقت اختيار السؤال',[row]);
      audienceModeV95='stage3'; renderAudiencePanelV95?.(false);
      setTimeout(async()=>{
        try{ await resumeStage3AfterReveal(turn.team); }
        catch(e){ console.error('resume stage3 after timeout failed',e); }
        finally{ revealBusyV9559=false; penaltyBusyV9559=false; }
      }, stage3RevealDuration([row]));
    }catch(e){ console.error('stage3 timeout penalty failed',e); revealBusyV9559=false; penaltyBusyV9559=false; }
  };
})();

/* ===== V9.5.60 FINAL: fixed 14s reveal pause and no choice during reveal ===== */
(function(){
  'use strict';
  const REVEAL_TOTAL_MS = 14000;
  const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const same=(a,b)=>{const A=String(a||'').trim(),B=String(b||'').trim(); if(!A||!B)return false; try{if(typeof sameTeamAdminV95==='function')return sameTeamAdminV95(A,B);}catch(e){} return A===B;};
  const esc=(x)=>String(x??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const teamTitle=(t)=>String((typeof nameV9541==='function'?nameV9541(t):(t?.name||t?.id||'فريق'))||'فريق').trim();
  let revealBusy=false, penaltyBusy=false;
  async function teamDocs(){ if(typeof getAllTeamDocsV95==='function')return await getAllTeamDocsV95(); const snap=await db.collection('teams').get(); const arr=[]; snap.forEach(d=>arr.push({id:d.id,ref:d.ref,...(d.data()||{})})); return arr; }
  async function publishReveal(docName,payload){
    await db.collection('meta').doc(docName).set(Object.assign({
      active:true,
      revealId:docName+'_'+Date.now()+'_'+Math.random().toString(36).slice(2),
      startedAtMs:Date.now(),
      durationMs:REVEAL_TOTAL_MS,
      holdMs:REVEAL_TOTAL_MS,
      updatedAt:Date.now()
    },payload),{merge:true});
  }
  async function clearReveal(docName){ await db.collection('meta').doc(docName).set({active:false,rows:[],answers:[],results:[],updatedAt:Date.now()},{merge:true}); }
  async function freezeStage3ForReveal(){
    const batch=db.batch();
    batch.set(db.collection('meta').doc('stage3Turn'),{paused:true,turnStartedAtMs:null,turnDuration:0,revealPaused:true,updatedAt:FieldValue.serverTimestamp()},{merge:true});
    batch.set(db.collection('meta').doc('activeStage3'),{status:'revealing',revealDone:true,paused:true,startedAtMs:null},{merge:true});
    await batch.commit();
  }
  async function resumeStage3(ownerTeam){
    await clearReveal('stage3Reveal');
    await db.collection('meta').doc('activeStage3').set({id:null,team:null,teamName:null,status:'waiting',revealDone:false,paused:false,startedAtMs:null},{merge:true});
    if(typeof advanceStage3TurnAdminV95==='function') await advanceStage3TurnAdminV95(ownerTeam);
    await db.collection('meta').doc('stage3Turn').set({paused:false,revealPaused:false,turnStartedAtMs:Date.now(),turnDuration:gameFlowDurationV960('stage3Choice',15),updatedAt:FieldValue.serverTimestamp()},{merge:true});
    audienceModeV95='stage3'; renderAudiencePanelV95?.(false);
  }
  function inline(title,rows){
    let host=document.getElementById('stageAudienceAdminRevealV9546');
    if(!host){host=document.createElement('section');host.id='stageAudienceAdminRevealV9546';host.className='mini-card admin-inline-reveal-v9546';(document.getElementById('audience')||document.getElementById('control')||document.body).appendChild(host);}
    rows=Array.isArray(rows)?rows:[];
    host.innerHTML=`<h3>${esc(title)}</h3><p class="muted">تم إرسال النتائج إلى شاشة الجمهور. مؤقت اختيار السؤال متوقف 14 ثانية حتى انتهاء الإعلان.</p><div class="admin-inline-reveal-grid-v9546">${rows.map(r=>{const pts=n(r.points,0),cls=pts>0?'plus':(pts<0?'minus':'zero'),status=r.ok===null||r.ok===undefined?'لم يجب':(r.ok?'صحيحة':'خاطئة');return `<div class="admin-inline-reveal-row-v9546 ${cls}"><b>${esc(r.name||'فريق')}</b><span>${esc(r.answer||'لم يجب')}</span><em>${status}</em><strong>${pts>0?'+':''}${pts}</strong></div>`}).join('')}</div>`;
  }
  async function buildStage3Rows(active,info){
    if(typeof applyMissingStage3PenaltiesV95==='function') await applyMissingStage3PenaltiesV95(info,active);
    const docs=await teamDocs(); const roundId='stage3_'+active.id+'_'+String(active.startedAtMs||'');
    return docs.map(t=>{const a=t.progress?.stage3?.liveAnswers?.[roundId]||{}; const has=!!(a.answer||a.skipped||a.time); return {name:teamTitle(t),answer:has?(a.answer||'لم يجب'):'لم يجب',ok:has?(a.ok===true?true:(a.ok===false?false:null)):null,points:n(a.points,0),teamId:t.id,isOwner:!!a.isOwner};}).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'));
  }
  window.revealStage3AnswersV95 = async function(auto=false){
    if(revealBusy) return;
    const active=audienceActiveStage3V95;
    const info=(typeof activeStage3InfoAdminV95==='function')?activeStage3InfoAdminV95():null;
    if(!active||!active.id||!info) return alert('لا يوجد سؤال مفتوح');
    revealBusy=true;
    try{
      const rows=await buildStage3Rows(active,info);
      await freezeStage3ForReveal();
      await publishReveal('stage3Reveal',{title:'إجابات المرحلة الثالثة',rows,answers:rows,results:rows,questionId:active.id,questionText:info.text});
      inline('إجابات المرحلة الثالثة',rows);
      await db.collection('stage3Locks').doc(active.id).set({answered:true,answeredAt:FieldValue.serverTimestamp()},{merge:true});
      audienceModeV95='stage3'; renderAudiencePanelV95?.(false);
      setTimeout(async()=>{try{await resumeStage3(active.team);}catch(e){console.error('resume stage3 failed',e)}finally{revealBusy=false;}},REVEAL_TOTAL_MS);
    }catch(e){console.error(e); revealBusy=false; alert('تعذر إظهار علامات المرحلة الثالثة');}
  };
  window.autoPenalizeExpiredStage3TurnV957 = async function(){
    if(revealBusy||penaltyBusy) return;
    if(!audienceStage3ControlV958?.started || audienceStage3ControlV958?.paused) return;
    if(audienceActiveStage3V95?.id) return;
    const turn=audienceStage3TurnV95||{};
    if(!turn.team) return;
    if(turn.paused || turn.revealPaused) return;
    if(!turn.turnStartedAtMs){penaltyBusy=true;try{await db.collection('meta').doc('stage3Turn').set({paused:false,revealPaused:false,turnStartedAtMs:Date.now(),turnDuration:Number(turn.turnDuration||15)||15,updatedAt:FieldValue.serverTimestamp()},{merge:true});}finally{penaltyBusy=false;}return;}
    const left=(typeof stage3TurnLeftAdminV957==='function')?stage3TurnLeftAdminV957():Math.max(0,(Number(turn.turnDuration||15)||15)-Math.floor((Date.now()-Number(turn.turnStartedAtMs||0))/1000));
    if(left>0) return;
    penaltyBusy=true; revealBusy=true;
    try{
      const docs=await teamDocs();
      const t=docs.find(x=>same(x.id,turn.team)||same(x.name,turn.teamName));
      const row={name:turn.teamName||'الفريق',answer:'لم يختر سؤالًا خلال 15 ثانية',ok:false,points:-5,teamId:turn.team||''};
      if(t){
        const stageScores=Object.assign({stage1:0,stage2:0,stage3:0,stage4:0},t.stageScores||{});
        stageScores.stage3=Math.max(0,n(stageScores.stage3,0)-5);
        const score=Math.max(0,n(t.score,0)-5);
        const log={stage:'على المحك',question:'لم يتم اختيار سؤال ضمن الوقت',selected:'لم يختر سؤالًا',correct:'-',ok:false,points:-5,meta:'انتهى وقت اختيار السؤال',playerName:t.name||turn.teamName||'',time:new Date().toLocaleString('ar')};
        await t.ref.set({stageScores,score,answerLog:[...(t.answerLog||[]),log]},{merge:true});
        row.name=teamTitle(t); row.teamId=t.id;
      }
      await freezeStage3ForReveal();
      await publishReveal('stage3Reveal',{title:'انتهى وقت اختيار السؤال',rows:[row],answers:[row],results:[row],questionId:'choice-timeout-'+Date.now(),questionText:'لم يتم اختيار سؤال'});
      inline('انتهى وقت اختيار السؤال',[row]);
      audienceModeV95='stage3'; renderAudiencePanelV95?.(false);
      setTimeout(async()=>{try{await resumeStage3(turn.team);}catch(e){console.error('resume after timeout failed',e)}finally{revealBusy=false; penaltyBusy=false;}},REVEAL_TOTAL_MS);
    }catch(e){console.error('stage3 timeout penalty failed',e); revealBusy=false; penaltyBusy=false;}
  };
  window.revealStage4AnswersV95 = async function(auto=false){
    const live=audienceStage4LiveV95||{}; const info=(typeof stage4InfoAdminV95==='function')?stage4InfoAdminV95():null;
    if(!info||!live.startedAtMs) return alert('لا يوجد سؤال ظاهر');
    const docs=await teamDocs(); const roundId='stage4_'+info.idx+'_'+String(live.startedAtMs||'manual');
    const rows=docs.map(t=>{const a=t.progress?.stage4?.liveAnswers?.[roundId]||{}; const has=!!(a.answer||a.skipped||a.time); return {name:teamTitle(t),answer:has?(a.answer||'لم يجب'):'لم يجب',ok:has?(a.ok===true?true:(a.ok===false?false:null)):null,points:n(a.points,0),teamId:t.id};}).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'));
    await db.collection('meta').doc('stage4Live').set({status:'revealing',revealDone:true,startedAtMs:null},{merge:true});
    await publishReveal('stage4Reveal',{title:'إجابات المرحلة الرابعة',rows,answers:rows,results:rows,questionIndex:info.idx});
    inline('إجابات المرحلة الرابعة',rows);
    audienceModeV95='stage4'; renderAudiencePanelV95?.(false);
    setTimeout(async()=>{try{await clearReveal('stage4Reveal'); await db.collection('meta').doc('stage4Live').set({status:'revealed',revealDone:true,startedAtMs:null},{merge:true}); renderAudiencePanelV95?.(false);}catch(e){console.error(e)}},REVEAL_TOTAL_MS);
  };
})();

/* ===== V9.5.61 FINAL: make audience window reopenable + ensure stage3 resumes not paused ===== */
(function(){
  'use strict';
  window.openAudienceWindowV9561=function(mode='stage3'){
    const url='audience.html?mode='+encodeURIComponent(mode)+'&t='+Date.now();
    const w=window.open(url,'_blank','noopener');
    if(!w) alert('اسمح بفتح النوافذ المنبثقة ثم حاول مرة أخرى.');
    return false;
  };
  document.addEventListener('click',function(e){
    const a=e.target && e.target.closest ? e.target.closest('a[href^="audience.html"]') : null;
    if(!a) return;
    e.preventDefault();
    try{
      const u=new URL(a.getAttribute('href'), location.href);
      openAudienceWindowV9561(u.searchParams.get('mode')||'stage3');
    }catch(err){ openAudienceWindowV9561('stage3'); }
  },true);
  const oldAdvance=window.advanceStage3TurnAdminV95;
  if(typeof oldAdvance==='function'){
    window.advanceStage3TurnAdminV95=async function(ownerId){
      const res=await oldAdvance(ownerId);
      try{
        await db.collection('meta').doc('stage3Control').set({started:true,paused:false,updatedAt:FieldValue.serverTimestamp()},{merge:true});
        await db.collection('meta').doc('stage3Turn').set({paused:false,revealPaused:false,turnStartedAtMs:Date.now(),turnDuration:gameFlowDurationV960('stage3Choice',15),updatedAt:FieldValue.serverTimestamp()},{merge:true});
      }catch(e){console.error('stage3 resume normalization failed',e)}
      return res;
    };
  }
})();




/* ===== V9.5.83 CLEAN STAGE 3: single timer + single reveal source ===== */
(function(){
  'use strict';

  const STAGE3_REVEAL_MS_CLEAN = 18000; // 3s countdown + 15s results
  let stage3CleanBusy = false;

  function n(v,d=0){ return Number.isFinite(Number(v)) ? Number(v) : d; }
  function same(a,b){
    try { return typeof sameTeamAdminV95 === 'function' ? sameTeamAdminV95(a,b) : String(a||'') === String(b||''); }
    catch(e){ return String(a||'') === String(b||''); }
  }
  function tName(t){
    try { return String((typeof nameV9541 === 'function' ? nameV9541(t) : (t?.name || t?.id || 'فريق')) || 'فريق').trim(); }
    catch(e){ return String(t?.name || t?.id || 'فريق').trim(); }
  }
  async function allTeams(){
    if(typeof getAllTeamDocsV95 === 'function') return await getAllTeamDocsV95();
    const snap = await db.collection('teams').get();
    const arr=[]; snap.forEach(d=>arr.push({id:d.id, ref:d.ref, ...(d.data()||{})}));
    return arr;
  }
  function latestAnswer(obj){
    if(!obj || typeof obj !== 'object') return {};
    const vals = Object.values(obj).filter(Boolean);
    if(!vals.length) return {};
    vals.sort((a,b)=>n(a.time,0)-n(b.time,0));
    return vals[vals.length-1] || {};
  }
  function answerFrom(progress, roundId){
    const live = progress?.liveAnswers || {};
    const ans = progress?.answers || {};
    return live[roundId] || ans[roundId] || latestAnswer(live) || latestAnswer(ans) || {};
  }
  function stage3InfoClean(active){
    if(typeof activeStage3InfoAdminV95 === 'function'){
      const info = activeStage3InfoAdminV95();
      if(info) return info;
    }
    return active?.questionText ? { text: active.questionText, cat:{cat: active.category || ''}, level: active.level || '' } : null;
  }
  async function clearStage3Reveal(){
    await db.collection('meta').doc('stage3Reveal').set({
      active:false,
      rows:[],
      answers:[],
      results:[],
      updatedAt:Date.now()
    }, {merge:true});
  }
  async function publishStage3Reveal(title, rows, extra={}){
    rows = Array.isArray(rows) ? rows : [];
    await db.collection('meta').doc('stage3Reveal').set(Object.assign({
      active:true,
      title,
      rows,
      answers:rows,
      results:rows,
      revealId:'stage3_clean_'+Date.now()+'_'+Math.random().toString(36).slice(2),
      startedAtMs:Date.now(),
      durationMs:STAGE3_REVEAL_MS_CLEAN,
      holdMs:STAGE3_REVEAL_MS_CLEAN,
      updatedAt:Date.now()
    }, extra), {merge:true});
  }
  async function freezeStage3(){
    const batch = db.batch();
    batch.set(db.collection('meta').doc('stage3Turn'), {
      paused:true,
      revealPaused:true,
      turnStartedAtMs:null,
      turnDuration:0,
      updatedAt:FieldValue.serverTimestamp()
    }, {merge:true});
    batch.set(db.collection('meta').doc('activeStage3'), {
      status:'revealing',
      revealDone:true,
      paused:true,
      startedAtMs:null,
      updatedAt:Date.now()
    }, {merge:true});
    await batch.commit();
  }
  async function nextTurnAfterReveal(ownerTeam){
    await clearStage3Reveal();
    await db.collection('meta').doc('activeStage3').set({
      id:null,
      team:null,
      teamName:null,
      status:'waiting',
      revealDone:false,
      paused:false,
      startedAtMs:null,
      updatedAt:Date.now()
    }, {merge:true});
    if(typeof advanceStage3TurnAdminV95 === 'function') await advanceStage3TurnAdminV95(ownerTeam);
    await db.collection('meta').doc('stage3Turn').set({
      paused:false,
      revealPaused:false,
      turnStartedAtMs:Date.now(),
      turnDuration:gameFlowDurationV960('stage3Choice',15),
      updatedAt:FieldValue.serverTimestamp()
    }, {merge:true});
    window.audienceModeV95='stage3';
    if(typeof renderAudiencePanelV95 === 'function') renderAudiencePanelV95(false);
  }
  async function rowsForOpenQuestion(active, info){
    if(typeof applyMissingStage3PenaltiesV95 === 'function') await applyMissingStage3PenaltiesV95(info, active);
    const docs = await allTeams();
    const roundId = 'stage3_' + active.id + '_' + String(active.startedAtMs || '');
    return docs.map(t=>{
      const a = answerFrom(t.progress?.stage3, roundId);
      const has = !!(a.answer || a.selected || a.skipped || a.time);
      return {
        name:tName(t),
        answer:has ? (a.answer || a.selected || 'لم يجب') : 'لم يجب',
        ok:has ? (a.ok === true ? true : (a.ok === false ? false : null)) : null,
        points:n(a.points,0),
        teamId:t.id
      };
    }).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'));
  }
  async function timeoutRowAndPenalty(turn){
    const docs = await allTeams();
    const t = docs.find(x=>same(x.id, turn.team) || same(x.name, turn.teamName));
    const row = { name: turn.teamName || 'الفريق صاحب الدور', answer:'لم يختار سؤال', ok:false, points:-5, teamId:turn.team || '' };

    if(t){
      const lockId = 'stage3_clean_timeout_' + String(turn.team || t.id) + '_' + String(turn.turnStartedAtMs || '');
      const lockRef = db.collection('stage3TimeoutLocks').doc(lockId.replace(/[^\w\u0600-\u06FF-]/g,'_'));
      let already = false;
      await db.runTransaction(async tx=>{
        const s = await tx.get(lockRef);
        if(s.exists){ already = true; return; }
        tx.set(lockRef, {done:true, team:t.id, at:Date.now()});
      });
      if(!already){
        const stageScores = Object.assign({stage1:0,stage2:0,stage3:0,stage4:0}, t.stageScores || {});
        stageScores.stage3 = Math.max(0, n(stageScores.stage3,0) - 5);
        const score = Math.max(0, n(t.score,0) - 5);
        const log = {
          stage:'على المحك',
          question:'انتهى وقت اختيار السؤال',
          selected:'لم يختار سؤال',
          correct:'-',
          ok:false,
          points:-5,
          meta:'انتهى وقت اختيار السؤال',
          playerName:t.name || turn.teamName || '',
          time:new Date().toLocaleString('ar')
        };
        await t.ref.set({ stageScores, score, answerLog:[...(t.answerLog||[]), log] }, {merge:true});
      }
      row.name = tName(t);
      row.teamId = t.id;
    }
    return row;
  }

  window.revealStage3AnswersV95 = async function(auto=false){
    if(stage3CleanBusy) return;
    const active = window.audienceActiveStage3V95 || {};
    const info = stage3InfoClean(active);
    if(!active?.id || !info){
      if(auto) return;
      return alert('لا يوجد سؤال مفتوح');
    }
    stage3CleanBusy = true;
    try{
      const rows = await rowsForOpenQuestion(active, info);
      await freezeStage3();
      await publishStage3Reveal('إجابات المرحلة الثالثة', rows, {questionId:active.id, questionText:info.text});
      try{ await db.collection('stage3Locks').doc(active.id).set({answered:true,answeredAt:FieldValue.serverTimestamp()},{merge:true}); }catch(e){}
      window.audienceModeV95='stage3';
      if(typeof renderAudiencePanelV95 === 'function') renderAudiencePanelV95(false);
      setTimeout(async()=>{
        try{ await nextTurnAfterReveal(active.team); }
        catch(e){ console.error('stage3 clean next turn failed', e); }
        finally{ stage3CleanBusy=false; }
      }, STAGE3_REVEAL_MS_CLEAN);
    }catch(e){
      console.error('stage3 clean reveal failed', e);
      stage3CleanBusy=false;
      if(!auto) alert('تعذر إظهار نتائج المرحلة الثالثة');
    }
  };

  window.autoPenalizeExpiredStage3TurnV957 = async function(){
    if(stage3CleanBusy) return;
    if(String(window.audienceModeV95||'') === 'stage4') return;
    const ctrl = window.audienceStage3ControlV958 || {};
    if(ctrl.paused) return;
    const active = window.audienceActiveStage3V95 || {};
    if(active?.id) return;

    const turn = window.audienceStage3TurnV95 || {};
    if(!turn.team && !turn.teamName) return;
    if(turn.paused || turn.revealPaused) return;

    const duration = n(turn.turnDuration, 15) || 15;
    if(!turn.turnStartedAtMs){
      await db.collection('meta').doc('stage3Turn').set({
        paused:false,
        revealPaused:false,
        turnStartedAtMs:Date.now(),
        turnDuration:duration,
        updatedAt:FieldValue.serverTimestamp()
      }, {merge:true});
      return;
    }

    const left = Math.max(0, duration - Math.floor((Date.now() - n(turn.turnStartedAtMs,Date.now())) / 1000));
    if(left > 0) return;

    stage3CleanBusy = true;
    try{
      const row = await timeoutRowAndPenalty(turn);
      await freezeStage3();
      await publishStage3Reveal('انتهى وقت اختيار السؤال', [row], {questionText:'لم يختار سؤال'});
      window.audienceModeV95='stage3';
      if(typeof renderAudiencePanelV95 === 'function') renderAudiencePanelV95(false);
      setTimeout(async()=>{
        try{ await nextTurnAfterReveal(turn.team); }
        catch(e){ console.error('stage3 clean timeout next turn failed', e); }
        finally{ stage3CleanBusy=false; }
      }, STAGE3_REVEAL_MS_CLEAN);
    }catch(e){
      console.error('stage3 clean timeout failed', e);
      stage3CleanBusy=false;
    }
  };
})();


/* ===== V9.5.84 FINAL FIX: bind stage3 clean functions to real moderator variables ===== */
(function(){
  'use strict';

  const STAGE3_FINAL_REVEAL_MS_9584 = 18000; // 3s countdown + 15s result display
  let stage3FinalBusy9584 = false;

  function n9584(v,d=0){ return Number.isFinite(Number(v)) ? Number(v) : d; }
  function same9584(a,b){
    try { return typeof sameTeamAdminV95 === 'function' ? sameTeamAdminV95(a,b) : String(a||'') === String(b||''); }
    catch(e){ return String(a||'') === String(b||''); }
  }
  function teamName9584(t){
    try { return String((typeof nameV9541 === 'function' ? nameV9541(t) : (t?.name || t?.id || 'فريق')) || 'فريق').trim(); }
    catch(e){ return String(t?.name || t?.id || 'فريق').trim(); }
  }
  async function teamDocs9584(){
    if(typeof getAllTeamDocsV95 === 'function') return await getAllTeamDocsV95();
    const snap = await db.collection('teams').get();
    const arr = [];
    snap.forEach(d => arr.push({id:d.id, ref:d.ref, ...(d.data()||{})}));
    return arr;
  }
  function latestAnswer9584(obj){
    if(!obj || typeof obj !== 'object') return {};
    const vals = Object.values(obj).filter(Boolean);
    if(!vals.length) return {};
    vals.sort((a,b)=>n9584(a.time,0)-n9584(b.time,0));
    return vals[vals.length-1] || {};
  }
  function getAnswer9584(progress, roundId){
    const live = progress?.liveAnswers || {};
    const ans = progress?.answers || {};
    return live[roundId] || ans[roundId] || latestAnswer9584(live) || latestAnswer9584(ans) || {};
  }
  function currentStage3Info9584(active){
    if(typeof activeStage3InfoAdminV95 === 'function'){
      const info = activeStage3InfoAdminV95();
      if(info) return info;
    }
    return active?.questionText ? {text:active.questionText, cat:{cat:active.category||''}, level:active.level||''} : null;
  }

  async function publishStage3Reveal9584(title, rows, extra={}){
    rows = Array.isArray(rows) ? rows : [];
    await db.collection('meta').doc('stage3Reveal').set(Object.assign({
      active:true,
      title,
      rows,
      answers:rows,
      results:rows,
      revealId:'stage3_final_9584_'+Date.now()+'_'+Math.random().toString(36).slice(2),
      startedAtMs:Date.now(),
      durationMs:STAGE3_FINAL_REVEAL_MS_9584,
      holdMs:STAGE3_FINAL_REVEAL_MS_9584,
      updatedAt:Date.now()
    }, extra), {merge:true});
  }

  async function clearStage3Reveal9584(){
    await db.collection('meta').doc('stage3Reveal').set({
      active:false,
      rows:[],
      answers:[],
      results:[],
      updatedAt:Date.now()
    }, {merge:true});
  }

  async function freezeStage3ForReveal9584(){
    const batch = db.batch();
    batch.set(db.collection('meta').doc('stage3Turn'), {
      paused:true,
      revealPaused:true,
      turnStartedAtMs:null,
      turnDuration:0,
      updatedAt:FieldValue.serverTimestamp()
    }, {merge:true});
    batch.set(db.collection('meta').doc('activeStage3'), {
      status:'revealing',
      revealDone:true,
      paused:true,
      startedAtMs:null,
      updatedAt:Date.now()
    }, {merge:true});
    await batch.commit();
  }

  async function resumeStage3AfterReveal9584(ownerTeam){
    await clearStage3Reveal9584();
    await db.collection('meta').doc('activeStage3').set({
      id:null,
      team:null,
      teamName:null,
      status:'waiting',
      revealDone:false,
      paused:false,
      startedAtMs:null,
      updatedAt:Date.now()
    }, {merge:true});

    if(typeof advanceStage3TurnAdminV95 === 'function'){
      await advanceStage3TurnAdminV95(ownerTeam);
    }

    await db.collection('meta').doc('stage3Turn').set({
      paused:false,
      revealPaused:false,
      turnStartedAtMs:Date.now(),
      turnDuration:gameFlowDurationV960('stage3Choice',15),
      updatedAt:FieldValue.serverTimestamp()
    }, {merge:true});

    audienceModeV95 = 'stage3';
    if(typeof renderAudiencePanelV95 === 'function') renderAudiencePanelV95(false);
  }

  async function rowsForOpenStage3Question9584(active, info){
    if(typeof applyMissingStage3PenaltiesV95 === 'function') {
      await applyMissingStage3PenaltiesV95(info, active);
    }
    const docs = await teamDocs9584();
    const roundId = 'stage3_' + active.id + '_' + String(active.startedAtMs || '');
    return docs.map(t=>{
      const a = getAnswer9584(t.progress?.stage3, roundId);
      const has = !!(a.answer || a.selected || a.skipped || a.time);
      return {
        name:teamName9584(t),
        answer:has ? (a.answer || a.selected || 'لم يجب') : 'لم يجب',
        ok:has ? (a.ok === true ? true : (a.ok === false ? false : null)) : null,
        points:n9584(a.points,0),
        teamId:t.id
      };
    }).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ar'));
  }

  async function timeoutPenaltyRow9584(turn){
    const docs = await teamDocs9584();
    const t = docs.find(x => same9584(x.id, turn.team) || same9584(x.name, turn.teamName));
    const row = {
      name: turn.teamName || 'الفريق صاحب الدور',
      answer: 'لم يختار سؤال',
      ok: false,
      points: -5,
      teamId: turn.team || ''
    };

    if(t){
      const lockId = ('stage3_timeout_9584_' + String(turn.team || t.id) + '_' + String(turn.turnStartedAtMs || '')).replace(/[^\w\u0600-\u06FF-]/g,'_');
      const lockRef = db.collection('stage3TimeoutLocks').doc(lockId);
      let already = false;

      await db.runTransaction(async tx=>{
        const s = await tx.get(lockRef);
        if(s.exists){ already = true; return; }
        tx.set(lockRef, {done:true, team:t.id, at:Date.now()});
      });

      if(!already){
        const stageScores = Object.assign({stage1:0,stage2:0,stage3:0,stage4:0}, t.stageScores || {});
        stageScores.stage3 = Math.max(0, n9584(stageScores.stage3,0) - 5);
        const score = Math.max(0, n9584(t.score,0) - 5);
        const log = {
          stage:'على المحك',
          question:'انتهى وقت اختيار السؤال',
          selected:'لم يختار سؤال',
          correct:'-',
          ok:false,
          points:-5,
          meta:'انتهى وقت اختيار السؤال',
          playerName:t.name || turn.teamName || '',
          time:new Date().toLocaleString('ar')
        };
        await t.ref.set({
          stageScores,
          score,
          answerLog:[...(t.answerLog||[]), log]
        }, {merge:true});
      }

      row.name = teamName9584(t);
      row.teamId = t.id;
    }
    return row;
  }

  async function revealStage3AnswersClean9584(auto=false){
    if(stage3FinalBusy9584) return;

    // IMPORTANT: use the real moderator variables, not window.*
    const active = audienceActiveStage3V95 || {};
    const info = currentStage3Info9584(active);

    if(!active?.id || !info){
      if(auto) return;
      return alert('لا يوجد سؤال مفتوح');
    }

    stage3FinalBusy9584 = true;
    try{
      const rows = await rowsForOpenStage3Question9584(active, info);
      await freezeStage3ForReveal9584();
      await publishStage3Reveal9584('إجابات المرحلة الثالثة', rows, {
        questionId:active.id,
        questionText:info.text
      });

      try{
        await db.collection('stage3Locks').doc(active.id).set({
          answered:true,
          answeredAt:FieldValue.serverTimestamp()
        }, {merge:true});
      }catch(e){}

      audienceModeV95 = 'stage3';
      if(typeof renderAudiencePanelV95 === 'function') renderAudiencePanelV95(false);

      setTimeout(async()=>{
        try{ await resumeStage3AfterReveal9584(active.team); }
        catch(e){ console.error('stage3 final resume failed', e); }
        finally{ stage3FinalBusy9584 = false; }
      }, STAGE3_FINAL_REVEAL_MS_9584);
    }catch(e){
      console.error('stage3 final reveal failed', e);
      stage3FinalBusy9584 = false;
      if(!auto) alert('تعذر إظهار نتائج المرحلة الثالثة');
    }
  }

  async function autoPenalizeExpiredStage3TurnClean9584(){
    if(stage3FinalBusy9584) return;
    if(audienceModeV95 === 'stage4') return;

    const ctrl = audienceStage3ControlV958 || {};
    if(ctrl.paused) return;

    const active = audienceActiveStage3V95 || {};
    if(active?.id) return;

    // IMPORTANT: use the real moderator variable, not window.audienceStage3TurnV95
    const turn = audienceStage3TurnV95 || {};
    if(!turn.team && !turn.teamName) return;
    if(turn.paused || turn.revealPaused) return;

    const duration = n9584(turn.turnDuration, 15) || 15;

    if(!turn.turnStartedAtMs){
      await db.collection('meta').doc('stage3Turn').set({
        paused:false,
        revealPaused:false,
        turnStartedAtMs:Date.now(),
        turnDuration:duration,
        updatedAt:FieldValue.serverTimestamp()
      }, {merge:true});
      return;
    }

    const left = Math.max(0, duration - Math.floor((Date.now() - n9584(turn.turnStartedAtMs, Date.now())) / 1000));
    if(left > 0) return;

    stage3FinalBusy9584 = true;
    try{
      const row = await timeoutPenaltyRow9584(turn);
      await freezeStage3ForReveal9584();
      await publishStage3Reveal9584('انتهى وقت اختيار السؤال', [row], {
        questionText:'لم يختار سؤال'
      });

      audienceModeV95 = 'stage3';
      if(typeof renderAudiencePanelV95 === 'function') renderAudiencePanelV95(false);

      setTimeout(async()=>{
        try{ await resumeStage3AfterReveal9584(turn.team); }
        catch(e){ console.error('stage3 timeout final resume failed', e); }
        finally{ stage3FinalBusy9584 = false; }
      }, STAGE3_FINAL_REVEAL_MS_9584);
    }catch(e){
      console.error('stage3 timeout final failed', e);
      stage3FinalBusy9584 = false;
    }
  }

  // Bind both the lexical function names and window properties.
  revealStage3AnswersV95 = window.revealStage3AnswersV95 = revealStage3AnswersClean9584;
  autoPenalizeExpiredStage3TurnV957 = window.autoPenalizeExpiredStage3TurnV957 = autoPenalizeExpiredStage3TurnClean9584;
})();


/* ===== V9.5.124 CLEAN: fifth reserve player in admin control + swap ===== */
function normalizePlayersV95124(players){
  const src = Array.isArray(players) ? players : [];
  return [0,1,2,3,4].map(i => {
    const p = src[i] || {};
    return { name:String(p.name || '').trim(), order:i+1, reserve:i===4 };
  });
}
function visiblePlayersFromEditorV95124(){
  return [0,1,2,3,4].map(i => ({
    name:String(document.getElementById('editPlayer'+i)?.value || '').trim(),
    order:i+1,
    reserve:i===4
  })).filter((p,i)=> i < 4 ? (p.name || (p.name=`لاعب ${i+1}`)) : p.name);
}
async function swapReserveWithPlayerV95124(index){
  const t=selectedTeam();
  if(!t)return alert('اختر فريقًا أولًا');
  const idx=Number(index);
  if(idx<0 || idx>3)return alert('اختر لاعبًا أساسيًا للاستبدال.');
  const players=normalizePlayersV95124(t.players);
  if(!players[4]?.name)return alert('لا يوجد لاعب خامس احتياط لاستبداله.');
  const temp=players[idx];
  players[idx]=Object.assign({},players[4],{order:idx+1,reserve:false});
  players[4]=Object.assign({},temp,{order:5,reserve:true});
  await db.collection('teams').doc(t.id).set({players},{merge:true});
  alert('تم استبدال اللاعب الاحتياط مع اللاعب المختار. سيظهر التغيير في صفحة المسابقة.');
}
window.renderPlayers = function(){
  const box=document.getElementById('playersBox'); if(!box)return;
  const t=selectedTeam();
  if(!t){box.innerHTML='<h3>تعديل بيانات الفريق</h3><p class="muted">اختر فريقًا من الأعلى.</p>';return;}
  const players=normalizePlayersV95124(t.players);
  const teamNameValue = (typeof safeName9522 === 'function') ? safeName9522(t) : (t.name || '');
  const govValue = (typeof safeGov9522 === 'function') ? safeGov9522(t) : ((typeof teamProvince === 'function' ? teamProvince(t) : t.governorate) || '');
  const reserveName=players[4]?.name || '';
  box.innerHTML=`
    <h3>تعديل بيانات الفريق</h3>
    <div class="admin-name-editor-v9522 admin-name-editor-v95124">
      <label>اسم الفريق</label><input id="editTeamName" value="${esc(teamNameValue)}">
      <label>المحافظة</label><input id="editGovernorate" value="${esc(govValue)}">
      ${[0,1,2,3,4].map(i=>`<label>${i===4?'اللاعب 5 - احتياط':'اللاعب '+(i+1)}</label><input id="editPlayer${i}" value="${esc(players[i]?.name||'')}">`).join('')}
      <button class="btn" onclick="saveTeamNames()">حفظ بيانات الفريق</button>
    </div>
    <div class="mini-card reserve-swap-card-v95124">
      <h3>استبدال اللاعب الخامس الاحتياط</h3>
      <p class="muted">اللاعب الخامس الحالي: <b>${esc(reserveName || 'غير محدد')}</b>. يمكن استبداله مع أي لاعب أساسي، وسيظهر التغيير في صفحة المسابقة.</p>
      <div class="reserve-swap-grid-v95124">
        ${[0,1,2,3].map(i=>`<button class="btn secondary" onclick="swapReserveWithPlayerV95124(${i})" ${reserveName?'':'disabled'}>استبدال مع اللاعب ${i+1}<small>${esc(players[i]?.name||'')}</small></button>`).join('')}
      </div>
    </div>
  `;
};
window.saveTeamNames = async function(){
  const t=selectedTeam();
  if(!t)return alert('اختر فريقًا أولًا');
  const name=(document.getElementById('editTeamName')?.value||t.name||'').trim();
  const governorate=(document.getElementById('editGovernorate')?.value||'').trim();
  const players=visiblePlayersFromEditorV95124();
  const update={name:name||t.name,governorate,players};
  if(update.name!==t.name && typeof FieldValue!=='undefined'){
    update.previousNames=FieldValue.arrayUnion(t.name, typeof safeDecodeTeamId==='function'?safeDecodeTeamId(t.id):t.id, t.id);
  }
  await db.collection('teams').doc(t.id).set(update,{merge:true});
  alert('تم حفظ بيانات الفريق واللاعبين.');
};



/* ===== V9.5.126: Admin live/general professional ranking tables ===== */
(function(){
  'use strict';

  function escRankV95126(v){
    if(typeof escV9541 === 'function') return escV9541(v);
    if(typeof esc === 'function') return esc(v);
    return String(v ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function nameRankV95126(t){
    try{
      if(typeof nameV9541 === 'function') return nameV9541(t);
      if(typeof teamDisplayNameV9512 === 'function') return teamDisplayNameV9512(t);
    }catch(e){}
    return t?.name || t?.id || 'فريق';
  }

  function govRankV95126(t){
    try{
      if(typeof provinceV9541 === 'function') return provinceV9541(t);
      if(typeof teamProvince === 'function') return teamProvince(t);
    }catch(e){}
    return t?.governorate || t?.province || '';
  }

  function totalRankV95126(t){
    try{ if(typeof scoreTotalV9541 === 'function') return Number(scoreTotalV9541(t)||0); }catch(e){}
    return Number(t?.score || 0);
  }

  function liveStageRankV95126(t){
    try{ if(typeof stageFromCurrentV9541 === 'function') return stageFromCurrentV9541(t); }catch(e){}
    const c=String(t?.current||'');
    if(c.includes('4'))return 'stage4';
    if(c.includes('3'))return 'stage3';
    if(c.includes('2'))return 'stage2';
    return 'stage1';
  }

  function liveScoreRankV95126(t){
    try{ if(typeof liveScoreV9541 === 'function') return Number(liveScoreV9541(t)||0); }catch(e){}
    const st=liveStageRankV95126(t);
    return Number((t?.stageScores||{})[st] || 0);
  }

  function rankBadgeV95126(i){
    if(i===0) return '🏆';
    if(i===1) return '🥈';
    if(i===2) return '🥉';
    return String(i+1);
  }

  function countClassV95126(list){
    if(list.length > 15) return 'many';
    if(list.length > 8) return 'medium';
    return 'few';
  }

  window.renderLive = function(){
    const live=document.getElementById('liveList');
    if(!live)return;

    const list=[...teams].sort((a,b)=>
      (liveScoreRankV95126(b)-liveScoreRankV95126(a)) ||
      (totalRankV95126(b)-totalRankV95126(a)) ||
      nameRankV95126(a).localeCompare(nameRankV95126(b),'ar')
    );

    if(!list.length){
      live.innerHTML='<p>لا توجد فرق بعد.</p>';
      return;
    }

    const max=Math.max(1,...list.map(liveScoreRankV95126));
    live.className=`ranking-table-wrap-v95126 live-ranking-v95126 ranking-count-${countClassV95126(list)}`;

    live.innerHTML=`
      <table class="ranking-table-v95126">
        <thead>
          <tr>
            <th>الترتيب</th>
            <th>الفريق</th>
            <th>المحافظة</th>
            <th>المرحلة الحالية</th>
            <th>نقاط المرحلة</th>
            <th>المجموع</th>
          </tr>
        </thead>
        <tbody>
          ${list.map((t,i)=>{
            const livePts=liveScoreRankV95126(t);
            const total=totalRankV95126(t);
            const st=liveStageRankV95126(t);
            const gov=govRankV95126(t);
            return `
              <tr class="${i<3?'top-rank-v95126':''}">
                <td class="rank-cell-v95126"><span>${rankBadgeV95126(i)}</span></td>
                <td class="team-cell-v95126"><b>${escRankV95126(nameRankV95126(t))}</b></td>
                <td>${gov?`<span class="province-chip">${escRankV95126(gov)}</span>`:'-'}</td>
                <td>${escRankV95126(stageNames[st]||st||'-')}</td>
                <td class="points-cell-v95126">
                  <b>${livePts}</b>
                  <div class="mini-bar-v95126"><i style="width:${Math.round(livePts/max*100)}%"></i></div>
                </td>
                <td class="total-cell-v95126"><b>${total}</b></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  };

  window.renderGeneralResultsV9520 = function(){
    const box=document.getElementById('generalList');
    if(!box)return;

    const list=[...teams].sort((a,b)=>
      (totalRankV95126(b)-totalRankV95126(a)) ||
      nameRankV95126(a).localeCompare(nameRankV95126(b),'ar')
    );

    if(!list.length){
      box.innerHTML='<p>لا توجد فرق بعد.</p>';
      return;
    }

    const max=Math.max(1,...list.map(totalRankV95126));
    box.className=`ranking-table-wrap-v95126 general-ranking-v95126 ranking-count-${countClassV95126(list)}`;

    box.innerHTML=`
      <table class="ranking-table-v95126">
        <thead>
          <tr>
            <th>الترتيب</th>
            <th>الفريق</th>
            <th>المحافظة</th>
            <th>المرحلة 1</th>
            <th>المرحلة 2</th>
            <th>المرحلة 3</th>
            <th>المرحلة 4</th>
            <th>المجموع</th>
          </tr>
        </thead>
        <tbody>
          ${list.map((t,i)=>{
            const ss=Object.assign({stage1:0,stage2:0,stage3:0,stage4:0},t.stageScores||{});
            const total=totalRankV95126(t);
            const gov=govRankV95126(t);
            return `
              <tr class="${i<3?'top-rank-v95126':''}">
                <td class="rank-cell-v95126"><span>${rankBadgeV95126(i)}</span></td>
                <td class="team-cell-v95126"><b>${escRankV95126(nameRankV95126(t))}</b></td>
                <td>${gov?`<span class="province-chip">${escRankV95126(gov)}</span>`:'-'}</td>
                <td>${Number(ss.stage1||0)}</td>
                <td>${Number(ss.stage2||0)}</td>
                <td>${Number(ss.stage3||0)}</td>
                <td>${Number(ss.stage4||0)}</td>
                <td class="points-cell-v95126 total-cell-v95126">
                  <b>${total}</b>
                  <div class="mini-bar-v95126"><i style="width:${Math.round(total/max*100)}%"></i></div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    const tools=document.querySelector('.general-tools-v9523');
    if(tools){
      tools.innerHTML=`<button class="btn secondary" onclick="renderGeneralResultsV9520()">تحديث الترتيب</button><a class="btn" href="audience.html?mode=general" target="_blank">إظهار النتائج بحماس</a>`;
    }
  };
})();



/* ===== V9.5.131 CLEAN FIX: Question Bank Excel import validation and safe stage1 types ===== */
(function(){
  'use strict';

  function qbCleanTrimV95131(v){ return String(v ?? '').trim(); }
  function qbCleanSplitV95131(v){
    return qbCleanTrimV95131(v).split(/[|،,؛;\n]+/).map(x=>x.trim()).filter(Boolean);
  }
  function qbCleanTypeV95131(row, stage){
    const raw = qbCleanTrimV95131(row?.type || row?.typeName || row?.category || '').toLowerCase();
    const compact = raw.replace(/[\sـ]+/g,'');
    if(['choice','choose','multiple','mcq','اختيار','اختر من متعدد'].includes(raw) || compact==='اخترمنمتعدد' || compact==='اخترمنمتعدّد') return 'choice';
    if(['missing','ماذا ينقص','ماذا ينقص؟'].includes(raw) || compact==='ماذاينقص') return 'missing';
    if(['arrange','order','sort','رتب','رتّب'].includes(raw) || compact==='رتب' || compact==='رتّب') return 'arrange';
    if(['fill','blank','فراغات','أكمل الفراغات','اكمل الفراغات'].includes(raw) || compact==='أكملالفراغات' || compact==='اكملالفراغات') return 'fill';
    if(['matching','توصيل'].includes(raw) || compact==='توصيل') return 'matching';
    if(['complete','أكمل','اكمل','أكمل الآيات','اكمل الآيات'].includes(raw) || compact==='أكملالآيات' || compact==='اكملالايات') return 'complete';
    if(['correct','صحح الخطأ'].includes(raw) || compact==='صححالخطأ') return 'correct';
    if(['truefalse','صح أو خطأ','صح او خطأ'].includes(raw) || compact==='صحاوخطأ' || compact==='صحأوخطأ') return 'truefalse';
    if(['link','الرابط العجيب'].includes(raw) || compact==='الرابطالعجيب') return 'link';
    if(['image','صور','صورة'].includes(raw)) return 'image';
    if(['whoami','من أنا','من انا'].includes(raw) || compact==='منانا' || compact==='منأنا') return 'whoami';
    if(['text','كتابة'].includes(raw)) return 'text';
    return stage === 'stage1' ? 'missing' : 'text';
  }
  function qbStage1LabelV95131(type){
    return ({choice:'اختر من متعدد', missing:'ماذا ينقص', arrange:'رتّب', fill:'فراغات'})[type] || 'ماذا ينقص';
  }
  function qbOptionsV95131(row){
    return [row.option1,row.option2,row.option3,row.option4,row.choice1,row.choice2,row.choice3,row.choice4,row.a,row.b,row.c,row.d]
      .map(qbCleanTrimV95131).filter(Boolean);
  }
  function qbHasQuestionV95131(row){
    return !!(qbCleanTrimV95131(row.question) && qbCleanTrimV95131(row.correct) && qbStageNameV9532(row.stage));
  }

  window.qbConvertRowsToDataV9532 = qbConvertRowsToDataV9532 = function(rows){
    const result = {stage1:[], stage2:{passage: DATA.stage2?.passage || '', groups:[]}, stage3:[], stage4:[]};
    const stage2Groups = {
      matching:{type:'matching',title:'توصيل',points:15,questions:[]},
      complete:{type:'complete',title:'أكمل الآيات',points:15,questions:[]},
      correct:{type:'correct',title:'صحح الخطأ',points:15,questions:[]},
      truefalse:{type:'truefalse',title:'صح أو خطأ',points:15,questions:[]}
    };
    const stage3Map = new Map();

    for(const row of rows || []){
      const stage = qbStageNameV9532(row.stage);
      if(!['stage1','stage2','stage3','stage4'].includes(stage)) continue;

      const question = qbCleanTrimV95131(row.question);
      const correct = qbCleanTrimV95131(row.correct);
      if(!question || !correct) continue;

      const type = qbCleanTypeV95131(row, stage);
      const options = qbOptionsV95131(row);
      const accepted = qbSplitV9532(row.acceptedAnswers);
      const base = {
        id:qbCleanTrimV95131(row.id),
        q:question,
        answer:correct,
        correct,
        acceptedAnswers:accepted,
        points:Number(row.points||0)||undefined,
        imageUrl:qbDriveDirectUrlV9532(row.imageUrl),
        videoUrl:qbCleanTrimV95131(row.videoUrl),
        notes:qbCleanTrimV95131(row.notes)
      };

      if(stage === 'stage1'){
        let typeLabel = qbStage1LabelV95131(type);
        const obj = Object.assign({}, base, {type:typeLabel, data:qbCleanTrimV95131(row.data)});

        if(typeLabel === 'اختر من متعدد'){
          let opts = options.slice(0,4);
          // A real MCQ must have at least two options. Never create a one-option choice question.
          if(opts.length < 2){
            typeLabel = 'ماذا ينقص';
            obj.type = typeLabel;
            obj.options = [];
          }else{
            if(correct && !opts.some(o=>o.trim()===correct.trim())) opts = [correct, ...opts].slice(0,4);
            obj.options = opts;
          }
        }else if(typeLabel === 'رتّب'){
          obj.options = options.length >= 2 ? options.slice(0,6) : qbCleanSplitV95131(correct);
        }else{
          obj.options = [];
        }

        result.stage1.push(obj);
      }else if(stage === 'stage2'){
        const g = stage2Groups[type] || stage2Groups.complete;
        const item = Object.assign({}, base, {targetPart:qbCleanTrimV95131(row.targetPart)});
        if(type === 'truefalse') Object.assign(item, {type:'choice', options:options.length>=2?options:['صح','خطأ']});
        else if(type === 'matching') Object.assign(item, {options:options.length?options:[correct]});
        else Object.assign(item, {type:'input'});
        if(row.points) g.points = Number(row.points) || g.points;
        g.questions.push(item);
      }else if(stage === 'stage3'){
        const cat = qbCleanTrimV95131(row.category) || 'عام';
        const level = qbCleanTrimV95131(row.level) || 'سهل';
        if(!stage3Map.has(cat)) stage3Map.set(cat, []);
        const arr = [level, question, correct];
        arr.options = options;
        arr.acceptedAnswers = accepted;
        arr.imageUrl = qbDriveDirectUrlV9532(row.imageUrl);
        stage3Map.get(cat).push(arr);
      }else if(stage === 'stage4'){
        result.stage4.push(Object.assign({}, base, {type, category:qbCleanTrimV95131(row.category), options}));
      }
    }

    result.stage2.groups = Object.values(stage2Groups).filter(g=>g.questions.length);
    result.stage3 = [...stage3Map.entries()].map(([cat,qs])=>({cat,qs}));

    // Keep existing stages only when the Excel intentionally includes other valid stages.
    // If no valid rows at all, preview will block applying the file.
    if(!result.stage1.length) result.stage1 = DATA.stage1;
    if(!result.stage2.groups.length) result.stage2 = DATA.stage2;
    if(!result.stage3.length) result.stage3 = DATA.stage3;
    if(!result.stage4.length) result.stage4 = DATA.stage4;

    return result;
  };

  window.previewQuestionExcelV9532 = previewQuestionExcelV9532 = async function(){
    const input = document.getElementById('questionExcelInput');
    const file = input?.files?.[0];
    if(!file) return alert('اختر ملف Excel أولًا');
    if(typeof XLSX === 'undefined') return alert('مكتبة Excel لم تُحمّل. تأكد من اتصال الإنترنت ثم أعد المحاولة.');

    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf,{type:'array'});
    let rows = [];
    const excluded = ['README','Lists','القوائم','شرح','Examples','Example','أمثلة','امثلة','Instructions','تعليمات'];
    const master = wb.SheetNames.find(n => ['all_questions','all questions','كل_الأسئلة','كل الأسئلة'].includes(String(n).toLowerCase()));
    const names = master ? [master] : wb.SheetNames.filter(n => !excluded.includes(n));

    for(const name of names){
      const sheetRows = qbReadSheetRowsV9532(wb.Sheets[name]);
      rows.push(...sheetRows.map(r=>Object.assign({sheet:name},r)));
    }

    const validRows = rows.filter(qbHasQuestionV95131);
    const box = document.getElementById('questionImportPreview');
    const btn = document.getElementById('applyQuestionBankBtn');

    if(!validRows.length){
      questionBankPreviewV9532 = null;
      if(btn) btn.disabled = true;
      if(box){
        box.innerHTML = `<div class="mini-card danger-soft">
          <h3>لا يوجد أسئلة صالحة في الملف</h3>
          <p>القالب الجديد فارغ للتعبئة. املأ صفوف الأسئلة أولًا، ثم ارفع الملف مرة ثانية.</p>
          <p class="muted">لن يتم تطبيق ملف فارغ حتى لا يستبدل أسئلة المسابقة بالخطأ.</p>
        </div>`;
      }
      return;
    }

    const data = qbConvertRowsToDataV9532(validRows);
    const counts = {
      stage1:data.stage1.length,
      stage2:data.stage2.groups.reduce((a,g)=>a+g.questions.length,0),
      stage3:data.stage3.reduce((a,c)=>a+(c.qs?.length||0),0),
      stage4:data.stage4.length
    };
    questionBankPreviewV9532 = {data, counts, sourceFile:file.name, rows:validRows.length};

    if(box){
      box.innerHTML = `<div class="mini-card">
        <h3>معاينة الملف</h3>
        <p>الملف: <b>${esc(file.name)}</b> | الصفوف الصالحة: <b>${validRows.length}</b></p>
        <div class="question-count-grid">
          <span>المرحلة الأولى: <b>${counts.stage1}</b></span>
          <span>المرحلة الثانية: <b>${counts.stage2}</b></span>
          <span>المرحلة الثالثة: <b>${counts.stage3}</b></span>
          <span>المرحلة الرابعة: <b>${counts.stage4}</b></span>
        </div>
        <p class="muted">تم منع أسئلة اختيار من متعدد ذات خيار واحد. إذا أردت Choice حقيقيًا، ضع خيارين على الأقل.</p>
      </div>`;
    }
    if(btn) btn.disabled = false;
  };
})();

/* ===== V9.6.13 STAGE 3 MODERATOR SMOOTH RENDERING ===== */
(function(){
  'use strict';
  let lastAudiencePanelSignatureV9613='';
  function sigV9613(){
    try{
      if(String(audienceModeV95||'')==='stage3'){
        const active=audienceActiveStage3V95||{};
        const turn=audienceStage3TurnV95||{};
        const ctrl=audienceStage3ControlV958||{};
        const locks=audienceStage3LocksV95||{};
        const lockSig=Object.keys(locks).sort().map(k=>k+':'+(locks[k]?.answered?'1':'0')).join(',');
        return JSON.stringify(['stage3',active.id||'',active.status||'',!!active.revealDone,active.startedAtMs||0,active.team||'',turn.team||'',turn.teamName||'',turn.turnStartedAtMs||0,!!turn.paused,!!turn.revealPaused,!!ctrl.started,!!ctrl.paused,lockSig]);
      }
      if(String(audienceModeV95||'')==='stage4'){
        const live=audienceStage4LiveV95||{};
        return JSON.stringify(['stage4',live.status||'',live.index||0,live.startedAtMs||0,!!live.revealDone]);
      }
    }catch(e){}
    return String(audienceModeV95||'home')+'|'+Date.now();
  }
  function updateTimersV9613(){
    try{
      if(String(audienceModeV95||'')==='stage3'){
        const active=audienceActiveStage3V95||{};
        const value=active.id ? (typeof liveLeftAdminV95==='function'?liveLeftAdminV95(active):0) : (typeof stage3TurnLeftAdminV957==='function'?stage3TurnLeftAdminV957():0);
        document.querySelectorAll('#audiencePanel .timer').forEach(el=>{
          el.textContent=Math.max(0,value)+'s';
          el.classList.toggle('timer-danger', value<=5);
        });
        const line=document.querySelector('#audiencePanel .turn-owner-line');
        if(line && !active.id && typeof stage3TurnLabelAdminV957==='function'){
          const name=(audienceStage3TurnV95&&audienceStage3TurnV95.teamName)||'بانتظار فريق';
          line.innerHTML='<b>الدور الآن:</b> <span>'+String(name).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c))+'</span> '+stage3TurnLabelAdminV957();
        }
      }
      if(String(audienceModeV95||'')==='stage4'){
        const live=audienceStage4LiveV95||{};
        const left=typeof liveLeftAdminV95==='function'?liveLeftAdminV95(live):0;
        document.querySelectorAll('#audiencePanel .audience-stage4-status .timer').forEach(el=>{
          el.textContent=(live.status==='asking'?left:0)+'s';
          el.classList.toggle('timer-danger', left<=5);
        });
      }
    }catch(e){}
  }
  const oldRenderAudiencePanelV9613=typeof renderAudiencePanelV95==='function'?renderAudiencePanelV95:null;
  if(oldRenderAudiencePanelV9613){
    window.renderAudiencePanelV95=renderAudiencePanelV95=function(resetAnim=true){
      const panel=document.getElementById('audiencePanel');
      if(panel && panel.closest && panel.closest('#gameFlowPanel')){
        const next=sigV9613();
        if(next===lastAudiencePanelSignatureV9613){
          updateTimersV9613();
          return;
        }
        lastAudiencePanelSignatureV9613=next;
      }
      return oldRenderAudiencePanelV9613.apply(this,arguments);
    };
  }
})();
