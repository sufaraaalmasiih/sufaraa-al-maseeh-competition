/* Sufaraa v9.6.4 - Contestant flow, stable waiting screens and smoother transitions */
(function(){
  'use strict';
  const GF = window.SUFARAA_GAME_FLOW;
  if(!GF) return;
  let flow = null;
  let syncBusy = false;
  let loginLocked = false;
  let lastWaitingSignature = '';
  let lastSyncTarget = '';
  let lastSyncAt = 0;
  const clean = (x) => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const stageNum = (status) => Number(String(status||'').match(/^stage(\d)_/)?.[1] || 0);
  const phase = (status) => String(status||'').split('_').slice(1).join('_');
  const flowRef = () => db.collection('meta').doc('gameFlow');
  function pageExists(id){ return !!document.getElementById(id); }
  function activePageId(){ const el=document.querySelector('#appScreen .page.active'); return el ? el.id : ''; }
  function showPage(id){
    try{
      const sameActive = activePageId() === id;
      if(pageExists(id) && typeof page === 'function' && !sameActive) page(id, false);
      // لا نصفر السكرول إذا كنا أصلًا في نفس الصفحة، خصوصًا المرحلة الثانية بعد تسجيل الإجابة.
      if(!sameActive){
        try{
          window.scrollTo({top:0,left:0,behavior:'instant'});
          document.documentElement.scrollTop=0;
          document.body.scrollTop=0;
          const app=document.getElementById('appScreen');
          const container=document.querySelector('#appScreen .container');
          if(app) app.scrollTop=0;
          if(container) container.scrollTop=0;
        }catch(_e){}
      }
    }catch(e){ console.warn(e); }
  }
  function setStatusText(text){ const el=document.getElementById('statusText'); if(el) el.textContent=text; }
  function stageKey(n){ return `stage${Number(n)}`; }
  function isTeamStageEnded(stage){
    try{
      const key = stageKey(stage);
      return !!(team && ((team.done||[]).includes(key) || team.current === 'moderatorWaitV960' || team.progress?.[key]?.ended === true));
    }catch(e){ return false; }
  }
  function isActiveGameStatus(status){ return status && status !== GF.STATUS.waiting && status !== 'waiting_players' && status !== GF.STATUS.contestFinished && status !== GF.STATUS.final; }
  function disabledStartButtons(){
    document.querySelectorAll('.start-stage-btn').forEach(btn=>{
      btn.disabled = true;
      btn.classList.add('moderator-locked-v960');
      btn.style.display = 'none';
      btn.setAttribute('aria-hidden','true');
      btn.onclick = null;
    });
  }
  function ensureWaitingPage(){
    let existing=document.getElementById('moderatorWaitV960');
    if(existing){
      if(!existing.innerHTML.trim()){
        existing.innerHTML = '<div class="wait-card-v960 stable"><div class="wait-icon-v960">⏳</div><h2>بانتظار الميسر</h2><p>سيتم فتح المرحلة وبدؤها من لوحة الميسر.</p></div>';
      }
      return;
    }
    const app=document.getElementById('appScreen'); if(!app) return;
    const sec=document.createElement('section');
    sec.className='page card moderator-wait-v960';
    sec.id='moderatorWaitV960';
    sec.innerHTML = '<div class="wait-card-v960 stable"><div class="wait-icon-v960">⏳</div><h2>بانتظار الميسر</h2><p>سيتم فتح المرحلة وبدؤها من لوحة الميسر.</p></div>';
    app.appendChild(sec);
  }
  function renderWaiting(kind, stage){
    if(shouldRouteFinishedWaitToCurrentFlow(kind, stage)){
      if(routeContestantToCurrentFlow()) return;
    }
    ensureWaitingPage();
    const sec=document.getElementById('moderatorWaitV960'); if(!sec) return;
    const title = kind==='finished' ? `أحسنتم! أنهيتم ${GF.STAGES[stage]?.title || 'المرحلة'}` : 'بانتظار الميسر';
    const msg = kind==='finished'
      ? 'تبقى هذه الشاشة ظاهرة إلى أن ينقلكم الميسر إلى المرحلة التالية.'
      : 'سيتم فتح المرحلة وبدؤها من لوحة الميسر.';
    const pts = stage ? Number((team?.stageScores||{})[`stage${stage}`]||0) : 0;
    try{ document.body.classList.add('flow-waiting-active-v966'); }catch(e){}
    const signature=[kind,stage,pts,title,msg].join('|');
    if(signature!==lastWaitingSignature){
      sec.innerHTML = `<div class="wait-card-v960 stable"><div class="wait-icon-v960">${kind==='finished'?'🏆':'⏳'}</div><h2>${clean(title)}</h2><p>${clean(msg)}</p>${kind==='finished'?`<strong>${pts} نقطة في هذه المرحلة</strong>`:''}</div>`;
      lastWaitingSignature=signature;
    }
    const scoreEl=document.getElementById('score'); if(scoreEl && typeof team!=='undefined' && team) scoreEl.textContent=Number(team.score||0);
    showPage('moderatorWaitV960');
  }
  window.renderWaiting = renderWaiting;

  function showSafeLoginIfNoVerifiedTeam(){
    try{
      const login=document.getElementById('loginScreen');
      const app=document.getElementById('appScreen');
      if(typeof team!=='undefined' && team) return;
      document.body.classList.remove('app-active-v95106b','flow-waiting-active-v966');
      document.body.classList.add('login-active-v95106b');
      if(app){app.classList.add('hidden');app.style.display='none';}
      if(login){login.classList.remove('hidden');login.style.display='';}
    }catch(e){console.warn(e);}
  }

  function renderLoginLock(){
    const login=document.getElementById('loginScreen'); if(!login) return;
    let note=document.getElementById('gameLoginLockV961');
    if(!note){
      note=document.createElement('div');
      note.id='gameLoginLockV961';
      note.className='game-login-lock-v961';
      login.insertBefore(note, login.firstChild);
    }
    const btn=document.getElementById('loginBtn');
    if(loginLocked && !(typeof teamName!=='undefined' && teamName)){
      note.innerHTML='<b>تم إغلاق تسجيل الفرق.</b><br>بدأت اللعبة بالفعل. اطلب من الميسر إنهاء اللعبة أو إعادتها لوضع انتظار الفرق لتسجيل فريق جديد.';
      note.style.display='block';
      if(btn){btn.disabled=true; btn.textContent='التسجيل مغلق';}
    }else{
      note.style.display='none';
      if(btn && btn.textContent==='التسجيل مغلق'){btn.disabled=false; btn.textContent='البدء';}
    }
  }
  function injectReadyButton(stage){
    const intro=document.getElementById(`intro${stage}`); if(!intro || !(typeof team!=='undefined' && team)) return;
    disabledStartButtons();
    let box=intro.querySelector('.ready-box-v961');
    if(!box){
      box=document.createElement('div');
      box.className='ready-box-v961';
      const host=intro.querySelector('.intro-content') || intro;
      host.appendChild(box);
    }
    const key=stageKey(stage);
    const ready=team?.readyStages?.[key]===true;
    box.innerHTML=`<p class="muted">اضغط جاهز بعد قراءة الشرح.</p><button class="btn ${ready?'success':'secondary'}" id="readyStageBtnV961" ${ready?'disabled':''}>${ready?'تم تسجيل جاهزيتكم':'جاهز للمرحلة'}</button>`;
    const btn=box.querySelector('#readyStageBtnV961');
    if(btn && !ready){
      btn.onclick=async()=>{
        btn.disabled=true; btn.textContent='جاري التسجيل...';
        try{
          if(typeof patchTeam==='function') await patchTeam({readyStages:{[key]:true}});
          if(typeof team!=='undefined' && team){ team.readyStages=Object.assign({},team.readyStages||{}, {[key]:true}); }
          injectReadyButton(stage);
        }catch(e){ console.error(e); btn.disabled=false; btn.textContent='جاهز للمرحلة'; alert('تعذر تسجيل الجاهزية. تأكد من الاتصال.'); }
      };
    }
  }
  async function patchCurrentIfNeeded(next){
    if(!next || !(typeof team!=='undefined' && team) || !(typeof teamName!=='undefined' && teamName) || typeof patchTeam !== 'function') return;
    if(team.current === next) return;
    try{ await patchTeam({current:next, finished: next==='final'}); }catch(e){ console.warn(e); }
  }
  function targetForFlowStatus(status){
    const st = status || flow?.status || GF.STATUS.waiting;
    const n = stageNum(st), ph = phase(st);
    if(st === 'contest_finished' || st === 'final_results') return 'final';
    if(n && ((team?.done||[]).includes(`stage${n}`) || team?.progress?.[`stage${n}`]?.ended) && (ph==='running' || ph==='finished')) return 'moderatorWaitV960';
    if(ph === 'intro') return `intro${n}`;
    if(ph === 'running') return `stage${n}`;
    if(ph === 'finished') return 'moderatorWaitV960';
    if(st === 'waiting_players') return 'moderatorWaitV960';
    return null;
  }
  function isFlowControlling(){
    const st = flow?.status || '';
    return !!st && st !== GF.STATUS.waiting;
  }
  function shouldRouteFinishedWaitToCurrentFlow(kind, stage){
    if(kind !== 'finished') return false;
    const st = flow?.status || '';
    if(!st || st === GF.STATUS.waiting || st === 'waiting_players') return false;
    const n = stageNum(st), ph = phase(st);
    if(!n) return false;
    // إذا كانت المرحلة الحالية نفسها منتهية/قيد اللعب، شاشة الانتظار صحيحة.
    // أما إذا كان الميسر انتقل إلى شرح/تشغيل مرحلة أخرى، فـ gameFlow هو القائد.
    if(Number(stage) === n && (ph === 'running' || ph === 'finished')) return false;
    return true;
  }
  function routeContestantToCurrentFlow(){
    const st = flow?.status || '';
    const n = stageNum(st), ph = phase(st);
    const target = targetForFlowStatus(st);
    if(!target) return false;
    if(target === 'moderatorWaitV960'){
      if(n){
        // اعرض انتظار المرحلة الحالية، لا انتظار مرحلة قديمة.
        const sec=document.getElementById('moderatorWaitV960');
        lastWaitingSignature='';
        renderWaiting('finished', n);
        return true;
      }
      return false;
    }
    try{ document.body.classList.remove('flow-waiting-active-v966'); }catch(e){}
    if(target && document.getElementById(target)){
      if(activePageId() !== target) showPage(target);
      if(ph === 'intro'){
        disabledStartButtons();
        injectReadyButton(n);
        setStatusText(`شرح ${GF.STAGES[n]?.title || 'المرحلة'} مفتوح. البداية من الميسر.`);
      }else if(ph === 'running'){
        setStatusText(`${GF.STAGES[n]?.title || 'المرحلة'} بدأت من لوحة الميسر.`);
        if(n===1 && typeof render1==='function') render1();
        if(n===2 && typeof render2==='function') render2();
        if(n===3 && typeof render3==='function') render3();
        if(n===4 && typeof render4==='function') render4();
      }
      if(typeof patchTeam==='function') patchCurrentIfNeeded(target);
      return true;
    }
    return false;
  }
  async function syncToFlow(){
    if(syncBusy || !flow || !(typeof team!=='undefined' && team)) return;
    const status=flow.status || GF.STATUS.waiting;
    syncBusy=true;
    try{
      const n=stageNum(status), ph=phase(status);
      if(status==='waiting_players'){
        setStatusText('تم تسجيلكم. انتظروا بداية اللعبة من الميسر.');
        renderWaiting('waiting',0);
        patchCurrentIfNeeded('intro1');
      }else if(ph==='intro'){
        try{ document.body.classList.remove('flow-waiting-active-v966'); }catch(e){}
        setStatusText(`شرح ${GF.STAGES[n]?.title || 'المرحلة'} مفتوح. البداية من الميسر.`);
        if(activePageId() !== `intro${n}`){ showPage(`intro${n}`); lastSyncTarget=`intro${n}`; lastSyncAt=Date.now(); }
        disabledStartButtons();
        injectReadyButton(n);
        patchCurrentIfNeeded(`intro${n}`);
      }else if(ph==='running'){
        if(n && (((team?.done||[]).includes(`stage${n}`)) || team?.progress?.[`stage${n}`]?.ended)){
          setStatusText(`انتهت ${GF.STAGES[n]?.title || 'المرحلة'}. انتظروا قرار الميسر.`);
          renderWaiting('finished', n);
          return;
        }
        try{ document.body.classList.remove('flow-waiting-active-v966'); }catch(e){}
        setStatusText(`${GF.STAGES[n]?.title || 'المرحلة'} بدأت من لوحة الميسر.`);
        if(activePageId() !== `stage${n}`){ showPage(`stage${n}`); lastSyncTarget=`stage${n}`; lastSyncAt=Date.now(); }
        patchCurrentIfNeeded(`stage${n}`);
        if(n===1 && typeof render1==='function') render1();
        if(n===2 && typeof render2==='function') render2();
        if(n===3 && typeof render3==='function') render3();
        if(n===4 && typeof render4==='function') render4();
      }else if(ph==='finished'){
        setStatusText(`انتهت ${GF.STAGES[n]?.title || 'المرحلة'}. انتظروا قرار الميسر.`);
        const sKey = stageKey(n);
        const done = Array.from(new Set([...(team?.done||[]), sKey]));
        const nextProgress = Object.assign({}, team?.progress||{});
        nextProgress[sKey] = Object.assign({}, nextProgress[sKey]||{}, {ended:true});
        if(team.current !== 'moderatorWaitV960' || !(team.done||[]).includes(sKey)){
          try{ await patchTeam({current:'moderatorWaitV960', done, progress:nextProgress}); }catch(e){ console.warn(e); }
          team.current='moderatorWaitV960'; team.done=done; team.progress=nextProgress;
        }
        renderWaiting('finished', n);
      }else if(status==='contest_finished' || status==='final_results'){
        showPage('final');
        patchCurrentIfNeeded('final');
      }
    }catch(e){ console.error('game flow contestant sync failed', e); }
    finally{ syncBusy=false; }
  }

  const oldFinishStage = window.finishStage;
  if(typeof oldFinishStage === 'function'){
    window.finishStage = finishStage = async function(id,next){
      try{
        const stage = Number(String(id||'').replace('stage',''));
        // V9.6.61: أي إنهاء مرحلة من جهة المتسابق يتحول إلى شاشة انتظار الميسر فقط.
        // لا نعود إلى finishStage القديم لأنه يستدعي رسالة المباركة القديمة أو انتقال داخلي.
        if(stage){
          const sKey = `stage${stage}`;
          const done = Array.from(new Set([...(team?.done||[]), sKey]));
          const nextProgress = Object.assign({}, team?.progress||{});
          nextProgress[sKey] = Object.assign({}, nextProgress[sKey]||{}, {ended:true});
          const flowTarget = shouldRouteFinishedWaitToCurrentFlow('finished', stage) ? targetForFlowStatus(flow?.status) : 'moderatorWaitV960';
          const nextCurrent = flowTarget && flowTarget !== 'moderatorWaitV960' ? flowTarget : 'moderatorWaitV960';
          if(typeof patchTeam==='function') await patchTeam({done, progress:nextProgress, current:nextCurrent});
          if(typeof team!=='undefined' && team){ team.done=done; team.progress=nextProgress; team.current=nextCurrent; }
          try{ const old=document.getElementById('achievementOverlay'); if(old) old.remove(); }catch(_e){}
          if(shouldRouteFinishedWaitToCurrentFlow('finished', stage) && routeContestantToCurrentFlow()) return;
          renderWaiting('finished', stage);
          return;
        }
      }catch(e){ console.warn(e); }
      return oldFinishStage.apply(this, arguments);
    };
  }

  const oldStartStage = window.startStage;
  window.startStage = async function(id){
    const n=Number(String(id).replace('stage',''));
    if(flow && flow.status !== GF.stageStatus(n,'running')){
      alert('بداية المرحلة تتم من لوحة الميسر فقط.');
      return;
    }
    return oldStartStage ? oldStartStage(id) : undefined;
  };

  const oldPage = window.page;
  if(typeof oldPage === 'function'){
    window.page = page = function(id, push){
      const st=flow?.status||''; const n=stageNum(st), ph=phase(st);
      if(ph==='finished' && String(id).startsWith('stage')) return renderWaiting('finished', n);
      if(ph==='intro' && String(id).startsWith('stage')) return showPage(`intro${n}`);
      return oldPage.apply(this, arguments);
    };
  }

  const oldUpdateUI = window.updateUI;
  if(typeof oldUpdateUI === 'function'){
    window.updateUI = updateUI = function(){
      try{
        const st=flow?.status || '';
        const n=stageNum(st), ph=phase(st);
        if(isFlowControlling() && (ph==='finished' || st==='waiting_players')){
          disabledStartButtons();
          const scoreEl=document.getElementById('score');
          if(scoreEl && typeof team!=='undefined' && team) scoreEl.textContent=Number(team.score||0);
          if(ph==='finished') renderWaiting('finished', n);
          else renderWaiting('waiting', 0);
          return;
        }
      }catch(e){ console.warn(e); }
      const result = oldUpdateUI.apply(this, arguments);
      try{
        disabledStartButtons();
        const scoreEl=document.getElementById('score');
        if(scoreEl && typeof team!=='undefined' && team) scoreEl.textContent=Number(team.score||0);
        const target = targetForFlowStatus();
        if(target && isFlowControlling()){
          const st=flow?.status || '';
          const n=stageNum(st), ph=phase(st);
          if(ph==='finished') renderWaiting('finished', n);
          else if(st==='waiting_players') renderWaiting('waiting', 0);
          else if(target && document.getElementById(target)) showPage(target);
          if(ph==='intro') injectReadyButton(n);
        }
      }catch(e){ console.warn(e); }
      return result;
    };
  }

  const oldStage2SecondsLeft = window.stage2SecondsLeft;
  if(typeof oldStage2SecondsLeft === 'function'){
    window.stage2SecondsLeft = stage2SecondsLeft = function(type,p){
      const duration = GF.localDuration('stage2Turn', 150);
      const startedAt = Number((p.stage2TurnStartedAt||{})[type] || 0);
      if(!startedAt) return duration;
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      return Math.max(0, duration - elapsed);
    };
  }

  const oldRender1 = window.render1;
  if(typeof oldRender1 === 'function'){
    window.render1 = render1 = function(){
      const status=flow?.status || '';
      if(status !== GF.stageStatus(1,'running')) return renderWaiting(phase(status)==='finished'?'finished':'waiting',1);
      if(isTeamStageEnded(1)) return renderWaiting('finished',1);
      const left = GF.flowLeftSeconds(flow);
      if(window.stage1Runtime){
        stage1Runtime.remaining = left;
        stage1Runtime.running = left > 0;
        stage1Runtime.lastKey = String(flow.startedAtMs || 'gameflow-stage1');
      }
      if(team?.progress?.stage1){
        team.progress.stage1.startedAt = Number(flow.startedAtMs || team.progress.stage1.startedAt || Date.now());
        team.progress.stage1.remaining = left;
        team.progress.stage1.ended = left <= 0 || phase(flow.status)==='finished';
      }
      if(left <= 0){
        try{
          const done = Array.from(new Set([...(team?.done||[]), 'stage1']));
          const nextProgress = Object.assign({}, team?.progress||{});
          nextProgress.stage1 = Object.assign({}, nextProgress.stage1||{}, {ended:true});
          if(team.current !== 'moderatorWaitV960') patchTeam({current:'moderatorWaitV960', done, progress:nextProgress}).catch(console.warn);
          team.current='moderatorWaitV960'; team.done=done; team.progress=nextProgress;
        }catch(e){ console.warn(e); }
        return renderWaiting('finished',1);
      }
      oldRender1();
      const timer=document.getElementById('timer1'); if(timer) timer.textContent=GF.formatSeconds(left);
    };
  }



  function acceptedAnswerFlowV9660(answer, q){
    const normalize = (v) => String(v ?? '').trim().toLowerCase()
      .replace(/[\u064B-\u065F\u0670]/g,'')
      .replace(/[أإآ]/g,'ا')
      .replace(/ى/g,'ي')
      .replace(/ة/g,'ه')
      .replace(/\s+/g,' ');
    const list=[];
    if(q?.answer) list.push(q.answer);
    if(q?.correct) list.push(q.correct);
    if(Array.isArray(q?.acceptedAnswers)) list.push(...q.acceptedAnswers);
    const a=normalize(answer);
    return list.filter(Boolean).some(x=>normalize(x)===a);
  }
  const oldAnswerStage1FlowV9660 = window.answerStage1;
  if(typeof oldAnswerStage1FlowV9660 === 'function'){
    window.answerStage1 = answerStage1 = async function(trigger,i,q,p,selected){
      try{
        const plan = typeof getStage1Plan==='function' ? getStage1Plan(team?.progress?.stage1 || p || {}) : [];
        const total = plan.length || Math.min(50, (window.DATA?.stage1 || DATA?.stage1 || []).length || 50);
        const answer = String(selected || '').trim();
        if(answer && Number(i) >= total - 1){
          if(trigger) trigger.classList.add('stage1-selected');
          document.querySelectorAll('#a1 button,#a1 input').forEach(x=>x.disabled=true);
          const qtype = (typeof stage1QuestionType==='function') ? stage1QuestionType(q, i) : String(q?.type||'');
          let ok = acceptedAnswerFlowV9660(answer, q);
          // ترتيب: نقبل المقارنة مع ترتيب الأنسر كما في ملف إصلاحات المرحلة الأولى.
          if(!ok && String(qtype).includes('رت')){
            const norm = v => String(v??'').replace(/[ًٌٍَُِّْـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/[\s|،,؛;\-–—_]+/g,' ').trim();
            ok = norm(answer) === norm(q?.answer || q?.correct || '');
          }
          const pts = ok ? 5 : 0;
          const remaining = Math.max(0, Number(window.stage1Runtime?.remaining ?? p?.remaining ?? team?.progress?.stage1?.remaining ?? 0));
          const key = 'stage1';
          const done = Array.from(new Set([...(team?.done||[]), key]));
          const nextProgress = Object.assign({}, team?.progress || {});
          nextProgress.stage1 = Object.assign({}, nextProgress.stage1 || p || {}, {i:total, remaining, ended:true});
          if(team){ team.progress=nextProgress; team.done=done; team.current='moderatorWaitV960'; }
          renderWaiting('finished',1);
          if(typeof changeScore==='function'){
            await changeScore(pts,'stage1', typeof makeLog==='function' ? makeLog('اجمعوا الكنوز',q?.q,answer,q?.answer||q?.correct,ok,pts) : null, {progress:nextProgress, done, current:'moderatorWaitV960'});
          }else if(typeof patchTeam==='function'){
            await patchTeam({progress:nextProgress, done, current:'moderatorWaitV960'});
          }
          renderWaiting('finished',1);
          return;
        }
      }catch(e){ console.warn('stage1 final answer unified flow failed; falling back', e); }
      return oldAnswerStage1FlowV9660.apply(this, arguments);
    };
  }

  function listenFlow(){
    flowRef().onSnapshot(doc=>{
      flow = Object.assign({status:GF.STATUS.waiting, durations:GF.DEFAULT_DURATIONS}, doc.data()||{});
      try{
        localStorage.setItem('sufaraa_game_durations_v960', JSON.stringify(GF.normalizeDurations(flow.durations||{})));
      }catch(e){}
      loginLocked = isActiveGameStatus(flow.status||GF.STATUS.waiting);
      renderLoginLock();
      disabledStartButtons();
      syncToFlow();
    }, console.error);
    setInterval(()=>{
      renderLoginLock();
      if(flow?.status===GF.stageStatus(1,'running') && !isTeamStageEnded(1) && team?.current==='stage1' && typeof render1==='function') render1();
      const n=stageNum(flow?.status), ph=phase(flow?.status);
      if(ph==='intro') injectReadyButton(n);
    }, 700);
  }
  document.addEventListener('DOMContentLoaded',()=>{
    disabledStartButtons();
    ensureWaitingPage();
    setTimeout(showSafeLoginIfNoVerifiedTeam, 250);
    setTimeout(showSafeLoginIfNoVerifiedTeam, 1200);
    setTimeout(listenFlow, 0);
  });
})();
