/* ===== V9.6.38: Stage 2 correction must validate selected wrong part + typed correction ===== */
(function(){
  'use strict';

  function normalize(v){
    return String(v == null ? '' : v)
      .replace(/[ًٌٍَُِّْـ]/g,'')
      .replace(/[إأآا]/g,'ا')
      .replace(/ى/g,'ي')
      .replace(/ة/g,'ه')
      .replace(/[،؛؟!\.\,;:\(\)\[\]"']/g,' ')
      .replace(/\s+/g,' ')
      .trim()
      .toLowerCase();
  }
  function cleanWord(v){return normalize(v).replace(/\s+/g,'');}
  function questionForKey(key,title){
    try{
      const parts = String(key||'').split('_');
      const type = parts[0] || '';
      const idx = Number(parts[1] || 0);
      const group = (DATA.stage2.groups||[]).find(g=>g.title===title || g.type===type);
      return {group, q: group && group.questions ? group.questions[idx] : null};
    }catch(e){return {group:null,q:null};}
  }
  function explicitTarget(q){
    return String((q && (q.targetPart || q.wrongPart || q.partToCorrect || q.mistake)) || '').trim();
  }
  function selectedPartValid(selected, q){
    const selectedN = normalize(selected);
    if(!selectedN || !q) return true;
    const explicit = explicitTarget(q);
    if(explicit){
      const explicitN = normalize(explicit);
      return selectedN === explicitN || explicitN.includes(selectedN) || selectedN.includes(explicitN);
    }
    const qText = normalize(q.q || q.text || q.fullText || '');
    const ans = normalize(q.answer || q.correct || q.correctAnswer || '');
    if(!qText || !ans) return true;

    const firstOriginal = cleanWord(String(q.q || '').split(/\s+/)[0] || '');
    const firstAnswer = cleanWord(String(q.answer || q.correct || '').split(/\s+/)[0] || '');
    if(firstOriginal && firstOriginal === firstAnswer && selectedN === firstOriginal) return false;

    if(!ans.includes(selectedN)) return true;
    if(ans.includes('لا ' + selectedN) || ans.includes('لا' + selectedN)) return true;
    if(ans.includes('بل ') && qText.includes(selectedN)) return true;
    return false;
  }

  const oldAnswer2 = typeof answer2 === 'function' ? answer2 : null;
  if(!oldAnswer2) return;

  window.answer2 = answer2 = async function(key, answer, correct, el, points, title){
    const item = el && el.closest ? el.closest('.stage2-item') : null;
    const isCorrection = !!(item && (item.classList.contains('stage2-correction-v9599') || item.classList.contains('stage2-correction-v9598')));
    if(isCorrection){
      const partBtn = item.querySelector('.stage2-correction-part-v9599.selected, .stage2-correction-part-v9598.selected');
      const selected = String((partBtn && partBtn.dataset && partBtn.dataset.part) || '').trim();
      const found = questionForKey(key,title);
      if(!selectedPartValid(selected, found.q)){
        // Do not block the contestant from submitting. A wrong selected part should be recorded
        // as a wrong answer, not freeze the button. Passing an impossible correct value lets
        // the existing stage-2 save/advance flow run while awarding 0 points.
        return oldAnswer2.call(this, key, answer, '__STAGE2_WRONG_SELECTED_PART__', el, points, title);
      }
    }
    return oldAnswer2.apply(this, arguments);
  };
})();
