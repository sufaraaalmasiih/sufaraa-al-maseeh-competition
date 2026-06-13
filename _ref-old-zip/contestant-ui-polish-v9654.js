/* v9.6.54 - Login blank-page guard: stable header render without MutationObserver loop */
(function(){
  'use strict';
  const esc = (x)=>String(x ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const stageTitles = {stage1:'اجمعوا الكنوز',stage2:'فتشوا الكتب',stage3:'على المحك',stage4:'اثبتوا بالحق'};
  const stageIcons = {stage1:'🥇',stage2:'🥈',stage3:'🥉',stage4:'🏅'};
  const stage2SelectionMemory = Object.create(null);

  function flowStatus(){
    try{return String((window.__sufaraaFlowStatusV9653)||(localStorage.getItem('sufaraa_last_game_status_v962')||''));}catch(e){return '';}
  }
  function statusStage(s){return Number(String(s||'').match(/^stage(\d)_/)?.[1] || 0);}
  function statusPhase(s){return String(s||'').split('_').slice(1).join('_');}
  function currentFlowTargetForContestant(){
    const st=flowStatus();
    const active=statusStage(st);
    const ph=statusPhase(st);
    if(!active) return '';
    if(ph==='intro') return 'intro'+active;
    if(ph==='running') return 'stage'+active;
    if(ph==='finished') return 'moderatorWaitV960';
    return '';
  }
  function showCurrentFlowTargetFromPolish(){
    const target=currentFlowTargetForContestant();
    if(!target) return false;
    if(target==='moderatorWaitV960') return false;
    try{ document.body.classList.remove('flow-waiting-active-v966'); }catch(e){}
    try{
      if(typeof page==='function') page(target,false);
      else {
        document.querySelectorAll('#appScreen .page').forEach(p=>p.classList.remove('active'));
        const el=document.getElementById(target); if(el) el.classList.add('active');
      }
      return true;
    }catch(e){ console.warn(e); return false; }
  }
  function isStaleStageFinish(id){
    const n=Number(String(id||'').replace('stage',''));
    const st=flowStatus();
    const active=statusStage(st);
    if(!n || !active) return false;
    return active !== n && (statusPhase(st)==='running' || statusPhase(st)==='intro' || statusPhase(st)==='finished');
  }

  function placeholderFix(root){
    (root||document).querySelectorAll('#stage2 input[placeholder],#stage4 input[placeholder],#stage1 input[placeholder]').forEach(input=>{
      if(input.dataset.placeholderFixV9653) return;
      input.dataset.placeholderFixV9653='1';
      input.dataset.placeholderOriginalV9653=input.getAttribute('placeholder')||'';
      input.addEventListener('focus',()=>{ input.setAttribute('placeholder',''); });
      input.addEventListener('blur',()=>{ if(!input.value) input.setAttribute('placeholder',input.dataset.placeholderOriginalV9653||''); });
    });
  }

  function renderPlayerHeaderOverride(){
    const top=document.querySelector('.topbar'); if(!top||typeof team==='undefined'||!team||typeof stages==='undefined'||!Array.isArray(stages)) return;
    let box=document.getElementById('playerHeaderV964');
    if(!box){box=document.createElement('div');box.id='playerHeaderV964';box.className='player-header-v964';top.appendChild(box);}
    const cur=String(team.current||'intro1');
    const stageButtons=stages.map(st=>{
      const done=(team.done||[]).includes(st.stage);
      const active=cur===st.id||cur===st.stage;
      const text=active ? st.title : '';
      return `<span class="ph-stage-v964 ${active?'active current-stage-v9653':''} ${done?'done':''}" title="${esc(st.title)}"><b>${esc(st.icon||'')}</b><span class="ph-stage-title-v9653">${esc(text)}</span></span>`;
    }).join('');
    const html=`<div class="ph-team-v964"><span>الفريق</span><b>${esc(team.name||'')}</b></div><div class="ph-score-v964"><span>النقاط</span><strong>${Number(team.score||0)}</strong></div><div class="ph-stages-v964">${stageButtons}</div>`;
    // Important: do not rewrite the header on every MutationObserver tick.
    // Rewriting innerHTML creates a new childList mutation, which can loop and leave the contestant screen blank/frozen after login.
    const sig=String(team.id||'')+'|'+String(team.name||'')+'|'+String(team.current||'')+'|'+String(team.score||0)+'|'+JSON.stringify(team.done||[]);
    if(box.dataset.headerSigV9654===sig && box.innerHTML===html) return;
    box.dataset.headerSigV9654=sig;
    box.innerHTML=html;
  }

  const oldRenderPlayerHeader=window.renderPlayerHeaderV964;
  if(typeof oldRenderPlayerHeader==='function'){
    window.renderPlayerHeaderV964=renderPlayerHeaderV964=function(){
      return renderPlayerHeaderOverride();
    };
  }

  const oldFinish = window.finishStage;
  if(typeof oldFinish === 'function'){
    window.finishStage = finishStage = async function(id,next){
      if(isStaleStageFinish(id)){
        try{ if(typeof timerInt !== 'undefined') clearInterval(timerInt); if(typeof stage1Runtime !== 'undefined' && stage1Runtime) stage1Runtime.running=false; }catch(e){}
        console.warn('Blocked stale finishStage call for', id, 'while flow is', flowStatus());
        // V9.6.61: حتى عند اعتبار الطلب قديمًا، لا نترك المتسابق عالقًا ولا نعرض المباركة القديمة.
        try{
          const stage=Number(String(id||'').replace('stage',''))||0;
          if(stage && typeof renderWaiting==='function'){
            const key='stage'+stage;
            const done=Array.from(new Set([...(team?.done||[]), key]));
            const progress=Object.assign({},team?.progress||{});
            progress[key]=Object.assign({},progress[key]||{}, {ended:true});
            const flowTarget=currentFlowTargetForContestant();
            const nextCurrent=(flowTarget && flowTarget!=='moderatorWaitV960') ? flowTarget : 'moderatorWaitV960';
            if(typeof patchTeam==='function') patchTeam({done,progress,current:nextCurrent}).catch(console.warn);
            if(team){team.done=done;team.progress=progress;team.current=nextCurrent;}
            if(showCurrentFlowTargetFromPolish()) return;
            renderWaiting('finished',stage);
          }
        }catch(e){console.warn(e);}
        return;
      }
      return oldFinish.apply(this, arguments);
    };
  }
  const oldRender1 = window.render1;
  if(typeof oldRender1 === 'function'){
    window.render1 = render1 = function(){
      const st=flowStatus();
      if(st && statusStage(st) && statusStage(st)!==1){
        try{ if(typeof timerInt !== 'undefined') clearInterval(timerInt); if(typeof stage1Runtime !== 'undefined' && stage1Runtime) stage1Runtime.running=false; }catch(e){}
        return;
      }
      return oldRender1.apply(this, arguments);
    };
  }
  const oldAnswerStage1 = window.answerStage1;
  function norm(v){
    if(typeof window.norm === 'function') return window.norm(v);
    return String(v ?? '').trim().replace(/[ًٌٍَُِّْـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/\s+/g,' ').toLowerCase();
  }
  function s1Type(q,i){
    try{ if(typeof window.stage1QuestionType==='function') return window.stage1QuestionType(q,i); }catch(e){}
    return String(q?.type || q?.typeName || 'اختر من متعدد');
  }
  function splitParts(v){ return String(v ?? '').split(/\s*(?:\||،|,|؛|;|\n|\/|\\)\s*/).map(x=>x.trim()).filter(Boolean); }
  function arrangeExpected(q){
    let p=splitParts(q?.answer || q?.correct || '');
    if(p.length<4 && Array.isArray(q?.correctOrder)) p=q.correctOrder.filter(Boolean).map(String);
    if(p.length<4 && Array.isArray(q?.arrangeOptions)) p=q.arrangeOptions.filter(Boolean).map(String);
    if(p.length<4 && Array.isArray(q?.options)) p=q.options.filter(Boolean).map(String);
    return p.slice(0,4).join(' | ');
  }
  function stage1Total(p){
    try{ const plan=typeof getStage1Plan==='function'?getStage1Plan(p||{}):[]; if(plan && plan.length) return plan.length; }catch(e){}
    try{ return Math.min(50, DATA.stage1.length); }catch(e){ return 50; }
  }
  if(typeof oldAnswerStage1 === 'function'){
    window.answerStage1 = answerStage1 = async function(trigger,i,q,p,selected){
      const total=stage1Total(p);
      if(Number(i)+1 < total) return oldAnswerStage1.apply(this, arguments);
      if((typeof stage1Busy !== 'undefined' && stage1Busy) || (typeof stage1PendingAdvance !== 'undefined' && stage1PendingAdvance)) return;
      const answer=String(selected||'').trim();
      if(!answer) return;
      try{ stage1Busy=true; stage1PendingAdvance=true; }catch(_e){}
      try{
        const type=s1Type(q,i);
        const correct=String(type).includes('رت') ? arrangeExpected(q) : String(q?.answer || q?.correct || '');
        const ok = norm(answer) === norm(correct);
        const pts = ok ? 5 : 0;
        if(trigger) trigger.classList.add('stage1-selected','sent');
        document.querySelectorAll('#a1 button,#a1 input').forEach(x=>{x.disabled=true; x.classList.add('stage1-clean-sent');});
        let remaining=0;
        try{ const parts=(document.getElementById('timer1')?.innerText||'00:00').split(':'); remaining=(Number(parts[0]||0)*60)+Number(parts[1]||0); }catch(e){}
        const latestStage1=Object.assign({}, ((typeof team!=='undefined' && team?.progress?.stage1) || p || {}), {i:Number(i)+1, remaining, ended:true});
        if(typeof team!=='undefined' && team?.progress) team.progress.stage1=latestStage1;
        const progress=Object.assign({}, (typeof team!=='undefined' ? (team?.progress || {}) : {}), {stage1:latestStage1});
        const done=Array.from(new Set([...(team?.done||[]),'stage1']));
        const immediatePayload={progress, done, current:'moderatorWaitV960'};
        if(typeof team!=='undefined' && team){ team.progress=progress; team.done=done; team.current='moderatorWaitV960'; }
        if(typeof renderWaiting==='function') renderWaiting('finished',1);
        if(typeof changeScore==='function'){
          const log=(typeof makeLog==='function')?makeLog('اجمعوا الكنوز',q?.q||'',answer,correct,ok,pts):null;
          await changeScore(pts,'stage1',log,immediatePayload);
        }else if(typeof patchTeam==='function'){
          await patchTeam(immediatePayload);
        }
        try{ stage1Busy=false; stage1PendingAdvance=false; }catch(_e){}
        if(typeof renderWaiting==='function') renderWaiting('finished',1);
        return;
      }catch(e){
        console.error(e); alert('تعذر تأكيد السؤال الأخير. حاول مرة ثانية.');
      }finally{
        try{ stage1Busy=false; stage1PendingAdvance=false; }catch(_e){}
      }
    };
  }

  function selectedNoteHtml(text){
    return `<div class="stage2-picked-note-v9653"><span>الجزء المختار:</span><b>${esc(text||'')}</b></div>`;
  }
  function stage2KeyForItem(item){
    return String(item?.querySelector?.('input[data-key]')?.dataset?.key || '').trim();
  }
  function upsertStage2PickedNote(item, part){
    if(!item) return;
    let note=item.querySelector('.stage2-picked-note-v9653');
    if(!part){ if(note) note.remove(); return; }
    if(!note){
      note=document.createElement('div');
      note.className='stage2-picked-note-v9653';
      const anchor=item.querySelector('.stage2-correction-parts-v9599, .stage2-correction-parts-v9598');
      if(anchor) anchor.insertAdjacentElement('afterend', note);
      else item.appendChild(note);
    }
    note.innerHTML=`<span>الجزء المختار:</span><b>${esc(part)}</b>`;
  }
  function applyStage2PickedSelection(item){
    if(!item) return;
    const key=stage2KeyForItem(item);
    const saved=key ? stage2SelectionMemory[key] : '';
    if(!saved) return;
    item.querySelectorAll('.stage2-correction-part-v9599, .stage2-correction-part-v9598').forEach(btn=>{
      const active=String(btn.dataset.part||'').trim()===saved;
      btn.classList.toggle('selected', active);
      btn.classList.toggle('stage2-correction-selected-v9629', active);
    });
    upsertStage2PickedNote(item, saved);
  }
  function bindStage2PickedSelection(root){
    (root||document).querySelectorAll('#stage2 .stage2-item.stage2-correction-v9599, #stage2 .stage2-item.stage2-correction-v9598').forEach(item=>{
      if(item.dataset.stage2PickedBoundV9653==='1'){
        applyStage2PickedSelection(item);
        return;
      }
      item.dataset.stage2PickedBoundV9653='1';
      applyStage2PickedSelection(item);
      item.querySelectorAll('.stage2-correction-part-v9599, .stage2-correction-part-v9598').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const part=String(btn.dataset.part||'').trim();
          const key=stage2KeyForItem(item);
          if(key) stage2SelectionMemory[key]=part;
          upsertStage2PickedNote(item, part);
          item.classList.add('stage2-picked-active-v9653');
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded',()=>{
    try{
      if(typeof db!=='undefined') db.collection('meta').doc('gameFlow').onSnapshot(doc=>{ window.__sufaraaFlowStatusV9653=String((doc.data()||{}).status||''); }, console.warn);
    }catch(e){}
    placeholderFix(document);
    bindStage2PickedSelection(document);
    renderPlayerHeaderOverride();
    let pendingV9654=false;
    const mo=new MutationObserver(()=>{
      if(pendingV9654) return;
      pendingV9654=true;
      setTimeout(()=>{
        pendingV9654=false;
        placeholderFix(document);
        bindStage2PickedSelection(document);
        renderPlayerHeaderOverride();
      }, 80);
    });
    mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    setInterval(()=>{ placeholderFix(document); bindStage2PickedSelection(document); },800);
  });
})();
