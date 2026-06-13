/* ===== V9.5.42 Admin cleanup: PNG only, clear current teams, polished live/general links ===== */
(function(){
  'use strict';
  const esc=(x)=>String(x??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const num=(v)=>Number.isFinite(Number(v))?Number(v):0;
  const stageOf=(t)=>{const c=String(t?.current||''); if(c.includes('4'))return 'stage4'; if(c.includes('3'))return 'stage3'; if(c.includes('2'))return 'stage2'; return 'stage1';};
  const nameOf=(t)=>String((typeof teamDisplayNameV9512==='function'?teamDisplayNameV9512(t):(t?.name||t?.id||'فريق'))||'فريق').trim();
  const govOf=(t)=>String((typeof teamProvince==='function'?teamProvince(t):(t?.governorate||t?.province||''))||'');
  const totalOf=(t)=>num(t?.score ?? (num(t?.stageScores?.stage1)+num(t?.stageScores?.stage2)+num(t?.stageScores?.stage3)+num(t?.stageScores?.stage4)));
  const liveOf=(t)=>num((t?.stageScores||{})[stageOf(t)]||0);
  const filename=(x)=>String(x||'export').replace(/[\\/:*?"<>|]/g,'-').slice(0,110);
  function cleanPdfWords(){
    document.querySelectorAll('button,a').forEach(el=>{
      const t=(el.textContent||'').trim();
      if(t.includes('PDF')) el.textContent=t.replace(/PDF/g,'صورة PNG').replace('تحميل صورة PNG','تحميل كصورة PNG');
    });
  }
  async function exportHtmlImage(html,name){
    if(!window.html2canvas){alert('مكتبة تصدير الصورة غير جاهزة.'); return;}
    const wrap=document.createElement('div');
    wrap.dir='rtl';
    wrap.style.cssText='position:fixed;left:-10000px;top:0;width:1400px;background:white;color:#111;padding:28px;font-family:Tahoma,Arial,sans-serif;z-index:-1;';
    wrap.innerHTML=`<style>.img-export-v9542 h1{text-align:center;color:#12324A;margin:0 0 20px;font-size:34px}.img-export-v9542 table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:17px}.img-export-v9542 th{background:#EAF6FC;color:#12324A;font-weight:900}.img-export-v9542 th,.img-export-v9542 td{border:1px solid #BFD4E3;padding:10px 9px;text-align:right;vertical-align:top;word-break:break-word}.img-export-v9542 tr:nth-child(even) td{background:#F8FCFF}</style><div class="img-export-v9542">${html}</div>`;
    document.body.appendChild(wrap);
    try{
      const canvas=await html2canvas(wrap,{scale:2,useCORS:true,backgroundColor:'#ffffff'});
      const a=document.createElement('a');
      a.download=name.endsWith('.png')?name:name+'.png';
      a.href=canvas.toDataURL('image/png');
      a.click();
    }catch(e){console.error(e); alert('تعذر إنشاء الصورة.');}
    finally{wrap.remove();}
  }
  function table(title,headers,rows){return `<h1>${esc(title)}</h1><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;}
  window.downloadSelectedTeamAnswersImageV9542 = async function(){
    const t=(typeof selectedTeam==='function')?selectedTeam():null; if(!t)return alert('اختر فريقًا أولًا');
    const logs=t.answerLog||[];
    const rows=logs.map((l,i)=>[i+1,l.playerName||'الفريق',l.stage||'',l.question||'',l.selected||'',l.correct||'-',l.selected==='تخطي'?'تخطي':(l.ok?'صحيح':'خطأ'),num(l.points)>0?'+'+l.points:(l.points||0),l.time||'']);
    if(!rows.length) rows.push(['-','-','-','لا توجد إجابات مسجلة','-','-','-','-','-']);
    await exportHtmlImage(table(`إجابات فريق ${nameOf(t)}`,['#','اللاعب/الفريق','المرحلة','السؤال','إجابة الفريق','الجواب الصحيح','النتيجة','النقاط','الوقت'],rows),`answers-${filename(nameOf(t))}.png`);
  };
  window.exportHistoryImageV9542 = async function(id){
    const r=(history||[]).find(x=>x.id===id); if(!r)return;
    const rows=(r.teams||[]).map((t,i)=>[i+1,nameOf(t),govOf(t)||'-',(t.players||[]).map(p=>p.name||p).join('، '),t.stageScores?.stage1||0,t.stageScores?.stage2||0,t.stageScores?.stage3||0,t.stageScores?.stage4||0,totalOf(t)]);
    await exportHtmlImage(table(`تاريخ المسابقة - ${r.title||r.date||''}`,['الترتيب','الفريق','المحافظة','اللاعبون','المرحلة 1','المرحلة 2','المرحلة 3','المرحلة 4','المجموع'],rows),`history-${filename(r.title||r.date||'competition')}.png`);
  };
  window.downloadSelectedTeamAnswersPdfV9512 = window.downloadSelectedTeamAnswersImageV9540 = window.downloadSelectedTeamAnswersImageV9542;
  window.exportHistoryPdfV9512 = window.exportHistoryImageV9540 = window.exportHistoryImageV9542;
  window.clearCurrentTeamsOnlyV9542 = window.clearCurrentTeamsOnlyV9541 = async function(){
    if(!confirm('سيتم حذف الفرق الحالية ونقاطها وتقدمها وإجاباتها الحالية فقط. لن يتم حذف الأسئلة ولا تاريخ المسابقة. هل أنت متأكد؟')) return;
    const batch=db.batch();
    const teamDocs=await db.collection('teams').get(); teamDocs.forEach(d=>batch.delete(d.ref));
    const locks=await db.collection('stage3Locks').get(); locks.forEach(d=>batch.delete(d.ref));
    batch.set(db.collection('meta').doc('activeStage3'),{id:null,team:null,teamName:null,status:'waiting',startedAtMs:null,duration:15,revealDone:false},{merge:true});
    batch.set(db.collection('meta').doc('stage3Turn'),{team:null,teamName:null,index:0,turnStartedAtMs:null,startedAtMs:null,turnDuration:15,duration:15,updatedAt:Date.now()},{merge:true});
    batch.set(db.collection('meta').doc('stage4Live'),{status:'waiting',index:0,duration:15,startedAtMs:null,revealDone:false},{merge:true});
    batch.set(db.collection('meta').doc('stage4Reveal'),{active:false,rows:[],questionIndex:null,updatedAt:Date.now()},{merge:true});
    batch.set(db.collection('meta').doc('control'),{currentTeamsClearedAt:String(Date.now())},{merge:true});
    await batch.commit();
    alert('تم حذف بيانات الفرق الحالية فقط. الأسئلة وتاريخ المسابقة محفوظان.');
  };
  window.renderLive = function(){
    const live=document.getElementById('liveList'); if(!live)return;
    const list=[...teams].sort((a,b)=>(liveOf(b)-liveOf(a))||(totalOf(b)-totalOf(a))||nameOf(a).localeCompare(nameOf(b),'ar'));
    if(!list.length){live.innerHTML='<p>لا توجد فرق بعد.</p>';return;}
    const max=Math.max(1,...list.map(liveOf));
    const link='<div class="audience-display-link-v9539 audience-result-link-v9542"><a class="btn" href="audience.html?mode=live" target="_blank">فتح شاشة الجمهور المنفصلة</a><p class="muted">افتح هذا الرابط على الشاشة الكبيرة. التحكم يبقى من لوحة الميسر هنا.</p></div>';
    live.innerHTML=link+`<div class="admin-live-list-v9542">${list.map((t,i)=>{const pts=liveOf(t); return `<div class="live-row-v9542 ${i===0?'leader':''}"><div class="rank-badge">${i===0?'🏆':i+1}</div><div class="live-main-v9542"><h3>${esc(nameOf(t))}${govOf(t)?` <span class="province-chip">${esc(govOf(t))}</span>`:''}</h3><p>${esc(stageNames[stageOf(t)]||'-')}</p><div class="bar-track"><div class="bar-fill" style="width:${Math.round(pts/max*100)}%"></div></div></div><div class="score-number">${pts}<br><small>نقطة</small></div></div>`}).join('')}</div>`;
  };
  window.renderGeneralResultsV9520 = function(){
    const box=document.getElementById('generalList'); if(!box)return;
    const list=[...teams].sort((a,b)=>(totalOf(b)-totalOf(a))||nameOf(a).localeCompare(nameOf(b),'ar'));
    if(!list.length){box.innerHTML='<p>لا توجد فرق بعد.</p>';return;}
    const max=Math.max(1,...list.map(totalOf));
    box.innerHTML=`<div class="general-results-list-v9542">${list.map((t,i)=>`<div class="general-row-v9542 ${i===0?'winner':''}"><div class="rank-badge">${i===0?'🏆':i+1}</div><div class="general-main-v9542"><h3>${esc(nameOf(t))}${govOf(t)?` <span class="province-chip">${esc(govOf(t))}</span>`:''}</h3><div class="bar-track"><div class="bar-fill" style="width:${Math.round(totalOf(t)/max*100)}%"></div></div></div><div class="score-number">${totalOf(t)}<br><small>مجموع</small></div></div>`).join('')}</div>`;
    const tools=document.querySelector('.general-tools-v9523');
    if(tools) tools.innerHTML='<button class="btn secondary" onclick="renderGeneralResultsV9520()">إظهار النتائج</button><a class="btn" href="audience.html?mode=general" target="_blank">إظهار النتائج بحماس</a>';
  };
  window.showGeneralResultsRevealV9520 = function(){ window.open('audience.html?mode=general','_blank'); };
  const oldControl=window.renderControl;
  if(typeof oldControl==='function') window.renderControl=function(){oldControl(); cleanPdfWords();};
  const oldHistory=window.renderHistory;
  if(typeof oldHistory==='function') window.renderHistory=function(){oldHistory(); cleanPdfWords(); document.querySelectorAll('button[onclick^="exportHistoryPdfV9512"]').forEach(b=>b.textContent='تصدير صورة PNG');};
  const oldAnswer=window.renderAnswerLog;
  if(typeof oldAnswer==='function') window.renderAnswerLog=function(){oldAnswer(); cleanPdfWords(); document.querySelectorAll('button[onclick*="downloadSelectedTeamAnswers"]').forEach(b=>b.textContent='تحميل إجابات الفريق كصورة PNG');};
  document.addEventListener('DOMContentLoaded',()=>{
    const style=document.createElement('style');
    style.textContent=`.clear-current-teams-v9542{border:2px solid rgba(220,38,38,.25)!important;background:#fff7f7!important}.audience-result-link-v9542{margin-bottom:14px}.admin-live-list-v9542,.general-results-list-v9542{display:grid;gap:12px}.live-row-v9542,.general-row-v9542{display:grid;grid-template-columns:76px minmax(0,1fr) 132px;gap:14px;align-items:center;background:#f8fcff;border:1px solid var(--line);border-radius:22px;padding:14px 16px;box-shadow:0 10px 24px rgba(18,50,74,.07)}.live-row-v9542.leader,.general-row-v9542.winner{background:linear-gradient(135deg,#fff8db,#f8fcff);border-color:#f1d481}.live-main-v9542 h3,.general-main-v9542 h3{margin:0;color:var(--blue-dark);font-size:1.35rem}.live-main-v9542 p{margin:4px 0;color:#60798d;font-weight:900}.province-chip{display:inline-flex;background:#edf7fc;border:1px solid #d5e8f4;border-radius:999px;padding:3px 8px;font-size:.8rem;color:var(--blue-dark);vertical-align:middle}.rank-badge{font-weight:1000;font-size:1.6rem;text-align:center;color:var(--blue)}@media(max-width:760px){.live-row-v9542,.general-row-v9542{grid-template-columns:1fr;text-align:center}}`;
    document.head.appendChild(style);
    cleanPdfWords();
  });
})();
