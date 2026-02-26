/* ═══════════════════════════════════════════════════════════════
   CosmoSorter 星图整理器 — app.js
   功能演示版核心逻辑
   Handles: View switching · Image upload · Mock AI analysis ·
            Tab navigation · LocalStorage · JSON export (Blob)
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   ★ API 调用预留位置 ★
   在真实环境中，将下方 runMockAnalysis() 中的 setTimeout 替换为：

   async function callAIAPI(textInput, imageBase64) {
     const response = await fetch('https://api.your-ai-service.com/v1/analyze', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': 'Bearer YOUR_API_KEY'
       },
       body: JSON.stringify({
         text: textInput,
         image: imageBase64,   // base64 encoded image (optional)
         categories: ['character', 'worldview', 'geography', 'items']
       })
     });
     if (!response.ok) throw new Error('API request failed');
     return await response.json();
     // Expected response shape: { character: {...}, worldview: {...}, geography: {...}, items: {...} }
   }
   ───────────────────────────────────────────────────────────── */

/* ═══════════════════════════════════════════════════════════════
   1. MOCK AI DATA
   ═══════════════════════════════════════════════════════════════ */
const MOCK_AI_DATA = {
  character: {
    name:       '塞尔弗',
    race:       '人类（疑似混血精灵）',
    ability:    '黑袍魔法、暗影操控、古语咒文',
    backstory:  '来自北方冰原的流浪法师，因一次意外的魔法实验失去了记忆，只记得自己的名字。他穿着一件据说能吸收魔力的黑色长袍，独自游荡于各大森林之间，寻找失落的过去。'
  },
  worldview: {
    magicSystem: '以「晶雾」为媒介的魔法体系，施法者需要吸收空气中的晶雾粒子来凝聚魔力。晶雾浓度越高，可施展的魔法越强大，但同时也会侵蚀施法者的记忆。',
    era:         '第三纪元末期，魔法文明与机械文明的交汇时代',
    factions:    '黑袍法师协会、晶雾守护者、断剑骑士团',
    cosmology:   '世界由七层晶雾层包裹，每层对应不同的魔法属性。最外层为「虚空晶雾」，据说是所有魔法的源头。'
  },
  geography: {
    name:     '晶雾森林',
    location: '大陆中部，横跨三个王国边界的禁区',
    climate:  '常年被淡蓝色晶雾笼罩，能见度极低，温度恒定在零下五度',
    features: '树木会发出微弱的蓝光，地面覆盖着会缓慢移动的晶雾苔藓。森林深处存在「晶雾漩涡」，是魔力最为集中的区域。',
    danger:   '迷失者会被晶雾侵蚀记忆，最终成为无意识的「雾人」。进入森林超过三天者，记忆损失率高达 87%。'
  },
  items: {
    name:    '会说话的断剑',
    type:    '魔法武器 · 第一纪元遗物',
    ability: '能与持有者进行心灵感应，拥有独立意识与记忆。可以感知周围的魔力波动，并以古语向持有者发出警告。',
    origin:  '据剑自述，它曾是第一纪元英雄「光明骑士卡尔文」的佩剑，在最后一战中断裂。剑中封印着卡尔文的部分意识，这也是它能够说话的原因。',
    state:   '剑身断裂，仅剩剑柄与三分之一剑身，但魔力依然强大。断口处散发着淡金色的光芒。'
  }
};

/* ═══════════════════════════════════════════════════════════════
   2. LOCALSTROAGE KEYS
   ═══════════════════════════════════════════════════════════════ */
const LS = {
  TEXT_INPUT:    'cosmo_text_input',
  ANALYSIS_DATA: 'cosmo_analysis_data',
  HAS_ANALYZED:  'cosmo_has_analyzed',
};

/* ═══════════════════════════════════════════════════════════════
   3. APP STATE
   ═══════════════════════════════════════════════════════════════ */
const state = {
  currentData:    null,   // current analysis result (may be user-edited)
  hasAnalyzed:    false,
  imageDataUrl:   null,
  docFile:        null,   // selected document File object
  audioFile:      null,   // selected audio File object
  audioObjectUrl: null,   // object URL for audio preview (must be revoked on clear)
};

