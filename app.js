const data = window.VIS_DATA;
let currentVideo = data[0];
let frame = currentVideo.frames[0];
let layers = [0, 1, 2, 3];
const $ = (id) => document.getElementById(id);
const asset = (name) => `assets/vis/${currentVideo.id}/${name}_frame${frame}.png`;
const viewer = $('viewer');

function imagePanel(name, label, slot) {
  const card = document.createElement('article');
  card.className = 'panel';
  const header = document.createElement('div');
  header.className = 'panel-header';
  if (slot !== undefined) {
    const caption = document.createElement('label');
    caption.textContent = 'Our Token';
    caption.htmlFor = `layer-${slot}`;
    const select = document.createElement('select');
    select.id = caption.htmlFor;
    select.setAttribute('aria-label', `Layer in comparison view ${slot + 1}`);
    currentVideo.layers.forEach((layer) => select.add(new Option(`Layer ${layer}`, layer, false, layer === layers[slot])));
    select.onchange = () => { layers[slot] = Number(select.value); renderFigures(); };
    header.append(caption, select);
  } else {
    const heading = document.createElement('h3');
    heading.textContent = label;
    header.append(heading);
  }
  const button = document.createElement('button');
  button.className = 'image-button';
  button.setAttribute('aria-label', `Enlarge ${label}, frame ${frame}`);
  const img = document.createElement('img');
  img.src = asset(name);
  img.alt = `${currentVideo.id} · Frame ${frame} · ${label}`;
  img.onerror = () => { $('status').textContent = `Image unavailable: ${img.alt}`; };
  button.append(img);
  button.onclick = () => {
    $('viewer-image').src = img.src;
    $('viewer-image').alt = img.alt;
    $('viewer-title').textContent = img.alt;
    viewer.showModal();
  };
  card.append(header, button);
  return card;
}

function renderFigures() {
  $('status').textContent = '';
  $('panels').replaceChildren(...layers.map((layer, slot) => imagePanel(`layer${layer}`, `Layer ${layer}`, slot)));
  $('baselines').replaceChildren(...currentVideo.methods.map((method) => imagePanel(method, method === 'omnizip' ? 'OmniZip' : 'Omni-Prune')));
  document.querySelectorAll('#frames button').forEach((button) => button.setAttribute('aria-pressed', Number(button.dataset.frame) === frame));
}

function selectVideo(video) {
  currentVideo = video;
  if (!video.frames.includes(frame)) frame = video.frames[0];
  layers = layers.map((layer, index) => video.layers.includes(layer) ? layer : video.layers[index % video.layers.length]);
  $('comparison-title').textContent = video.id;
  $('source-video').src = `assets/vis/Videos/${video.id}.mp4`;
  $('source-pdf').href = `assets/vis/all/${video.id}_llm_layers_selection_4f.pdf`;
  $('frames').replaceChildren(...video.frames.map((value) => {
    const button = document.createElement('button');
    button.textContent = value;
    button.dataset.frame = value;
    button.setAttribute('aria-label', `Frame ${value}`);
    button.onclick = () => { frame = value; renderFigures(); };
    return button;
  }));
  document.querySelectorAll('.video-card').forEach((button) => button.setAttribute('aria-pressed', button.dataset.video === video.id));
  renderFigures();
}

data.forEach((video) => {
  const button = document.createElement('button');
  button.className = 'video-card';
  button.dataset.video = video.id;
  const img = document.createElement('img');
  img.src = `assets/vis/${video.id}/layer0_frame0.png`;
  img.alt = '';
  const name = document.createElement('span');
  name.textContent = video.id;
  button.append(img, name);
  button.onclick = () => selectVideo(video);
  $('video-list').append(button);
});
$('close-viewer').onclick = () => viewer.close();
viewer.onclick = (event) => { if (event.target === viewer) viewer.close(); };

$('export').onclick = async () => {
  const button = $('export');
  button.disabled = true;
  const selectedVideo = currentVideo.id;
  const selectedFrame = frame;
  const selectedLayers = [...layers];
  const paths = selectedLayers.map((layer) => asset(`layer${layer}`));
  try {
    const images = await Promise.all(paths.map((src) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('An image could not be loaded.'));
      img.src = src;
    })));
    const canvas = document.createElement('canvas');
    const width = 640, height = 341, gap = 24, titleHeight = 72, labelHeight = 42;
    canvas.width = width * 2 + gap * 3;
    canvas.height = titleHeight + 2 * (height + labelHeight + gap);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#182536'; ctx.font = '24px sans-serif';
    ctx.fillText(`${selectedVideo} · Frame ${selectedFrame} · Our Token`, gap, 43);
    images.forEach((img, index) => {
      const x = gap + (index % 2) * (width + gap);
      const y = titleHeight + Math.floor(index / 2) * (height + labelHeight + gap);
      ctx.fillStyle = '#182536'; ctx.font = '20px sans-serif';
      ctx.fillText(`Layer ${selectedLayers[index]}`, x, y + 27);
      const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);
      const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
      ctx.drawImage(img, x + (width - w) / 2, y + labelHeight + (height - h) / 2, w, h);
    });
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Image export failed.');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `${selectedVideo}_frame${selectedFrame}_layers${selectedLayers.join('-')}.png`;
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('status').textContent = 'Figure downloaded.';
  } catch (error) {
    $('status').textContent = `${error.message} Open the page through a local web server to export figures.`;
  } finally { button.disabled = false; }
};
selectVideo(currentVideo);
