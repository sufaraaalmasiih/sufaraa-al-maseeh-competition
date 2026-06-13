/* v9.6.46 - Clean admin Stage 3. */
(function(){
  'use strict';
  const S = window.SUFARAA_STAGE3_FINAL;
  const GF = window.SUFARAA_GAME_FLOW;
  if(!S || !GF) return;
  let stage3 = {status:'idle'};
  let flow = null;
  let renderTimer = null;
  let choiceTimeoutRunning = false;
  let revealAutoRunning = false;
  let answerAutoRevealRunning = false;
  const getTeams = () => { try{ return Array.isArray(window.teams) ? window.teams : teams || []; }catch(e){ return []; } };
  const sortedTeams = () => [...getTeams()].sort((a,b)=>S.teamDisplay(a).localeCompare(S.teamDisplay(b),'ar'));
  const durs = () => GF.normalizeDurations(flow?.durations || JSON.parse(localStorage.getItem('sufaraa_game_durations_v960')||'{}'));
  function firstTeam(){ return sortedTeams()[0] || null; }
  function currentTurnTeam(){ return sortedTeams().find(t => String(t.id) === String(stage3.currentTurnTeamId)) || null; }
  function nextTeamInfo(){
    const list = sortedTeams();
    if(!list.length) return {team:null,index:0};
    const cur = Math.max(0, Number(stage3.currentTurnIndex || 0));
    const idx = (cur + 1) % list.length;
    return {team:list[idx], index:idx};
  }
  function selectedTeamInfo(id){
    const list = sortedTeams();
    const idx = Math.max(0, list.findIndex(t => String(t.id) === String(id)));
    return {team:list[idx]||list[0]||null, index: idx<0?0:idx};
  }
  function statusText(){
    const st = String(stage3.status || 'idle');
    return {idle:'جاهزة للبداية', choosing:'اختيار سؤال', question_open:'السؤال مفتوح', answer_closed:'تم إغلاق الإجابات', revealing:'عرض الإجابات', results_done:'انتهى العرض', finished:'انتهت المرحلة'}[st] || st;
  }
  function esc(x){ return S.esc(x); }
  function timer(kind){
    const left = S.leftSeconds(kind==='answer' ? stage3.answerEndsAtMs : stage3.chooseEndsAtMs);
    return `<span class="stage3-final-timer ${left<=5?'danger':''}">${S.fmt(left)}</span>`;
  }
  function adminBoardHtml(){
    const used = stage3.usedQuestions || {};
    const activeId = stage3.activeQuestion?.id || '';
    const cats = S.questions();
    if(!cats.length) return `<div class="stage3-final-empty">لم يتم تحميل أسئلة المرحلة الثالثة.</div>`;
    return `<div class="stage3-admin-board-wrap"><h3>جدول أسئلة المرحلة الثالثة</h3><div class="stage3-final-board stage3-admin-board">${cats.map(cat => `<article class="stage3-final-col"><h3>${esc(cat.title)}</h3>${cat.questions.map(q => {
      const usedCls = used[q.id] ? 'used' : '';
      const activeCls = activeId === q.id ? 'active-admin' : '';
      return `<button class="stage3-final-qbtn ${usedCls} ${activeCls}" disabled><span>${esc(q.level)} ${q.questionIndex+1}</span><span class="pts">${q.points}</span></button>`;
    }).join('')}</article>`).join('')}</div></div>`;
  }
  function noticeHtml(){
    return stage3.lastNotice ? `<div class="stage3-admin-notice">${esc(stage3.lastNotice)}</div>` : '';
  }
  function answerStatusGrid(resultsMode=false){
    const answers = stage3.answers || {};
    const results = stage3.results || [];
    if(resultsMode && results.length){
      return `<div class="stage3-answer-list">${results.map(r => `<div class="stage3-answer-item ${r.ok?'result-ok':(r.points<0?'result-bad':'')}"><b>${esc(r.teamName)}</b><span>${r.skipped?'تخطى':(r.answer?esc(r.answer):'لم يجب')}</span><strong>${r.points>0?'+':''}${Number(r.points||0)} نقطة</strong></div>`).join('')}</div>`;
    }
    return `<div class="stage3-answer-list">${sortedTeams().map(t => {
      const a = answers[t.id] || {};
      const cls = a.skipped ? 'skipped' : (a.submittedAtMs ? 'answered' : '');
      const label = a.skipped ? 'تخطى' : (a.submittedAtMs ? 'أجاب' : 'لم يجب');
      return `<div class="stage3-answer-item ${cls}"><b>${esc(S.teamDisplay(t))}</b><span>${label}</span>${a.answer?`<small>${esc(a.answer)}</small>`:''}</div>`;
    }).join('')}</div>`;
  }
  function renderHtml(){
    const st = String(stage3.status || 'idle');
    const turn = currentTurnTeam();
    const q = stage3.activeQuestion || null;
    const head = `<div class="stage3-admin-status"><span>الحالة: ${esc(statusText())}</span><span>الدور: ${esc(turn ? S.teamDisplay(turn) : 'غير محدد')}</span>${st==='choosing'?timer('choose'):''}${st==='question_open'?timer('answer'):''}</div>`;
    if(st === 'idle'){
      return `<section class="game-step-v960 stage3-admin-grid"><div class="stage3-admin-card"><h2>المرحلة الثالثة</h2>${head}${noticeHtml()}<p class="muted">ابدأ المرحلة ليتمكن الفريق صاحب الدور من اختيار سؤال من الجدول.</p><div class="stage3-admin-actions"><button class="btn game-primary-v960" onclick="stage3FinalStartV9646()">بدء المرحلة الثالثة</button><button class="btn danger" onclick="stage3FinalResetV9646()">إعادة ضبط المرحلة</button></div></div></section>`;
    }
    if(st === 'choosing'){
      return `<section class="game-step-v960 stage3-admin-grid"><div class="stage3-admin-card"><h2>اختيار سؤال</h2>${head}${noticeHtml()}<p class="muted">الفريق صاحب الدور فقط يستطيع اختيار السؤال من شاشة المتسابق.</p>${adminBoardHtml()}<div class="stage3-admin-actions"><button class="btn secondary" onclick="stage3FinalChangeTurnV9646()">تغيير الدور</button><button class="btn danger" onclick="stage3FinalResetV9646()">إعادة المرحلة</button></div></div></section>`;
    }
    if(st === 'question_open'){
      return `<section class="game-step-v960 stage3-admin-grid"><div class="stage3-admin-card"><h2>السؤال المفتوح</h2>${head}${noticeHtml()}<h3>${esc(q?.text || '')}</h3><p class="muted">${esc(q?.category||'')} - ${esc(q?.level||'')} - ${Number(q?.points||0)} نقطة</p>${answerStatusGrid(false)}<div class="stage3-admin-actions"><button class="btn secondary" onclick="stage3FinalCloseAnswersV9646()">إغلاق الإجابات</button><button class="btn game-primary-v960" onclick="stage3FinalRevealV9646()">إظهار الإجابات على الجمهور</button></div></div></section>`;
    }
    if(st === 'answer_closed'){
      return `<section class="game-step-v960 stage3-admin-grid"><div class="stage3-admin-card"><h2>تم إغلاق الإجابات</h2>${head}${noticeHtml()}<h3>${esc(q?.text || '')}</h3>${answerStatusGrid(false)}<div class="stage3-admin-actions"><button class="btn game-primary-v960" onclick="stage3FinalRevealV9646()">إظهار الإجابات على الجمهور</button></div></div></section>`;
    }
    if(st === 'revealing'){
      return `<section class="game-step-v960 stage3-admin-grid"><div class="stage3-admin-card"><h2>يتم الآن عرض الإجابات على شاشة الجمهور</h2>${head}${answerStatusGrid(true)}<p class="muted">بعد انتهاء العرض سينتقل النظام تلقائيًا إلى اختيار السؤال التالي.</p></div></section>`;
    }
    if(st === 'results_done'){
      return `<section class="game-step-v960 stage3-admin-grid"><div class="stage3-admin-card"><h2>انتهى عرض الإجابات</h2>${head}${noticeHtml()}${answerStatusGrid(true)}<div class="stage3-admin-actions"><button class="btn game-primary-v960" onclick="stage3FinalNextTurnV9646()">الدور التالي / سؤال جديد</button><button class="btn secondary" onclick="finishGameStageV960(3,true)">إنهاء المرحلة الثالثة</button><button class="btn danger" onclick="stage3FinalResetV9646()">إعادة المرحلة</button></div></div></section>`;
    }
    if(st === 'finished'){
      return `<section class="game-step-v960 stage3-admin-grid"><div class="stage3-admin-card"><h2>انتهت المرحلة الثالثة</h2><p class="muted">يمكنك الانتقال إلى المرحلة الرابعة من مسار اللعبة.</p></div></section>`;
    }
    return `<section class="game-step-v960"><p>حالة المرحلة الثالثة غير معروفة.</p></section>`;
  }
  window.renderStage3AdminFinalV9646 = function(){ return `<div id="stage3FinalAdminRoot">${renderHtml()}</div>`; };
  function refreshPanel(){
    const root = document.getElementById('stage3FinalAdminRoot');
    if(root) root.innerHTML = renderHtml();
  }
  async function ensureFlowStage3(){
    if(String(flow?.status||'') !== 'stage3_running'){
      await S.flowRef().set({status:'stage3_running', currentStage:3, phase:'running', audienceMode:'stage3', updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
    }
  }
  window.stage3FinalStartV9646 = async function(){
    const t = firstTeam();
    if(!t) return alert('لا توجد فرق مسجلة.');
    const now = Date.now();
    const d = durs();
    await ensureFlowStage3();
    await S.stage3Ref().set({
      status:'choosing',
      currentTurnTeamId:t.id,
      currentTurnTeamName:S.teamDisplay(t),
      currentTurnIndex:0,
      usedQuestions:{},
      answers:{},
      results:[],
      activeQuestion:null,
      chooseDuration:d.stage3Choice,
      answerDuration:d.stageQuestion,
      chooseStartedAtMs:now,
      chooseEndsAtMs:now + d.stage3Choice*1000,
      lastNotice:'',
      updatedAt:firebase.firestore.FieldValue.serverTimestamp()
    }, {merge:true});
  };
  window.stage3FinalChangeTurnV9646 = async function(){
    if(stage3.status !== 'choosing') return alert('يمكن تغيير الدور فقط قبل فتح السؤال.');
    const info = nextTeamInfo();
    if(!info.team) return;
    const now = Date.now();
    const d = durs();
    await S.stage3Ref().set({currentTurnTeamId:info.team.id, currentTurnTeamName:S.teamDisplay(info.team), currentTurnIndex:info.index, chooseStartedAtMs:now, chooseEndsAtMs:now+d.stage3Choice*1000, lastNotice:'', updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
  };
  window.stage3FinalCloseAnswersV9646 = async function(){
    if(stage3.status !== 'question_open') return;
    await S.stage3Ref().set({status:'answer_closed', answerClosedAtMs:Date.now(), updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
  };
  function resultForTeam(t){
    const q = stage3.activeQuestion || {};
    const ans = (stage3.answers || {})[t.id] || {};
    const turn = String(t.id) === String(stage3.currentTurnTeamId);
    const answered = !!ans.submittedAtMs && !ans.skipped;
    let points = 0, ok = false, label = ans.answer || '';
    if(ans.skipped){ points = 0; }
    else if(answered){ ok = S.norm(ans.answer) === S.norm(q.answer); points = ok ? Number(q.points||0) : -Number(q.points||0); }
    else { points = turn ? -5 : 0; label = ''; }
    return {teamId:t.id, teamName:S.teamDisplay(t), answer:label, skipped:!!ans.skipped, ok, points, correctAnswer:q.answer||'', isTurn:turn};
  }
  window.stage3FinalRevealV9646 = async function(){
    if(!['question_open','answer_closed'].includes(stage3.status)) return;
    const results = sortedTeams().map(resultForTeam);
    const batch = db.batch();
    sortedTeams().forEach(t => {
      const r = results.find(x => x.teamId === t.id);
      const ss = Object.assign({stage1:0,stage2:0,stage3:0,stage4:0}, t.stageScores || {});
      ss.stage3 = Math.max(0, Number(ss.stage3||0) + Number(r.points||0));
      const score = Math.max(0, Number(t.score||0) + Number(r.points||0));
      const log = {stage:'على المحك', question:stage3.activeQuestion?.text || '', selected:r.skipped?'تخطي':(r.answer || 'لم يجب'), correct:r.correctAnswer, ok:r.ok, points:r.points, meta:stage3.activeQuestion?.category || '', playerName:'الفريق', time:new Date().toLocaleString('ar')};
      batch.set(db.collection('teams').doc(t.id), {score, stageScores:ss, answerLog:[...(t.answerLog||[]), log]}, {merge:true});
    });
    const now = Date.now();
    batch.set(S.stage3Ref(), {status:'revealing', lastNotice:'يتم الآن عرض الإجابات على شاشة الجمهور.', results, revealStartedAtMs:now, revealDuration:15, revealEndsAtMs:now+15000, updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
    await batch.commit();
  };
  window.stage3FinalNextTurnV9646 = async function(){
    const info = nextTeamInfo();
    if(!info.team) return;
    const now = Date.now();
    const d = durs();
    await S.stage3Ref().set({status:'choosing', currentTurnTeamId:info.team.id, currentTurnTeamName:S.teamDisplay(info.team), currentTurnIndex:info.index, activeQuestion:null, answers:{}, results:[], lastNotice:'', answerClosedAtMs:null, revealStartedAtMs:null, revealEndsAtMs:null, chooseStartedAtMs:now, chooseEndsAtMs:now+d.stage3Choice*1000, updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
  };
  window.stage3FinalResetV9646 = async function(){
    if(!confirm('إعادة المرحلة الثالثة فقط؟ سيتم حذف أسئلة المرحلة الثالثة المستخدمة وإجاباتها.')) return;
    const t = firstTeam();
    await S.stage3Ref().set({status:'idle', currentTurnTeamId:t?.id||null, currentTurnTeamName:t?S.teamDisplay(t):'', currentTurnIndex:0, activeQuestion:null, usedQuestions:{}, answers:{}, results:[], updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
  };
  async function handleChoiceTimeout(){
    if(choiceTimeoutRunning) return;
    if(stage3.status !== 'choosing' || S.leftSeconds(stage3.chooseEndsAtMs) > 0) return;
    choiceTimeoutRunning = true;
    const list = sortedTeams();
    if(!list.length){ choiceTimeoutRunning = false; return; }
    const curTeam = currentTurnTeam() || list[0];
    const curIndex = Math.max(0, list.findIndex(t => String(t.id) === String(curTeam.id)));
    const now = Date.now();
    const batch = db.batch();
    const timeoutQuestion = {
      id: 'choice_timeout_' + now,
      category: 'اختيار السؤال',
      level: 'تنبيه',
      points: 5,
      text: `انتهى وقت اختيار السؤال لفريق ${S.teamDisplay(curTeam)}`,
      answer: ''
    };
    const results = list.map(t => {
      const isTurn = String(t.id) === String(curTeam.id);
      return {
        teamId: t.id,
        teamName: S.teamDisplay(t),
        answer: isTurn ? 'لم يتم اختيار سؤال ضمن الوقت' : 'ليس دورهم',
        skipped: false,
        ok: false,
        points: isTurn ? -5 : 0,
        correctAnswer: '',
        isTurn,
        reason: isTurn ? 'timeout_pick' : 'not_turn'
      };
    });
    if(curTeam && curTeam.id){
      const ss = Object.assign({stage1:0,stage2:0,stage3:0,stage4:0}, curTeam.stageScores || {});
      ss.stage3 = Math.max(0, Number(ss.stage3||0) - 5);
      const score = Math.max(0, Number(curTeam.score||0) - 5);
      const log = {
        stage:'على المحك',
        question:'انتهى وقت اختيار السؤال',
        selected:'لم يتم اختيار سؤال',
        correct:'',
        ok:false,
        points:-5,
        meta:'اختيار السؤال',
        playerName:'الفريق',
        time:new Date().toLocaleString('ar')
      };
      batch.set(db.collection('teams').doc(curTeam.id), {score, stageScores:ss, answerLog:[...(curTeam.answerLog||[]), log]}, {merge:true});
    }
    batch.set(S.stage3Ref(), {
      status:'revealing',
      currentTurnTeamId: curTeam?.id || null,
      currentTurnTeamName: curTeam ? S.teamDisplay(curTeam) : '',
      currentTurnIndex: curIndex,
      activeQuestion: timeoutQuestion,
      answers:{},
      results,
      lastNotice: curTeam ? `انتهى وقت اختيار السؤال. يتم الآن عرض خصم 5 نقاط من ${S.teamDisplay(curTeam)} على شاشة الجمهور.` : 'انتهى وقت اختيار السؤال.',
      revealStartedAtMs:now,
      revealDuration:15,
      revealEndsAtMs:now + 15000,
      updatedAt:firebase.firestore.FieldValue.serverTimestamp()
    }, {merge:true});
    try{ await batch.commit(); } finally { setTimeout(()=>{ choiceTimeoutRunning = false; }, 1200); }
  }
  async function auto(){
    await handleChoiceTimeout();
    if(stage3.status === 'question_open' && S.leftSeconds(stage3.answerEndsAtMs) <= 0){
      if(answerAutoRevealRunning) return;
      answerAutoRevealRunning = true;
      try{
        await S.stage3Ref().set({status:'answer_closed', answerClosedAtMs:Date.now(), updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
        await stage3FinalRevealV9646();
      }catch(e){ console.warn(e); }
      finally{ setTimeout(()=>{ answerAutoRevealRunning = false; }, 1200); }
    }
    if(['revealing','results_done'].includes(stage3.status) && S.leftSeconds(stage3.revealEndsAtMs) <= 0){
      if(revealAutoRunning) return;
      revealAutoRunning = true;
      try{ await stage3FinalNextTurnV9646(); }
      catch(e){ console.warn(e); }
      finally{ setTimeout(()=>{ revealAutoRunning = false; }, 1200); }
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    S.stage3Ref().onSnapshot(doc => { stage3 = Object.assign({status:'idle'}, doc.data()||{}); refreshPanel(); }, console.error);
    S.flowRef().onSnapshot(doc => { flow = doc.data() || {}; refreshPanel(); }, console.error);
    setInterval(() => { refreshPanel(); auto(); }, 700);
  });
})();