/* ═══════════════════════════════════════════════════════════════
   4. DOM CACHE
   ═══════════════════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);

const DOM = {
  // Views
  landingView:     $('landing-view'),
  appView:         $('app-view'),

  // App chrome
  appStatus:       $('app-status'),
  loadingOverlay:  $('loading-overlay'),
  actionBar:       $('action-bar'),

  // Sections
  uploadSection:   $('upload-section'),
  analysisSection: $('analysis-section'),

  // Upload
  textInput:         $('text-input'),
  charCount:         $('char-count'),
  imageInput:        $('image-input'),
  imageUploadZone:   $('image-upload-zone'),
  uploadPlaceholder: $('upload-placeholder'),
  imagePreviewWrap:  $('image-preview-wrap'),
  imagePreview:      $('image-preview'),
  removeImageBtn:    $('remove-image-btn'),
  analyzeBtn:        $('analyze-btn'),

  // Analysis fields — Character
  charName:      $('char-name'),
  charRace:      $('char-race'),
  charAbility:   $('char-ability'),
  charBackstory: $('char-backstory'),

  // Analysis fields — Worldview
  worldMagic:     $('world-magic'),
  worldEra:       $('world-era'),
  worldFactions:  $('world-factions'),
  worldCosmology: $('world-cosmology'),

  // Analysis fields — Geography
  geoName:     $('geo-name'),
  geoLocation: $('geo-location'),
  geoClimate:  $('geo-climate'),
  geoFeatures: $('geo-features'),
  geoDanger:   $('geo-danger'),

  // Analysis fields — Items
  itemName:    $('item-name'),
  itemType:    $('item-type'),
  itemAbility: $('item-ability'),
  itemOrigin:  $('item-origin'),
  itemState:   $('item-state'),

  // Action buttons
  reclassifyBtn: $('reclassify-btn'),
  exportBtn:     $('export-btn'),
  backHomeBtn:   $('back-home-btn'),
};

/* ═══════════════════════════════════════════════════════════════
   5. TOAST HELPER
   ═══════════════════════════════════════════════════════════════ */
let toastTimer = null;

function showToast(message, type = 'success') {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  if (toastTimer) clearTimeout(toastTimer);

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, 2800);
}

/* ═══════════════════════════════════════════════════════════════
   6. VIEW SWITCHING
   ═══════════════════════════════════════════════════════════════ */
const CosmoApp = {

  open() {
    DOM.landingView.style.display = 'none';
    DOM.appView.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.title = 'CosmoSorter — 星图整理器 · 功能演示';

    // Restore saved text input from LocalStorage
    const savedText = localStorage.getItem(LS.TEXT_INPUT);
    if (savedText && DOM.textInput) {
      DOM.textInput.value = savedText;
      updateCharCount();
    }

    // If there's a previous analysis result, restore it
    const savedData = localStorage.getItem(LS.ANALYSIS_DATA);
    const hadAnalyzed = localStorage.getItem(LS.HAS_ANALYZED);
    if (savedData && hadAnalyzed === 'true') {
      try {
        state.currentData = JSON.parse(savedData);
        state.hasAnalyzed = true;
        fillFields(state.currentData);
        showAnalysisView();
      } catch (e) {
        // Corrupted data — start fresh
        showUploadView();
      }
    } else {
      showUploadView();
    }
  },

  close() {
    DOM.appView.classList.remove('active');
    DOM.landingView.style.display = '';
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.title = 'CosmoSorter 星图整理器 — 从碎片到完整世界';
  }
};

// Expose globally so inline onclick handlers work
window.CosmoApp = CosmoApp;

/* ═══════════════════════════════════════════════════════════════
   7. SECTION VISIBILITY HELPERS
   ═══════════════════════════════════════════════════════════════ */
function showUploadView() {
  DOM.uploadSection.classList.add('active');
  DOM.analysisSection.classList.remove('active');
  DOM.actionBar.classList.remove('active');
  setStatus('等待输入', '');
}

function showAnalysisView() {
  DOM.uploadSection.classList.remove('active');
  DOM.analysisSection.classList.add('active');
  DOM.actionBar.classList.add('active');
  setStatus('分析完成', 'done');
}

