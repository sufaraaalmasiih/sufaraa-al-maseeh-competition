/* v9.6.46 - Clean contestant Stage 3. */
(function(){
  'use strict';
  const S = window.SUFARAA_STAGE3_FINAL;
  if(!S) return;
  let stage3 = {status:'idle'};
  let flow = null;
  let tick = null;
  let lastRenderKey = '';
  function updateTimersOnly(){
    document.querySelectorAll('[data-stage3-timer-kind]').forEach(el => {
      const kind = el.getAttribute('data-stage3-timer-kind');
      const left = S.leftSeconds(kind==='answer' ? stage3.answerEndsAtMs : stage3.chooseEndsAtMs);
      el.textContent = S.fmt(left);
      el.classList.toggle('danger', left <= 5);
    });
  }
  const myId = () => {
    try{ return typeof myTeamDocId === 'function' ? myTeamDocId() : encodeURIComponent(String(window.teamName||'')); }catch(e){ return ''; }
  };
  const isMine = (id) => {
    const a = String(id||''), b = String(myId()||''), n = String(window.team?.name||window.teamName||'');
    try{ return a===b || decodeURIComponent(a)===n || a===encodeURIComponent(n); }catch(e){ return a===b; }
  };
  function currentTeamName(){ return String(stage3.currentTurnTeamName || 'بانتظار فريق'); }
  function timerHtml(kind){
    const left = S.leftSeconds(kind==='answer' ? stage3.answerEndsAtMs : stage3.chooseEndsAtMs);
    return `<span class="stage3-final-timer ${left<=5?'danger':''}" data-stage3-timer-kind="${kind}">${S.fmt(left)}</span>`;
  }
  function setStage3Body(html){
    const el = document.getElementById('stage3');
    if(!el) return;
    el.className = 'page active stage3-final-shell';
    el.innerHTML = html;
    try{ document.body.classList.add('stage3-final-mode'); }catch(e){}
  }
  function boardHtml(){
    const myTurn = isMine(stage3.currentTurnTeamId);
    const used = stage3.usedQuestions || {};
    const canChoose = stage3.status === 'choosing' && myTurn;
    return `<section class="stage3-final-card">
      <header class="stage3-final-head">
        <div class="stage3-final-title"><h2>جدول أسئلة المرحلة الثالثة</h2><p>${canChoose?'اختاروا سؤالًا واحدًا من الجدول.':'انتظروا اختيار السؤال من الفريق صاحب الدور.'}</p></div>
        <div class="stage3-final-turn"><span>الدور الآن: ${S.esc(currentTeamName())}</span>${timerHtml('choose')}</div>
      </header>
      <div class="stage3-final-board">
        ${S.questions().length ? S.questions().map(cat => `<article class="stage3-final-col"><h3>${S.esc(cat.title)}</h3>${cat.questions.map(q => {
          const isUsed = !!used[q.id];
          const cls = isUsed ? 'used' : (canChoose ? '' : 'locked');
          const disabled = isUsed || !canChoose;
          return `<button class="stage3-final-qbtn ${cls}" ${disabled?'disabled':''} data-stage3-q="${S.esc(q.id)}"><span>${S.esc(q.level)} ${q.questionIndex+1}</span><span class="pts">${q.points}</span></button>`;
        }).join('')}</article>`).join('') : `<div class="stage3-final-empty">لم يتم تحميل أسئلة المرحلة الثالثة. تأكد من تحميل data.js أو بنك الأسئلة.</div>`}
      </div>
    </section>`;
  }
  function questionHtml(){
    const q = stage3.activeQuestion || {};
    const ans = (stage3.answers || {})[myId()] || {};
    const myTurn = isMine(stage3.currentTurnTeamId);
    const closed = ['answer_closed','revealing','results_done'].includes(stage3.status);
    const submitted = !!(ans.submittedAtMs || ans.skipped);
    let body = '';
    if(stage3.status === 'revealing'){
      body = `<div class="stage3-final-wait"><h2>تُعرض الإجابات الآن على شاشة الجمهور</h2><p>انتظروا إعلان النتائج من الميسر.</p></div>`;
    }else if(stage3.status === 'results_done'){
      body = `<div class="stage3-final-wait"><h2>انتهى عرض الإجابات</h2><p>بانتظار الدور التالي من الميسر.</p></div>`;
    }else if(closed || submitted){
      body = `<div class="stage3-final-wait"><h2>${submitted?'تم تسجيل إجابتكم':'انتهى وقت الإجابة'}</h2><p>انتظروا عرض النتائج على شاشة الجمهور.</p></div>`;
    }else{
      body = `<div class="stage3-final-answer-row"><input class="stage3-final-input" id="stage3FinalAnswerInput" placeholder="اكتبوا الإجابة هنا" autocomplete="off" inputmode="text"><button class="stage3-final-btn success" id="stage3FinalSubmitBtn">تسجيل الإجابة</button>${myTurn?'':`<button class="stage3-final-btn secondary" id="stage3FinalSkipBtn">تخطي بدون نقاط</button>`}</div>`;
    }
    return `<section class="stage3-final-card stage3-final-question">
      <div class="stage3-final-question-meta"><span class="stage3-chip">${S.esc(q.category || '')}</span><span class="stage3-chip">${S.esc(q.level || '')}</span><span class="stage3-chip">${Number(q.points||0)} نقطة</span><span class="stage3-chip">صاحب الدور: ${S.esc(currentTeamName())}</span>${timerHtml('answer')}</div>
      <h2>${S.esc(q.text || 'بانتظار السؤال...')}</h2>
      ${body}
    </section>`;
  }
  function waitHtml(title, msg){
    return `<section class="stage3-final-card"><div class="stage3-final-wait"><h2>${S.esc(title)}</h2><p>${S.esc(msg || '')}</p></div></section>`;
  }
  function bind(){
    document.querySelectorAll('[data-stage3-q]').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-stage3-q');
        const q = S.findQuestion(id);
        if(!q || !isMine(stage3.currentTurnTeamId) || stage3.status !== 'choosing') return;
        btn.disabled = true;
        const duration = Number(stage3.answerDuration || 15);
        const now = Date.now();
        await S.stage3Ref().set({
          status:'question_open',
          lastNotice:'',
          activeQuestion:q,
          answers:{},
          answerStartedAtMs:now,
          answerDuration:duration,
          answerEndsAtMs:now + duration*1000,
          usedQuestions:Object.assign({}, stage3.usedQuestions || {}, {[q.id]: true}),
          updatedAt:firebase.firestore.FieldValue.serverTimestamp()
        }, {merge:true});
      };
    });
    const submit = document.getElementById('stage3FinalSubmitBtn');
    if(submit){
      submit.onclick = async () => {
        const input = document.getElementById('stage3FinalAnswerInput');
        const answer = String(input?.value || '').trim();
        if(!answer) return alert('اكتبوا الإجابة أولًا.');
        submit.disabled = true;
        await S.stage3Ref().set({answers:{[myId()]:{teamId:myId(), teamName:window.team?.name || window.teamName || '', answer, skipped:false, submittedAtMs:Date.now()}}}, {merge:true});
      };
    }
    const skip = document.getElementById('stage3FinalSkipBtn');
    if(skip){
      skip.onclick = async () => {
        if(isMine(stage3.currentTurnTeamId)) return;
        skip.disabled = true;
        await S.stage3Ref().set({answers:{[myId()]:{teamId:myId(), teamName:window.team?.name || window.teamName || '', answer:'', skipped:true, submittedAtMs:Date.now()}}}, {merge:true});
      };
    }
  }
  function render(force=false){
    if(!S.isStage3Flow(flow)) return;
    const st = String(stage3.status || 'idle');
    const myAnswer = (stage3.answers || {})[myId()] || {};
    const qid = stage3.activeQuestion?.id || '';
    const key = [st, qid, stage3.currentTurnTeamId || '', myAnswer.submittedAtMs || '', myAnswer.skipped ? 'skip' : '', Object.keys(stage3.usedQuestions || {}).join('|')].join('::');
    if(!force && key === lastRenderKey){ updateTimersOnly(); return; }
    lastRenderKey = key;
    if(st === 'idle') setStage3Body(waitHtml('بانتظار بداية المرحلة الثالثة', 'سيبدأ الميسر المرحلة من لوحة التحكم.'));
    else if(st === 'choosing') setStage3Body(boardHtml());
    else if(['question_open','answer_closed','revealing','results_done'].includes(st)) setStage3Body(questionHtml());
    else if(st === 'finished') setStage3Body(waitHtml('مبارك! أنهيتم المرحلة الثالثة', 'بانتظار الانتقال إلى المرحلة الرابعة.'));
    else setStage3Body(waitHtml('المرحلة الثالثة', 'بانتظار الميسر.'));
    bind();
  }
  const oldRender3 = window.render3;
  window.render3 = function(){ render(); };
  document.addEventListener('DOMContentLoaded', () => {
    S.flowRef().onSnapshot(doc => { flow = doc.data() || {}; render(); }, console.error);
    S.stage3Ref().onSnapshot(doc => { stage3 = Object.assign({status:'idle', answers:{}, usedQuestions:{}}, doc.data() || {}); render(); }, console.error);
    tick = setInterval(() => { if(S.isStage3Flow(flow) && ['choosing','question_open'].includes(stage3.status)) updateTimersOnly(); }, 300);
  });
})();
