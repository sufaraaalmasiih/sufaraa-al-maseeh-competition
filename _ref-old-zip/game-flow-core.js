/* Sufaraa v9.6.0 - Unified Game Flow Core
   Shared constants/utilities for the moderator, contestants, and audience. */
(function(){
  'use strict';
  const DEFAULT_DURATIONS = {
    stage1: 420,
    stage2Turn: 150,
    stage3Choice: 15,
    stageQuestion: 15
  };
  const STAGES = {
    1: { key:'stage1', intro:'intro1', title:'اجمعوا الكنوز', next:2 },
    2: { key:'stage2', intro:'intro2', title:'فتشوا الكتب', next:3 },
    3: { key:'stage3', intro:'intro3', title:'على المحك', next:4 },
    4: { key:'stage4', intro:'intro4', title:'اثبتوا بالحق', next:null }
  };
  const STATUS = {
    waiting:'waiting_players',
    final:'final_results',
    contestFinished:'contest_finished'
  };
  function stageStatus(stage, phase){ return `stage${Number(stage)}_${phase}`; }
  function normalizeDurations(raw){
    const out = Object.assign({}, DEFAULT_DURATIONS, raw || {});
    Object.keys(DEFAULT_DURATIONS).forEach(k=>{
      const n = Number(out[k]);
      out[k] = Number.isFinite(n) && n > 0 ? Math.round(n) : DEFAULT_DURATIONS[k];
    });
    return out;
  }
  function flowLeftSeconds(flow){
    if(!flow) return 0;
    const end = Number(flow.endsAtMs || 0);
    const dur = Number(flow.durationSeconds || 0);
    if(!end) return Math.max(0, dur || 0);
    return Math.max(0, Math.ceil((end - Date.now()) / 1000));
  }
  function formatSeconds(seconds){
    const s = Math.max(0, Number(seconds)||0);
    return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
  }
  function localDuration(key, fallback){
    try{
      const raw = localStorage.getItem('sufaraa_game_durations_v960');
      const data = raw ? JSON.parse(raw) : {};
      const d = normalizeDurations(data);
      return Number(d[key] || fallback || DEFAULT_DURATIONS[key] || 15);
    }catch(e){ return Number(fallback || DEFAULT_DURATIONS[key] || 15); }
  }
  window.SUFARAA_GAME_FLOW = { DEFAULT_DURATIONS, STAGES, STATUS, stageStatus, normalizeDurations, flowLeftSeconds, formatSeconds, localDuration };
  window.gameFlowDurationV960 = localDuration;
})();