function setStatus(text, modifier) {
  if (!DOM.appStatus) return;
  DOM.appStatus.textContent = text;
  DOM.appStatus.className = 'app-status';
  if (modifier) DOM.appStatus.classList.add(modifier);
}

/* ═══════════════════════════════════════════════════════════════
   8. CHARACTER COUNT
   ═══════════════════════════════════════════════════════════════ */
function updateCharCount() {
  if (DOM.charCount && DOM.textInput) {
    DOM.charCount.textContent = DOM.textInput.value.length;
  }
}

/* ═══════════════════════════════════════════════════════════════
   9. IMAGE UPLOAD (FileReader — no real backend)
   ═══════════════════════════════════════════════════════════════ */
function initImageUpload() {
  const zone        = DOM.imageUploadZone;
  const input       = DOM.imageInput;
  const placeholder = DOM.uploadPlaceholder;
  const previewWrap = DOM.imagePreviewWrap;
  const preview     = DOM.imagePreview;
  const removeBtn   = DOM.removeImageBtn;

  if (!zone || !input) return;

  // Click zone → trigger file input
  zone.addEventListener('click', e => {
    if (e.target === removeBtn || removeBtn.contains(e.target)) return;
    input.click();
  });

  // Keyboard accessibility
  zone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      input.click();
    }
  });

  // File selected
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (file) loadImageFile(file);
  });

  // Drag & drop
  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('drag-over');
  });

  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      loadImageFile(file);
    } else {
      showToast('请上传图片文件（PNG / JPG / WEBP）', 'error');
    }
  });

  // Remove image
  removeBtn.addEventListener('click', e => {
    e.stopPropagation();
    clearImage();
  });

  function loadImageFile(file) {
    const reader = new FileReader();
    reader.onload = evt => {
      state.imageDataUrl = evt.target.result;
      preview.src = state.imageDataUrl;
      placeholder.style.display = 'none';
      previewWrap.classList.add('has-image');
    };
    reader.onerror = () => showToast('图片读取失败，请重试', 'error');
    reader.readAsDataURL(file);
  }

  function clearImage() {
    state.imageDataUrl = null;
    preview.src = '';
    input.value = '';
    previewWrap.classList.remove('has-image');
    placeholder.style.display = '';
  }
}

/* ═══════════════════════════════════════════════════════════════
   10. MOCK AI ANALYSIS
   ═══════════════════════════════════════════════════════════════ */
function runMockAnalysis() {
  const textValue = DOM.textInput ? DOM.textInput.value.trim() : '';

  if (!textValue && !state.imageDataUrl && !state.docFile && !state.audioFile) {
    showToast('请先输入文字片段或上传素材', 'error');
    return;
  }

  // Save input to LocalStorage
  if (DOM.textInput) {
    localStorage.setItem(LS.TEXT_INPUT, DOM.textInput.value);
  }

  // Show loading state
  DOM.loadingOverlay.classList.add('active');
  setStatus('分析中…', 'analyzing');
  if (DOM.analyzeBtn) {
    DOM.analyzeBtn.disabled = true;
    DOM.analyzeBtn.textContent = '分析中…';
  }

  /* ─────────────────────────────────────────────────────────────
     ★ API 调用预留位置 ★
     将下方 setTimeout 替换为真实 API 调用：

     callAIAPI(textValue, state.imageDataUrl)
       .then(data => onAnalysisComplete(data))
       .catch(err => onAnalysisError(err))
       .finally(() => hideLoading());
     ───────────────────────────────────────────────────────────── */
  setTimeout(() => {
    // Simulate API response with mock data
    const result = deepClone(MOCK_AI_DATA);
    onAnalysisComplete(result);
  }, 1800 + Math.random() * 600); // 1.8–2.4s simulated delay
}

function onAnalysisComplete(data) {
  state.currentData = data;
  state.hasAnalyzed = true;

  // Persist to LocalStorage
  localStorage.setItem(LS.ANALYSIS_DATA, JSON.stringify(data));
  localStorage.setItem(LS.HAS_ANALYZED, 'true');

  // Fill form fields
  fillFields(data);

  // Hide loading, show analysis view
  DOM.loadingOverlay.classList.remove('active');
  resetAnalyzeBtn();
  showAnalysisView();

  // Switch to first tab
  switchTab('character');

  showToast('✨ AI 分析完成！所有字段均可编辑', 'success');
}

