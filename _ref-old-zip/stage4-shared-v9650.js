/* v9.6.50 - Stage 4 clean shared helpers. */
(function(){
  'use strict';
  const esc = (x) => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = (x) => String(x ?? '').trim().replace(/[ًٌٍَُِّْـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g,'').replace(/\s+/g,' ').toLowerCase();
  function getData(){
    try{ if(typeof DATA !== 'undefined' && DATA && Array.isArray(DATA.stage4)) return DATA; }catch(e){}
    try{ if(window.DATA && Array.isArray(window.DATA.stage4)) return window.DATA; }catch(e){}
    return {stage4:[]};
  }
  function questions(){
    return (getData().stage4 || []).map((q, i) => ({
      id: 'stage4_' + i,
      index: i,
      text: q.q || q.question || q[0] || '',
      answer: q.answer || q.correct || q[1] || '',
      options: Array.isArray(q.options) ? q.options : (Array.isArray(q[2]) ? q[2] : []),
      points: Number(q.points || 15)
    }));
  }
  function findQuestion(index){ return questions()[Number(index)||0] || null; }
  function leftSeconds(endsAtMs){ const end=Number(endsAtMs||0); return end ? Math.max(0, Math.ceil((end-Date.now())/1000)) : 0; }
  function fmt(s){ s=Math.max(0,Number(s)||0); return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }
  function teamDisplay(t){ return String(t?.name || t?.id || 'فريق'); }
  function stage4Ref(){ return db.collection('meta').doc('stage4Final'); }
  function flowRef(){ return db.collection('meta').doc('gameFlow'); }
  function isStage4Flow(flow){ return String(flow?.status||'') === 'stage4_running'; }
  function answerMatches(answer, q){ return norm(answer) === norm(q?.answer || ''); }
  window.SUFARAA_STAGE4_FINAL = { esc, norm, getData, questions, findQuestion, leftSeconds, fmt, teamDisplay, stage4Ref, flowRef, isStage4Flow, answerMatches };
})();
