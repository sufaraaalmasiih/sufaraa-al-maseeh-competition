/* Sufaraa v9.6.5 - Unified Moderator Game Flow, stable rendering and fast batched transitions */
(function(){
  'use strict';
  const GF = window.SUFARAA_GAME_FLOW;
  if(!GF) return console.error('Unified game flow core is missing.');

  let flow = null;
  let flowLoaded = false;
  let autoBusy = false;
  let lastRenderKey = '';
  let teamsWatchStarted = false;
  let lastLiveSignatureV965 = '';
  let lastEmbeddedStageSignatureV9613 = '';
  let lastEmbeddedAnswersSignatureV9613 = '';
  const flowRef = () => db.collection('meta').doc('gameFlow');
  const clean = (x) => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const now = () => Date.now();
  const stageNumFromStatus = (status) => Number(String(status||'').match(/^stage(\d)_/)?.[1] || 0);
  const phaseFromStatus = (status) => String(status||'').split('_').slice(1).join('_');
  const stageKey = (stage) => `stage${Number(stage)}`;
  const durationInput = (key) => Math.max(1, Math.round(Number(document.getElementById('gf_'+key)?.value || GF.localDuration(key, GF.DEFAULT_DURATIONS[key]))));
  const durationsFromUi = () => GF.normalizeDurations({stage1:durationInput('stage1'), stage2Turn:durationInput('stage2Turn'), stage3Choice:durationInput('stage3Choice'), stageQuestion:durationInput('stageQuestion')});
  const activeDurations = () => GF.normalizeDurations(flow?.durations || JSON.parse(localStorage.getItem('sufaraa_game_durations_v960')||'{}'));
  function saveDurationsLocal(d){ try{ localStorage.setItem('sufaraa_game_durations_v960', JSON.stringify(GF.normalizeDurations(d))); }catch(e){} }
  function stageKeyFromTeam(t){ const c=String(t?.current||''); if(c.includes('4'))return 'stage4'; if(c.includes('3'))return 'stage3'; if(c.includes('2'))return 'stage2'; return 'stage1'; }
  function totalScore(t){ const ss=t.stageScores||{}; return Number(t.score ?? ((+ss.stage1||0)+(+ss.stage2||0)+(+ss.stage3||0)+(+ss.stage4||0))) || 0; }
  function liveScore(t){ const st=stageKeyFromTeam(t); return Number((t.stageScores||{})[st] || 0); }
  function province(t){ return String(t.governorate||t.province||'').trim(); }
  function playersText(t){ return (t.players||[]).map(p=>String(p?.name||p||'').trim()).filter(Boolean).join('، '); }
  function getTeams(){ try{ return Array.isArray(teams) ? teams : []; }catch(e){ return []; } }
  function sortedGeneral(){ return [...getTeams()].sort((a,b)=>totalScore(b)-totalScore(a)||String(a.name||'').localeCompare(String(b.name||''),'ar')); }
  function sortedLive(){ return [...getTeams()].sort((a,b)=>liveScore(b)-liveScore(a)||totalScore(b)-totalScore(a)||String(a.name||'').localeCompare(String(b.name||''),'ar')); }
  function allReady(stage){
    const list=getTeams(); if(!list.length) return false;
    const key=stageKey(stage);
    return list.every(t=>t?.readyStages?.[key]===true);
  }
  function readySummary(stage){
    const list=getTeams(); const key=stageKey(stage);
    const ready=list.filter(t=>t?.readyStages?.[key]===true).length;
    return {ready,total:list.length,key};
  }
  function teamCards(stageForReady){
    const list=[...getTeams()].sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'ar'));
    if(!list.length) return '<div class="game-empty-v960">لم يسجل أي فريق بعد.</div>';
    const key=stageForReady?stageKey(stageForReady):'';
    return `<div class="game-team-grid-v960">${list.map((t,i)=>{const ready=key? t?.readyStages?.[key]===true : false;return `<article class="game-team-card-v960 ${ready?'ready-v961':''}"><div class="game-team-index-v960">${i+1}</div><h3>${clean(t.name||'فريق')}</h3><p>${province(t)?`<b>${clean(province(t))}</b>`:'محافظة غير محددة'}</p><small>${clean(playersText(t)||'لم يتم إدخال أسماء اللاعبين')}</small>${key?`<span class="ready-chip-v961 ${ready?'yes':'no'}">${ready?'جاهز':'غير جاهز'}</span>`:''}</article>`;}).join('')}</div>`;
  }
  function liveTable(){
    const list=sortedLive(); if(!list.length) return '<p class="muted">لا توجد فرق بعد.</p>';
    const max=Math.max(1,...list.map(liveScore));
    return `<div class="game-results-wrap-v960"><table class="ranking-table-v95126"><thead><tr><th>الترتيب</th><th>الفريق</th><th>المحافظة</th><th>نقاط المرحلة</th><th>المجموع</th></tr></thead><tbody>${list.map((t,i)=>`<tr class="${i<3?'top-rank-v95126':''}"><td class="rank-cell-v95126"><span>${i===0?'🏆':i+1}</span></td><td><b>${clean(t.name||'')}</b></td><td>${province(t)?`<span class="province-chip">${clean(province(t))}</span>`:'-'}</td><td class="points-cell-v95126"><b>${liveScore(t)}</b><div class="mini-bar-v95126"><i style="width:${Math.round(liveScore(t)/max*100)}%"></i></div></td><td><b>${totalScore(t)}</b></td></tr>`).join('')}</tbody></table></div>`;
  }
  function generalTable(){
    const list=sortedGeneral(); if(!list.length) return '<p class="muted">لا توجد فرق بعد.</p>';
    return `<div class="game-results-wrap-v960"><table class="ranking-table-v95126"><thead><tr><th>الترتيب</th><th>الفريق</th><th>المحافظة</th><th>الأولى</th><th>الثانية</th><th>الثالثة</th><th>الرابعة</th><th>المجموع</th></tr></thead><tbody>${list.map((t,i)=>{const ss=Object.assign({stage1:0,stage2:0,stage3:0,stage4:0},t.stageScores||{});return `<tr class="${i<3?'top-rank-v95126':''}"><td class="rank-cell-v95126"><span>${i===0?'🏆':i+1}</span></td><td><b>${clean(t.name||'')}</b></td><td>${province(t)?`<span class="province-chip">${clean(province(t))}</span>`:'-'}</td><td>${ss.stage1||0}</td><td>${ss.stage2||0}</td><td>${ss.stage3||0}</td><td>${ss.stage4||0}</td><td><b>${totalScore(t)}</b></td></tr>`;}).join('')}</tbody></table></div>`;
  }
  function durationControls(){
    const d=activeDurations();
    return `<details class="game-settings-v960"><summary>إعداد المؤقتات المركزية</summary><div class="game-duration-grid-v960">
      <label>المرحلة الأولى / ثانية<input id="gf_stage1" type="number" min="30" value="${d.stage1}"></label>
      <label>كل دور في المرحلة الثانية / ثانية<input id="gf_stage2Turn" type="number" min="30" value="${d.stage2Turn}"></label>
      <label>اختيار سؤال المرحلة الثالثة / ثانية<input id="gf_stage3Choice" type="number" min="5" value="${d.stage3Choice}"></label>
      <label>إجابة سؤال المرحلة الثالثة والرابعة / ثانية<input id="gf_stageQuestion" type="number" min="5" value="${d.stageQuestion}"></label>
      <button class="btn secondary" onclick="saveGameDurationsV960()">حفظ المؤقتات</button>
    </div><p class="muted">كل الشاشات تقرأ هذه القيم من لوحة الميسر. لا يوجد مؤقت مستقل عند المتسابقين.</p></details>`;
  }
  function statusLabel(){
    if(!flowLoaded) return 'جاري تحميل حالة اللعبة...';
    const s=flow?.status || GF.STATUS.waiting;
    if(s==='waiting_players') return 'بانتظار تسجيل دخول جميع اللاعبين';
    if(s==='contest_finished') return 'تم إنهاء المسابقة';
    if(s==='final_results') return 'النتائج النهائية';
    const n=stageNumFromStatus(s), ph=phaseFromStatus(s), title=GF.STAGES[n]?.title || 'مرحلة';
    return ph==='intro'?`شرح ${title}`:ph==='running'?`${title} قيد اللعب`:ph==='finished'?`انتهت ${title}`:title;
  }
  function mainAction(){
    const s=flow?.status || GF.STATUS.waiting;
    const n=stageNumFromStatus(s), ph=phaseFromStatus(s);
    if(s==='waiting_players') return `<button class="btn game-primary-v960" ${getTeams().length?'':'disabled'} onclick="goGameIntroV960(1)">بداية اللعبة</button>`;
    if(ph==='intro'){
      const r=readySummary(n), ok=allReady(n);
      return `<button class="btn game-primary-v960" ${ok?'':'disabled'} onclick="startGameStageV960(${n})">بدء المرحلة ${n}</button><span class="game-ready-status-v961">جاهز: ${r.ready} من ${r.total}</span>`;
    }
    if(ph==='running') return `<button class="btn danger" onclick="finishGameStageV960(${n}, true)">إنهاء المرحلة الآن</button>`;
    if(ph==='finished' && n<4) return `<button class="btn game-primary-v960" onclick="goGameIntroV960(${n+1})">الانتقال إلى المرحلة ${n+1}</button>`;
    if(ph==='finished' && n===4) return `<button class="btn game-primary-v960" onclick="finishContestV960()">إنهاء المسابقة</button>`;
    if(s==='contest_finished') return `<button class="btn game-primary-v960" onclick="showFinalResultsFromGameV960()">عرض النتائج النهائية</button>`;
    if(s==='final_results') return `<button class="btn secondary" onclick="showFinalResultsFromGameV960()">تحديث النتائج النهائية</button>`;
    return '';
  }
  function audienceLink(){ return `<a class="btn secondary" href="audience.html" target="_blank">فتح شاشة الجمهور</a>`; }
  function answersTableForStage(stage){
    try{
      let title='إجابات الفرق الحالية', roundId='', rows=[];
      if(stage===3){
        const a=(typeof audienceActiveStage3V95!=='undefined'?audienceActiveStage3V95:null); if(!a?.id || !a?.startedAtMs) return '<div class="mini-card live-answers-v961"><h3>إجابات المرحلة الثالثة</h3><p class="muted">لا يوجد سؤال مفتوح حاليًا.</p></div>';
        roundId='stage3_'+a.id+'_'+String(a.startedAtMs||''); title='إجابات السؤال المفتوح - المرحلة الثالثة';
        rows=getTeams().map(t=>{const ans=t.progress?.stage3?.liveAnswers?.[roundId]||{}; return {name:t.name, answer:ans.answer||'', ok:ans.ok, points:ans.points, time:ans.time};});
      }else if(stage===4){
        const live=(typeof audienceStage4LiveV95!=='undefined'?audienceStage4LiveV95:{}); if(!live.startedAtMs) return '<div class="mini-card live-answers-v961"><h3>إجابات المرحلة الرابعة</h3><p class="muted">لا يوجد سؤال مفتوح حاليًا.</p></div>';
        roundId='stage4_'+Number(live.index||0)+'_'+String(live.startedAtMs||'manual'); title='إجابات السؤال الحالي - المرحلة الرابعة';
        rows=getTeams().map(t=>{const ans=t.progress?.stage4?.liveAnswers?.[roundId]||{}; return {name:t.name, answer:ans.answer||'', ok:ans.ok, points:ans.points, time:ans.time};});
      }
      return `<div class="mini-card live-answers-v961"><h3>${clean(title)}</h3><div class="live-answer-grid-v961">${rows.map(r=>{const answered=!!(r.answer||r.time); const status=!answered?'لم يجب':(r.ok===true?'صحيحة':(r.ok===false?'خاطئة':'تم التخطي')); return `<div class="live-answer-row-v961 ${answered?'answered':'pending'}"><b>${clean(r.name||'فريق')}</b><span>${clean(r.answer||'بانتظار الإجابة')}</span><em>${status}</em><strong>${Number(r.points||0)>0?'+':''}${Number(r.points||0)}</strong></div>`;}).join('')}</div></div>`;
    }catch(e){ return ''; }
  }
  function embeddedStagePanel(stage){
    if(stage===3 && typeof window.renderStage3AdminFinalV9646 === 'function') return window.renderStage3AdminFinalV9646();
    if(stage===4 && typeof window.renderStage4AdminFinalV9650 === 'function') return window.renderStage4AdminFinalV9650();
    const title=GF.STAGES[stage]?.title || '';
    return `<section class="game-step-v960 stage34-deep-clean-admin" data-stage="${stage}"><h2>${clean(title)} - قيد إعادة البناء</h2><p class="muted">تم حذف منطق المرحلة القديمة من لوحة الميسر. هذه الصفحة مكان نظيف لبناء المرحلة من الصفر.</p><div class="stage34-clean-note">لا توجد أزرار قديمة، ولا مؤقتات قديمة، ولا ربط قديم بشاشة الجمهور.</div></section>`;
  }
  function gameBody(){
    const s=flow?.status || GF.STATUS.waiting;
    const n=stageNumFromStatus(s), ph=phaseFromStatus(s), left=GF.flowLeftSeconds(flow);
    if(s==='waiting_players') return `<section class="game-wait-v960"><h2>بانتظار تسجيل دخول جميع اللاعبين</h2><p class="muted">بعد الضغط على بداية اللعبة سيتم إغلاق تسجيل الفرق الجديدة حتى ينهي الميسر المسابقة أو يعيدها للانتظار.</p>${teamCards()}</section>`;
    if(ph==='intro'){ const r=readySummary(n); return `<section class="game-step-v960"><h2>المتسابقون الآن في شاشة شرح المرحلة ${n}</h2><p>زر البدء لا يعمل إلا بعد ضغط كل الفرق زر جاهز من شاشة الشرح.</p><div class="game-ready-box-v961">جاهز: <b>${r.ready}</b> من <b>${r.total}</b></div>${teamCards(n)}</section>`; }
    if(ph==='running' && (n===1 || n===2)) return `<section class="game-step-v960"><div class="game-timer-v960 ${left<=30?'danger':''}" id="gameTimerV961">${GF.formatSeconds(left)}</div><h2>الترتيب المباشر</h2><div id="gameLiveTableV965">${liveTable()}</div></section>`;
    if(ph==='running' && (n===3 || n===4)) return embeddedStagePanel(n);
    if(ph==='finished') return `<section class="game-step-v960"><h2>النتائج العامة بعد المرحلة ${n}</h2><p class="muted">تبقى رسالة المباركة ظاهرة عند المتسابقين إلى أن تضغط الانتقال إلى المرحلة التالية.</p>${generalTable()}</section>`;
    if(s==='contest_finished' || s==='final_results') return `<section class="game-step-v960"><h2>النتائج النهائية</h2>${generalTable()}</section>`;
    return `<section class="game-step-v960"><p>حالة غير معروفة: ${clean(s)}</p></section>`;
  }
  function embeddedStageSignature(stage){
    try{
      if(stage===3){
        const active=(typeof audienceActiveStage3V95!=='undefined'?audienceActiveStage3V95:null)||{};
        const turn=(typeof audienceStage3TurnV95!=='undefined'?audienceStage3TurnV95:null)||{};
        const ctrl=(typeof audienceStage3ControlV958!=='undefined'?audienceStage3ControlV958:null)||{};
        const locks=(typeof audienceStage3LocksV95!=='undefined'?audienceStage3LocksV95:null)||{};
        const lockSig=Object.keys(locks).sort().map(k=>k+':'+(locks[k]?.answered?'1':'0')).join(',');
        return JSON.stringify(['stage3', active.id||'', active.status||'', !!active.revealDone, active.startedAtMs||0, active.team||'', turn.team||'', turn.teamName||'', turn.turnStartedAtMs||0, !!ctrl.started, !!ctrl.paused, lockSig]);
      }
      const live=(typeof audienceStage4LiveV95!=='undefined'?audienceStage4LiveV95:null)||{};
      return JSON.stringify(['stage4', live.status||'', live.index||0, live.startedAtMs||0, !!live.revealDone]);
    }catch(e){ return String(stage)+'-'+Date.now(); }
  }
  function updateEmbeddedTimersOnly(stage){
    try{
      if(stage===3){
        const active=(typeof audienceActiveStage3V95!=='undefined'?audienceActiveStage3V95:null)||{};
        const activeLeft=(typeof liveLeftAdminV95==='function') ? liveLeftAdminV95(active) : 0;
        const turnLeft=(typeof stage3TurnLeftAdminV957==='function') ? stage3TurnLeftAdminV957() : 0;
        document.querySelectorAll('#audiencePanel .audience-current-question .timer').forEach(el=>{
          const val=active?.id ? activeLeft : turnLeft;
          el.textContent=Math.max(0,val)+'s';
          el.classList.toggle('timer-danger', val<=5);
        });
        const line=document.querySelector('#audiencePanel .turn-owner-line');
        if(line && !active?.id && typeof stage3TurnLabelAdminV957==='function'){
          const b=line.querySelector('span');
          const name=(typeof audienceStage3TurnV95!=='undefined' && audienceStage3TurnV95?.teamName) ? audienceStage3TurnV95.teamName : 'بانتظار فريق';
          line.innerHTML='<b>الدور الآن:</b> <span>'+clean(name)+'</span> '+stage3TurnLabelAdminV957();
        }
      }else{
        const live=(typeof audienceStage4LiveV95!=='undefined'?audienceStage4LiveV95:null)||{};
        const left=(typeof liveLeftAdminV95==='function') ? liveLeftAdminV95(live) : 0;
        document.querySelectorAll('#audiencePanel .audience-stage4-status .timer').forEach(el=>{ el.textContent=(live.status==='asking'?left:0)+'s'; el.classList.toggle('timer-danger', left<=5); });
      }
    }catch(e){}
  }
  function renderEmbeddedStagePanelOnly(){
    const n=stageNumFromStatus(flow?.status), ph=phaseFromStatus(flow?.status);
    if(ph!=='running' || !(n===3||n===4)) return;
    try{
      const panel=document.getElementById('audiencePanel');
      const sig=embeddedStageSignature(n);
      if(panel){
        if(panel.dataset.lockedStage===String(n) && sig===lastEmbeddedStageSignatureV9613){
          updateEmbeddedTimersOnly(n);
        }else{
          if(n===3){
            try{ audienceModeV95='stage3'; }catch(e){}
            panel.innerHTML = (typeof renderAudienceStage3V95==='function') ? renderAudienceStage3V95() : '<p>لوحة المرحلة الثالثة غير جاهزة.</p>';
          }else{
            try{ audienceModeV95='stage4'; }catch(e){}
            panel.innerHTML = (typeof renderAudienceStage4V95==='function') ? renderAudienceStage4V95() : '<p>لوحة المرحلة الرابعة غير جاهزة.</p>';
          }
          panel.dataset.lockedStage=String(n);
          lastEmbeddedStageSignatureV9613=sig;
          document.querySelectorAll('#audiencePanel .audience-top-actions, #audiencePanel .audience-top-actions-v9520, #audiencePanel .audience-top-actions-v9521, #audiencePanel .audience-top-actions-v9522').forEach(x=>x.remove());
        }
      }
      const ans=document.getElementById('liveAnswersPanelV961');
      if(ans){
        const html=answersTableForStage(n);
        const ansSig=String(n)+'|'+html;
        if(ansSig!==lastEmbeddedAnswersSignatureV9613){ ans.innerHTML=html; lastEmbeddedAnswersSignatureV9613=ansSig; }
      }
    }catch(e){ console.warn(e); }
  }
  function renderDynamicPieces(){
    const status=flow?.status||GF.STATUS.waiting;
    const n=stageNumFromStatus(status), ph=phaseFromStatus(status);
    if(ph==='running' && (n===1 || n===2)){
      const left=GF.flowLeftSeconds(flow);
      const timer=document.getElementById('gameTimerV961');
      if(timer){
        timer.textContent=GF.formatSeconds(left);
        timer.classList.toggle('danger', left<=30);
      }
      const live=document.getElementById('gameLiveTableV965');
      if(live){
        const sig=JSON.stringify(sortedLive().map(t=>[t.id,t.name,liveScore(t),totalScore(t),province(t)]));
        if(sig!==lastLiveSignatureV965){
          live.innerHTML=liveTable();
          lastLiveSignatureV965=sig;
        }
      }
      return;
    }
    if(ph==='running' && (n===3 || n===4)){ return; }
  }

  function renderGameFlow(force=false){
    const box=document.getElementById('gameFlowPanel'); if(!box) return;
    const status=flow?.status||GF.STATUS.waiting;
    const n=stageNumFromStatus(status), ph=phaseFromStatus(status);
    const teamsKey = ph==='running'
      ? JSON.stringify(getTeams().map(t=>[t.id,t.readyStages,t.current]))
      : JSON.stringify(getTeams().map(t=>[t.id,t.score,t.stageScores,t.readyStages,t.current]));
    const key=[status, getTeams().length, teamsKey, JSON.stringify(flow?.durations||{})].join('|');
    if(!force && key===lastRenderKey){ renderDynamicPieces(); return; }
    lastRenderKey=key;
    box.innerHTML = `<div class="game-shell-v960">
      <header class="game-hero-v960"><div><span class="badge green">اللعبة</span><h2>${clean(statusLabel())}</h2><p>مسار واحد متسلسل يتحكم بالمتسابقين وشاشة الجمهور والنتائج.</p></div><div class="game-actions-v960">${audienceLink()}${mainAction()}</div></header>
      ${durationControls()}
      ${gameBody()}
      <footer class="game-footer-v960"><button class="btn danger" onclick="resetGameFlowV960()">إعادة اللعبة إلى انتظار الفرق</button></footer>
    </div>`;
    setTimeout(renderDynamicPieces, 40);
  }

  async function updateAllTeamsCurrent(current, extra={}, resetReadyStage=null){
    const snap=await db.collection('teams').get();
    const batch=db.batch();
    snap.forEach(doc=>{
      const payload=Object.assign({current, finished: current==='final'}, extra);
      if(resetReadyStage) payload.readyStages = {[resetReadyStage]: false};
      batch.set(doc.ref, payload, {merge:true});
    });
    await batch.commit();
  }
  function stageStartProgress(stage, startedAtMs, duration){
    if(stage===1) return {progress:{stage1:{i:0,startedAt:startedAtMs,startedAtMs,remaining:duration,ended:false,order: []}}};
    if(stage===2) return {progress:{stage2:{answered:{},roles:{},matching:{},startedTurns:{},stage2TurnStartedAt:{}}}};
    if(stage===3) return {progress:{stage3:{answered:{}}}};
    if(stage===4) return {progress:{stage4:{i:0,streak:0,ended:false,liveAnswers:{}}}};
    return {};
  }
  async function setFlow(payload){ await flowRef().set(Object.assign({updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, payload), {merge:true}); }
  async function commitFlowAndTeams(flowPayload, teamCurrent, teamExtra={}, resetReadyStage=null){
    const snap=await db.collection('teams').get();
    const batch=db.batch();
    snap.forEach(doc=>{
      const payload=Object.assign({current:teamCurrent, finished: teamCurrent==='final'}, teamExtra);
      if(resetReadyStage) payload.readyStages = {[resetReadyStage]: false};
      batch.set(doc.ref, payload, {merge:true});
    });
    batch.set(flowRef(), Object.assign({updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, flowPayload), {merge:true});
    await batch.commit();
  }


  window.saveGameDurationsV960 = async function(){
    const d=durationsFromUi(); saveDurationsLocal(d); await setFlow({durations:d}); alert('تم حفظ المؤقتات المركزية.');
  };
  window.goGameIntroV960 = async function(stage){
    const s=GF.STAGES[stage]; if(!s) return;
    const d=durationsFromUi(); saveDurationsLocal(d);
    await commitFlowAndTeams(
      {status:GF.stageStatus(stage,'intro'), currentStage:stage, phase:'intro', durations:d, startedAtMs:null, endsAtMs:null, durationSeconds:null, audienceMode:'waiting'},
      s.intro,
      {finished:false},
      s.key
    );
  };
  window.startGameStageV960 = async function(stage){
    const st=GF.STAGES[stage]; if(!st) return;
    if(!allReady(stage)) return alert('لا يمكن بدء المرحلة قبل أن تضغط كل الفرق زر جاهز من شاشة الشرح.');
    const d=durationsFromUi(); saveDurationsLocal(d);
    const startedAtMs=now();
    const durationSeconds = stage===1 ? d.stage1 : (stage===2 ? d.stage2Turn*4 : 0);
    const teamPayload = stageStartProgress(stage, startedAtMs, stage===1?d.stage1:d.stage2Turn);
    const snap=await db.collection('teams').get();
    const batch=db.batch();
    snap.forEach(doc=>batch.set(doc.ref, Object.assign({current:st.key, finished:false}, teamPayload), {merge:true}));
    if(stage===3 || stage===4){
      batch.set(db.collection('meta').doc('stage34DeepClean'),{status:'cleaned',stage,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
    }
    if(stage===3){
      const firstTeam = [...getTeams()].sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'ar'))[0] || null;
      batch.set(db.collection('meta').doc('stage3Final'),{status:'idle',currentTurnTeamId:firstTeam?.id||null,currentTurnTeamName:firstTeam?.name||'',currentTurnIndex:0,activeQuestion:null,usedQuestions:{},answers:{},results:[],updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
    }
    if(stage===4){
      batch.set(db.collection('meta').doc('stage4Final'),{status:'idle',currentQuestionIndex:0,activeQuestion:null,answers:{},results:[],updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
    }
    batch.set(flowRef(), {status:GF.stageStatus(stage,'running'), currentStage:stage, phase:'running', durations:d, startedAtMs, durationSeconds, endsAtMs: durationSeconds ? startedAtMs + durationSeconds*1000 : null, audienceMode: stage===3?'stage3':stage===4?'stage4':'live', updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
    await batch.commit();
  };
  window.finishGameStageV960 = async function(stage, manual=false){
    const st=GF.STAGES[stage]; if(!st) return;
    const snap=await db.collection('teams').get();
    const batch=db.batch();
    snap.forEach(doc=>{
      const t=doc.data()||{}; const done=Array.from(new Set([...(t.done||[]), st.key]));
      batch.set(doc.ref, {done, current:'moderatorWaitV960', progress:{[st.key]:{ended:true}}}, {merge:true});
    });
    if(stage===3 || stage===4){
      batch.set(db.collection('meta').doc('stage34DeepClean'),{status:'finished',stage,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
    }
    if(stage===3){
      batch.set(db.collection('meta').doc('stage3Final'),{status:'finished',updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
    }
    if(stage===4){
      batch.set(db.collection('meta').doc('stage4Final'),{status:'finished',updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
    }
    batch.set(flowRef(), {status:GF.stageStatus(stage,'finished'), currentStage:stage, phase:'finished', manualEnded:!!manual, endedAtMs:now(), durationSeconds:null, endsAtMs:null, audienceMode:'general', updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
    await batch.commit();
  };
  window.finishContestV960 = async function(){
    await updateAllTeamsCurrent('final', {finished:true});
    await setFlow({status:GF.STATUS.contestFinished, currentStage:4, phase:'contest_finished', audienceMode:'general', endedAtMs:now()});
  };
  window.showFinalResultsFromGameV960 = async function(){
    await setFlow({status:GF.STATUS.final, phase:'final_results', audienceMode:'general'});
    const btn=[...document.querySelectorAll('.admin-tabs button')].find(b=>b.getAttribute('onclick')?.includes("'finals'"));
    if(typeof showAdmin==='function') showAdmin('finals', btn || null);
  };
  window.resetGameFlowV960 = async function(){
    if(!confirm('إعادة اللعبة إلى انتظار الفرق؟ سيتم حذف كل الفرق والنقاط والتقدم والإجابات الحالية، وستعود شاشة الجمهور إلى البداية.')) return;
    const batch=db.batch();
    const teamsSnap=await db.collection('teams').get();
    teamsSnap.forEach(doc=>batch.delete(doc.ref));
    const locksSnap=await db.collection('stage3Locks').get();
    locksSnap.forEach(doc=>batch.delete(doc.ref));
    const timeoutLocksSnap=await db.collection('stage3TimeoutLocks').get().catch(()=>null);
    if(timeoutLocksSnap) timeoutLocksSnap.forEach(doc=>batch.delete(doc.ref));
    batch.set(flowRef(), {status:GF.STATUS.waiting, currentStage:0, phase:'waiting', startedAtMs:null, endsAtMs:null, durationSeconds:null, endedAtMs:null, manualEnded:false, audienceMode:'waiting', updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
    batch.set(db.collection('meta').doc('control'), {resetAt:String(Date.now()), paused:false, deletedTeams:[]}, {merge:true});
    batch.set(db.collection('meta').doc('activeStage3'), {id:null,team:null,teamName:null,status:'waiting',startedAtMs:null,revealDone:false}, {merge:true});
    batch.set(db.collection('meta').doc('stage3Control'), {started:false,paused:true,updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
    batch.set(db.collection('meta').doc('stage3Turn'), {team:null,teamName:null,index:0,turnStartedAtMs:null,updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
    batch.set(db.collection('meta').doc('stage3Reveal'), {status:'idle',answers:[],updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
    batch.set(db.collection('meta').doc('stage4Live'), {status:'waiting',index:0,startedAtMs:null,revealDone:false}, {merge:true});
    batch.set(db.collection('meta').doc('stage4Reveal'), {status:'idle',answers:[],updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
    batch.set(db.collection('meta').doc('stage3Final'), {status:'idle',currentTurnTeamId:null,currentTurnTeamName:'',currentTurnIndex:0,activeQuestion:null,usedQuestions:{},answers:{},results:[],updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
    batch.set(db.collection('meta').doc('stage4Final'), {status:'idle',currentQuestionIndex:0,activeQuestion:null,answers:{},results:[],updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
    await batch.commit();
    try{ teams=[]; }catch(e){}
    lastRenderKey='';
    renderGameFlow(true);
  };

  function autoFinishCheck(){
    if(autoBusy || !flow) return;
    const n=stageNumFromStatus(flow.status), ph=phaseFromStatus(flow.status);
    if(ph==='running' && (n===1 || n===2) && GF.flowLeftSeconds(flow)<=0){
      autoBusy=true; window.finishGameStageV960(n,false).finally(()=>{autoBusy=false;});
    }
  }
  function installShowAdminHook(){
    const old=window.showAdmin;
    window.showAdmin=function(id,btn){
      if(id==='game'){
        document.querySelectorAll('.admin-page').forEach(p=>p.classList.add('hidden'));
        document.getElementById('game')?.classList.remove('hidden');
        document.querySelectorAll('.admin-tabs button').forEach(b=>b.classList.remove('active'));
        btn?.classList?.add('active');
        renderGameFlow(true);
        return;
      }
      return old ? old(id,btn) : undefined;
    };
  }
  function listenFlow(){
    flowRef().onSnapshot(doc=>{
      flowLoaded=true;
      flow = Object.assign({status:GF.STATUS.waiting, durations:GF.DEFAULT_DURATIONS}, doc.data()||{});
      saveDurationsLocal(flow.durations||{});
      renderGameFlow(false);
    }, console.error);
  }
  function listenTeamsForGame(){
    if(teamsWatchStarted) return; teamsWatchStarted=true;
    try{
      db.collection('teams').onSnapshot(()=>{ setTimeout(()=>renderGameFlow(false), 20); }, console.error);
    }catch(e){}
  }
  function patchOldStageFinishButtons(){
    const old3=window.finishAudienceStage3V958;
    window.finishAudienceStage3V958=async function(){
      if((flow?.status||'')===GF.stageStatus(3,'running')) return window.finishGameStageV960(3,true);
      return old3 ? old3.apply(this,arguments) : undefined;
    };
    const old4=window.finishAudienceStage4V958;
    window.finishAudienceStage4V958=async function(){
      if((flow?.status||'')===GF.stageStatus(4,'running')) return window.finishGameStageV960(4,true);
      return old4 ? old4.apply(this,arguments) : undefined;
    };
  }
  document.addEventListener('DOMContentLoaded',()=>{
    installShowAdminHook();
    listenFlow();
    listenTeamsForGame();
    patchOldStageFinishButtons();
    setInterval(()=>{
      const ae=document.activeElement;
      if(!(ae && String(ae.id||'').startsWith('gf_'))){
        const n=stageNumFromStatus(flow?.status), ph=phaseFromStatus(flow?.status);
        if(ph==='running') renderDynamicPieces();
        else renderGameFlow(false);
      }
      autoFinishCheck();
    }, 700);
    setTimeout(()=>{ const active=document.querySelector('.admin-tabs button.active'); if(active?.getAttribute('onclick')?.includes("'game'")) renderGameFlow(true); }, 600);
  });
})();
