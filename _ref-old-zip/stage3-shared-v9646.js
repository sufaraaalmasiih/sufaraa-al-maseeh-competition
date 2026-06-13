/* v9.6.46 - Stage 3 shared helpers. */
(function(){
  'use strict';
  const esc = (x) => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = (x) => String(x ?? '').trim().replace(/[ًٌٍَُِّْـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/\s+/g,' ').toLowerCase();
  const pointsFor = (level) => /صعب/.test(level) ? 15 : /متوسط/.test(level) ? 10 : 5;
  function getData(){
    // data.js declares DATA with const, which is available as a global lexical binding
    // but not as window.DATA in modern browsers. Using window.DATA here made the
    // stage 3 board empty even though DATA.stage3 was loaded correctly.
    try{ if(typeof DATA !== 'undefined' && DATA && Array.isArray(DATA.stage3)) return DATA; }catch(e){}
    try{ if(window.DATA && Array.isArray(window.DATA.stage3)) return window.DATA; }catch(e){}
    return {stage3:[]};
  }
  function questions(){
    const cats = (getData().stage3 || []).slice(0,5);
    return cats.map((cat, ci) => ({
      id: 'cat'+ci,
      index: ci,
      title: cat.cat,
      questions: (cat.qs || []).slice(0,6).map((q, qi) => ({
        id: ci + '_' + qi,
        categoryIndex: ci,
        questionIndex: qi,
        category: cat.cat,
        level: q[0],
        text: q[1],
        answer: q[2],
        points: pointsFor(q[0])
      }))
    }));
  }
  function findQuestion(id){
    for(const c of questions()) for(const q of c.questions) if(q.id === id) return q;
    return null;
  }
  function leftSeconds(endsAtMs){
    const end = Number(endsAtMs || 0);
    if(!end) return 0;
    return Math.max(0, Math.ceil((end - Date.now()) / 1000));
  }
  function fmt(s){
    s = Math.max(0, Number(s)||0);
    return String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0');
  }
  function teamDisplay(t){ return String(t?.name || t?.id || 'فريق'); }
  function stage3Ref(){ return db.collection('meta').doc('stage3Final'); }
  function flowRef(){ return db.collection('meta').doc('gameFlow'); }
  function isStage3Flow(flow){ return String(flow?.status||'') === 'stage3_running'; }
  window.SUFARAA_STAGE3_FINAL = { esc, norm, pointsFor, getData, questions, findQuestion, leftSeconds, fmt, teamDisplay, stage3Ref, flowRef, isStage3Flow };
})();
