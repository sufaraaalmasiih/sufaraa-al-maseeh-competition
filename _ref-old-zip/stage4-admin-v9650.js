/* v9.6.50 - Clean admin Stage 4. */
(function(){
  'use strict';
  const S = window.SUFARAA_STAGE4_FINAL;
  const GF = window.SUFARAA_GAME_FLOW;
  if(!S || !GF) return;
  let stage4 = {status:'idle', currentQuestionIndex:0, answers:{}, results:[]};
  let flow = null;
  let revealAutoRunning = false;
  const getTeams = () => { try{ return Array.isArray(window.teams) ? window.teams : teams || []; }catch(e){ return []; } };
  const sortedTeams = () => [...getTeams()].sort((a,b)=>S.teamDisplay(a).localeCompare(S.teamDisplay(b),'ar'));
  const durs = () => GF.normalizeDurations(flow?.durations || JSON.parse(localStorage.getItem('sufaraa_game_durations_v960')||'{}'));
  const esc = S.esc;
  function statusText(){ return {idle:'جاهزة للبداية', question_open:'السؤال مفتوح', answer_closed:'تم إغلاق الإجابات', revealing:'عرض الإجابات', results_done:'انتهى العرض', finished:'انتهت المرحلة'}[stage4.status] || stage4.status || 'غير محدد'; }
  function timer(){ const left=S.leftSeconds(stage4.answerEndsAtMs); return `<span class="stage4-final-timer ${left<=5?'danger':''}">${S.fmt(left)}</span>`; }
  function qNow(){ return stage4.activeQuestion || S.findQuestion(stage4.currentQuestionIndex) || null; }
  function answerStatusGrid(resultsMode=false){
    const answers = stage4.answers || {};
    const results = stage4.results || [];
    if(resultsMode && results.length){
      return `<div class="stage4-answer-list">${results.map(r=>`<div class="stage4-answer-item ${r.ok?'result-ok':(r.points<0?'result-bad':'')}"><b>${esc(r.teamName)}</b><span>${r.skipped?'تخطى':(r.answer?esc(r.answer):'لم يجب')}</span><strong>${r.points>0?'+':''}${Number(r.points||0)} نقطة${r.ok && r.streak ? ` · متتالية ${Number(r.streak||0)}` : ''}</strong></div>`).join('')}</div>`;
    }
    return `<div class="stage4-answer-list">${sortedTeams().map(t=>{ const a=answers[t.id]||{}; const cls=a.skipped?'answered':(a.submittedAtMs?'answered':''); const label=a.skipped?'تخطى':(a.submittedAtMs?'أجاب':'لم يجب'); return `<div class="stage4-answer-item ${cls}"><b>${esc(S.teamDisplay(t))}</b><span>${label}</span>${a.answer?`<small>${esc(a.answer)}</small>`:''}</div>`; }).join('')}</div>`;
  }
  function renderHtml(){
    const st = String(stage4.status || 'idle');
    const q = qNow();
    const head = `<div class="stage4-admin-status"><span>الحالة: ${esc(statusText())}</span><span>السؤال: ${Number(stage4.currentQuestionIndex||0)+1} من ${S.questions().length}</span>${st==='question_open'?timer():''}</div>`;
    if(st === 'idle') return `<section class="game-step-v960 stage4-admin-wrap"><div class="stage4-admin-card"><h2>المرحلة الرابعة</h2>${head}<p class="muted">ابدأ السؤال الأول عندما تكون الفرق جاهزة.</p><div class="stage4-admin-actions"><button class="btn game-primary-v960" onclick="stage4FinalOpenQuestionV9650()">بدء السؤال</button><button class="btn danger" onclick="stage4FinalResetV9650()">إعادة المرحلة</button></div></div></section>`;
    if(st === 'question_open') return `<section class="game-step-v960 stage4-admin-wrap"><div class="stage4-admin-card"><h2>السؤال المفتوح</h2>${head}<h3>${esc(q?.text || '')}</h3><p class="muted">الإجابة الصحيحة: ${esc(q?.answer || '')}</p>${answerStatusGrid(false)}<div class="stage4-admin-actions"><button class="btn secondary" onclick="stage4FinalCloseAnswersV9650()">إغلاق الإجابات</button><button class="btn game-primary-v960" onclick="stage4FinalRevealV9650()">إظهار الإجابات على الجمهور</button></div></div></section>`;
    if(st === 'answer_closed') return `<section class="game-step-v960 stage4-admin-wrap"><div class="stage4-admin-card"><h2>تم إغلاق الإجابات</h2>${head}<h3>${esc(q?.text || '')}</h3>${answerStatusGrid(false)}<div class="stage4-admin-actions"><button class="btn game-primary-v960" onclick="stage4FinalRevealV9650()">إظهار الإجابات على الجمهور</button></div></div></section>`;
    if(st === 'revealing') return `<section class="game-step-v960 stage4-admin-wrap"><div class="stage4-admin-card"><h2>يتم الآن عرض الإجابات على شاشة الجمهور</h2>${head}${answerStatusGrid(true)}<p class="muted">بعد انتهاء العرض سيظهر زر السؤال التالي.</p></div></section>`;
    if(st === 'results_done') return `<section class="game-step-v960 stage4-admin-wrap"><div class="stage4-admin-card"><h2>انتهى عرض الإجابات</h2>${head}${answerStatusGrid(true)}<div class="stage4-admin-actions"><button class="btn game-primary-v960" onclick="stage4FinalNextQuestionV9650()">السؤال التالي</button><button class="btn secondary" onclick="finishGameStageV960(4,true)">إنهاء المرحلة الرابعة</button><button class="btn danger" onclick="stage4FinalResetV9650()">إعادة المرحلة</button></div></div></section>`;
    if(st === 'finished') return `<section class="game-step-v960 stage4-admin-wrap"><div class="stage4-admin-card"><h2>انتهت المرحلة الرابعة</h2><p class="muted">يمكنك إنهاء المسابقة من مسار اللعبة.</p></div></section>`;
    return `<section class="game-step-v960"><p>حالة المرحلة الرابعة غير معروفة.</p></section>`;
  }
  window.renderStage4AdminFinalV9650 = function(){ return `<div id="stage4FinalAdminRoot">${renderHtml()}</div>`; };
  function refreshPanel(){ const root=document.getElementById('stage4FinalAdminRoot'); if(root) root.innerHTML=renderHtml(); }
  async function ensureFlowStage4(){
    if(String(flow?.status||'') !== 'stage4_running') await S.flowRef().set({status:'stage4_running', currentStage:4, phase:'running', audienceMode:'stage4', updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
  }
  window.stage4FinalOpenQuestionV9650 = async function(){
    const qs = S.questions();
    if(!qs.length) return alert('لا توجد أسئلة للمرحلة الرابعة.');
    const idx = Math.min(Number(stage4.currentQuestionIndex||0), qs.length-1);
    const q = qs[idx];
    const duration = Number(durs().stageQuestion || 15);
    const now = Date.now();
    await ensureFlowStage4();
    await S.stage4Ref().set({status:'question_open', currentQuestionIndex:idx, activeQuestion:q, answers:{}, results:[], answerStartedAtMs:now, answerDuration:duration, answerEndsAtMs:now+duration*1000, revealStartedAtMs:null, revealEndsAtMs:null, updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
  };
  window.stage4FinalCloseAnswersV9650 = async function(){
    if(stage4.status !== 'question_open') return;
    await S.stage4Ref().set({status:'answer_closed', answerClosedAtMs:Date.now(), updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
  };
  function resultForTeam(t){
    const q = qNow() || {};
    const ans = (stage4.answers || {})[t.id] || {};
    const answered = !!ans.submittedAtMs && !ans.skipped;
    const ok = answered && S.answerMatches(ans.answer, q);
    const base = Number(q.points || 15);
    const previousStreak = Number(t?.progress?.stage4?.streak || 0);
    const streak = ok ? previousStreak + 1 : 0;
    // نظام الأجوبة المتتالية: أول إجابة صحيحة = 15، ثم +2 لكل إجابة صحيحة متتالية.
    const points = ok ? base + Math.max(0, streak - 1) * 2 : 0;
    return {
      teamId:t.id,
      teamName:S.teamDisplay(t),
      answer: ans.skipped?'':(ans.answer||''),
      skipped:!!ans.skipped,
      ok,
      points,
      streak,
      previousStreak,
      correctAnswer:q.answer||''
    };
  }
  window.stage4FinalRevealV9650 = async function(){
    if(!['question_open','answer_closed'].includes(String(stage4.status))) return;
    const teams = sortedTeams();
    const q = qNow();
    if(!q) return;
    const results = teams.map(resultForTeam);
    const batch = db.batch();
    results.forEach(r=>{
      const t = teams.find(x=>String(x.id)===String(r.teamId)) || {};
      const ss = Object.assign({stage1:0,stage2:0,stage3:0,stage4:0}, t.stageScores || {});
      ss.stage4 = Math.max(0, Number(ss.stage4||0) + Number(r.points||0));
      const score = Math.max(0, Number(t.score||0) + Number(r.points||0));
      const progress = Object.assign({}, t.progress || {});
      progress.stage4 = Object.assign({i:0, streak:0, ended:false}, progress.stage4 || {}, {
        i: Math.max(Number(progress.stage4?.i || 0), Number(stage4.currentQuestionIndex || 0)),
        streak: Number(r.streak || 0)
      });
      const log = {stage:'اثبتوا بالحق', question:q.text, selected:r.skipped?'تخطي':(r.answer||'لم يجب'), correct:q.answer||'', ok:!!r.ok, points:Number(r.points||0), meta:`سؤال ${Number(stage4.currentQuestionIndex||0)+1} - متتالية ${Number(r.streak||0)}`, playerName:t.name||'الفريق', time:new Date().toLocaleString('ar')};
      batch.set(db.collection('teams').doc(r.teamId), {score, stageScores:ss, progress, answerLog:[...(t.answerLog||[]), log]}, {merge:true});
    });
    const now = Date.now();
    batch.set(S.stage4Ref(), {status:'revealing', results, revealStartedAtMs:now, revealDuration:15, revealEndsAtMs:now+15000, updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
    await batch.commit();
  };
  window.stage4FinalNextQuestionV9650 = async function(){
    const next = Number(stage4.currentQuestionIndex||0) + 1;
    if(next >= S.questions().length){
      await S.stage4Ref().set({status:'finished', currentQuestionIndex:next, activeQuestion:null, answers:{}, results:[], updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
      if(typeof window.finishGameStageV960 === 'function') await window.finishGameStageV960(4, true);
      return;
    }
    await S.stage4Ref().set({status:'idle', currentQuestionIndex:next, activeQuestion:null, answers:{}, results:[], updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
  };
  window.stage4FinalResetV9650 = async function(){
    if(!confirm('إعادة المرحلة الرابعة فقط؟ سيتم حذف إجابات المرحلة الرابعة الحالية.')) return;
    await S.stage4Ref().set({status:'idle', currentQuestionIndex:0, activeQuestion:null, answers:{}, results:[], updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
  };
  async function auto(){
    if(stage4.status === 'question_open' && S.leftSeconds(stage4.answerEndsAtMs) <= 0){
      await S.stage4Ref().set({status:'answer_closed', answerClosedAtMs:Date.now(), updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true}).catch(console.warn);
    }
    if(stage4.status === 'revealing' && S.leftSeconds(stage4.revealEndsAtMs) <= 0){
      if(revealAutoRunning) return;
      revealAutoRunning = true;
      try{ await S.stage4Ref().set({status:'results_done', updatedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true}); }
      catch(e){ console.warn(e); }
      finally{ setTimeout(()=>{ revealAutoRunning=false; }, 1200); }
    }
  }
  document.addEventListener('DOMContentLoaded',()=>{
    S.stage4Ref().onSnapshot(doc=>{ stage4 = Object.assign({status:'idle', currentQuestionIndex:0, answers:{}, results:[]}, doc.data()||{}); refreshPanel(); }, console.error);
    S.flowRef().onSnapshot(doc=>{ flow = doc.data() || {}; refreshPanel(); }, console.error);
    setInterval(()=>{ refreshPanel(); auto(); }, 700);
  });
})();