function onAnalysisError(err) {
  console.error('Analysis error:', err);
  DOM.loadingOverlay.classList.remove('active');
  resetAnalyzeBtn();
  setStatus('分析失败', '');
  showToast('分析失败，请重试', 'error');
}

function resetAnalyzeBtn() {
  if (DOM.analyzeBtn) {
    DOM.analyzeBtn.disabled = false;
    DOM.analyzeBtn.innerHTML = `
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
      </svg>
      开始分析`;
  }
}

/* ═══════════════════════════════════════════════════════════════
   11. FILL FIELDS FROM DATA
   ═══════════════════════════════════════════════════════════════ */
function fillFields(data) {
  if (!data) return;

  // Character
  if (data.character) {
    setVal(DOM.charName,      data.character.name);
    setVal(DOM.charRace,      data.character.race);
    setVal(DOM.charAbility,   data.character.ability);
    setVal(DOM.charBackstory, data.character.backstory);
  }

  // Worldview
  if (data.worldview) {
    setVal(DOM.worldMagic,     data.worldview.magicSystem);
    setVal(DOM.worldEra,       data.worldview.era);
    setVal(DOM.worldFactions,  data.worldview.factions);
    setVal(DOM.worldCosmology, data.worldview.cosmology);
  }

  // Geography
  if (data.geography) {
    setVal(DOM.geoName,     data.geography.name);
    setVal(DOM.geoLocation, data.geography.location);
    setVal(DOM.geoClimate,  data.geography.climate);
    setVal(DOM.geoFeatures, data.geography.features);
    setVal(DOM.geoDanger,   data.geography.danger);
  }

  // Items
  if (data.items) {
    setVal(DOM.itemName,    data.items.name);
    setVal(DOM.itemType,    data.items.type);
    setVal(DOM.itemAbility, data.items.ability);
    setVal(DOM.itemOrigin,  data.items.origin);
    setVal(DOM.itemState,   data.items.state);
  }
}

function setVal(el, value) {
  if (el && value !== undefined && value !== null) {
    el.value = value;
  }
}

/* ═══════════════════════════════════════════════════════════════
   12. READ FIELDS INTO DATA OBJECT
   ═══════════════════════════════════════════════════════════════ */
function readFields() {
  return {
    _meta: {
      exportedAt:  new Date().toISOString(),
      source:      'CosmoSorter 星图整理器 · 功能演示版',
      version:     '1.0.0',
    },
    character: {
      name:       DOM.charName      ? DOM.charName.value      : '',
      race:       DOM.charRace      ? DOM.charRace.value      : '',
      ability:    DOM.charAbility   ? DOM.charAbility.value   : '',
      backstory:  DOM.charBackstory ? DOM.charBackstory.value : '',
    },
    worldview: {
      magicSystem: DOM.worldMagic     ? DOM.worldMagic.value     : '',
      era:         DOM.worldEra       ? DOM.worldEra.value       : '',
      factions:    DOM.worldFactions  ? DOM.worldFactions.value  : '',
      cosmology:   DOM.worldCosmology ? DOM.worldCosmology.value : '',
    },
    geography: {
      name:     DOM.geoName     ? DOM.geoName.value     : '',
      location: DOM.geoLocation ? DOM.geoLocation.value : '',
      climate:  DOM.geoClimate  ? DOM.geoClimate.value  : '',
      features: DOM.geoFeatures ? DOM.geoFeatures.value : '',
      danger:   DOM.geoDanger   ? DOM.geoDanger.value   : '',
    },
    items: {
      name:    DOM.itemName    ? DOM.itemName.value    : '',
      type:    DOM.itemType    ? DOM.itemType.value    : '',
      ability: DOM.itemAbility ? DOM.itemAbility.value : '',
      origin:  DOM.itemOrigin  ? DOM.itemOrigin.value  : '',
      state:   DOM.itemState   ? DOM.itemState.value   : '',
    },
  };
}

/* ═══════════════════════════════════════════════════════════════
   13. TAB SWITCHING
   ═══════════════════════════════════════════════════════════════ */
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn[data-tab]');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });
}

