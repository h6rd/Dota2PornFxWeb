(function () {
  'use strict';
  const TEMPLATE_BASE = 'assets/wallpaper/template/';
  const TEMPLATE_FILES = [
    'panorama/styles/dashboard_background_manager.vcss_c',
    'panorama/styles/hero_loadout_background_images.vcss_c',
    'panorama/styles/dashboard_background_last_match.vcss_c',
    'panorama/layout/dashboard.vxml_c',
    'panorama/layout/dashboard_page_home.vxml_c',
    'panorama/layout/dashboard_background_manager.vxml_c',
    'panorama/layout/hero_loadout_background_images.vxml_c',
    'panorama/layout/dashboard_background_last_match.vxml_c'
  ];
  const WEBM_PATH_IN_VPK = 'zxc/zxc.webm';

  const ASPECTS = { '16:9': [16, 9], '16:10': [16, 10], '21:9': [21, 9], '4:3': [4, 3] };
  const BITRATE_BY_QUALITY = { low: 2.5e6, medium: 5e6, high: 8e6, max: 14e6 };
  const MAX_SOURCE_SECONDS = 120;

  const S = {
    src: null,
    aspect: '16:9',
    customW: 16, customH: 9,
    height: 1080,
    fps: 30,
    quality: 'medium',
    codec: 'vp8',
    zoom: 1, cx: 0.5, cy: 0.5,
    trimStart: 0, trimEnd: 0,
    pakNum: 99,
    busy: false,
    cancel: false,
    rafId: 0,
    resultBlob: null
  };

  const $ = (id) => document.getElementById(id);
  let el = {};

  function toast(msg) {
    if (typeof window.showToast === 'function') window.showToast(msg);
  }

  function aspectRatio() {
    if (S.aspect === 'custom') {
      const w = Math.max(1, +S.customW || 16), h = Math.max(1, +S.customH || 9);
      return w / h;
    }
    const [w, h] = ASPECTS[S.aspect];
    return w / h;
  }

  function outputSize() {
    const h = even(S.height);
    const w = even(Math.round(S.height * aspectRatio()));
    return { w, h };
  }

  function even(n) { return Math.max(2, Math.round(n / 2) * 2); }

  function targetBitrate() {
    const { w, h } = outputSize();
    return Math.round(BITRATE_BY_QUALITY[S.quality] * (w * h) / (1920 * 1080));
  }

  function fmtBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1024 / 1024).toFixed(1) + ' MB';
  }

  function fmtTime(s) {
    s = Math.max(0, s);
    const m = Math.floor(s / 60);
    return m + ':' + (s % 60).toFixed(1).padStart(4, '0');
  }

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function gameFolder() {
    try {
      const st = JSON.parse(localStorage.getItem('d2pfx_settings') || '{}');
      const lang = (!st.gameLang || st.gameLang === 'default') ? 'english' : st.gameLang;
      return lang === 'english' ? 'dota_123' : 'dota_' + lang;
    } catch { return 'dota_123'; }
  }

  function drawableSize(d) {
    return {
      w: d.videoWidth || d.naturalWidth || d.width,
      h: d.videoHeight || d.naturalHeight || d.height
    };
  }

  function drawView(ctx, cw, ch, source, quality) {
    const src = source || (S.src && S.src.el);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cw, ch);
    if (!src || !S.src) return;
    const { w: sw, h: sh } = drawableSize(src);
    if (!sw || !sh) return;
    const scale = Math.max(cw / sw, ch / sh) * S.zoom;
    const dw = sw * scale, dh = sh * scale;
    const dx = cw / 2 - S.cx * dw;
    const dy = ch / 2 - S.cy * dh;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = quality || 'high';
    ctx.drawImage(src, dx, dy, dw, dh);
  }

  function resizePreview() {
    const { w, h } = outputSize();
    const pw = 960;
    el.canvas.width = pw;
    el.canvas.height = Math.round(pw * h / w);
    el.stage.style.aspectRatio = w + ' / ' + h;
    renderPreview();
    updateInfo();
  }

  function renderPreview() {
    drawView(el.ctx, el.canvas.width, el.canvas.height);
  }

  function startLoop() {
    cancelAnimationFrame(S.rafId);
    const tick = () => {
      if (S.src && S.src.kind === 'video' && !S.busy) {
        const v = S.src.el;
        if (!v.paused && v.currentTime >= S.trimEnd - 0.02) v.currentTime = S.trimStart;
      }
      if (S.src && S.src.kind === 'video' && !S.busy) renderPreview();
      S.rafId = requestAnimationFrame(tick);
    };
    S.rafId = requestAnimationFrame(tick);
  }

  function stopLoop() { cancelAnimationFrame(S.rafId); }

  function resetSource() {
    if (S.src) {
      if (S.src.kind === 'video') { try { S.src.el.pause(); } catch { } }
      URL.revokeObjectURL(S.src.url);
    }
    S.src = null;
    S.resultBlob = null;
  }

  async function loadFile(file) {
    if (!file) return;
    const isVideo = file.type.startsWith('video/') || /\.(webm|mp4|mov|mkv|m4v)$/i.test(file.name);
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(file.name);
    if (!isVideo && !isImage) { setStatus('Unsupported file type. Use an image or a video.', 'error'); return; }

    resetSource();
    el.generateBtn.disabled = true;
    setStatus('Loading…');
    const url = URL.createObjectURL(file);

    try {
      if (isImage) {
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
        await img.decode();
        S.src = { kind: 'image', el: img, w: img.naturalWidth, h: img.naturalHeight, duration: 0, url, name: file.name };
      } else {
        const v = document.createElement('video');
        v.muted = true; v.loop = false; v.playsInline = true; v.preload = 'auto';
        v.crossOrigin = 'anonymous';
        v.src = url;
        await new Promise((res, rej) => {
          v.onloadeddata = res;
          v.onerror = () => rej(new Error('This browser cannot decode that video.'));
        });
        if (!isFinite(v.duration) || !v.videoWidth) throw new Error('Could not read video metadata.');
        S.src = { kind: 'video', el: v, w: v.videoWidth, h: v.videoHeight, duration: v.duration, url, name: file.name, file };
        S.trimStart = 0;
        S.trimEnd = Math.min(v.duration, MAX_SOURCE_SECONDS);
      }
    } catch (e) {
      URL.revokeObjectURL(url);
      setStatus(e.message || 'Failed to load file.', 'error');
      return;
    }

    S.zoom = 1; S.cx = 0.5; S.cy = 0.5;
    syncControlsFromState();
    el.workspace.classList.add('has-source');
    el.fileLabel.textContent = file.name;
    el.videoOnly.forEach(n => n.style.display = S.src.kind === 'video' ? '' : 'none');
    el.imageOnly.forEach(n => n.style.display = S.src.kind === 'image' ? '' : 'none');
    setStatus('');
    el.generateBtn.disabled = S.busy;
    resizePreview();

    if (S.src.kind === 'video') {
      S.src.el.currentTime = S.trimStart;
      S.src.el.play().catch(() => { });
      updatePlayIcon();
    }
    startLoop();
    setResult(null);
    logLine(`Loaded ${S.src.kind}: ${S.src.w}×${S.src.h}` + (S.src.kind === 'video' ? `, ${S.src.duration.toFixed(1)}s` : ''), 'info');
  }

  function syncControlsFromState() {
    el.zoom.value = Math.round(S.zoom * 100);
    el.zoomVal.textContent = Math.round(S.zoom * 100) + '%';
    if (S.src && S.src.kind === 'video') {
      const d = S.src.duration;
      el.trimStartRange.max = el.trimEndRange.max = d;
      el.trimStartRange.step = el.trimEndRange.step = 0.1;
      el.trimStartRange.value = S.trimStart;
      el.trimEndRange.value = S.trimEnd;
      el.trimLabel.textContent = `${fmtTime(S.trimStart)} – ${fmtTime(S.trimEnd)}  (${(S.trimEnd - S.trimStart).toFixed(1)}s)`;
    }
  }

  function updateInfo() {
    const { w, h } = outputSize();
    let text = `${w}×${h}`;
    if (S.src) {
      if (S.src.kind === 'video') {
        const dur = Math.max(0, S.trimEnd - S.trimStart);
        const est = targetBitrate() * dur / 8;
        text += ` · ${S.fps} fps · ${dur.toFixed(1)}s · ≈ ${fmtBytes(est)} (upper bound)`;
      } else {
        text += ' · still image (2-frame WebM)';
      }
    }
    el.info.textContent = text;
  }

  function setStatus(msg, kind) {
    el.status.textContent = msg || '';
    el.status.className = 'upload-status wp-status' + (kind ? ' upload-status-' + kind : '');
  }

  function logLine(msg, kind) {
    const row = document.createElement('div');
    row.className = 'upload-preview-log-entry ' + (kind || '');
    row.innerHTML = '<span class="material-symbols-rounded">' +
      ({ info: 'info', success: 'check_circle', error: 'error', warn: 'warning' }[kind] || 'chevron_right') +
      '</span><span></span>';
    row.lastChild.textContent = msg;
    el.logBody.appendChild(row);
    el.logBody.scrollTop = el.logBody.scrollHeight;
  }

  function clearLog() { el.logBody.innerHTML = ''; }

  function setProgress(pct) {
    el.progressWrap.style.display = '';
    el.progressBar.value = pct;
    el.progressPct.textContent = Math.round(pct) + '%';
  }

  function setBusy(b) {
    S.busy = b;
    el.generateBtn.disabled = b || !S.src;
    el.cancelBtn.style.display = b ? '' : 'none';
    el.modal.classList.toggle('wp-busy', b);
    if (!b) el.progressWrap.style.display = 'none';
  }

  function setResult(blob, name) {
    S.resultBlob = blob;
    el.downloadBtn.style.display = blob ? '' : 'none';
    el.resultBox.style.display = blob ? '' : 'none';
    if (blob) {
      el.downloadBtn.dataset.name = name;
      el.resultText.textContent = `${name} · ${fmtBytes(blob.size)}`;
      el.installHint.textContent = `Put ${name} into your game language folder (e.g. …\\dota 2 beta\\game\\${gameFolder()}\\), like any other VPK mod.`;
    }
  }

  function updatePlayIcon() {
    if (!S.src || S.src.kind !== 'video') return;
    el.playIcon.textContent = S.src.el.paused ? 'play_arrow' : 'pause';
  }

  function setAspect(a) {
    S.aspect = a;
    el.aspectBtns.forEach(b => b.classList.toggle('active', b.dataset.aspect === a));
    el.customAspect.style.display = a === 'custom' ? '' : 'none';
    resizePreview();
  }

  function bindStage() {
    let drag = null;

    el.stage.addEventListener('pointerdown', (e) => {
      if (!S.src || S.busy) return;
      el.stage.setPointerCapture(e.pointerId);
      drag = { x: e.clientX, y: e.clientY, cx: S.cx, cy: S.cy };
      el.stage.classList.add('dragging');
    });

    el.stage.addEventListener('pointermove', (e) => {
      if (!drag || !S.src || pts.size > 1) return;
      const rect = el.stage.getBoundingClientRect();
      const cw = el.canvas.width, ch = el.canvas.height;
      const k = cw / rect.width;
      const scale = Math.max(cw / S.src.w, ch / S.src.h) * S.zoom;
      const dw = S.src.w * scale, dh = S.src.h * scale;
      S.cx = clamp(drag.cx - ((e.clientX - drag.x) * k) / dw, 0, 1);
      S.cy = clamp(drag.cy - ((e.clientY - drag.y) * k) / dh, 0, 1);
      renderPreview();
    });

    const end = () => { drag = null; el.stage.classList.remove('dragging'); };
    el.stage.addEventListener('pointerup', end);
    el.stage.addEventListener('pointercancel', end);

    el.stage.addEventListener('wheel', (e) => {
      if (!S.src || S.busy) return;
      e.preventDefault();
      setZoom(S.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08));
    }, { passive: false });

    const pts = new Map();
    let pinch0 = null;
    el.stage.addEventListener('pointerdown', (e) => { pts.set(e.pointerId, e); });
    el.stage.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, e);
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        if (pinch0 == null) pinch0 = { d, zoom: S.zoom };
        else setZoom(pinch0.zoom * d / pinch0.d);
      }
    });
    const up = (e) => { pts.delete(e.pointerId); if (pts.size < 2) pinch0 = null; };
    el.stage.addEventListener('pointerup', up);
    el.stage.addEventListener('pointercancel', up);
  }

  function setZoom(z) {
    S.zoom = clamp(z, 0.5, 5);
    el.zoom.value = Math.round(S.zoom * 100);
    el.zoomVal.textContent = Math.round(S.zoom * 100) + '%';
    renderPreview();
  }

  function checkSupport() {
    if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') {
      return 'WebCodecs is not available in this browser. Use a recent Chrome, Edge, Opera or Firefox (130+).';
    }
    if (typeof WebMMuxer === 'undefined') return 'webm-muxer failed to load.';
    if (typeof MediaBunnyLite === 'undefined') return 'Video decoder library failed to load.';
    if (typeof VPKBuilder === 'undefined') return 'vpk.js failed to load.';
    return null;
  }

  function codecString() {
    return S.codec === 'vp9' ? 'vp09.00.10.08' : 'vp8';
  }

  async function encodeWebM() {
    const { w, h } = outputSize();
    const isVideo = S.src.kind === 'video';
    const fps = isVideo ? S.fps : 1;
    const bitrate = targetBitrate();

    const cfg = {
      codec: codecString(), width: w, height: h, bitrate, framerate: fps,
      bitrateMode: 'variable', latencyMode: 'quality'
    };
    const sup = await VideoEncoder.isConfigSupported(cfg);
    if (!sup.supported) throw new Error(`${S.codec.toUpperCase()} at ${w}×${h} is not supported by this browser. Try a lower resolution or the other codec.`);

    const target = new WebMMuxer.ArrayBufferTarget();
    const muxer = new WebMMuxer.Muxer({
      target,
      video: { codec: S.codec === 'vp9' ? 'V_VP9' : 'V_VP8', width: w, height: h, frameRate: fps },
      firstTimestampBehavior: 'offset'
    });

    let encError = null;
    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => { encError = e; }
    });
    encoder.configure(cfg);

    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d', { alpha: false });

    const frameDur = 1e6 / fps;
    let total, i = 0;

    const pushFrame = async (idx, key) => {
      if (encError) throw encError;
      while (encoder.encodeQueueSize > 6) await new Promise(r => setTimeout(r, 4));
      const vf = new VideoFrame(canvas, { timestamp: Math.round(idx * frameDur), duration: Math.round(frameDur) });
      encoder.encode(vf, { keyFrame: key });
      vf.close();
    };

    if (!isVideo) {
      drawView(ctx, w, h);
      total = 2;
      for (; i < total; i++) {
        await pushFrame(i, true);
        setProgress(((i + 1) / total) * 90);
      }
    } else {
      S.src.el.pause();
      const MB = MediaBunnyLite;
      const input = new MB.Input({
        source: new MB.BlobSource(S.src.file),
        formats: [MB.MP4, MB.MATROSKA, MB.WEBM, MB.QTFF]
      });
      const track = await input.getPrimaryVideoTrack();
      if (!track) throw new Error('No video track found in this file.');
      if (!(await track.canDecode())) {
        throw new Error('This browser cannot decode the video codec for export. Try a WebM (VP8/VP9) or MP4 (H.264) file.');
      }
      const sink = new MB.CanvasSink(track);
      const dur = S.trimEnd - S.trimStart;
      total = Math.max(1, Math.round(dur * fps));
      const keyEvery = fps * 2;

      const timestamps = (function* () {
        for (let k = 0; k < total; k++) yield S.trimStart + k / fps;
      })();

      for await (const wrapped of sink.canvasesAtTimestamps(timestamps)) {
        if (S.cancel) throw new Error('cancelled');
        if (wrapped) drawView(ctx, w, h, wrapped.canvas, 'medium');
        await pushFrame(i, i % keyEvery === 0);
        i++;
        if (i % 3 === 0) {
          setProgress((i / total) * 90);
          setStatus(`Encoding frame ${i} / ${total}`);
          await new Promise(r => setTimeout(r, 0));
        }
      }
      total = i;
    }

    await encoder.flush();
    if (encError) throw encError;
    encoder.close();
    muxer.finalize();
    return new Uint8Array(target.buffer);
  }

  async function fetchTemplate() {
    const out = [];
    for (const rel of TEMPLATE_FILES) {
      const res = await fetch(TEMPLATE_BASE + rel, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`Template file missing: ${TEMPLATE_BASE}${rel} (HTTP ${res.status})`);
      out.push({ path: rel, data: new Uint8Array(await res.arrayBuffer()) });
    }
    return out;
  }

  async function generate() {
    if (!S.src || S.busy) return;
    const unsupported = checkSupport();
    if (unsupported) { setStatus(unsupported, 'error'); logLine(unsupported, 'error'); return; }
    if (S.src.kind === 'video' && S.trimEnd - S.trimStart < 0.2) { setStatus('Trim range is too short.', 'error'); return; }

    S.cancel = false;
    clearLog();
    setResult(null);
    setStatus('');
    setBusy(true);
    setProgress(0);
    const t0 = performance.now();

    try {
      logLine('Encoding WebM (' + S.codec.toUpperCase() + ')…', 'info');
      const webm = await encodeWebM();
      logLine(`WebM ready: ${fmtBytes(webm.length)}`, 'success');

      setProgress(92);
      setStatus('Loading panorama template…');
      logLine('Fetching panorama template…', 'info');
      const files = await fetchTemplate();

      setProgress(96);
      setStatus('Building VPK…');
      files.push({ path: WEBM_PATH_IN_VPK, data: webm });
      const vpk = VPKBuilder.build(files);

      const name = `pak${String(S.pakNum).padStart(2, '0')}_dir.vpk`;
      const blob = new Blob([vpk], { type: 'application/octet-stream' });
      setProgress(100);
      setResult(blob, name);
      logLine(`${name} built (${fmtBytes(vpk.length)}, ${files.length} files) in ${((performance.now() - t0) / 1000).toFixed(1)}s`, 'success');
      setStatus('');
      toast('Wallpaper VPK is ready');
    } catch (e) {
      if (e && e.message === 'cancelled') {
        logLine('Cancelled', 'warn');
        setStatus('Cancelled');
      } else {
        console.error(e);
        logLine(e.message || String(e), 'error');
        setStatus(e.message || 'Failed to build wallpaper.', 'error');
      }
    } finally {
      setBusy(false);
      if (S.src && S.src.kind === 'video') {
        S.src.el.currentTime = S.trimStart;
        S.src.el.play().catch(() => { });
        updatePlayIcon();
      }
    }
  }

  function download() {
    if (!S.resultBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(S.resultBlob);
    a.download = el.downloadBtn.dataset.name || 'pak99_dir.vpk';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  function open() {
    el.overlay.classList.add('active');
    el.modal.classList.add('active');
    if (typeof window.openModal === 'function') window.openModal();
    else document.body.classList.add('modal-open');
    if (S.src) startLoop();
    const unsupported = checkSupport();
    if (unsupported) setStatus(unsupported, 'error');
  }

  function close() {
    if (S.busy && !confirm('Generation is in progress. Cancel it and close?')) return;
    S.cancel = true;
    el.overlay.classList.remove('active');
    el.modal.classList.remove('active');
    if (typeof window.closeModal === 'function') window.closeModal();
    else document.body.classList.remove('modal-open');
    if (S.src && S.src.kind === 'video') S.src.el.pause();
    stopLoop();
  }

  function init() {
    el = {
      overlay: $('wallpaperOverlay'), modal: $('wallpaperModal'), closeBtn: $('closeWallpaperModal'),
      workspace: $('wpWorkspace'),
      file: $('wpFile'), fileLabel: $('wpFileLabel'), dropzone: $('wpDrop'),
      stage: $('wpStage'), canvas: $('wpCanvas'),
      info: $('wpInfo'),
      aspectBtns: [...document.querySelectorAll('#wpAspect [data-aspect]')],
      customAspect: $('wpCustomAspect'), customW: $('wpCustomW'), customH: $('wpCustomH'),
      zoom: $('wpZoom'), zoomVal: $('wpZoomVal'), resetBtn: $('wpReset'),
      height: $('wpHeight'), fps: $('wpFps'), quality: $('wpQuality'), codec: $('wpCodec'), pak: $('wpPak'),
      trimStartRange: $('wpTrimStart'), trimEndRange: $('wpTrimEnd'), trimLabel: $('wpTrimLabel'),
      playBtn: $('wpPlay'), playIcon: $('wpPlayIcon'),
      videoOnly: [...document.querySelectorAll('.wp-video-only')],
      imageOnly: [...document.querySelectorAll('.wp-image-only')],
      generateBtn: $('wpGenerate'), cancelBtn: $('wpCancel'), downloadBtn: $('wpDownload'),
      progressWrap: $('wpProgressWrap'), progressBar: $('wpProgressBar'), progressPct: $('wpProgressPct'),
      status: $('wpStatus'), logBody: $('wpLogBody'),
      resultBox: $('wpResult'), resultText: $('wpResultText'), installHint: $('wpInstallHint')
    };
    if (!el.modal) return;
    el.ctx = el.canvas.getContext('2d');
    el.videoOnly.forEach(n => n.style.display = 'none');
    el.imageOnly.forEach(n => n.style.display = 'none');

    ['wallpaperButton', 'mobileWallpaperButton', 'wallpaperAboutLink'].forEach(id => {
      const b = $(id);
      if (!b) return;
      b.addEventListener('click', (e) => {
        e.preventDefault();
        if (id === 'mobileWallpaperButton') $('mobileMenu')?.classList.remove('active');
        if (id === 'wallpaperAboutLink') $('closeModal')?.click();
        setTimeout(open, id === 'wallpaperAboutLink' ? 150 : 0);
      });
    });
    el.closeBtn.addEventListener('click', close);
    el.overlay.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && el.modal.classList.contains('active')) close();
    });

    el.file.addEventListener('change', () => { loadFile(el.file.files[0]); el.file.value = ''; });
    ['dragenter', 'dragover'].forEach(ev => el.dropzone.addEventListener(ev, (e) => { e.preventDefault(); el.dropzone.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => el.dropzone.addEventListener(ev, (e) => { e.preventDefault(); el.dropzone.classList.remove('over'); }));
    el.dropzone.addEventListener('drop', (e) => loadFile(e.dataTransfer.files[0]));

    // aspect
    el.aspectBtns.forEach(b => b.addEventListener('click', () => setAspect(b.dataset.aspect)));
    const onCustom = () => { S.customW = +el.customW.value || 16; S.customH = +el.customH.value || 9; resizePreview(); };
    el.customW.addEventListener('input', onCustom);
    el.customH.addEventListener('input', onCustom);

    // crop
    bindStage();
    el.zoom.addEventListener('input', () => setZoom(el.zoom.value / 100));
    el.resetBtn.addEventListener('click', () => { S.zoom = 1; S.cx = 0.5; S.cy = 0.5; syncControlsFromState(); renderPreview(); });

    // output settings
    el.height.addEventListener('change', () => { S.height = +el.height.value; resizePreview(); });
    el.fps.addEventListener('change', () => { S.fps = +el.fps.value; updateInfo(); });
    el.quality.addEventListener('change', () => { S.quality = el.quality.value; updateInfo(); });
    el.codec.addEventListener('change', () => { S.codec = el.codec.value; });
    el.pak.addEventListener('input', () => { S.pakNum = clamp(parseInt(el.pak.value, 10) || 99, 2, 99); });
    el.pak.addEventListener('blur', () => { el.pak.value = S.pakNum; });

    // trim
    const onTrim = (which) => {
      let a = +el.trimStartRange.value, b = +el.trimEndRange.value;
      if (which === 'start' && a > b - 0.2) a = Math.max(0, b - 0.2);
      if (which === 'end' && b < a + 0.2) b = Math.min(S.src.duration, a + 0.2);
      if (b - a > MAX_SOURCE_SECONDS) { if (which === 'start') a = b - MAX_SOURCE_SECONDS; else b = a + MAX_SOURCE_SECONDS; }
      S.trimStart = a; S.trimEnd = b;
      syncControlsFromState();
      updateInfo();
      if (S.src && !S.busy) S.src.el.currentTime = which === 'end' ? Math.max(a, b - 0.1) : a;
    };
    el.trimStartRange.addEventListener('input', () => onTrim('start'));
    el.trimEndRange.addEventListener('input', () => onTrim('end'));

    el.playBtn.addEventListener('click', () => {
      if (!S.src || S.src.kind !== 'video') return;
      const v = S.src.el;
      if (v.paused) { if (v.currentTime >= S.trimEnd - 0.05) v.currentTime = S.trimStart; v.play(); } else v.pause();
      updatePlayIcon();
    });

    el.generateBtn.addEventListener('click', generate);
    el.cancelBtn.addEventListener('click', () => { S.cancel = true; });
    el.downloadBtn.addEventListener('click', download);

    setAspect('16:9');
    setBusy(false);
    el.progressWrap.style.display = 'none';
    el.generateBtn.disabled = true;
    resizePreview();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.openWallpaperModal = open;
})();
