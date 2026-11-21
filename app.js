const viewer = document.getElementById('viewer');
document.getElementById('close').onclick = () => viewer.close();
viewer.onclick = (event) => { if (event.target === viewer) viewer.close(); };
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load ' + src));
    image.src = src;
  });
}

window.VIS_DATA.forEach((video) => {
  let frame = video.frames[0];
  let layers = video.layers.slice(0, 4);
  let revision = 0;
  let figureUrl;
  const section = document.createElement('section');
  section.className = 'video-section';
  section.id = video.id;
  section.innerHTML = `
    <div class="section-heading"><h2>${video.id}</h2><a class="download" aria-disabled="true">Download comparison</a></div>
    <div class="frames" role="group" aria-label="Frame for ${video.id}"></div>
    <div class="controls"><span class="control-label">Layers</span><div class="layer-controls" role="group" aria-label="Choose four layers for ${video.id}"></div></div>
    <figure class="figure"><button class="figure-button" aria-label="Enlarge four-layer comparison for ${video.id}" disabled><img class="comparison-image" alt=""></button><figcaption class="caption"><span class="figure-label"></span><span>Click image to enlarge</span></figcaption></figure>
    <p class="status" role="status" aria-live="polite"></p>
    <div class="supporting"><details class="source"><summary>Watch source video</summary><video controls playsinline preload="none" aria-label="Source video ${video.id}" src="assets/vis/Videos/${video.id}.mp4"></video></details><details class="baselines"><summary>OmniZip &amp; Omni-Prune</summary><div class="baseline-images"></div></details><a class="pdf-link" href="assets/vis/all/${video.id}_llm_layers_selection_4f.pdf" target="_blank" rel="noopener">All layers (PDF)</a></div>`;
  document.getElementById('videos').append(section);
  const navigation = document.createElement('a');
  navigation.href = '#' + video.id;
  navigation.textContent = video.id;
  document.getElementById('navigation').append(navigation);
  const frames = section.querySelector('.frames');
  const controls = section.querySelector('.layer-controls');
  const output = section.querySelector('.comparison-image');
  const figureButton = section.querySelector('.figure-button');
  const download = section.querySelector('.download');
  const status = section.querySelector('.status');
  video.frames.forEach((index) => {
    const button = document.createElement('button');
    const thumbnail = document.createElement('img');
    thumbnail.src = `assets/vis/${video.id}/layer0_frame${index}.png`;
    thumbnail.alt = '';
    const label = document.createElement('span');
    label.textContent = `Frame ${index}`;
    button.append(thumbnail, label);
    button.setAttribute('aria-label', `Frame ${index}`);
    button.dataset.frame = index;
    button.onclick = () => { frame = index; render(); };
    frames.append(button);
  });
  for (let start = 0; start < video.layers.length; start += 4) {
    const group = video.layers.slice(start, start + 4);
    const button = document.createElement('button');
    button.textContent = `${group[0]}–${group[group.length - 1]}`;
    button.dataset.firstLayer = group[0];
    button.setAttribute('aria-label', `Layers ${group.join(', ')}`);
    button.onclick = () => { layers = group; render(); };
    controls.append(button);
  }
  section.querySelector('.source').ontoggle = (event) => {
    if (!event.target.open) section.querySelector('video').pause();
  };
  const baselineImages = video.methods.map((method) => {
    const figure = document.createElement('figure');
    const image = document.createElement('img');
    const caption = document.createElement('figcaption');
    caption.textContent = method === 'omnizip' ? 'OmniZip' : 'Omni-Prune';
    image.alt = caption.textContent + ' for ' + video.id;
    image.loading = 'lazy';
    figure.append(caption, image);
    section.querySelector('.baseline-images').append(figure);
    return {method, image};
  });
  figureButton.onclick = () => {
    document.getElementById('zoom').src = output.src;
    document.getElementById('zoom').alt = output.alt;
    document.getElementById('viewer-title').textContent = output.alt;
    viewer.showModal();
  };
  async function render() {
    const ticket = ++revision;
    const selectedLayers = [...layers];
    const selectedFrame = frame;
    figureButton.disabled = true;
    download.setAttribute('aria-disabled', 'true');
    status.textContent = 'Loading comparison…';
    frames.querySelectorAll('button').forEach((button) => button.setAttribute('aria-pressed', Number(button.dataset.frame) === frame));
    controls.querySelectorAll('button').forEach((button) => button.setAttribute('aria-pressed', Number(button.dataset.firstLayer) === layers[0]));
    baselineImages.forEach(({method, image}) => { image.src = `assets/vis/${video.id}/${method}_frame${frame}.png`; });
    try {
      const images = await Promise.all(selectedLayers.map((layer) => loadImage(`assets/vis/${video.id}/layer${layer}_frame${selectedFrame}.png`)));
      if (ticket !== revision) return;
      const width = 640, height = 341, gap = 12, label = 42;
      const canvas = document.createElement('canvas');
      canvas.width = 4 * width + 3 * gap;
      canvas.height = height + label;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      images.forEach((image, index) => {
        const x = index * (width + gap);
        ctx.fillStyle = '#252b31'; ctx.font = '22px sans-serif';
        ctx.fillText(`Layer ${selectedLayers[index]}`, x, 28);
        const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
        const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
        ctx.drawImage(image, x + (width - w) / 2, label + (height - h) / 2, w, h);
      });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (ticket !== revision) return;
      if (!blob) throw new Error('Could not compose image.');
      const url = URL.createObjectURL(blob);
      const oldUrl = figureUrl;
      figureUrl = url;
      output.src = url;
      output.alt = `${video.id} · Frame ${selectedFrame} · Layers ${selectedLayers.join(', ')}`;
      download.href = url;
      download.download = `${video.id}_frame${selectedFrame}_layers${selectedLayers.join('-')}.png`;
      download.setAttribute('aria-disabled', 'false');
      section.querySelector('.figure-label').textContent = `Frame ${selectedFrame} · Layers ${selectedLayers.join(', ')}`;
      figureButton.disabled = false;
      status.textContent = '';
      if (oldUrl) URL.revokeObjectURL(oldUrl);
    } catch (error) {
      if (ticket === revision) status.textContent = `${error.message} Please open through start-preview.cmd.`;
    }
  }
  render();
});