function switchTab(tabId) {
  // Update buttons
  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
    const isActive = btn.dataset.tab === tabId;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });

  // Update panels
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabId}`);
  });
}

/* ═══════════════════════════════════════════════════════════════
   14. AUTO-SAVE EDITS TO LOCALSTORAGE
   ═══════════════════════════════════════════════════════════════ */
function initAutoSave() {
  // Save text input on change (debounced)
  let textSaveTimer;
  if (DOM.textInput) {
    DOM.textInput.addEventListener('input', () => {
      updateCharCount();
      clearTimeout(textSaveTimer);
      textSaveTimer = setTimeout(() => {
        localStorage.setItem(LS.TEXT_INPUT, DOM.textInput.value);
      }, 600);
    });
  }

  // Save analysis fields on change (debounced)
  const analysisFields = [
    DOM.charName, DOM.charRace, DOM.charAbility, DOM.charBackstory,
    DOM.worldMagic, DOM.worldEra, DOM.worldFactions, DOM.worldCosmology,
    DOM.geoName, DOM.geoLocation, DOM.geoClimate, DOM.geoFeatures, DOM.geoDanger,
    DOM.itemName, DOM.itemType, DOM.itemAbility, DOM.itemOrigin, DOM.itemState,
  ];

  let fieldSaveTimer;
  analysisFields.forEach(field => {
    if (!field) return;
    field.addEventListener('input', () => {
      clearTimeout(fieldSaveTimer);
      fieldSaveTimer = setTimeout(() => {
        const data = readFields();
        localStorage.setItem(LS.ANALYSIS_DATA, JSON.stringify(data));
      }, 800);
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   15. JSON EXPORT (Blob)
   ═══════════════════════════════════════════════════════════════ */
function exportJSON() {
  if (!state.hasAnalyzed) {
    showToast('请先完成分析再导出', 'error');
    return;
  }

  const data       = readFields();
  const jsonString = JSON.stringify(data, null, 2);
  const blob       = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url        = URL.createObjectURL(blob);

  // Create a temporary anchor and trigger download
  const anchor     = document.createElement('a');
  anchor.href      = url;
  anchor.download  = `cosmo-sorter-${Date.now()}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Release the object URL after a short delay
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  showToast('✅ JSON 文件已导出', 'success');
}

/* ═══════════════════════════════════════════════════════════════
   16. DOCUMENT UPLOAD
   ═══════════════════════════════════════════════════════════════ */
function initDocUpload() {
  const zone        = document.getElementById('doc-upload-zone');
  const input       = document.getElementById('doc-input');
  const placeholder = document.getElementById('doc-placeholder');
  const previewWrap = document.getElementById('doc-preview-wrap');
  const fileName    = document.getElementById('doc-file-name');
  const removeBtn   = document.getElementById('remove-doc-btn');

  if (!zone || !input) return;

  // Click zone → trigger file input (ignore clicks on the remove button)
  zone.addEventListener('click', e => {
    if (removeBtn && (e.target === removeBtn || removeBtn.contains(e.target))) return;
    input.click();
  });

  // Keyboard accessibility
  zone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      input.click();
    }
  });

  // File selected via dialog
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (file) loadDocFile(file);
  });

  // Drag & drop
  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('drag-over');
  });

  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && isValidDoc(file)) {
      loadDocFile(file);
    } else {
      showToast('请上传文档文件（TXT / MD / DOCX / PDF）', 'error');
    }
  });

  // Remove button
  if (removeBtn) {
    removeBtn.addEventListener('click', e => {
      e.stopPropagation();
      clearDoc();
    });
  }

  // ── helpers ──────────────────────────────────────────────────
  function isValidDoc(file) {
    const validTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const validExts = ['.txt', '.md', '.docx', '.pdf'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    return validTypes.includes(file.type) || validExts.includes(ext);
  }

  function loadDocFile(file) {
    state.docFile = file;
    if (fileName) fileName.textContent = file.name;
    if (placeholder) placeholder.style.display = 'none';
    if (previewWrap) previewWrap.classList.add('has-file');
  }

  function clearDoc() {
    state.docFile = null;
    input.value = '';
    if (previewWrap) previewWrap.classList.remove('has-file');
    if (placeholder) placeholder.style.display = '';
    if (fileName) fileName.textContent = '';
  }
}

