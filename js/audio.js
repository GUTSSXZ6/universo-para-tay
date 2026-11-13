const TRACKS = {
  background: { src: 'assets/musicas/musica_sistema_solar.mp3', volume: .30 },
  terra: { src: 'assets/musicas/musica_terra.mp3', volume: .65 },
  sol: { src: 'assets/musicas/musica_sol.mp3', volume: .75 }
};

export function createAudioController({
  background = document.getElementById('background-audio'),
  chapter = document.getElementById('chapter-audio'),
  toggle = document.getElementById('music-toggle'),
  status = document.getElementById('audio-status')
} = {}) {
  let enabled = true, selected = 'background', generation = 0, frame = 0;
  const elements = [background, chapter];
  if (elements.some(el => !el)) throw new Error('Elementos de áudio ausentes.');
  for (const el of elements) { el.loop = true; el.preload = 'none'; el.volume = 0; }
  function report(message = '') {
    if (status) { status.textContent = message; status.hidden = !message; }
    if (toggle) { toggle.disabled = false; toggle.setAttribute('aria-pressed', String(enabled)); toggle.textContent = enabled ? '♪ Música ligada' : '♪ Música desligada'; }
  }
  function stopFade() { cancelAnimationFrame(frame); return ++generation; }
  function fade(target, volume, token, duration = 1800) {
    const starts = elements.map(el => el.volume), start = performance.now();
    function tick(now) {
      if (token !== generation) return;
      const t = Math.min(1, (now - start) / duration);
      elements.forEach((el, i) => { el.volume = starts[i] + ((el === target ? volume : 0) - starts[i]) * t; });
      if (t < 1) frame = requestAnimationFrame(tick);
      else elements.forEach(el => { if (el !== target) el.pause(); });
    }
    frame = requestAnimationFrame(tick);
  }
  async function apply() {
    const token = stopFade();
    if (!enabled) { fade(null, 0, token, 350); report(); return false; }
    const track = TRACKS[selected], target = selected === 'background' ? background : chapter;
    if (target.dataset.track !== selected) {
      target.pause(); target.volume = 0; target.src = track.src; target.dataset.track = selected;
    }
    try {
      await target.play();
      if (token !== generation) return false;
      fade(target, track.volume, token); report(); return true;
    } catch (error) {
      if (token !== generation) return false;
      enabled = false; elements.forEach(el => { el.pause(); el.volume = 0; });
      report('Toque em Música para tentar reproduzir novamente.');
      return false;
    }
  }
  function setEnabled(value) { enabled = Boolean(value); report(); return apply(); }
  function openChapter(id) { const next = Object.hasOwn(TRACKS, id) ? id : 'background'; if (selected === next) return; selected = next; return apply(); }
  function closeChapter() { return openChapter('background'); }
  function onToggle() { void setEnabled(!enabled); }
  function dispose() { stopFade(); elements.forEach(el => el.pause()); toggle?.removeEventListener('click', onToggle); }
  toggle?.addEventListener('click', onToggle);
  report();
  return { setEnabled, openChapter, closeChapter, dispose, get enabled() { return enabled; } };
}
