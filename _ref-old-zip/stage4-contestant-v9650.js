/* v9.6.50 - Clean contestant Stage 4. */
(function(){
  'use strict';
  const S = window.SUFARAA_STAGE4_FINAL;
  if(!S) return;
  let stage4 = {status:'idle', answers:{}, results:[]};
  let flow = null;
  let lastRenderKey = '';
  const myId = () => { try{ return typeof myTeamDocId === 'function' ? myTeamDocId() : encodeURIComponent(String(window.teamName||'')); }catch(e){ return ''; } };
  function updateTimersOnly(){
    document.querySelectorAll('[data-stage4-timer]').forEach(el=>{
      const left = S.leftSeconds(stage4.answerEndsAtMs);
      el.textContent = S.fmt(left);
      el.classList.toggle('danger', left <= 5);
    });
  }
  function setBody(html){
    const el = document.getElementById('stage4');
    if(!el) return;
    el.className = 'page active stage4-final-shell';
    el.innerHTML = html;
    try{ document.body.classList.add('stage4-final-mode'); }catch(e){}
  }
  function waitHtml(title,msg,emoji='🏅'){
    return `<section class="stage4-final-card"><div class="stage4-final-wait"><span class="emoji">${emoji}</span><h2>${S.esc(title)}</h2><p>${S.esc(msg||'')}</p></div></section>`;
  }
  function questionHtml(){
    const q = stage4.activeQuestion || S.findQuestion(stage4.currentQuestionIndex) || {};
    const ans = (stage4.answers || {})[myId()] || {};
    const closed = ['answer_closed','revealing','results_done'].includes(String(stage4.status));
    const submitted = !!(ans.submittedAtMs || ans.skipped);
    let body = '';
    if(stage4.status === 'revealing'){
      body = `<div class="stage4-final-wait"><h2>تُعرض الإجابات الآن على شاشة الجمهور</h2><p>انتظروا إعلان النتائج من الميسر.</p></div>`;
    }else if(stage4.status === 'results_done'){
      body = `<div class="stage4-final-wait"><h2>انتهى عرض الإجابات</h2><p>بانتظار السؤال التالي من الميسر.</p></div>`;
    }else if(closed || submitted){
      body = `<div class="stage4-final-wait"><h2>${submitted?'تم تسجيل إجابتكم':'انتهى وقت الإجابة'}</h2><p>${submitted && ans.answer ? 'إجابتكم: '+S.esc(ans.answer) : 'انتظروا عرض النتائج على شاشة الجمهور.'}</p></div>`;
    }else{
      const opts = Array.isArray(q.options) ? q.options : [];
      if(opts.length){
        body = `<div class="stage4-final-options">${opts.map(o=>`<button class="stage4-final-option" data-stage4-answer="${S.esc(o)}">${S.esc(o)}</button>`).join('')}</div><div class="stage4-final-input-row"><button class="stage4-final-btn success" id="stage4FinalSubmitChoice" disabled>تسجيل الإجابة</button><button class="stage4-final-btn secondary" id="stage4FinalSkipBtn">تخطي</button></div>`;
      }else{
        body = `<div class="stage4-final-input-row"><input class="stage4-final-input" id="stage4FinalAnswerInput" placeholder="اكتبوا الإجابة هنا" autocomplete="off"><button class="stage4-final-btn success" id="stage4FinalSubmitText">تسجيل الإجابة</button><button class="stage4-final-btn secondary" id="stage4FinalSkipBtn">تخطي</button></div>`;
      }
    }
    const currentStreak = Number((window.team && window.team.progress && window.team.progress.stage4 && window.team.progress.stage4.streak) || 0);
    const nextPoints = Number(q.points||15) + Math.max(0, currentStreak) * 2;
    const streakLabel = currentStreak > 0 ? `🔥 متتالية صحيحة: ${currentStreak}` : '🔥 المتتالية الحالية: 0';
    const dashboard = `<div class="stage4-streak-dashboard-v9652"><span class="stage4-chip streak-live">${streakLabel}</span><span class="stage4-chip streak-next">نقاط الإجابة الصحيحة القادمة: ${nextPoints}</span><span class="stage4-final-timer ${S.leftSeconds(stage4.answerEndsAtMs)<=5?'danger':''}" data-stage4-timer>${S.fmt(S.leftSeconds(stage4.answerEndsAtMs))}</span></div>`;
    return `<section class="stage4-final-card stage4-final-question"><header class="stage4-final-head"><div class="stage4-final-title"><h2>المرحلة الرابعة</h2><p>السؤال ${Number(stage4.currentQuestionIndex||0)+1} من ${S.questions().length || 0}</p></div><div class="stage4-final-meta">${dashboard}</div></header><div class="stage4-final-question-text">${S.esc(q.text || 'بانتظار السؤال...')}</div>${body}</section>`;
  }
  function bind(){
    let selected = '';
    document.querySelectorAll('[data-stage4-answer]').forEach(btn=>{
      btn.onclick = () => {
        selected = btn.getAttribute('data-stage4-answer') || '';
        document.querySelectorAll('[data-stage4-answer]').forEach(b=>b.classList.toggle('selected', b===btn));
        const submit = document.getElementById('stage4FinalSubmitChoice');
        if(submit) submit.disabled = !selected;
      };
    });
    const sendAnswer = async (answer, skipped=false, clicked=null) => {
      if(stage4.status !== 'question_open' || S.leftSeconds(stage4.answerEndsAtMs) <= 0) return alert('انتهى وقت الإجابة.');
      answer = String(answer||'').trim();
      if(!skipped && !answer) return alert('اختاروا أو اكتبوا الإجابة أولًا.');
      if(clicked) clicked.disabled = true;
      const id = myId();
      await S.stage4Ref().set({answers:{[id]:{teamId:id, teamName:window.team?.name || window.teamName || '', answer: skipped?'':answer, skipped:!!skipped, submittedAtMs:Date.now()}}}, {merge:true});
    };
    const ch = document.getElementById('stage4FinalSubmitChoice');
    if(ch) ch.onclick = () => sendAnswer(selected, false, ch);
    const tx = document.getElementById('stage4FinalSubmitText');
    if(tx) tx.onclick = () => sendAnswer(document.getElementById('stage4FinalAnswerInput')?.value || '', false, tx);
    const sk = document.getElementById('stage4FinalSkipBtn');
    if(sk) sk.onclick = () => sendAnswer('', true, sk);
  }
  function render(force=false){
    if(!S.isStage4Flow(flow)) return;
    const myAnswer = (stage4.answers || {})[myId()] || {};
    const currentStreakKey = Number((window.team && window.team.progress && window.team.progress.stage4 && window.team.progress.stage4.streak) || 0);
    const key = [stage4.status||'', stage4.currentQuestionIndex||0, stage4.activeQuestion?.id||'', myAnswer.submittedAtMs||'', myAnswer.skipped?'skip':'', currentStreakKey].join('::');
    if(!force && key === lastRenderKey){ updateTimersOnly(); return; }
    lastRenderKey = key;
    const st = String(stage4.status || 'idle');
    if(st === 'idle') setBody(waitHtml('بانتظار بداية المرحلة الرابعة', 'سيبدأ الميسر السؤال من لوحة التحكم.'));
    else if(['question_open','answer_closed','revealing','results_done'].includes(st)) setBody(questionHtml());
    else if(st === 'finished') setBody(waitHtml('مبارك! أنهيتم المرحلة الرابعة', 'بانتظار النتائج النهائية.', '🏆'));
    else setBody(waitHtml('المرحلة الرابعة', 'بانتظار الميسر.'));
    bind();
  }
  window.render4 = render4 = function(){ render(true); };
  document.addEventListener('DOMContentLoaded',()=>{
    S.flowRef().onSnapshot(doc=>{ flow = doc.data() || {}; render(); }, console.error);
    S.stage4Ref().onSnapshot(doc=>{ stage4 = Object.assign({status:'idle', answers:{}, results:[]}, doc.data()||{}); render(); }, console.error);
    setInterval(()=>{ if(S.isStage4Flow(flow) && stage4.status === 'question_open') updateTimersOnly(); }, 300);
  });
})();