/* ═══════════════════════════════════════════════════════════════
   17. AUDIO UPLOAD
   ═══════════════════════════════════════════════════════════════ */
function initAudioUpload() {
  const zone        = document.getElementById('audio-upload-zone');
  const input       = document.getElementById('audio-input');
  const placeholder = document.getElementById('audio-placeholder');
  const previewWrap = document.getElementById('audio-preview-wrap');
  const fileName    = document.getElementById('audio-file-name');
  const removeBtn   = document.getElementById('remove-audio-btn');
  const audioPlayer = document.getElementById('audio-player');

  if (!zone || !input) return;

  // Click zone → trigger file input
  // Ignore clicks on the remove button or the native audio controls
  zone.addEventListener('click', e => {
    if (removeBtn && (e.target === removeBtn || removeBtn.contains(e.target))) return;
    if (audioPlayer && (e.target === audioPlayer || audioPlayer.contains(e.target))) return;
    input.click();
  });

  // Keyboard accessibility
  zone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      input.click();
    }
  });

  // File selected via dialog
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (file) loadAudioFile(file);
  });

  // Drag & drop
  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('drag-over');
  });

  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      loadAudioFile(file);
    } else {
      showToast('请上传音频文件（MP3 / WAV / M4A）', 'error');
    }
  });

  // Remove button
  if (removeBtn) {
    removeBtn.addEventListener('click', e => {
      e.stopPropagation();
      clearAudio();
    });
  }

  // ── helpers ──────────────────────────────────────────────────
  function loadAudioFile(file) {
    // Release previous object URL to avoid memory leaks
    if (state.audioObjectUrl) {
      URL.revokeObjectURL(state.audioObjectUrl);
    }
    state.audioFile      = file;
    state.audioObjectUrl = URL.createObjectURL(file);

    if (fileName)    fileName.textContent = file.name;
    if (audioPlayer) audioPlayer.src = state.audioObjectUrl;
    if (placeholder) placeholder.style.display = 'none';
    if (previewWrap) previewWrap.classList.add('has-file');
  }

  function clearAudio() {
    if (state.audioObjectUrl) {
      URL.revokeObjectURL(state.audioObjectUrl);
      state.audioObjectUrl = null;
    }
    state.audioFile = null;
    input.value = '';

    if (audioPlayer) {
      audioPlayer.src = '';
      audioPlayer.load();
    }
    if (previewWrap) previewWrap.classList.remove('has-file');
    if (placeholder) placeholder.style.display = '';
    if (fileName)    fileName.textContent = '';
  }
}

/* ═══════════════════════════════════════════════════════════════
   18. RECLASSIFY (go back to upload, keep text)
   ═══════════════════════════════════════════════════════════════ */
function reclassify() {
  state.hasAnalyzed = false;
  state.currentData = null;
  localStorage.removeItem(LS.ANALYSIS_DATA);
  localStorage.removeItem(LS.HAS_ANALYZED);

  showUploadView();
  showToast('已返回上传页，可修改素材后重新分析', 'success');
}

/* ═══════════════════════════════════════════════════════════════
   19. UTILITY
   ═══════════════════════════════════════════════════════════════ */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/* ═══════════════════════════════════════════════════════════════
   20. INIT
   ═══════════════════════════════════════════════════════════════ */
function init() {
  // Bind analyze button
  if (DOM.analyzeBtn) {
    DOM.analyzeBtn.addEventListener('click', runMockAnalysis);
  }

  // Bind action bar buttons
  if (DOM.reclassifyBtn) {
    DOM.reclassifyBtn.addEventListener('click', reclassify);
  }

  if (DOM.exportBtn) {
    DOM.exportBtn.addEventListener('click', exportJSON);
  }

  // back-home-btn is handled by inline onclick="CosmoApp.close()"

  // Init sub-modules
  initImageUpload();
  initDocUpload();
  initAudioUpload();
  initTabs();
  initAutoSave();

  // Restore char count if text was pre-filled
  updateCharCount();
}

// Run after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}