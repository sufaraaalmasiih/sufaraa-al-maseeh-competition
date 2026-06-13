/* ===== V9.5.42 Clean gameplay fixes: Stage 1 arrange rebuilt without manual input ===== */
(function(){
  'use strict';
  const byId = (id)=>document.getElementById(id);
  const esc = (x)=>String(x??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const normalizeText = (x)=>String(x??'')
    .trim()
    .replace(/[ًٌٍَُِّْـ]/g,'')
    .replace(/[أإآ]/g,'ا')
    .replace(/ة/g,'ه')
    .replace(/ى/g,'ي')
    .replace(/[\s|،,؛;\-–—_]+/g,' ')
    .trim();
  const normalizeType = (type)=>{
    const raw = String(type||'').trim();
    const compact = raw.replace(/[\sـ]/g,'').toLowerCase();
    if(['arrange','order','sort'].includes(compact) || compact==='رتب' || compact==='رتّب') return 'رتّب';
    if(['choice','multiple'].includes(compact) || raw==='اختر من متعدد') return 'اختر من متعدد';
    if(raw.includes('ينقص')) return 'ماذا ينقص';
    if(raw.includes('فراغ') || raw.includes('أكمل') || raw.includes('اكمل')) return 'فراغات';
    return raw || 'اختر من متعدد';
  };
  const splitParts = (value)=>String(value??'')
    .split(/\s*(?:\||،|,|؛|;|\n|\/|\\)\s*/)
    .map(x=>x.trim()).filter(Boolean);
  function arrangeCorrectParts(q){
    let parts = splitParts(q && q.answer);
    if(parts.length>=4) return parts.slice(0,4);
    if(Array.isArray(q && q.correctOrder) && q.correctOrder.length>=4) return q.correctOrder.slice(0,4).map(String);
    if(Array.isArray(q && q.arrangeOptions) && q.arrangeOptions.length>=4) return q.arrangeOptions.slice(0,4).map(String);
    if(Array.isArray(q && q.options) && q.options.filter(Boolean).length>=4) return q.options.filter(Boolean).slice(0,4).map(String);
    const words = String((q && q.answer) || '').trim().split(/\s+/).filter(Boolean);
    if(words.length>=4) return words.slice(0,4);
    return words.concat(['—','—','—','—']).slice(0,4);
  }
  function arrangeDisplayParts(q){
    const fromOptions = Array.isArray(q && q.options) ? q.options.filter(Boolean).slice(0,4).map(String) : [];
    const base = fromOptions.length===4 ? fromOptions : arrangeCorrectParts(q);
    const shuffler = (typeof seededShuffle === 'function') ? seededShuffle : (arr)=>arr.slice().sort(()=>Math.random()-.5);
    return shuffler(base, `stage1-arrange-v9542|${(typeof teamName!=='undefined'?teamName:'')}|${q?.q||''}`).slice(0,4);
  }
  function renderArrange(q){
    const options = arrangeDisplayParts(q);
    return `<div class="stage1-arrange-v9542" data-arrange-active="1">
      <p class="muted arrange-help-v9542"></p>
      <div class="arrange-options-v9542">${options.map((x,i)=>`<button class="answer arrange-option-v9542" type="button" data-arrange-value="${esc(x)}" data-arrange-index="${i}">${esc(x)}</button>`).join('')}</div>
      <div class="arrange-actions-v9542"><button class="btn secondary" id="arrangeResetV9542" type="button">إعادة الترتيب</button><button class="btn stage1-submit" id="arrangeSubmitV9542" type="button" disabled>تأكيد الترتيب</button></div>
    </div>`;
  }
  function renderQuestion(q,i,type){
    const t = normalizeType(type);
    if(t==='اختر من متعدد'){
      const opts = (Array.isArray(q?.options)?q.options:[]).map(x=>String(x||'').trim()).filter(Boolean);
      if(opts.length < 2){
        return `<div class="stage1-input-card"><input id="stage1Input" class="stage1-input" autocomplete="off" placeholder="اكتب الإجابة هنا"><button class="btn stage1-submit" id="stage1Submit" type="button">تسجيل الإجابة</button></div>`;
      }
      return `<div class="stage1-choice-confirm-v95118">
        <div class="stage1-choice-options-v95118">
          ${opts.map(o=>`<button class="answer stage1-choice-option-v95118" type="button" data-a="${esc(o)}">${esc(o)}</button>`).join('')}
        </div>
        <button class="btn stage1-choice-confirm-btn-v95118" id="stage1ChoiceConfirmV95118" type="button" disabled>تأكيد الإجابة</button>
      </div>`;
    }
    if(t==='رتّب') return renderArrange(q);
    return `<div class="stage1-input-card"><input id="stage1Input" class="stage1-input" autocomplete="off" placeholder="اكتب الإجابة هنا"><button class="btn stage1-submit" id="stage1Submit" type="button">تسجيل الإجابة</button></div>`;
  }
  function bindQuestion(i,q,p,type){
    const t = normalizeType(type);
    const box = byId('a1');
    if(!box) return;
    if(t==='اختر من متعدد'){
      let selectedAnswer = '';
      const buttons = Array.from(box.querySelectorAll('.stage1-choice-option-v95118'));
      const confirm = byId('stage1ChoiceConfirmV95118');

      if(buttons.length < 2){
        const input=byId('stage1Input'), submit=byId('stage1Submit');
        if(input){
          input.focus();
          input.onkeydown=(e)=>{if(e.key==='Enter') submit?.click();};
        }
        if(submit) submit.onclick=()=>answerStage1(submit,i,q,p,input?.value||'');
        return;
      }

      function refreshChoice(){
        buttons.forEach(btn=>{
          const value = String(btn.dataset.a || btn.textContent || '').trim();
          btn.classList.toggle('selected', !!selectedAnswer && value === selectedAnswer);
        });
        if(confirm){
          confirm.disabled = !selectedAnswer;
          confirm.classList.toggle('ready', !!selectedAnswer);
        }
      }

      buttons.forEach(btn=>{
        btn.onclick=(event)=>{
          event.preventDefault();
          event.stopPropagation();
          if(event.stopImmediatePropagation) event.stopImmediatePropagation();
          if(btn.disabled) return;
          selectedAnswer = String(btn.dataset.a || btn.textContent || '').trim();
          refreshChoice();
        };
      });

      if(confirm){
        confirm.onclick=(event)=>{
          event.preventDefault();
          event.stopPropagation();
          if(!selectedAnswer || confirm.disabled) return;
          buttons.forEach(btn=>btn.disabled=true);
          confirm.disabled=true;
          answerStage1(confirm,i,q,p,selectedAnswer);
        };
      }

      refreshChoice();
      return;
    }
    if(t==='رتّب'){
      const picked = [];
      const list = byId('arrangePickedListV9542');
      const submit = byId('arrangeSubmitV9542');
      const reset = byId('arrangeResetV9542');
      const expectedCount = 4;
      const optionButtons = Array.from(box.querySelectorAll('.arrange-option-v9542'));
      const refresh = ()=>{
        if(list){
          list.innerHTML = picked.length
            ? picked.map((x,n)=>`<span class="arrange-picked-chip-v9542"><b>${n+1}</b>${esc(x)}</span>`).join('')
            : '<span class="muted">لم تختر بعد</span>';
        }
        optionButtons.forEach(btn=>{
          const value = String(btn.dataset.arrangeValue || btn.textContent || '').trim();
          const order = picked.indexOf(value);
          const selected = order >= 0;
          btn.disabled = false;
          btn.classList.toggle('picked', selected);
          btn.classList.toggle('stage1-selected', selected);
          btn.classList.toggle('selected', selected);
          btn.dataset.order = selected ? String(order + 1) : '';
        });
        if(submit){
          const ready = picked.length === expectedCount;
          submit.disabled = !ready;
          submit.classList.toggle('ready', ready);
        }
      };
      optionButtons.forEach(btn=>{
        btn.onclick = (event)=>{
          event.preventDefault();
          event.stopPropagation();
          if(event.stopImmediatePropagation) event.stopImmediatePropagation();
          const value = String(btn.dataset.arrangeValue || btn.textContent || '').trim();
          const existing = picked.indexOf(value);
          if(existing >= 0){
            picked.splice(existing, 1);
          }else{
            if(picked.length >= expectedCount) return;
            picked.push(value);
          }
          refresh();
        };
      });
      if(reset) reset.onclick = ()=>{
        picked.length = 0;
        refresh();
      };
      if(submit) submit.onclick = (event)=>{
        event.preventDefault();
        event.stopPropagation();
        if(picked.length!==expectedCount || submit.disabled) return;
        optionButtons.forEach(btn=>btn.disabled=true);
        submit.disabled=true;
        answerStage1(submit,i,q,p,picked.join(' | '));
      };
      refresh();
      return;
    }
    const input=byId('stage1Input'), submit=byId('stage1Submit');
    if(input){
      input.focus();
      input.onkeydown=(e)=>{if(e.key==='Enter') submit?.click();};
    }
    if(submit) submit.onclick=()=>answerStage1(submit,i,q,p,input?.value||'');
  }
  window.renderStage1Question = renderStage1Question = renderQuestion;
  window.renderStage1Input = renderStage1Input = function(q,i,type){return normalizeType(type)==='رتّب' ? renderArrange(q) : `<div class="stage1-input-card"><input id="stage1Input" class="stage1-input" autocomplete="off" placeholder="اكتب الإجابة هنا"><button class="btn stage1-submit" id="stage1Submit" type="button">تسجيل الإجابة</button></div>`;};
  window.bindStage1Answers = bindStage1Answers = bindQuestion;
  window.showQ1 = showQ1 = function(){
    const p = team?.progress?.stage1 || {i:0};
    const remoteI = Number(p.i || 0);
    const currentKey = String((team?.progress?.stage1 || {}).startedAt || 'stage1');
    if(stage1LocalKey !== currentKey){stage1LocalKey = currentKey; stage1LocalI = remoteI;}
    if(stage1LocalI === null || remoteI > stage1LocalI) stage1LocalI = remoteI;
    const i = Math.max(remoteI, Number(stage1LocalI || 0));
    const plan = getStage1Plan(p);
    const total = plan.length || Math.min(50, DATA.stage1.length);
    if(i >= total) return patchStage1Progress({ended:true}).then(() => finishStage('stage1','intro2'));
    const item = plan[i] || {idx:i, type:STAGE1_TYPES[i % STAGE1_TYPES.length]};
    const q = DATA.stage1[item.idx] || DATA.stage1[i % DATA.stage1.length];
    let type1 = normalizeType(q?.type || q?.typeName || item.type || (typeof stage1QuestionType==='function' ? stage1QuestionType(q,i) : ''));
    if(type1==='اختر من متعدد' && (!Array.isArray(q?.options) || q.options.map(x=>String(x||'').trim()).filter(Boolean).length < 2)) type1='ماذا ينقص';
    const count = byId('count1'), stageType=byId('stage1Type'), question=byId('q1'), progress=byId('progress1'), answersBox=byId('a1');
    if(count) count.textContent = `سؤال ${i+1} من ${total}`;
    if(stageType) stageType.textContent = type1;
    if(question){question.classList.toggle('stage1-arrange-question', type1==='رتّب'); question.textContent = q?.q || '';}
    if(progress) progress.style.width = (i / total * 100) + '%';
    if(!answersBox) return;
    const qKey = `v9542|${i}|${item.idx}|${type1}|${q?.q||''}`;
    if(answersBox.dataset.qIndex !== qKey){
      stage1Busy = false; stage1PendingAdvance = false;
      answersBox.dataset.qIndex = qKey;
      answersBox.innerHTML = renderQuestion(q,i,type1);
      bindQuestion(i,q,p,type1);
    }
  };
  window.answerStage1 = answerStage1 = async function(trigger,i,q,p,selected){
    if(stage1Busy || stage1PendingAdvance) return;
    const answer = String(selected||'').trim();
    if(!answer) return;
    stage1Busy = true; stage1PendingAdvance = true;
    const qtype = normalizeType((q && q.type) || (STAGE1_TYPES && STAGE1_TYPES[i % STAGE1_TYPES.length]) || 'اختر من متعدد');
    const correct = qtype==='رتّب' ? arrangeCorrectParts(q).join(' | ') : String(q?.answer||'');
    const ok = normalizeText(answer) === normalizeText(correct);
    if(trigger) trigger.classList.add('stage1-selected');
    document.querySelectorAll('#a1 button,#a1 input').forEach(x=>x.disabled=true);
    const pts = ok ? 5 : 0;
    const remaining = stage1Runtime.remaining ?? (()=>{const secText=(byId('timer1')?.innerText||'07:00').split(':');return (Number(secText[0]||0)*60)+Number(secText[1]||0);})();
    const nextI = i + 1;
    stage1LocalI = nextI;
    stage1LocalKey = String((team?.progress?.stage1||{}).startedAt || 'stage1');
    const total = Math.min(50, Array.isArray(DATA?.stage1) ? DATA.stage1.length : 50);
    const finalQuestion = nextI >= total;
    const latestStage1 = Object.assign({}, team?.progress?.stage1 || p, {i:nextI, remaining, ended:finalQuestion});
    if(team?.progress?.stage1) team.progress.stage1 = latestStage1;
    if(finalQuestion){
      try{ clearInterval(timerInt); if(stage1Runtime) stage1Runtime.running=false; }catch(e){}
      const doneArr=Array.from(new Set([...(team?.done||[]),'stage1']));
      if(team){ team.done=doneArr; team.current='moderatorWaitV960'; team.progress=Object.assign({},team.progress||{}, {stage1:latestStage1}); }
      if(typeof renderWaiting==='function') renderWaiting('finished',1);
      try{
        await changeScore(pts,'stage1',makeLog('اجمعوا الكنوز',q?.q||'',answer,correct,ok,pts),{progress:Object.assign({},team.progress,{stage1:latestStage1}),done:doneArr,current:'moderatorWaitV960'});
      }catch(e){console.error(e);}finally{stage1Busy=false; stage1PendingAdvance=false; if(typeof renderWaiting==='function') renderWaiting('finished',1);}
      return;
    }
    stage1Busy = false; stage1PendingAdvance = false;
    showQ1();
    try{
      await changeScore(pts,'stage1',makeLog('اجمعوا الكنوز',q?.q||'',answer,correct,ok,pts),{progress:Object.assign({},team.progress,{stage1:latestStage1})});
    }catch(e){console.error(e);}finally{stage1Busy=false; stage1PendingAdvance=false;}
  };
  document.addEventListener('DOMContentLoaded',()=>{
    const style=document.createElement('style');
    style.textContent=`.stage1-arrange-v9542{width:100%;display:grid;gap:16px}.arrange-help-v9542{text-align:center;font-weight:900}.arrange-options-v9542{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:stretch}.arrange-option-v9542{min-height:82px!important;height:100%!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;padding:14px 18px!important;font-size:clamp(1.05rem,1.65vw,1.45rem)!important;line-height:1.35!important;border-radius:18px!important}.arrange-option-v9542.picked{opacity:.62!important;filter:saturate(.8);transform:scale(.985)!important}.arrange-picked-v9542{background:#f8fcff;border:1px solid var(--line);border-radius:20px;padding:14px;text-align:center}.arrange-picked-list-v9542{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;min-height:44px;margin-top:10px}.arrange-picked-chip-v9542{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid #cfe4f2;border-radius:999px;padding:8px 13px;font-weight:1000}.arrange-picked-chip-v9542 b{display:inline-flex;width:25px;height:25px;border-radius:50%;align-items:center;justify-content:center;background:var(--blue);color:#fff}.arrange-actions-v9542{display:grid;grid-template-columns:1fr 1fr;gap:12px}.arrange-actions-v9542 .btn{min-height:54px}@media(max-width:760px){.arrange-options-v9542,.arrange-actions-v9542{grid-template-columns:1fr}}`;
    document.head.appendChild(style);
  });
})();


/* ===== V9.5.51 FINAL: arrange action buttons fixed after all old overrides ===== */
(function(){
  'use strict';
  const byId=(id)=>document.getElementById(id);
  const esc=(x)=>String(x??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c));
  const normType=(type)=>{
    const raw=String(type||'').trim(), compact=raw.replace(/[\sـ]/g,'').toLowerCase();
    if(['arrange','order','sort'].includes(compact)||compact==='رتب'||compact==='رتّب')return 'رتّب';
    if(['choice','multiple'].includes(compact)||raw==='اختر من متعدد')return 'اختر من متعدد';
    if(raw.includes('ينقص'))return 'ماذا ينقص';
    if(raw.includes('فراغ')||raw.includes('أكمل')||raw.includes('اكمل'))return 'فراغات';
    return raw||'اختر من متعدد';
  };
  const split=(v)=>String(v??'').split(/\s*(?:\||،|,|؛|;|\n|\/|\\)\s*/).map(x=>x.trim()).filter(Boolean);
  function parts(q){
    let p=split(q?.answer);
    if(p.length<4 && Array.isArray(q?.correctOrder))p=q.correctOrder.filter(Boolean).map(String);
    if(p.length<4 && Array.isArray(q?.arrangeOptions))p=q.arrangeOptions.filter(Boolean).map(String);
    if(p.length<4 && Array.isArray(q?.options))p=q.options.filter(Boolean).map(String);
    if(p.length<4)p=String(q?.answer||'').trim().split(/\s+/).filter(Boolean);
    while(p.length<4)p.push('—');
    return p.slice(0,4);
  }
  function renderArrange(q,i){
    const base=parts(q);
    const shuffler=(typeof seededShuffle==='function')?seededShuffle:(arr)=>arr.slice().sort(()=>Math.random()-.5);
    const opts=shuffler(base,`arrange-v9551|${typeof teamName!=='undefined'?teamName:''}|${i}|${q?.q||''}`).slice(0,4);
    return `<div class="stage1-arrange-v9551">
      <p class="arrange-help-v9551"></p>
      <div class="arrange-options-v9551">${opts.map(x=>`<button class="answer arrange-option-v9551" type="button" data-arrange-value="${esc(x)}">${esc(x)}</button>`).join('')}</div>
      <div class="arrange-actions-v9551"><button class="btn secondary arrange-reset-v9551" id="arrangeResetV9551" type="button">إعادة الترتيب</button><button class="btn stage1-submit arrange-submit-v9551" id="arrangeSubmitV9551" type="button" disabled>تأكيد الترتيب</button></div>
    </div>`;
  }
  window.renderStage1Question = renderStage1Question = function(q,i,type){
    const t=normType(type);
    if(t==='اختر من متعدد')return (Array.isArray(q?.options)?q.options:[]).filter(Boolean).map(o=>`<button class="answer" type="button" data-a="${esc(o)}">${esc(o)}</button>`).join('');
    if(t==='رتّب')return renderArrange(q,i);
    return `<div class="stage1-input-card"><input id="stage1Input" class="stage1-input" autocomplete="off" placeholder="اكتب الإجابة هنا"><button class="btn stage1-submit" id="stage1Submit" type="button">تسجيل الإجابة</button></div>`;
  };
  window.renderStage1Input = renderStage1Input = function(q,i,type){
    return normType(type)==='رتّب' ? renderArrange(q,i) : `<div class="stage1-input-card"><input id="stage1Input" class="stage1-input" autocomplete="off" placeholder="اكتب الإجابة هنا"><button class="btn stage1-submit" id="stage1Submit" type="button">تسجيل الإجابة</button></div>`;
  };
  window.bindStage1Answers = bindStage1Answers = function(i,q,p,type){
    const t=normType(type), box=byId('a1'); if(!box)return;
    if(t==='اختر من متعدد'){box.querySelectorAll('.answer').forEach(btn=>{btn.onclick=()=>answerStage1(btn,i,q,p,btn.dataset.a||btn.textContent.trim());});return;}
    if(t==='رتّب'){
      const picked=[], expected=parts(q);
      const list=byId('arrangePickedListV9551'), submit=byId('arrangeSubmitV9551'), reset=byId('arrangeResetV9551');
      const refresh=()=>{
        if(list)list.innerHTML=picked.length?picked.map((x,n)=>`<span class="arrange-picked-chip-v9551"><b>${n+1}</b>${esc(x)}</span>`).join(''):'<span class="muted">لم تختر بعد</span>';
        box.querySelectorAll('.arrange-option-v9551').forEach(btn=>{
          const value=btn.dataset.arrangeValue||btn.textContent.trim();
          const on=picked.indexOf(value)>=0;
          btn.classList.toggle('picked',on);
          btn.classList.toggle('stage1-selected',on);
          btn.classList.toggle('selected',on);
        });
        if(submit)submit.disabled=picked.length!==expected.length;
      };
      box.querySelectorAll('.arrange-option-v9551').forEach(btn=>{btn.onclick=()=>{
        if(btn.disabled)return;
        const value=btn.dataset.arrangeValue||btn.textContent.trim();
        const pos=picked.indexOf(value);
        if(pos>=0){
          picked.splice(pos,1);
          btn.classList.remove('picked','stage1-selected','selected');
        }else{
          if(picked.length>=expected.length)return;
          picked.push(value);
          btn.classList.add('picked','stage1-selected','selected');
        }
        refresh();
      };});
      if(reset)reset.onclick=()=>{picked.length=0;box.querySelectorAll('.arrange-option-v9551').forEach(btn=>{btn.disabled=false;btn.classList.remove('picked','stage1-selected','selected');});refresh();};
      if(submit)submit.onclick=()=>{if(picked.length===expected.length)answerStage1(submit,i,q,p,picked.join(' | '));};
      refresh(); return;
    }
    const input=byId('stage1Input'), submit=byId('stage1Submit');
    if(input){input.focus();input.onkeydown=(e)=>{if(e.key==='Enter')submit?.click();};}
    if(submit)submit.onclick=()=>answerStage1(submit,i,q,p,input?.value||'');
  };
})();

/* ===== V9.5.54 CLEAN FINAL: no contestant correctness/score feedback after late overrides ===== */
(function(){
  'use strict';
  window.showScorePop = showScorePop = function(){ return; };
})();



/* ===== V9.5.133 CLEAN FIX: Stage 1 uses each imported Excel question type ===== */
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
