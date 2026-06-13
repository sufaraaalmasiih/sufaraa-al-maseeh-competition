(function(){
  'use strict';

  const root = document.getElementById('audienceRoot');
  const connectionLabel = document.getElementById('audienceConnectionLabel');
  const statusLabel = document.getElementById('audienceStatusLabel');
  const fullscreenBtn = document.getElementById('audienceFullscreenBtn');
  const reloadBtn = document.getElementById('audienceReloadBtn');
  const headerEyebrow = document.getElementById('audienceHeaderEyebrow');
  const headerTitle = document.getElementById('audienceHeaderTitle');
  const headerSubtitle = document.getElementById('audienceHeaderSubtitle');

  const state = {
    connected:false,
    error:'',
    flow:{status:'waiting_players'},
    teams:[],
    stage3:{status:'idle'},
    stage4:{status:'idle'},
    finishedKey:'',
    finishedCountdownStartedAt:0,
    finalGeneralStartedAt:0,
    currentView:'',
    currentHtml:'',
    localReveal:{
      stage3:{key:'', startAtMs:0, results:[], duration:15},
      stage4:{key:'', startAtMs:0, results:[], duration:15}
    },
    rankHistory:{}
  };

  const STAGE_TITLES = {1:'المرحلة الأولى',2:'المرحلة الثانية',3:'المرحلة الثالثة',4:'المرحلة الرابعة'};
  const STAGE_NAMES = {1:'اجمعوا الكنوز',2:'فتشوا الكتب',3:'على المحك',4:'اثبتوا بالحق'};
  const SLOGAN = 'نحيا بالكلمة ونشهد للحق';

  function esc(v){
    return String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  const now = ()=> Date.now();
  const clamp = (n,min,max)=> Math.max(min, Math.min(max, Number(n)||0));
  const stageFromStatus = status => Number(String(status||'').match(/^stage(\d)_/)?.[1] || 0);
  const phaseFromStatus = status => String(status||'waiting_players').split('_').slice(1).join('_');
  const teamName = t => String(t?.name || t?.teamName || t?.id || 'فريق');
  const province = t => String(t?.governorate || t?.province || '').trim();
  const stageScore = (t,n)=> Number((t?.stageScores || {})['stage'+Number(n)] || 0);
  function totalScore(t){
    const ss = t?.stageScores || {};
    return Number(t?.score ?? ((+ss.stage1||0)+(+ss.stage2||0)+(+ss.stage3||0)+(+ss.stage4||0))) || 0;
  }
  function sortedByStage(n){
    return [...(state.teams||[])].sort((a,b)=>stageScore(b,n)-stageScore(a,n)||totalScore(b)-totalScore(a)||teamName(a).localeCompare(teamName(b),'ar'));
  }
  function sortedGeneral(){
    return [...(state.teams||[])].sort((a,b)=>totalScore(b)-totalScore(a)||teamName(a).localeCompare(teamName(b),'ar'));
  }
  function leftSeconds(endsAtMs){
    const end = Number(endsAtMs || 0);
    return end ? Math.max(0, Math.ceil((end - now())/1000)) : 0;
  }
  function fmt(s){
    s = Math.max(0, Number(s)||0);
    return String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0');
  }
  function statusArabic(status){
    if(status === 'waiting_players') return 'لم تبدأ المسابقة بعد';
    if(status === 'contest_finished') return 'انتهت المسابقة';
    if(status === 'final_results') return 'النتائج النهائية';
    const st = stageFromStatus(status), ph = phaseFromStatus(status);
    if(!st) return String(status || 'غير معروف');
    if(ph === 'intro') return STAGE_TITLES[st] + ' — شرح المرحلة';
    if(ph === 'running') return STAGE_TITLES[st] + ' — قيد اللعب';
    if(ph === 'finished') return STAGE_TITLES[st] + ' — انتهت';
    return STAGE_TITLES[st];
  }
  function setHeaderInfo(title, subtitle, eyebrow){
    if(headerEyebrow) headerEyebrow.textContent = eyebrow || ''; 
    if(headerTitle) headerTitle.textContent = title || 'سفراء المسيح';
    if(headerSubtitle) headerSubtitle.textContent = subtitle || '';
  }
  function updateFooter(){
    if(connectionLabel) connectionLabel.textContent = state.error ? 'خطأ في الاتصال' : (state.connected ? 'متصل بقاعدة البيانات' : 'بانتظار الاتصال');
    if(statusLabel) statusLabel.textContent = state.error ? state.error : ('الحالة: ' + statusArabic(state.flow?.status || 'waiting_players'));
  }

  function rankingDenseClass(count){
    if(count > 12) return ' ultra-dense';
    if(count > 8) return ' dense';
    return '';
  }
  function answerDenseClass(count){
    if(count > 12) return ' compact';
    if(count > 8) return ' dense';
    return '';
  }
  function rankClass(i){ return i===0?'first':(i===1?'second':(i===2?'third':'')); }

  function renderWaiting(){
    setHeaderInfo('سفراء المسيح', '', '');
    const teams = [...state.teams].sort((a,b)=>teamName(a).localeCompare(teamName(b),'ar'));
    const teamList = teams.length
      ? `<div class="aud-team-chip-wrap ${teams.length>8?'dense':''}">${teams.map(t=>`<div class="aud-team-chip"><strong>${esc(teamName(t))}</strong>${province(t)?`<small>${esc(province(t))}</small>`:''}</div>`).join('')}</div>`
      : `<div class="aud-empty">بانتظار تسجيل الفرق...</div>`;
    state.currentView = 'waiting';
    return `<section class="aud-view aud-hero">
      <img src="logo.png" alt="شعار سفراء المسيح" class="aud-hero-logo" />
      <div class="aud-kicker">مسابقة</div>
      <h1 class="aud-hero-title">سفراء المسيح</h1>
      <p class="aud-hero-sub">لم تبدأ المسابقة بعد</p>
      ${teamList}
    </section>`;
  }

  function standingRows(list, scoreFn, scoreLabel, showTotal, opts){
    opts = opts || {};
    if(!list.length) return '<div class="aud-empty">لا توجد فرق مسجلة بعد.</div>';
    const max = Math.max(1, ...list.map(scoreFn));
    const dense = rankingDenseClass(list.length);
    const historyKey = String(opts.historyKey || 'default');
    const progressive = !!opts.progressive;
    const currentMap = {};
    const previousMap = state.rankHistory[historyKey] || {};
    const rows = list.map((t,i)=>{
      const score = Number(scoreFn(t)||0);
      const pct = clamp(score / max * 100, 4, 100);
      const id = String(t.id || teamName(t) + '::' + province(t));
      currentMap[id] = i + 1;
      const oldRank = Number(previousMap[id] || 0);
      const movedUp = oldRank && oldRank > (i + 1);
      const movedDown = oldRank && oldRank < (i + 1);
      const revealDelay = progressive ? Math.max(0, (list.length - i - 1)) : (i * 0.06);
      return `<article class="aud-standing-row${dense} ${rankClass(i)}${progressive?' progressive-row':''}${movedUp?' moved-up':''}${movedDown?' moved-down':''}" style="--reveal-delay:${revealDelay}s;--move-shift:${Math.max(1, Math.abs(oldRank - (i+1) || 1))};">
        <div class="aud-standing-points">
          <b>${score}</b>
          <small>${esc(scoreLabel)}</small>
          ${showTotal?`<em>المجموع ${totalScore(t)}</em>`:''}
        </div>
        <div class="aud-standing-main">
          <div class="aud-standing-name-wrap">
            <strong>${esc(teamName(t))}</strong>
            ${province(t)?`<span>${esc(province(t))}</span>`:''}
          </div>
          <div class="aud-standing-bar"><i style="width:${pct}%"></i></div>
        </div>
        <div class="aud-standing-rank">${i+1}</div>
      </article>`;
    }).join('');
    state.rankHistory[historyKey] = currentMap;
    return `<div class="aud-standing-list${dense}${progressive?' progressive-list':''}">${rows}</div>`;
  }

  function renderStageRanking(stage){
    setHeaderInfo(STAGE_NAMES[stage], `${STAGE_TITLES[stage]} · ترتيب الفرق حسب نقاط هذه المرحلة فقط.`, 'سفراء المسيح');
    state.currentView = 'ranking-stage' + stage;
    return `<section class="aud-view compact"><div class="aud-stage-chip">${esc(STAGE_NAMES[stage])}</div>${standingRows(sortedByStage(stage), t=>stageScore(t, stage), 'نقاط المرحلة', false, {historyKey:'stage-'+stage})}</section>`;
  }

  function renderIntro(stage){
    setHeaderInfo(STAGE_NAMES[stage], `${STAGE_TITLES[stage]} · استعدوا للبداية`, 'سفراء المسيح');
    state.currentView = 'intro-stage' + stage;
    return `<section class="aud-view compact"><div class="aud-intro-card"><div class="aud-stage-index">${stage}</div><h2>${esc(STAGE_NAMES[stage] || '')}</h2><p>بانتظار أمر الميسر لبدء المرحلة.</p></div></section>`;
  }

  function finishedCountdownInfo(status){
    const key = status + '::' + String(state.flow?.endedAtMs || state.flow?.updatedAt?.seconds || 'x');
    if(state.finishedKey !== key){
      state.finishedKey = key;
      state.finishedCountdownStartedAt = now();
      state.finalGeneralStartedAt = 0;
    }
    const elapsed = Math.floor((now() - state.finishedCountdownStartedAt)/1000);
    const left = Math.max(0, 5 - elapsed);
    return {left, done: elapsed >= 6};
  }

  function renderGeneralResults(stage, isFinal){
    setHeaderInfo('النتائج العامة', stage ? `بعد انتهاء ${STAGE_TITLES[stage]}` : 'مجموع نقاط كل الفرق', 'سفراء المسيح');
    state.currentView = isFinal ? 'final-general' : ('general-stage' + stage);
    if(isFinal && !state.finalGeneralStartedAt) state.finalGeneralStartedAt = now();
    return `<section class="aud-view compact general-results-view"><div class="aud-stage-chip general">النتائج العامة</div>${standingRows(sortedGeneral(), totalScore, 'المجموع العام', true, {historyKey:'general-results', progressive:true})}</section>`;
  }

  function renderFinished(stage, finalAfterStage4){
    const info = finishedCountdownInfo(state.flow?.status || '');
    if(!info.done){
      setHeaderInfo(STAGE_NAMES[stage], `${STAGE_TITLES[stage]} · انتهت المرحلة`, 'سفراء المسيح');
      state.currentView = 'finished-countdown-stage' + stage;
      return `<section class="aud-view compact"><div class="aud-count-card"><h2>استعدوا للنتائج</h2><div class="aud-count-circle" data-live="finished-countdown">${info.left}</div><p>سيتم عرض النتائج العامة بعد لحظات.</p></div></section>`;
    }
    if(finalAfterStage4){
      if(!state.finalGeneralStartedAt) state.finalGeneralStartedAt = now();
      if(now() - state.finalGeneralStartedAt > 9000) return renderPodium();
      return renderGeneralResults(stage, true);
    }
    return renderGeneralResults(stage, false);
  }

  function renderPodium(){
    setHeaderInfo('منصة الفائزين', 'مبارك للفرق الثلاثة الأولى', 'سفراء المسيح');
    const top = sortedGeneral().slice(0,3);
    const card = (team, place, label) => `<article class="aud-podium-place place-${place}"><div class="aud-podium-medal">${place===1?'🥇':place===2?'🥈':'🥉'}</div><strong>${esc(team ? teamName(team) : '—')}</strong><span>${team && province(team) ? esc(province(team)) : '&nbsp;'}</span><b>${team ? totalScore(team) : 0}</b><small>${esc(label)}</small></article>`;
    state.currentView = 'podium';
    return `<section class="aud-view compact"><div class="aud-podium">${card(top[1],2,'المركز الثاني')}${card(top[0],1,'المركز الأول')}${card(top[2],3,'المركز الثالث')}</div></section>`;
  }

  function getStage3Questions(){
    try{ if(window.SUFARAA_STAGE3_FINAL) return window.SUFARAA_STAGE3_FINAL.questions(); }catch(e){}
    return [];
  }
  function getStage4Questions(){
    try{ if(window.SUFARAA_STAGE4_FINAL) return window.SUFARAA_STAGE4_FINAL.questions(); }catch(e){}
    return [];
  }

  function allTeamsResponded(answers){
    const teams = state.teams || [];
    if(!teams.length) return false;
    return teams.every(t=>{
      const a = (answers || {})[t.id] || {};
      return !!a.submittedAtMs || !!String(a.answer || '').trim() || !!a.skipped;
    });
  }

  function computeStage3Results(){
    const q = state.stage3?.activeQuestion || {};
    return sortedGeneral().map(t=>{
      const ans = (state.stage3?.answers || {})[t.id] || {};
      const turn = String(t.id) === String(state.stage3?.currentTurnTeamId);
      const answered = !!ans.submittedAtMs && !ans.skipped;
      let points = 0, ok = false, label = ans.answer || '';
      if(ans.skipped){ points = 0; }
      else if(answered){
        const n1 = String(window.SUFARAA_STAGE3_FINAL?.norm ? window.SUFARAA_STAGE3_FINAL.norm(ans.answer) : String(ans.answer||'').trim());
        const n2 = String(window.SUFARAA_STAGE3_FINAL?.norm ? window.SUFARAA_STAGE3_FINAL.norm(q.answer || '') : String(q.answer||'').trim());
        ok = n1 === n2;
        points = ok ? Number(q.points||0) : -Number(q.points||0);
      } else {
        points = turn ? -5 : 0;
        label = '';
      }
      return {teamId:t.id, teamName:`${teamName(t)}${province(t)?` — ${province(t)}`:''}`, answer:label, skipped:!!ans.skipped, ok, points, correctAnswer:q.answer||'', isTurn:turn};
    });
  }

  function computeStage4Results(){
    const q = state.stage4?.activeQuestion || getStage4Questions()[Number(state.stage4?.currentQuestionIndex || 0)] || {};
    return sortedGeneral().map(t=>{
      const ans = (state.stage4?.answers || {})[t.id] || {};
      const answered = !!ans.submittedAtMs && !ans.skipped;
      const matcher = window.SUFARAA_STAGE4_FINAL?.answerMatches;
      const ok = answered && (typeof matcher === 'function' ? matcher(ans.answer, q) : String(ans.answer||'').trim() === String(q.answer||'').trim());
      const base = Number(q.points || 15);
      const previousStreak = Number(t?.progress?.stage4?.streak || 0);
      const streak = ok ? previousStreak + 1 : 0;
      const points = ok ? base + Math.max(0, streak - 1) * 2 : 0;
      return {teamId:t.id, teamName:`${teamName(t)}${province(t)?` — ${province(t)}`:''}`, answer: ans.skipped?'':(ans.answer||''), skipped:!!ans.skipped, ok, points, streak, previousStreak, correctAnswer:q.answer||''};
    });
  }

  function localRevealKey(stageNum, data){
    return `${data?.activeQuestion?.id || data?.currentQuestionIndex || 'x'}|${data?.answerClosedAtMs || 0}|${data?.answerEndsAtMs || 0}`;
  }

  function clearRevealSlot(stageNum){
    state.localReveal['stage'+stageNum] = {key:'', startAtMs:0, results:[], duration:15};
  }

  function revealElapsedSec(model){
    return Math.max(0, (now() - Number(model?.startAtMs || now())) / 1000);
  }

  function revealIsDone(model){
    return revealElapsedSec(model) >= Math.max(4, Number(model?.duration || 15));
  }

  function revealVisibleCount(model){
    const elapsed = revealElapsedSec(model);
    const countdown = 2;
    if(elapsed < countdown) return 0;
    const arr = Array.isArray(model?.results) ? model.results : [];
    return Math.min(arr.length, Math.max(1, Math.floor((elapsed - countdown) / 1) + 1));
  }

  function getRevealModel(stageNum, data){
    if(!data) return null;
    if(['revealing','results_done','finished'].includes(String(data.status || '')) && Array.isArray(data.results) && data.results.length){
      clearRevealSlot(stageNum);
      return {results:data.results, startAtMs:Number(data.revealStartedAtMs || now()), duration:Number(data.revealDuration || 15), host:true};
    }
    if(!data.activeQuestion) { clearRevealSlot(stageNum); return null; }
    const currentStatus = String(data.status||'');
    const shouldAuto = ['question_open','answer_closed'].includes(currentStatus) && leftSeconds(data.answerEndsAtMs) <= 0;
    if(!shouldAuto) { clearRevealSlot(stageNum); return null; }
    const slotKey = localRevealKey(stageNum, data);
    const slotName = 'stage'+stageNum;
    const slot = state.localReveal[slotName];
    if(slot.key !== slotKey){
      slot.key = slotKey;
      slot.startAtMs = now();
      slot.duration = 15;
      slot.results = stageNum === 3 ? computeStage3Results() : computeStage4Results();
    }
    return {results:slot.results, startAtMs:slot.startAtMs, duration:slot.duration, host:false};
  }

  function answerGrid(results, stage4, extraClass, newestIndex){
    const arr = Array.isArray(results) ? results : [];
    if(!arr.length) return '<div class="aud-empty">بانتظار إجابات الفرق...</div>';
    const dense = answerDenseClass(arr.length);
    return `<div class="aud-answer-grid${dense}${extraClass?` ${extraClass}`:''}">${arr.map((r,idx)=>`<article class="aud-answer-card ${r.ok?'ok':(Number(r.points||0)<0?'bad':'neutral')}${dense}${idx===Number(newestIndex)?' just-shown':''}">
      <strong>${esc(r.teamName || 'فريق')}</strong>
      <span>${r.skipped ? 'تخطى' : esc(r.answer || 'لم يجب')}</span>
      <b>${Number(r.points||0)>0?'+':''}${Number(r.points||0)}</b>
      <small>${r.ok ? (stage4 && r.streak!=null ? `متتالية ${Number(r.streak || 0)}` : 'إجابة صحيحة') : (Number(r.points||0)<0 ? 'إجابة خاطئة' : 'بدون نقاط')}</small>
    </article>`).join('')}</div>`;
  }

  function revealGate(model, stage4){
    const arr = Array.isArray(model?.results) ? model.results : [];
    if(!arr.length) return '<div class="aud-empty">بانتظار إعلان إجابات الفرق...</div>';
    const elapsed = revealElapsedSec(model);
    const countdown = 2;
    if(elapsed < countdown){
      const left = Math.max(1, Math.ceil(countdown - elapsed));
      return `<div class="aud-count-card compact-reveal"><h2>استعدوا لكشف الإجابات</h2><div class="aud-count-circle small" data-live="reveal-countdown">${left}</div><p>سيتم إظهار النتائج تلقائيًا.</p></div>`;
    }
    const visible = revealVisibleCount(model);
    return answerGrid(arr.slice(0, visible), stage4, 'revealing-cards', visible - 1);
  }

  function stage3Board(){
    const cats = getStage3Questions();
    const used = state.stage3?.usedQuestions || {};
    const activeId = state.stage3?.activeQuestion?.id || '';
    if(!cats.length) return '<div class="aud-empty">لم يتم تحميل أسئلة المرحلة الثالثة.</div>';
    return `<div class="stage3-final-board">${cats.map(cat=>`<article class="stage3-final-col"><h3>${esc(cat.title)}</h3>${cat.questions.map(q=>{
      const usedCls = used[q.id] ? ' used' : '';
      const activeCls = activeId === q.id ? ' active-admin' : '';
      return `<button class="stage3-final-qbtn${usedCls}${activeCls}" type="button" disabled><span>${esc(q.level)} ${q.questionIndex+1}</span><span class="pts">${Number(q.points||0)}</span></button>`;
    }).join('')}</article>`).join('')}</div>`;
  }

  function stage3ChooseView(){
    const tName = state.stage3?.currentTurnTeamName || 'بانتظار تحديد الفريق';
    const chooseLeft = leftSeconds(state.stage3?.chooseEndsAtMs);
    return `<div class="stage3-final-card audience-stage-card board-compact-card"><div class="stage3-final-head compact-board-head"><div class="stage3-final-head-side"><div class="stage3-final-timer ${chooseLeft<=5?'danger':''}" data-live="stage3-choose">${fmt(chooseLeft)}</div><div class="stage3-final-turn">الدور الآن: ${esc(tName)}</div></div></div>${stage3Board()}</div>`;
  }

  function questionHero(meta1, meta2, meta3, qText, timerHtml){
    return `<div class="aud-question-screen"><div class="aud-question-meta">${meta1?`<span>${esc(meta1)}</span>`:''}${meta2?`<span>${esc(meta2)}</span>`:''}${meta3?`<span>${esc(meta3)}</span>`:''}</div><h2>${esc(qText || 'بانتظار السؤال')}</h2>${timerHtml || ''}</div>`;
  }

  function renderStage3(){
    setHeaderInfo(STAGE_TITLES[3], '', '');
    const st = String(state.stage3?.status || 'idle');
    const q = state.stage3?.activeQuestion || null;
    const answerLeft = leftSeconds(state.stage3?.answerEndsAtMs);
    const revealModel = getRevealModel(3, state.stage3);
    let body = '';

    if(st === 'idle'){
      body = `<div class="stage3-final-card audience-stage-card"><div class="aud-message-card slim"><h2>${esc(STAGE_NAMES[3])}</h2><p>بانتظار بدء المرحلة الثالثة من لوحة الميسر.</p></div>${stage3Board()}</div>`;
    } else if(st === 'choosing'){
      body = stage3ChooseView();
    } else {
      const timer = (!revealModel && st === 'question_open') ? `<div class="aud-timer-badge ${answerLeft<=5?'danger':''}" data-live="stage3-answer">${fmt(answerLeft)}</div>` : '';
      if(revealModel && revealIsDone(revealModel)){
        body = `<div class="stage3-final-card audience-stage-card"><div class="aud-message-card slim"><h2>انتهى عرض النتائج</h2><p>جاري إعادة جدول الأسئلة للجميع...</p></div>${stage3Board()}</div>`;
      } else {
        const questionHtml = questionHero(q?.category || 'على المحك', q?.level || '', `${Number(q?.points || 0)} نقطة`, q?.text || 'بانتظار السؤال', timer);
        const revealHtml = revealModel ? revealGate(revealModel, false) : '<div class="aud-status-note">يتم استقبال إجابات الفرق...</div>';
        body = `<div class="aud-stage-qa-shell"><div class="aud-stage-chip">${esc(STAGE_NAMES[3])}</div>${questionHtml}<div class="aud-results-shell">${revealHtml}</div></div>`;
      }
    }

    state.currentView = 'stage3-' + st;
    return `<section class="aud-view compact">${body}</section>`;
  }

  function renderStage4(){
    setHeaderInfo(STAGE_NAMES[4], `${STAGE_TITLES[4]} · مرتبطة بلوحة الميسر`, 'سفراء المسيح');
    const st = String(state.stage4?.status || 'idle');
    const q = state.stage4?.activeQuestion || getStage4Questions()[Number(state.stage4?.currentQuestionIndex || 0)] || null;
    const qNum = Number(state.stage4?.currentQuestionIndex || 0) + 1;
    const answerLeft = leftSeconds(state.stage4?.answerEndsAtMs);
    const revealModel = getRevealModel(4, state.stage4);
    let body = '';

    if(st === 'idle'){
      body = `<div class="aud-intro-card"><div class="aud-stage-index">4</div><h2>${esc(STAGE_NAMES[4])}</h2><p>بانتظار أمر الميسر لإظهار السؤال.</p></div>`;
    } else {
      const timer = (!revealModel && st === 'question_open') ? `<div class="aud-timer-badge ${answerLeft<=5?'danger':''}" data-live="stage4-answer">${fmt(answerLeft)}</div>` : '';
      const questionHtml = questionHero(`السؤال ${qNum}`, '', '', q?.text || 'بانتظار السؤال', timer);
      const revealHtml = revealModel ? (revealIsDone(revealModel) ? '<div class="aud-status-note">بانتظار السؤال التالي من الميسر...</div>' : revealGate(revealModel, true)) : '<div class="aud-status-note">يتم استقبال إجابات الفرق...</div>';
      body = `<div class="aud-stage-qa-shell"><div class="aud-stage-chip">${esc(STAGE_NAMES[4])}</div>${questionHtml}<div class="aud-results-shell">${revealHtml}</div></div>`;
    }

    state.currentView = 'stage4-' + st;
    return `<section class="aud-view compact">${body}</section>`;
  }

  function renderError(){
    setHeaderInfo('تعذر تشغيل شاشة الجمهور', state.error || 'حدث خطأ غير معروف', 'سفراء المسيح');
    state.currentView = 'error';
    return `<section class="aud-view compact"><div class="aud-message-card"><h2>مشكلة في الاتصال</h2><p>تأكد من الاتصال وFirebase ثم اضغط تحديث.</p></div></section>`;
  }

  function render(){
    if(!root) return;
    updateFooter();
    let html = '';
    const status = state.flow?.status || 'waiting_players';
    const st = stageFromStatus(status);
    const ph = phaseFromStatus(status);

    if(state.error) html = renderError();
    else if(status === 'waiting_players') html = renderWaiting();
    else if(status === 'contest_finished' || status === 'final_results') html = renderFinished(4, true);
    else if(st && ph === 'intro') html = renderIntro(st);
    else if(st === 1 && ph === 'running') html = renderStageRanking(1);
    else if(st === 2 && ph === 'running') html = renderStageRanking(2);
    else if(st === 3 && ph === 'running') html = renderStage3();
    else if(st === 4 && ph === 'running') html = renderStage4();
    else if(st && ph === 'finished') html = renderFinished(st, st === 4);
    else html = renderWaiting();

    if(html !== state.currentHtml){
      root.innerHTML = html;
      root.dataset.view = state.currentView;
      root.dataset.revealVisible = '';
      state.currentHtml = html;
    }
  }

  function updateLive(){
    if(!root) return;
    const view = root.dataset.view || '';

    if(view.startsWith('finished-countdown-stage')){
      const info = finishedCountdownInfo(state.flow?.status || '');
      const node = root.querySelector('[data-live="finished-countdown"]');
      if(node) node.textContent = String(info.left);
      if(info.done) render();
      return;
    }
    if(view === 'final-general'){
      if(state.finalGeneralStartedAt && now() - state.finalGeneralStartedAt > 9000) render();
      return;
    }
    if(view.startsWith('stage3-choosing')){
      const n = root.querySelector('[data-live="stage3-choose"]');
      if(n) n.textContent = fmt(leftSeconds(state.stage3?.chooseEndsAtMs));
      return;
    }
    if(view.startsWith('stage3-')){
      const n = root.querySelector('[data-live="stage3-answer"]');
      if(n) n.textContent = fmt(leftSeconds(state.stage3?.answerEndsAtMs));
      const reveal = getRevealModel(3, state.stage3);
      advanceStage3AfterReveal();
      if(reveal){
        const c = root.querySelector('[data-live="reveal-countdown"]');
        if(c){ c.textContent = String(Math.max(1, Math.ceil(2 - revealElapsedSec(reveal)))); }
        const visible = String(revealVisibleCount(reveal));
        if(root.dataset.revealVisible !== visible){
          root.dataset.revealVisible = visible;
          render();
        }
      }
      return;
    }
    if(view.startsWith('stage4-')){
      const n = root.querySelector('[data-live="stage4-answer"]');
      if(n) n.textContent = fmt(leftSeconds(state.stage4?.answerEndsAtMs));
      const reveal = getRevealModel(4, state.stage4);
      if(reveal){
        const c = root.querySelector('[data-live="reveal-countdown"]');
        if(c){ c.textContent = String(Math.max(1, Math.ceil(2 - revealElapsedSec(reveal)))); }
        const visible = String(revealVisibleCount(reveal));
        if(root.dataset.revealVisible !== visible){
          root.dataset.revealVisible = visible;
          render();
        }
      }
      return;
    }
  }

  function attachEvents(){
    if(fullscreenBtn){
      fullscreenBtn.addEventListener('click', function(){
        try{
          if(document.fullscreenElement) document.exitFullscreen && document.exitFullscreen();
          else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
        }catch(e){}
      });
    }
    if(reloadBtn) reloadBtn.addEventListener('click', function(){ location.reload(); });
  }

  function subscribe(){
    if(typeof db === 'undefined' || !db || !db.collection){
      state.error = 'Firebase غير جاهز. تأكد من firebase-init.js.';
      render();
      return;
    }
    try{
      db.collection('meta').doc('gameFlow').onSnapshot(function(doc){
        state.connected = true; state.error = '';
        state.flow = Object.assign({status:'waiting_players'}, doc.exists ? (doc.data() || {}) : {});
        render();
      }, function(err){ state.error = err?.message || 'تعذر قراءة حالة المسابقة.'; render(); });

      db.collection('teams').onSnapshot(function(snapshot){
        state.connected = true; state.error = '';
        const arr = []; snapshot.forEach(function(doc){ arr.push(Object.assign({id:doc.id}, doc.data() || {})); });
        state.teams = arr;
        render();
      }, function(err){ state.error = err?.message || 'تعذر قراءة الفرق.'; render(); });

      db.collection('meta').doc('stage3Final').onSnapshot(function(doc){
        state.stage3 = Object.assign({status:'idle', answers:{}, results:[]}, doc.exists ? (doc.data() || {}) : {});
        render();
      }, function(){});

      db.collection('meta').doc('stage4Final').onSnapshot(function(doc){
        state.stage4 = Object.assign({status:'idle', answers:{}, results:[]}, doc.exists ? (doc.data() || {}) : {});
        render();
      }, function(){});
    }catch(err){
      state.error = err?.message || 'حدث خطأ أثناء تشغيل شاشة الجمهور.';
      render();
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    attachEvents();
    render();
    subscribe();
    setInterval(updateLive, 250);
  });
})();
