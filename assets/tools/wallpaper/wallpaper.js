(function () {
  'use strict';
  const TEMPLATE_BASE = 'assets/tools/wallpaper/template/';
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
  const BITRATE_BY_QUALITY = { low: 2.5e6, medium: 4.5e6, high: 6.5e6 };
  const MAX_SOURCE_SECONDS = 120;
  const MAX_BITRATE = 7e6;
  const HARD_LIMIT_BITRATE = 7.6e6;
  const WARN_BITRATE = 7.6e6;
  const MAX_ENCODE_ATTEMPTS = 2;
  const YIELD_EVERY_MS = 24;
  const HEAVY_WORK_BUDGET_MS = 45;
  const MIN_TRIM = 0.2;
  const GIF_MEMORY_BUDGET = 600 * 1024 * 1024;
  const DEFAULT_PAK = 2;

  const FX_DEFAULTS = {
    blur: 0, wave: 0, waveCount: 16, waveDir: 'vertical', grain: 0, grainSize: 1, vignette: 0, brightness: 0, contrast: 0, saturation: 0,
    pixelate: 0, chroma: 0, sharpen: 0, edges: 0
  };

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
    pakNum: DEFAULT_PAK,
    busy: false,
    cancel: false,
    rafId: 0,
    lastTs: 0,
    filmToken: 0,
    resultBlob: null,
    fx: { ...FX_DEFAULTS }
  };

  const $ = (id) => document.getElementById(id);
  let el = {};

  function toast(msg) {
    if (typeof window.showToast === 'function') window.showToast(msg);
  }


  function isTimed() { return !!S.src && (S.src.kind === 'video' || S.src.kind === 'gif'); }
  function even(n) { return Math.max(2, Math.round(n / 2) * 2); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function pad2(n) { return String(n).padStart(2, '0'); }

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

  function targetBitrate(scale) {
    const { w, h } = outputSize();
    const base = BITRATE_BY_QUALITY[S.quality] * (w * h) / (1920 * 1080);
    return Math.round(Math.min(MAX_BITRATE, base) * (scale || 1));
  }

  let lastYield = 0, lastUi = 0;
  function heavyFx() {
    const f = S.fx;
    return f.blur > 0 || f.wave > 0 || f.chroma > 0 || f.pixelate > 0 || f.sharpen > 0 || f.edges > 0 || f.grain > 0;
  }

  async function yieldUI() {
    const now = performance.now();
    if (now - lastYield < (heavyFx() ? HEAVY_WORK_BUDGET_MS : YIELD_EVERY_MS)) return false;
    await new Promise(r => {
      let done = false;
      const fin = () => { if (!done) { done = true; r(); } };
      if (heavyFx()) { requestAnimationFrame(fin); setTimeout(fin, 60); }
      else setTimeout(fin, 0);
    });
    lastYield = performance.now();
    return true;
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

  function drawableSize(d) {
    return {
      w: d.videoWidth || d.naturalWidth || d.width,
      h: d.videoHeight || d.naturalHeight || d.height
    };
  }

  const scratch = {};
  function getScratch(name, w, h, readback) {
    let c = scratch[name];
    if (!c) {
      c = scratch[name] = document.createElement('canvas');
      c.getContext('2d', readback ? { willReadFrequently: true } : undefined);
    }
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    return c;
  }

  const SUPPORTS_FILTER = (() => {
    try { return 'filter' in document.createElement('canvas').getContext('2d'); } catch { return false; }
  })();

  function currentDrawable() {
    const s = S.src;
    if (!s) return null;
    if (s.kind === 'gif') return s.frameAt(s.player.time);
    return s.el;
  }

  function drawView(ctx, cw, ch, source, quality) {
    const src = source || currentDrawable();
    ctx.fillStyle = '#212121';
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
    const fx = S.fx;
    const colorFx = SUPPORTS_FILTER && (fx.brightness || fx.contrast || fx.saturation);
    if (colorFx) {
      ctx.save();
      ctx.filter = `brightness(${1 + fx.brightness / 100}) contrast(${1 + fx.contrast / 100}) saturate(${1 + fx.saturation / 100})`;
    }
    ctx.drawImage(src, dx, dy, dw, dh);
    if (colorFx) ctx.restore();
  }

  function applyBlur(src, target, w, h) {
    const r = S.fx.blur * h / 1080;
    const t = target.getContext('2d');
    t.save();
    if (SUPPORTS_FILTER) {
      const pad = r * 2;
      t.filter = `blur(${r}px)`;
      t.drawImage(src, -pad, -pad, w + pad * 2, h + pad * 2);
    } else {
      const k = 1 + r * 0.6;
      const tiny = getScratch('tiny', Math.max(2, Math.round(w / k)), Math.max(2, Math.round(h / k)));
      const tc = tiny.getContext('2d');
      tc.imageSmoothingEnabled = true; tc.imageSmoothingQuality = 'high';
      tc.drawImage(src, 0, 0, tiny.width, tiny.height);
      t.imageSmoothingEnabled = true; t.imageSmoothingQuality = 'high';
      t.drawImage(tiny, 0, 0, w, h);
    }
    t.restore();
  }

  function applyWave(src, ctx, w, h) {
    const fx = S.fx;
    const amp = fx.wave / 100;
    const F = w / fx.waveCount;
    const step = Math.max(1, Math.min(Math.round(w / 960), Math.floor(F / 6)));
    const vertical = fx.waveDir === 'vertical';
    const len = vertical ? w : h;
    const disp = (pos) => {
      const u = ((pos % F) + F) % F / F;
      return -(u - 0.5) * F * amp * 0.9 + Math.sin(u * 2 * Math.PI) * F * amp * 0.25;
    };
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';
    for (let p = 0; p < len; p += step) {
      const s = clamp(p + disp(p + step / 2), 0, len - step);
      if (vertical) ctx.drawImage(src, s, 0, step, h, p, 0, step, h);
      else ctx.drawImage(src, 0, s, w, step, 0, p, w, step);
    }
  }

  let grainPattern = null;
  function getGrainPattern(ctx) {
    if (grainPattern) return grainPattern;
    const n = 256;
    const c = document.createElement('canvas');
    c.width = c.height = n;
    const cc = c.getContext('2d');
    const img = cc.createImageData(n, n);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    cc.putImageData(img, 0, 0);
    grainPattern = ctx.createPattern(c, 'repeat');
    return grainPattern;
  }

  function applyOverlays(ctx, w, h) {
    const fx = S.fx;
    if (fx.vignette > 0) {
      const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) / 2);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(0,0,0,${(0.85 * fx.vignette / 100).toFixed(3)})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    if (fx.grain > 0) {
      const k = fx.grainSize * h / 1080;
      const rx = Math.random() * 256, ry = Math.random() * 256; // new noise every frame
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = fx.grain / 100;
      ctx.fillStyle = getGrainPattern(ctx);
      ctx.setTransform(k, 0, 0, k, rx, ry);
      ctx.fillRect(-rx / k, -ry / k, w / k + 1, h / k + 1);
      ctx.restore();
    }
  }

  function stagePixelate(src, dst, w, h) {
    const block = Math.max(2, Math.round(S.fx.pixelate * h / 1080));
    const tw = Math.ceil(w / block), th = Math.ceil(h / block);
    const tiny = getScratch('tiny', tw, th);
    const tc = tiny.getContext('2d');
    tc.imageSmoothingEnabled = true; tc.imageSmoothingQuality = 'high';
    tc.drawImage(src, 0, 0, tw, th);
    const d = dst.getContext('2d');
    d.imageSmoothingEnabled = false;
    d.drawImage(tiny, 0, 0, tw * block, th * block);
    d.imageSmoothingEnabled = true;
  }

  function stageBlur(src, dst, w, h) { applyBlur(src, dst, w, h); }

  function stageWave(src, dst, w, h) { applyWave(src, dst.getContext('2d'), w, h); }

  function stageChroma(src, dst, w, h) {
    const a = S.fx.chroma / 100 * 0.025;
    const d = dst.getContext('2d');
    const tmp = getScratch('chroma', w, h);
    const t = tmp.getContext('2d');
    d.globalCompositeOperation = 'source-over';
    d.fillStyle = '#000';
    d.fillRect(0, 0, w, h);
    d.globalCompositeOperation = 'lighter';
    d.imageSmoothingEnabled = true;
    d.imageSmoothingQuality = 'medium';
    [['#ff0000', 1 + a], ['#00ff00', 1 + a * 0.5], ['#0000ff', 1]].forEach(([col, k]) => {
      t.globalCompositeOperation = 'source-over';
      t.drawImage(src, 0, 0);
      t.globalCompositeOperation = 'multiply';
      t.fillStyle = col;
      t.fillRect(0, 0, w, h);
      d.drawImage(tmp, w / 2 * (1 - k), h / 2 * (1 - k), w * k, h * k);
    });
    d.globalCompositeOperation = 'source-over';
  }

  const buf = { img: null, lum: null };
  function readPixels(src, w, h) {
    const read = getScratch('read', w, h, true);
    const rc = read.getContext('2d');
    rc.globalCompositeOperation = 'source-over';
    rc.drawImage(src, 0, 0);
    const s = rc.getImageData(0, 0, w, h).data;
    if (!buf.img || buf.img.width !== w || buf.img.height !== h) buf.img = new ImageData(w, h);
    buf.img.data.set(s);
    return { s, out: buf.img.data };
  }

  function stageSharpen(src, dst, w, h) {
    const off = Math.max(1, Math.round(h / 540));
    const k = S.fx.sharpen / 100 * 1.2;
    const { s, out } = readPixels(src, w, h);
    const rowStep = off * w * 4, colStep = off * 4;
    for (let y = off; y < h - off; y++) {
      let i = (y * w + off) * 4;
      for (let x = off; x < w - off; x++, i += 4) {
        const up = i - rowStep, dn = i + rowStep, lf = i - colStep, rt = i + colStep;
        const r = s[i], g = s[i + 1], b = s[i + 2];
        out[i] = r + k * (4 * r - s[up] - s[dn] - s[lf] - s[rt]);
        out[i + 1] = g + k * (4 * g - s[up + 1] - s[dn + 1] - s[lf + 1] - s[rt + 1]);
        out[i + 2] = b + k * (4 * b - s[up + 2] - s[dn + 2] - s[lf + 2] - s[rt + 2]);
      }
    }
    dst.getContext('2d').putImageData(buf.img, 0, 0);
  }

  function stageEdges(src, dst, w, h) {
    const off = Math.max(1, Math.round(h / 540));
    const m = S.fx.edges / 100, im = 1 - m;
    const { s, out } = readPixels(src, w, h);
    if (!buf.lum || buf.lum.length !== w * h) buf.lum = new Uint8Array(w * h);
    const L = buf.lum;
    for (let p = 0, i = 0; p < L.length; p++, i += 4) L[p] = (s[i] * 77 + s[i + 1] * 150 + s[i + 2] * 29) >> 8;
    const gain = 1.3;
    for (let y = off; y < h - off; y++) {
      const r0 = (y - off) * w, r1 = y * w, r2 = (y + off) * w;
      for (let x = off; x < w - off; x++) {
        const l = x - off, r = x + off;
        const gx = (L[r0 + r] + 2 * L[r1 + r] + L[r2 + r]) - (L[r0 + l] + 2 * L[r1 + l] + L[r2 + l]);
        const gy = (L[r2 + l] + 2 * L[r2 + x] + L[r2 + r]) - (L[r0 + l] + 2 * L[r0 + x] + L[r0 + r]);
        const e = Math.min(255, (gx < 0 ? -gx : gx) + (gy < 0 ? -gy : gy)) * gain * m;
        const i = (r1 + x) * 4;
        out[i] = s[i] * im + e;
        out[i + 1] = s[i + 1] * im + e;
        out[i + 2] = s[i + 2] * im + e;
      }
    }
    dst.getContext('2d').putImageData(buf.img, 0, 0);
  }

  function renderFrame(ctx, w, h, source, quality) {
    const fx = S.fx;
    const stages = [];
    if (fx.pixelate > 0) stages.push(stagePixelate);
    if (fx.blur > 0) stages.push(stageBlur);
    if (fx.wave > 0) stages.push(stageWave);
    if (fx.chroma > 0) stages.push(stageChroma);
    if (fx.sharpen > 0) stages.push(stageSharpen);
    if (fx.edges > 0) stages.push(stageEdges);

    if (!stages.length) {
      drawView(ctx, w, h, source, quality);
    } else {
      let cur = getScratch('fxA', w, h);
      drawView(cur.getContext('2d'), w, h, source, quality);
      stages.forEach((stage, i) => {
        const dst = i === stages.length - 1 ? ctx.canvas : getScratch(i % 2 === 0 ? 'fxB' : 'fxA', w, h);
        stage(cur, dst, w, h);
        cur = dst;
      });
    }
    applyOverlays(ctx, w, h);
  }

  const PREVIEW_TIERS = [960, 720, 540, 400];
  const pv = { tier: 0, ema: 0, cool: 0 };

  function adaptPreview(ms) {
    if (S.busy) return;
    const heavy = S.fx && Object.keys(FX_DEFAULTS).some(k => k !== 'waveCount' && k !== 'waveDir' && k !== 'grainSize' && S.fx[k]);
    if (!heavy) {
      if (pv.tier !== 0) { pv.tier = 0; pv.ema = 0; resizePreview(); }
      return;
    }
    pv.ema = pv.ema ? pv.ema * 0.8 + ms * 0.2 : ms;
    if (pv.cool > 0) { pv.cool--; return; }
    const t = pv.tier;
    if (pv.ema > 26 && t < PREVIEW_TIERS.length - 1) {
      pv.tier++;
    } else if (t > 0) {
      const ratio = Math.pow(PREVIEW_TIERS[t - 1] / PREVIEW_TIERS[t], 2);
      if (pv.ema * ratio < 16) pv.tier--;
    }
    if (pv.tier !== t) { pv.ema = 0; pv.cool = 20; resizePreview(); }
  }

  let renderQueued = false;
  function scheduleRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => { renderQueued = false; renderPreview(); });
  }

  function resizePreview() {
    const { w, h } = outputSize();
    const pw = PREVIEW_TIERS[pv.tier];
    el.canvas.width = pw;
    el.canvas.height = Math.round(pw * h / w);
    el.stage.style.aspectRatio = w + ' / ' + h;
    renderPreview();
    updateInfo();
  }

  function renderPreview() {
    const t0 = performance.now();
    renderFrame(el.ctx, el.canvas.width, el.canvas.height);
    S.lastRenderT = S.src && S.src.player ? S.src.player.time : -1;
    adaptPreview(performance.now() - t0);
  }

  function startLoop() {
    cancelAnimationFrame(S.rafId);
    S.lastTs = 0;
    const tick = (ts) => {
      const s = S.src;
      if (s && isTimed() && !S.busy) {
        const p = s.player;
        if (s.kind === 'gif' && !p.paused && S.lastTs) p.time += (ts - S.lastTs) / 1000;
        if (!p.paused && p.time >= S.trimEnd - 0.02) p.time = S.trimStart;
        if (p.time !== S.lastRenderT) renderPreview(); // skip identical frames
        updatePlayhead();
      }
      S.lastTs = ts;
      S.rafId = requestAnimationFrame(tick);
    };
    S.rafId = requestAnimationFrame(tick);
  }

  function stopLoop() { cancelAnimationFrame(S.rafId); }

  function resetSource() {
    S.filmToken++;
    if (S.src) {
      if (S.src.player) { try { S.src.player.pause(); } catch { } }
      if (S.src.frames) S.src.frames.forEach(f => { try { f.bmp.close(); } catch { } });
      if (S.src.url) URL.revokeObjectURL(S.src.url);
    }
    S.src = null;
    S.resultBlob = null;
  }

  async function decodeGif(file) {
    if (typeof ImageDecoder === 'undefined') {
      throw new Error('This browser cannot decode GIFs (ImageDecoder is missing). Use a recent Chrome or Edge.');
    }
    const dec = new ImageDecoder({ data: await file.arrayBuffer(), type: 'image/gif' });
    try {
      await dec.tracks.ready;
      await dec.completed;
      const total = dec.tracks.selectedTrack.frameCount;
      const frames = [];
      let t = 0, truncated = false;
      for (let i = 0; i < total; i++) {
        const { image } = await dec.decode({ frameIndex: i });
        let dur = image.duration ? image.duration / 1e6 : 0.1;
        if (dur < 0.02) dur = 0.1;
        const bmp = await createImageBitmap(image);
        image.close();
        const maxFrames = Math.floor(GIF_MEMORY_BUDGET / (bmp.width * bmp.height * 4));
        frames.push({ bmp, start: t, dur });
        t += dur;
        if (i % 10 === 0) setStatus(`Decoding GIF… ${i + 1} / ${total}`);
        if (t >= MAX_SOURCE_SECONDS || frames.length >= maxFrames) { truncated = i < total - 1; break; }
      }
      return { frames, duration: t, truncated, total };
    } finally {
      dec.close();
    }
  }

  async function loadFile(file) {
    if (!file || S.busy) return;
    const isGif = file.type === 'image/gif' || /\.gif$/i.test(file.name);
    const isVideo = !isGif && (file.type.startsWith('video/') || /\.(webm|mp4|mov|mkv|m4v)$/i.test(file.name));
    const isImage = !isGif && (file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|avif)$/i.test(file.name));
    if (!isGif && !isVideo && !isImage) { setStatus('Unsupported file type. Use an image, a GIF or a video.', 'error'); return; }

    resetSource();
    el.generateBtn.disabled = true;
    setStatus('Loading…');
    const url = URL.createObjectURL(file);
    let note = '';

    try {
      if (isImage) {
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
        await img.decode();
        S.src = { kind: 'image', el: img, w: img.naturalWidth, h: img.naturalHeight, duration: 0, url, name: file.name };
      } else if (isGif) {
        const g = await decodeGif(file);
        const first = g.frames[0].bmp;
        if (g.frames.length === 1) {
          S.src = { kind: 'image', el: first, frames: g.frames, w: first.width, h: first.height, duration: 0, url, name: file.name };
        } else {
          const frames = g.frames, dur = g.duration;
          S.src = {
            kind: 'gif', el: null, frames, w: first.width, h: first.height, duration: dur, url, name: file.name,
            player: { time: 0, paused: false, play() { this.paused = false; }, pause() { this.paused = true; } },
            frameAt(t) {
              t = clamp(t, 0, dur);
              let lo = 0, hi = frames.length - 1;
              while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (frames[mid].start <= t) lo = mid; else hi = mid - 1; }
              return frames[lo].bmp;
            }
          };
          S.trimStart = 0;
          S.trimEnd = Math.min(dur, MAX_SOURCE_SECONDS);
          note = `, ${frames.length} frames`;
          if (g.truncated) note += ` (truncated from ${g.total})`;
        }
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
        S.src = {
          kind: 'video', el: v, w: v.videoWidth, h: v.videoHeight, duration: v.duration, url, name: file.name, file,
          player: {
            get time() { return v.currentTime; }, set time(x) { v.currentTime = x; },
            get paused() { return v.paused; },
            play() { v.play().catch(() => { }); }, pause() { v.pause(); }
          }
        };
        S.trimStart = 0;
        S.trimEnd = Math.min(v.duration, MAX_SOURCE_SECONDS);
      }
      if (S.src.kind === 'gif') S.src.file = file;
    } catch (e) {
      URL.revokeObjectURL(url);
      setStatus(e.message || 'Failed to load file.', 'error');
      return;
    }

    S.zoom = 1; S.cx = 0.5; S.cy = 0.5;
    syncControlsFromState();
    el.workspace.classList.add('has-source');
    el.fileLabel.textContent = file.name;
    const timed = isTimed();
    el.videoOnly.forEach(n => n.style.display = timed ? '' : 'none');
    setStatus('');
    el.generateBtn.disabled = S.busy;
    resizePreview();

    if (timed) {
      S.src.player.time = S.trimStart;
      S.src.player.play();
      updatePlayIcon();
      updateTrimUI();
      buildFilmstrip();
    }
    startLoop();
    setResult(null);
    const label = { video: 'video', gif: 'GIF', image: 'image' }[S.src.kind];
    logLine(`Loaded ${label}: ${S.src.w}×${S.src.h}` + (timed ? `, ${S.src.duration.toFixed(1)}s${note}` : ''), 'info');
  }

  function syncControlsFromState() {
    el.zoom.value = Math.round(S.zoom * 100);
    el.zoomVal.textContent = Math.round(S.zoom * 100) + '%';
    updateTrimUI();
  }

  function updateTrimUI() {
    if (!isTimed()) return;
    const d = S.src.duration;
    const a = S.trimStart / d * 100, b = S.trimEnd / d * 100;
    el.tlStart.style.left = a + '%';
    el.tlEnd.style.left = b + '%';
    el.tlRange.style.left = a + '%';
    el.tlRange.style.width = (b - a) + '%';
    el.tlDimL.style.width = a + '%';
    el.tlDimR.style.width = (100 - b) + '%';
    const len = S.trimEnd - S.trimStart;
    el.trimStartTxt.textContent = fmtTime(S.trimStart);
    el.trimEndTxt.textContent = fmtTime(S.trimEnd);
    el.trimLenTxt.textContent = len.toFixed(1) + 's';
    el.trimLabel.textContent = `of ${d.toFixed(1)}s`;
    el.tlStart.setAttribute('aria-valuemin', 0);
    el.tlStart.setAttribute('aria-valuemax', S.trimEnd.toFixed(1));
    el.tlStart.setAttribute('aria-valuenow', S.trimStart.toFixed(1));
    el.tlEnd.setAttribute('aria-valuemin', S.trimStart.toFixed(1));
    el.tlEnd.setAttribute('aria-valuemax', d.toFixed(1));
    el.tlEnd.setAttribute('aria-valuenow', S.trimEnd.toFixed(1));
  }

  function updatePlayhead() {
    if (!isTimed()) return;
    const t = S.src.player.time;
    el.tlPlayhead.style.left = clamp(t / S.src.duration * 100, 0, 100) + '%';
    el.playTime.textContent = fmtTime(t);
  }

  function setTrim(a, b, which) {
    const d = S.src.duration;
    if (which === 'start') {
      a = clamp(a, 0, Math.max(0, b - MIN_TRIM));
      if (b - a > MAX_SOURCE_SECONDS) a = b - MAX_SOURCE_SECONDS;
    } else {
      b = clamp(b, Math.min(d, a + MIN_TRIM), d);
      if (b - a > MAX_SOURCE_SECONDS) b = a + MAX_SOURCE_SECONDS;
    }
    S.trimStart = a; S.trimEnd = b;
    updateTrimUI();
    updateInfo();
  }

  function bindTimeline() {
    let mode = null;
    const timeAt = (e) => {
      const r = el.timeline.getBoundingClientRect();
      return clamp((e.clientX - r.left) / r.width, 0, 1) * S.src.duration;
    };
    const start = (m) => (e) => {
      if (!isTimed() || S.busy) return;
      e.preventDefault();
      e.stopPropagation();
      mode = m;
      el.timeline.setPointerCapture(e.pointerId);
      move(e);
    };
    const move = (e) => {
      if (!mode || !isTimed()) return;
      const t = timeAt(e), p = S.src.player;
      if (mode === 'start') { setTrim(t, S.trimEnd, 'start'); p.time = S.trimStart; }
      else if (mode === 'end') { setTrim(S.trimStart, t, 'end'); p.time = Math.max(S.trimStart, S.trimEnd - 0.15); }
      else p.time = t;
      updatePlayhead();
    };
    const end = () => { mode = null; };

    el.tlStart.addEventListener('pointerdown', start('start'));
    el.tlEnd.addEventListener('pointerdown', start('end'));
    el.timeline.addEventListener('pointerdown', start('seek'));
    el.timeline.addEventListener('pointermove', move);
    el.timeline.addEventListener('pointerup', end);
    el.timeline.addEventListener('pointercancel', end);

    const key = (which) => (e) => {
      if (!isTimed() || S.busy) return;
      const dir = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
      if (!dir) return;
      e.preventDefault();
      const step = dir * (e.shiftKey ? 1 : 0.1);
      const p = S.src.player;
      if (which === 'start') { setTrim(S.trimStart + step, S.trimEnd, 'start'); p.time = S.trimStart; }
      else { setTrim(S.trimStart, S.trimEnd + step, 'end'); p.time = Math.max(S.trimStart, S.trimEnd - 0.15); }
    };
    el.tlStart.addEventListener('keydown', key('start'));
    el.tlEnd.addEventListener('keydown', key('end'));

    el.setIn.addEventListener('click', () => {
      if (!isTimed()) return;
      const t = S.src.player.time;
      if (t < S.trimEnd - MIN_TRIM) setTrim(t, S.trimEnd, 'start');
    });
    el.setOut.addEventListener('click', () => {
      if (!isTimed()) return;
      const t = S.src.player.time;
      if (t > S.trimStart + MIN_TRIM) setTrim(S.trimStart, t, 'end');
    });
  }

  async function buildFilmstrip() {
    const token = ++S.filmToken;
    const s = S.src;
    const c = el.film, ctx = c.getContext('2d');
    ctx.fillStyle = '#1b1b1b';
    ctx.fillRect(0, 0, c.width, c.height);
    if (!s || !isTimed()) return;

    const N = 12, tw = c.width / N, th = c.height;
    const drawThumb = (img, i) => {
      const { w, h } = drawableSize(img);
      if (!w || !h) return;
      const k = Math.max(tw / w, th / h);
      const dw = w * k, dh = h * k;
      ctx.save();
      ctx.beginPath(); ctx.rect(i * tw, 0, tw, th); ctx.clip();
      ctx.drawImage(img, i * tw + (tw - dw) / 2, (th - dh) / 2, dw, dh);
      ctx.restore();
    };

    if (s.kind === 'gif') {
      for (let i = 0; i < N; i++) drawThumb(s.frameAt((i + 0.5) / N * s.duration), i);
      return;
    }

    const v = document.createElement('video');
    try {
      v.muted = true; v.preload = 'auto'; v.src = s.url;
      await new Promise((res) => { v.onloadeddata = res; v.onerror = res; });
      for (let i = 0; i < N; i++) {
        if (token !== S.filmToken) return;
        await new Promise((res) => {
          let done = false;
          const fin = () => { if (!done) { done = true; res(); } };
          v.onseeked = fin;
          setTimeout(fin, 1500);
          v.currentTime = (i + 0.5) / N * s.duration;
        });
        drawThumb(v, i);
      }
    } catch { /* thumbnails are optional */ } finally {
      v.removeAttribute('src');
      v.load();
    }
  }

  function updateInfo() {
    const { w, h } = outputSize();
    let text = `${w}×${h}`;
    if (S.src) {
      if (isTimed()) {
        const dur = Math.max(0, S.trimEnd - S.trimStart);
        const est = targetBitrate() * dur / 8;
        text += ` · ${S.fps}fps · ${dur.toFixed(1)}s · ≈ ${fmtBytes(est)}`;
      } else {
        text += ' · Image';
      }
    }
    if (pv.tier > 0) text += ` · preview ${PREVIEW_TIERS[pv.tier]}px`;
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

  let progShown = 0, progTarget = 0, progRaf = 0;
  function paintProgress() {
    el.progressBar.value = progShown;
    el.progressPct.textContent = Math.round(progShown) + '%';
  }
  function progStep() {
    progRaf = 0;
    const d = progTarget - progShown;
    if (Math.abs(d) < 0.1) { progShown = progTarget; paintProgress(); return; }
    progShown += d * 0.15;
    paintProgress();
    progRaf = requestAnimationFrame(progStep);
  }
  function setProgress(pct, instant) {
    el.progressWrap.style.display = '';
    progTarget = pct;
    if (instant) { progShown = pct; paintProgress(); return; }
    if (!progRaf) progRaf = requestAnimationFrame(progStep);
  }

  function updateGenerateBtn() {
    const b = S.busy;
    el.generateBtn.classList.toggle('is-cancel', b);
    el.genIcon.textContent = b ? 'close' : 'movie_edit';
    el.genText.textContent = b ? (S.cancel ? 'Cancelling…' : 'Cancel') : 'Generate VPK';
    el.generateBtn.disabled = b ? S.cancel : !S.src;
  }

  function setBusy(b) {
    S.busy = b;
    el.modal.classList.toggle('wp-busy', b);
    if (!b) el.progressWrap.style.display = 'none';
    updateGenerateBtn();
  }

  function setResult(blob, name) {
    S.resultBlob = blob;
    el.downloadBtn.style.display = blob ? '' : 'none';
    el.resultBox.style.display = blob ? '' : 'none';
    if (blob) {
      el.downloadBtn.dataset.name = name;
      el.resultText.textContent = `${name} · ${fmtBytes(blob.size)}`;
      el.installHint.textContent = `Put ${name} into your game language folder, like any other VPK mods.`;
    }
  }

  function updatePlayIcon() {
    if (!isTimed()) return;
    el.playIcon.textContent = S.src.player.paused ? 'play_arrow' : 'pause';
  }

  function setAspect(a) {
    S.aspect = a;
    el.aspectBtns.forEach(b => b.classList.toggle('active', b.dataset.aspect === a));
    el.customAspect.style.display = a === 'custom' ? '' : 'none';
    resizePreview();
  }

  function setZoom(z) {
    S.zoom = clamp(z, 0.5, 5);
    el.zoom.value = Math.round(S.zoom * 100);
    el.zoomVal.textContent = Math.round(S.zoom * 100) + '%';
    scheduleRender();
  }

  function bindStage() {
    let drag = null;
    const pts = new Map();
    let pinch0 = null;

    el.stage.addEventListener('pointerdown', (e) => {
      if (!S.src || S.busy) return;
      el.stage.setPointerCapture(e.pointerId);
      drag = { x: e.clientX, y: e.clientY, cx: S.cx, cy: S.cy };
      el.stage.classList.add('dragging');
      pts.set(e.pointerId, e);
    });

    el.stage.addEventListener('pointermove', (e) => {
      if (pts.has(e.pointerId)) pts.set(e.pointerId, e);
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        if (pinch0 == null) pinch0 = { d, zoom: S.zoom };
        else setZoom(pinch0.zoom * d / pinch0.d);
        return;
      }
      if (!drag || !S.src) return;
      const rect = el.stage.getBoundingClientRect();
      const cw = el.canvas.width, ch = el.canvas.height;
      const k = cw / rect.width;
      const scale = Math.max(cw / S.src.w, ch / S.src.h) * S.zoom;
      const dw = S.src.w * scale, dh = S.src.h * scale;
      S.cx = clamp(drag.cx - ((e.clientX - drag.x) * k) / dw, 0, 1);
      S.cy = clamp(drag.cy - ((e.clientY - drag.y) * k) / dh, 0, 1);
      scheduleRender();
    });

    const end = (e) => {
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch0 = null;
      if (!pts.size) { drag = null; el.stage.classList.remove('dragging'); }
    };
    el.stage.addEventListener('pointerup', end);
    el.stage.addEventListener('pointercancel', end);

    el.stage.addEventListener('wheel', (e) => {
      if (!S.src || S.busy) return;
      e.preventDefault();
      setZoom(S.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08));
    }, { passive: false });
  }

  const FX_FORMAT = {
    blur: (v) => v > 0 ? v + 'px' : 'Off',
    wave: (v) => v > 0 ? v + '%' : 'Off',
    waveCount: (v) => String(v),
    grain: (v) => v > 0 ? v + '%' : 'Off',
    grainSize: (v) => v + '×',
    vignette: (v) => v > 0 ? v + '%' : 'Off',
    brightness: (v) => v > 0 ? '+' + v : String(v),
    contrast: (v) => v > 0 ? '+' + v : String(v),
    saturation: (v) => v > 0 ? '+' + v : String(v),
    pixelate: (v) => v > 0 ? v + 'px' : 'Off',
    chroma: (v) => v > 0 ? v + '%' : 'Off',
    sharpen: (v) => v > 0 ? v + '%' : 'Off',
    edges: (v) => v > 0 ? v + '%' : 'Off'
  };

  function syncFxUi() {
    document.querySelectorAll('[data-fx]').forEach((input) => {
      const key = input.dataset.fx;
      const label = $(input.id + 'Val');
      if (label && FX_FORMAT[key]) label.textContent = FX_FORMAT[key](S.fx[key]);
    });
    document.querySelectorAll('.wp-fx-block').forEach((block) => {
      const k = block.dataset.block;
      if (k in S.fx) block.classList.toggle('is-off', !(S.fx[k] > 0));
    });
    updateFxBadge();
  }

  const FX_OPEN_KEY = 'd2pfx_wp_fx_open';

  function activeFxCount() {
    const f = S.fx;
    let n = ['blur', 'wave', 'grain', 'vignette', 'chroma', 'pixelate', 'sharpen', 'edges'].filter(k => f[k] > 0).length;
    if (f.brightness || f.contrast || f.saturation) n++;
    return n;
  }

  function updateFxBadge() {
    const n = activeFxCount();
    el.fxBadge.textContent = n;
    el.fxBadge.hidden = n === 0;
  }

  function setFxOpen(open, save) {
    el.fx.classList.toggle('is-collapsed', !open);
    el.fxToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (save) { try { localStorage.setItem(FX_OPEN_KEY, open ? '1' : '0'); } catch { } }
  }

  function initFxToggle() {
    let open = false;
    try { open = localStorage.getItem(FX_OPEN_KEY) === '1'; } catch { }
    setFxOpen(open, false);
    el.fxToggle.addEventListener('click', () => setFxOpen(el.fx.classList.contains('is-collapsed'), true));
  }

  function bindFx() {
    document.querySelectorAll('[data-fx]').forEach((input) => {
      const key = input.dataset.fx;
      const isSelect = input.tagName === 'SELECT';
      input.addEventListener(isSelect ? 'change' : 'input', () => {
        S.fx[key] = isSelect ? input.value : +input.value;
        syncFxUi();
        scheduleRender();
      });
    });
    el.fxReset.addEventListener('click', () => {
      S.fx = { ...FX_DEFAULTS };
      document.querySelectorAll('[data-fx]').forEach((input) => {
        input.value = FX_DEFAULTS[input.dataset.fx];
        if (input.tagName === 'SELECT') input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      syncFxUi();
      renderPreview();
    });
    syncFxUi();
  }

  function initPakSelect() {
    el.pak.innerHTML = '';
    for (let i = 2; i <= 99; i++) {
      const o = document.createElement('option');
      o.value = o.textContent = pad2(i);
      el.pak.appendChild(o);
    }
    el.pak.value = pad2(DEFAULT_PAK);
    if (window.MD3Select) window.MD3Select.enhance(el.pak);
    else el.pak.classList.add('md3-field');
  }

  function checkSupport() {
    if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') {
      return 'WebCodecs is not available in this browser. Use a recent Chrome, Edge, Opera or Firefox (130+).';
    }
    if (typeof Mediabunny === 'undefined') return 'Mediabunny failed to load.';
    if (typeof VPKBuilder === 'undefined') return 'vpk.js failed to load.';
    return null;
  }

  const CANCELLED = 'cancelled';
  function checkCancel() { if (S.cancel) throw new Error(CANCELLED); }

  async function encodeWebM(bitrateScale, progressBase, progressSpan, maxSeconds) {
    const MB = Mediabunny;
    const { w, h } = outputSize();
    const kind = S.src.kind;
    const timed = kind === 'video' || kind === 'gif';
    const fps = timed ? S.fps : 1;
    const bitrate = targetBitrate(bitrateScale);
    const pb = progressBase || 0, ps = progressSpan || 90;
    const prog = (frac) => setProgress(pb + frac * ps);
    lastYield = performance.now();

    const ok = await MB.canEncodeVideo(S.codec, { width: w, height: h, bitrate });
    if (!ok) throw new Error(`${S.codec.toUpperCase()} at ${w}\u00d7${h} is not supported by this browser. Try a lower resolution or the other codec.`);

    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d', { alpha: false });

    const output = new MB.Output({ format: new MB.WebMOutputFormat(), target: new MB.BufferTarget() });
    const source = new MB.CanvasSource(canvas, {
      codec: S.codec, bitrate, bitrateMode: 'constant', latencyMode: 'quality', keyFrameInterval: 2
    });
    output.addVideoTrack(source, { frameRate: fps });
    await output.start();

    const frameDur = 1 / fps;
    const dur = maxSeconds ? Math.min(S.trimEnd - S.trimStart, maxSeconds) : S.trimEnd - S.trimStart;
    let total, i = 0;

    if (kind === 'image') {
      renderFrame(ctx, w, h);
      total = 2;
      for (; i < total; i++) {
        checkCancel();
        await source.add(i, 1, { keyFrame: true });
        prog((i + 1) / total);
      }
    } else if (kind === 'gif') {
      S.src.player.pause();
      total = Math.max(1, Math.round(dur * fps));
      for (; i < total; i++) {
        checkCancel();
        renderFrame(ctx, w, h, S.src.frameAt(S.trimStart + i / fps), 'medium');
        await source.add(i * frameDur, frameDur);
        if (await yieldUI()) {
          prog((i + 1) / total);
          setStatus(`Encoding frame ${i + 1} / ${total}`);
        }
      }
    } else {
      S.src.player.pause();
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
      total = Math.max(1, Math.round(dur * fps));

      const timestamps = (function* () {
        for (let k = 0; k < total; k++) yield S.trimStart + k / fps;
      })();

      for await (const wrapped of sink.canvasesAtTimestamps(timestamps)) {
        checkCancel();
        if (wrapped) renderFrame(ctx, w, h, wrapped.canvas, 'medium');
        await source.add(i * frameDur, frameDur);
        i++;
        if (await yieldUI()) {
          prog(i / total);
          setStatus(`Encoding frame ${i} / ${total}`);
        }
      }
      total = i;
    }

    checkCancel();
    await output.finalize();
    return new Uint8Array(output.target.buffer);
  }

  async function fetchTemplate() {
    const out = [];
    for (const rel of TEMPLATE_FILES) {
      checkCancel();
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
    if (isTimed() && S.trimEnd - S.trimStart < MIN_TRIM) { setStatus('Trim range is too short.', 'error'); return; }

    S.cancel = false;
    clearLog();
    setResult(null);
    setStatus('');
    setBusy(true);
    setProgress(0, true);
    const t0 = performance.now();

    try {
      const timed = isTimed();
      const secs = timed ? S.trimEnd - S.trimStart : 0;
      const { w: ow, h: oh } = outputSize();
      if (timed && (ow * oh * S.fps > 1920 * 1080 * 30 * 1.05)) {
        logLine('Resolution/FPS above 1080p30: Panorama decode limit was only verified at 1080p30, a black screen is possible.', 'warn');
      }

      let scale = 1, webm = null;

      const PROBE_SEC = 3;
      let probeSpan = 0;
      if (timed && secs > PROBE_SEC * 1.5) {
        probeSpan = 8;
        logLine('Calibrating bitrate on a short sample…', 'info');
        const probe = await encodeWebM(1, 0, probeSpan, PROBE_SEC);
        const pReal = probe.length * 8 / PROBE_SEC;
        const pTarget = targetBitrate(1);
        const safe = HARD_LIMIT_BITRATE * 0.92;
        if (pReal > safe) {
          scale = Math.max(0.3, safe / pReal);
          logLine(`Sample: ${(pReal / 1e6).toFixed(2)} Mbit/s (target ${(pTarget / 1e6).toFixed(1)}), lowering target to ${(targetBitrate(scale) / 1e6).toFixed(1)} Mbit/s`, 'warn');
        } else {
          logLine(`Sample: ${(pReal / 1e6).toFixed(2)} Mbit/s, OK`, 'info');
        }
      }

      for (let attempt = 1; attempt <= MAX_ENCODE_ATTEMPTS; attempt++) {
        const tb = targetBitrate(scale);
        logLine(`Encoding WebM (${S.codec.toUpperCase()}, target ${(tb / 1e6).toFixed(1)} Mbit/s)` +
          (attempt > 1 ? `, attempt ${attempt}` : '') + '…', 'info');
        webm = await encodeWebM(scale, probeSpan, 90 - probeSpan);
        if (!timed) break;
        const real = webm.length * 8 / secs;
        const over = real > HARD_LIMIT_BITRATE;
        logLine(`Average bitrate: ${(real / 1e6).toFixed(2)} Mbit/s`, over ? 'warn' : 'info');
        if (!over) break;
        if (attempt === MAX_ENCODE_ATTEMPTS) {
          logLine('Bitrate is still above the safe limit, the game may show a black screen. Lower the quality, frame rate or effects (grain/sharpen/edges inflate bitrate).', 'warn');
          break;
        }
        scale *= (HARD_LIMIT_BITRATE * 0.9) / real;
        logLine('Over the Panorama limit, re-encoding with a lower target…', 'warn');
      }
      logLine(`WebM ready: ${fmtBytes(webm.length)}`, 'success');

      setProgress(92);
      setStatus('Loading panorama template…');
      logLine('Fetching panorama template…', 'info');
      const files = await fetchTemplate();
      checkCancel();

      setProgress(96);
      setStatus('Building VPK…');
      files.push({ path: WEBM_PATH_IN_VPK, data: webm });
      const vpk = VPKBuilder.build(files);

      const name = `pak${pad2(S.pakNum)}_dir.vpk`;
      const blob = new Blob([vpk], { type: 'application/octet-stream' });
      setProgress(100);
      setResult(blob, name);
      logLine(`${name} built (${fmtBytes(vpk.length)}, ${files.length} files) in ${((performance.now() - t0) / 1000).toFixed(1)}s`, 'success');
      setStatus('');
      toast('Wallpaper VPK is ready');
    } catch (e) {
      if (e && e.message === CANCELLED) {
        logLine('Cancelled', 'warn');
        setStatus('Cancelled');
      } else {
        console.error(e);
        logLine(e.message || String(e), 'error');
        setStatus(e.message || 'Failed to build wallpaper.', 'error');
      }
    } finally {
      S.cancel = false;
      setBusy(false);
      if (isTimed()) {
        S.src.player.time = S.trimStart;
        S.src.player.play();
        updatePlayIcon();
      }
    }
  }

  function download() {
    if (!S.resultBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(S.resultBlob);
    a.download = el.downloadBtn.dataset.name || `pak${pad2(DEFAULT_PAK)}_dir.vpk`;
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
    if (isTimed()) { S.src.player.pause(); updatePlayIcon(); }
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
      timeline: $('wpTimeline'), film: $('wpFilm'),
      tlStart: $('wpTlStart'), tlEnd: $('wpTlEnd'), tlRange: $('wpTlRange'),
      tlDimL: $('wpTlDimL'), tlDimR: $('wpTlDimR'), tlPlayhead: $('wpTlPlayhead'),
      trimLabel: $('wpTrimLabel'), trimStartTxt: $('wpTrimStartTxt'), trimEndTxt: $('wpTrimEndTxt'),
      trimLenTxt: $('wpTrimLenTxt'), playTime: $('wpPlayTime'),
      setIn: $('wpSetIn'), setOut: $('wpSetOut'),
      playBtn: $('wpPlay'), playIcon: $('wpPlayIcon'),
      fxReset: $('wpFxReset'), fx: $('wpFx'), fxToggle: $('wpFxToggle'), fxBadge: $('wpFxBadge'),
      videoOnly: [...document.querySelectorAll('.wp-video-only')],
      generateBtn: $('wpGenerate'), genIcon: $('wpGenIcon'), genText: $('wpGenText'), downloadBtn: $('wpDownload'),
      progressWrap: $('wpProgressWrap'), progressBar: $('wpProgressBar'), progressPct: $('wpProgressPct'),
      status: $('wpStatus'), logBody: $('wpLogBody'),
      resultBox: $('wpResult'), resultText: $('wpResultText'), installHint: $('wpInstallHint')
    };
    if (!el.modal) return;
    el.ctx = el.canvas.getContext('2d');
    el.videoOnly.forEach(n => n.style.display = 'none');

    ['wallpaperAboutLink'].forEach(id => {
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

    initPakSelect();
    el.height.addEventListener('change', () => { S.height = +el.height.value; resizePreview(); });
    el.fps.addEventListener('change', () => { S.fps = +el.fps.value; updateInfo(); });
    el.quality.addEventListener('change', () => { S.quality = el.quality.value; updateInfo(); });
    el.codec.addEventListener('change', () => { S.codec = el.codec.value; });
    el.pak.addEventListener('change', () => { S.pakNum = clamp(parseInt(el.pak.value, 10) || DEFAULT_PAK, 2, 99); });

    // trim + effects
    bindTimeline();
    bindFx();
    initFxToggle();

    el.playBtn.addEventListener('click', () => {
      if (!isTimed()) return;
      const p = S.src.player;
      if (p.paused) { if (p.time >= S.trimEnd - 0.05 || p.time < S.trimStart) p.time = S.trimStart; p.play(); } else p.pause();
      updatePlayIcon();
    });

    el.generateBtn.addEventListener('click', () => {
      if (S.busy) { S.cancel = true; updateGenerateBtn(); return; }
      generate();
    });
    el.downloadBtn.addEventListener('click', download);

    setAspect('16:9');
    setBusy(false);
    el.progressWrap.style.display = 'none';
    resizePreview();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.openWallpaperModal = open;
})();