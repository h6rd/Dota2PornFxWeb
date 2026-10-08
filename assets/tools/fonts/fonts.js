(function () {
  'use strict';

  const TEMPLATE_URL = 'assets/tools/fonts/template.zip';
  const SAMPLE_DEFAULT = 'BrownЧёрный123./?!';
  const MAX_BYTES = 40 * 1024 * 1024;

  const SLOTS = {
    main: { file: 'Radiance-Light.otf', psName: 'Radiance-Light', family: 'Radiance', style: 'Light', weight: 300 },
    title: { file: 'Reaver-Regular.otf', psName: 'Reaver-Regular', family: 'Reaver', style: 'Regular', weight: 400 }
  };

  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String.fromCharCode(a + i)).join('');
  const COVERAGE = [
    ['Latin', range(65, 90) + range(97, 122)],
    ['Cyrillic', range(0x410, 0x44f) + '\u0401\u0451'],
    ['Digits', '0123456789'],
    ['Symbols', '.,:;!?-+()/%&@#*']
  ];

  const $ = (id) => document.getElementById(id);
  const state = {
    main: { file: null, buf: null, font: null, family: '' },
    title: { file: null, buf: null, font: null, family: '' }
  };
  let el = {};
  let busy = false;
  let faceSeq = 0;
  let resultBlob = null;
  let resultName = '';
  let templateCache = null;

  function log(msg, kind) {
    const row = document.createElement('div');
    row.className = 'upload-preview-log-entry' + (kind ? ' ' + kind : '');
    const ic = document.createElement('span');
    ic.className = 'material-symbols-rounded';
    ic.textContent = kind === 'error' ? 'error' : kind === 'success' ? 'check_circle' : 'chevron_right';
    const tx = document.createElement('span');
    tx.textContent = msg;
    row.append(ic, tx);
    el.log.appendChild(row);
    el.log.scrollTop = el.log.scrollHeight;
  }

  function setStatus(msg, kind) {
    el.status.textContent = msg || '';
    el.status.className = 'fc-status' + (kind ? ' ' + kind : '');
  }

  const safeName = (n) => (n || '').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 48) || 'My Font';
  const tick = () => new Promise((r) => setTimeout(r, 0));

  function sameOn() { return el.same.checked; }

  function resetResult() {
    resultBlob = null;
    el.result.style.display = 'none';
    el.download.style.display = 'none';
  }

  function updateButtons() {
    const ok = state.main.font && (sameOn() || state.title.font);
    el.generate.disabled = busy || !ok;
  }

  function coverageOf(font) {
    return COVERAGE.map(([label, chars]) => {
      let hit = 0;
      for (const ch of chars) if (font.charToGlyphIndex(ch) > 0) hit++;
      return { label, pct: Math.round((hit / chars.length) * 100) };
    });
  }

  function renderMeta(key) {
    const st = state[key];
    const box = key === 'main' ? el.metaMain : el.metaTitle;
    box.innerHTML = '';
    if (!st.font) { box.style.display = 'none'; return; }
    box.style.display = 'flex';
    const name = document.createElement('div');
    name.className = 'fc-meta-name';
    const full = st.font.names && st.font.names.fullName && st.font.names.fullName.en;
    name.textContent = (full || st.file.name) + ' · ' + st.font.numGlyphs + ' glyphs · ' + (st.file.size / 1024).toFixed(0) + ' KB';
    const chips = document.createElement('div');
    chips.className = 'fc-chips';
    coverageOf(st.font).forEach((c) => {
      const chip = document.createElement('span');
      chip.className = 'fc-chip ' + (c.pct === 100 ? 'ok' : c.pct === 0 ? 'bad' : 'warn');
      chip.textContent = c.label + ' ' + c.pct + '%';
      chips.appendChild(chip);
    });
    box.append(name, chips);
  }

  function renderPreview() {
    const text = el.sample.value || SAMPLE_DEFAULT;
    [['main', el.pvMain], ['title', el.pvTitle]].forEach(([key, card]) => {
      const src = key === 'title' && sameOn() ? state.main : state[key];
      card.querySelectorAll('.fc-pv-line').forEach((line) => {
        line.textContent = text;
        line.style.fontFamily = src.family ? '"' + src.family + '", sans-serif' : '';
      });
      card.classList.toggle('empty', !src.family);
    });
  }

  async function setFont(key, file) {
    if (!file) return;
    if (!/\.(ttf|otf|woff)$/i.test(file.name)) {
      setStatus('Only .ttf, .otf and .woff fonts are supported.', 'error');
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus('The font is too large (max ' + (MAX_BYTES / 1048576) + ' MB).', 'error');
      return;
    }
    try {
      const buf = await file.arrayBuffer();
      const font = opentype.parse(buf);
      const st = state[key];
      if (st.family) {
        document.fonts.forEach((f) => { if (f.family.replace(/"/g, '') === st.family) document.fonts.delete(f); });
      }
      let family = '';
      try {
        family = 'fc-' + key + '-' + (++faceSeq);
        const ff = new FontFace(family, buf.slice(0));
        await ff.load();
        document.fonts.add(ff);
      } catch (e) {
        family = '';
        log('Preview unavailable for ' + file.name, 'error');
      }
      Object.assign(st, { file, buf, font, family });
      const cov = coverageOf(font).find((c) => c.label === 'Cyrillic');
      log('Loaded ' + file.name + ' (' + font.numGlyphs + ' glyphs)');
      if (cov && cov.pct < 100) log(file.name + ': Cyrillic coverage is ' + cov.pct + '%, missing letters will not render in game', 'error');
      setStatus('');
      resetResult();
      renderMeta(key);
      renderPreview();
      updateButtons();
      const label = key === 'main' ? el.mainLabel : el.titleLabel;
      label.textContent = file.name;
      (key === 'main' ? el.mainField : el.titleField).classList.add('has-file');
    } catch (e) {
      setStatus('Cannot read font: ' + (e && e.message ? e.message : e), 'error');
      log('Cannot read ' + file.name + ': ' + (e && e.message ? e.message : e), 'error');
    }
  }

  function convert(buf, slot) {
    const font = opentype.parse(buf.slice(0));
    const n = font.names || (font.names = {});
    const set = (k, v) => { n[k] = { en: v }; };
    set('fontFamily', slot.family);
    set('fontSubfamily', slot.style);
    set('uniqueID', slot.psName + ';FontCreator');
    set('fullName', slot.family + ' ' + slot.style);
    set('version', 'Version 1.000');
    set('postScriptName', slot.psName);
    ['preferredFamily', 'preferredSubfamily', 'wwsFamily', 'wwsSubfamily', 'compatibleFullName', 'typographicFamily', 'typographicSubfamily']
      .forEach((k) => { delete n[k]; });
    if (font.tables && font.tables.os2) font.tables.os2.usWeightClass = slot.weight;
    const out = new Uint8Array(font.toArrayBuffer());
    const check = opentype.parse(out.buffer.slice(0));
    if (check.outlinesFormat !== 'cff') throw new Error('Output is not an OpenType (CFF) font');
    return { data: out, glyphs: check.numGlyphs };
  }

  const CRLF = (lines) => lines.join('\r\n') + '\r\n';

  const detectLines = () => [
    'set "REL=steamapps\\common\\dota 2 beta\\game\\dota\\panorama\\fonts"',
    'set "FONTS="',
    'set "STEAM="',
    'for /f "tokens=2,*" %%A in (\'reg query "HKCU\\Software\\Valve\\Steam" /v SteamPath 2^>nul ^| find "REG_SZ"\') do set "STEAM=%%B"',
    'if defined STEAM set "STEAM=%STEAM:/=\\%"',
    'if defined STEAM if exist "%STEAM%\\%REL%\\" set "FONTS=%STEAM%\\%REL%"',
    'if not defined FONTS if exist "%ProgramFiles(x86)%\\Steam\\%REL%\\" set "FONTS=%ProgramFiles(x86)%\\Steam\\%REL%"',
    'if not defined FONTS if exist "%ProgramFiles%\\Steam\\%REL%\\" set "FONTS=%ProgramFiles%\\Steam\\%REL%"',
    'if defined FONTS goto found',
    'echo Dota 2 fonts folder was not found automatically.',
    'echo Paste the full path to the panorama\\fonts folder of your Dota 2 install.',
    'set /p "FONTS=Path: "',
    'set "FONTS=%FONTS:"=%"',
    ':found',
    'if not exist "%FONTS%\\" goto missing'
  ];

  function installBat(name) {
    return CRLF([
      '@echo off',
      'setlocal EnableExtensions',
      'title ' + name + ' - install',
      ...detectLines(),
      'if exist "%~dp0assets\\default\\radiance-light.otf" goto hasbackup',
      'mkdir "%~dp0assets\\default" 2>nul',
      'xcopy /y /q "%FONTS%\\*" "%~dp0assets\\default\\" >nul',
      ':hasbackup',
      'for %%F in ("%FONTS%\\*") do if /i not "%%~nxF"=="grenze-bold.ttf" if /i not "%%~nxF"=="creepster-regular.ttf" del /q /f "%%~F"',
      'xcopy /y /q "%~dp0assets\\custom\\*" "%FONTS%\\" >nul',
      'echo.',
      'echo Done. Start Dota 2.',
      'pause',
      'exit /b 0',
      ':missing',
      'echo Fonts folder not found. Nothing was changed.',
      'pause',
      'exit /b 1'
    ]);
  }

  function uninstallBat(name) {
    return CRLF([
      '@echo off',
      'setlocal EnableExtensions',
      'title ' + name + ' - uninstall',
      ...detectLines(),
      'if not exist "%~dp0assets\\default\\radiance-light.otf" goto nobackup',
      'for %%F in ("%FONTS%\\*") do del /q /f "%%~F"',
      'xcopy /y /q "%~dp0assets\\default\\*" "%FONTS%\\" >nul',
      'echo.',
      'echo Original fonts restored.',
      'pause',
      'exit /b 0',
      ':nobackup',
      'echo No backup of the original fonts was found.',
      'echo In Steam: Dota 2 - Properties - Installed Files - Verify integrity of game files.',
      'pause',
      'exit /b 1',
      ':missing',
      'echo Fonts folder not found. Nothing was changed.',
      'pause',
      'exit /b 1'
    ]);
  }

  function guideTxt(name) {
    return CRLF([
      name,
      '',
      'INSTALL',
      '1. Unpack the archive anywhere.',
      '2. Run Install.bat. It finds your Dota 2 folder, keeps grenze-bold and creepster-regular,',
      '   removes the other fonts and copies assets\\custom into panorama\\fonts.',
      '3. Start Dota 2.',
      '',
      'If the folder is not found, type the path to:',
      '  Steam\\steamapps\\common\\dota 2 beta\\game\\dota\\panorama\\fonts',
      '',
      'REMOVE',
      'Run Uninstall.bat. It restores the original fonts from assets\\default.',
      'If assets\\default is empty, verify integrity of game files in Steam.',
      '',
      'Radiance-Light.otf replaces the interface font, Reaver-Regular.otf replaces the title font.'
    ]);
  }

  async function loadTemplate() {
    if (templateCache) return templateCache;
    try {
      const r = await fetch(TEMPLATE_URL, { cache: 'no-cache' });
      if (!r.ok) throw new Error(r.status);
      const files = fflate.unzipSync(new Uint8Array(await r.arrayBuffer()));
      const names = Object.keys(files).filter((n) => !n.endsWith('/'));
      const first = names.length ? names[0].split('/')[0] : '';
      const wrapped = names.length && first !== 'assets' && names.every((n) => n.startsWith(first + '/'));
      const out = {};
      names.forEach((n) => { out[wrapped ? n.slice(first.length + 1) : n] = files[n]; });
      templateCache = out;
      return out;
    } catch (e) {
      return null;
    }
  }

  async function generate() {
    if (busy) return;
    const main = state.main;
    const title = sameOn() ? state.main : state.title;
    if (!main.font || !title.font) return;
    busy = true;
    resetResult();
    updateButtons();
    el.log.innerHTML = '';
    const name = safeName(el.name.value);
    try {
      setStatus('Working…');
      log('Loading template');
      let files = await loadTemplate();
      const enc = new TextEncoder();
      if (!files) {
        log('Template not found at ' + TEMPLATE_URL + ', original fonts will not be bundled', 'error');
        files = {};
      }
      const out = { ...files };
      await tick();

      log('Converting ' + main.file.name + ' → ' + SLOTS.main.file);
      const a = convert(main.buf, SLOTS.main);
      out['assets/custom/' + SLOTS.main.file] = a.data;
      log(SLOTS.main.file + ': ' + a.glyphs + ' glyphs, ' + (a.data.length / 1024).toFixed(0) + ' KB');
      await tick();

      log('Converting ' + title.file.name + ' → ' + SLOTS.title.file);
      const b = convert(title.buf, SLOTS.title);
      out['assets/custom/' + SLOTS.title.file] = b.data;
      log(SLOTS.title.file + ': ' + b.glyphs + ' glyphs, ' + (b.data.length / 1024).toFixed(0) + ' KB');
      await tick();

      if (!out['Install.bat']) out['Install.bat'] = enc.encode(installBat(name));
      if (!out['Uninstall.bat']) out['Uninstall.bat'] = enc.encode(uninstallBat(name));
      if (!out['guide.txt']) out['guide.txt'] = enc.encode(guideTxt(name));

      log('Packing archive');
      const tree = {};
      Object.keys(out).sort().forEach((k) => { tree[name + '/' + k] = out[k]; });
      resultBlob = new Blob([fflate.zipSync(tree, { level: 6 })], { type: 'application/zip' });
      resultName = name + '.zip';
      el.resultText.textContent = resultName + ' (' + (resultBlob.size / 1024).toFixed(0) + ' KB)';
      el.result.style.display = 'flex';
      el.download.style.display = 'inline-flex';
      setStatus('Done.', 'success');
      log('Archive ready', 'success');
    } catch (e) {
      setStatus('Failed: ' + (e && e.message ? e.message : e), 'error');
      log(e && e.message ? e.message : String(e), 'error');
    } finally {
      busy = false;
      updateButtons();
    }
  }

  function download() {
    if (!resultBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(resultBlob);
    a.download = resultName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  function open() {
    el.overlay.classList.add('active');
    el.modal.classList.add('active');
    if (typeof window.openModal === 'function') window.openModal();
    else document.body.classList.add('modal-open');
    renderPreview();
  }

  function close() {
    if (busy && !confirm('Archive is being created. Close anyway?')) return;
    el.overlay.classList.remove('active');
    el.modal.classList.remove('active');
    if (typeof window.closeModal === 'function') window.closeModal();
    else document.body.classList.remove('modal-open');
  }

  function init() {
    el = {
      overlay: $('fontOverlay'), modal: $('fontModal'), closeBtn: $('closeFontModal'),
      mainFile: $('fnMainFile'), mainLabel: $('fnMainLabel'), mainField: $('fnMainField'), metaMain: $('fnMainMeta'),
      titleFile: $('fnTitleFile'), titleLabel: $('fnTitleLabel'), titleField: $('fnTitleField'), metaTitle: $('fnTitleMeta'),
      titleGroup: $('fnTitleGroup'), same: $('fnSame'),
      name: $('fnName'), sample: $('fnSample'),
      pvMain: $('fnPvMain'), pvTitle: $('fnPvTitle'),
      status: $('fnStatus'), generate: $('fnGenerate'),
      result: $('fnResult'), resultText: $('fnResultText'), download: $('fnDownload'), log: $('fnLog')
    };
    if (!el.modal) return;

    el.closeBtn.addEventListener('click', close);
    el.overlay.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && el.modal.classList.contains('active')) close();
    });

    el.mainFile.addEventListener('change', () => { setFont('main', el.mainFile.files[0]); el.mainFile.value = ''; });
    el.titleFile.addEventListener('change', () => { setFont('title', el.titleFile.files[0]); el.titleFile.value = ''; });

    function applySame() {
      const on = sameOn();
      el.titleGroup.classList.toggle('fc-disabled', on);
      if (on) el.titleGroup.setAttribute('inert', ''); else el.titleGroup.removeAttribute('inert');
    }

    el.same.addEventListener('change', () => {
      applySame();
      resetResult();
      renderPreview();
      updateButtons();
    });
    el.sample.addEventListener('input', renderPreview);
    el.name.addEventListener('input', resetResult);
    el.generate.addEventListener('click', generate);
    el.download.addEventListener('click', download);

    el.sample.value = SAMPLE_DEFAULT;
    applySame();
    renderPreview();
    updateButtons();

    window.openFontModal = open;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();