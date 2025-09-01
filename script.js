// Simple frontend logic: send concept to backend, render results, draw canvas visualizations
const explainBtn = document.getElementById('explainBtn');
const input = document.getElementById('conceptInput');
const imageSource = document.getElementById('imageSource');

const beginnerText = document.getElementById('beginnerText');
const intermediateText = document.getElementById('intermediateText');
const advancedText = document.getElementById('advancedText');
const applicationsDiv = document.getElementById('applications');
const imageContainer = document.getElementById('imageContainer');

const canvas = document.getElementById('vizCanvas');
const ctx = canvas.getContext('2d');

explainBtn.addEventListener('click', async () => {
  const concept = input.value.trim();
  if (!concept) return alert('Type a concept first.');

  setLoadingState(true);
  clearOutputs();

  try {
    const res = await fetch('http://localhost:5000/api/ask', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ concept, prefer_image_source: imageSource.value })
    });
    if (!res.ok) throw new Error(`Server error: ${res.statusText}`);
    const data = await res.json();

    // Place text
    beginnerText.innerText = data.beginner || '—';
    intermediateText.innerText = data.intermediate || '—';
    advancedText.innerText = data.advanced || '—';
    applicationsDiv.innerText = (data.applications || '—');

    // If backend suggested an image URL, show it (or NASA)
    if (data.image_url) {
      imageContainer.innerHTML = `<img src="${data.image_url}" alt="related image" style="max-width:100%; border-radius:6px;">`;
    } else {
      imageContainer.innerHTML = 'No image available';
    }

    // Draw visualization instructions (we support a few types)
    const viz = data.visualization || {};
    drawVisualization(viz, concept);

  } catch (err){
    console.error(err);
    alert('Error: ' + err.message);
  } finally {
    setLoadingState(false);
  }
});

function clearOutputs(){
  beginnerText.innerText = '—';
  intermediateText.innerText = '—';
  advancedText.innerText = '—';
  applicationsDiv.innerText = '—';
  imageContainer.innerHTML = 'No image';
  ctx.clearRect(0,0,canvas.width,canvas.height);
}

function setLoadingState(isLoading){
  explainBtn.disabled = isLoading;
  explainBtn.innerText = isLoading ? 'Working…' : 'Explain';
}

// Very small drawing helper: accepts a viz object {type:'orbit'|'wave'|'lifecycle', params:{}}
function drawVisualization(viz = {}, concept = '') {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  const w = canvas.width, h = canvas.height;

  // starfield background
  for (let i=0;i<80;i++){
    const x=Math.random()*w, y=Math.random()*h, r=Math.random()*1.2;
    ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.6})`;
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }

  if (viz.type === 'orbit' || concept.toLowerCase().includes('orbit')) {
    // simple central body + ellipse orbit
    const cx = w*0.45, cy = h*0.45;
    ctx.fillStyle='rgba(255,200,80,1)'; ctx.beginPath(); ctx.arc(cx,cy,14,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(180,220,255,0.9)'; ctx.lineWidth=2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 180, 90, Math.PI/6, 0, Math.PI*2);
    ctx.stroke();

    // a small orbiting body
    const t = Date.now()/1000;
    const orbX = cx + 180 * Math.cos(t*0.6); 
    const orbY = cy + 90 * Math.sin(t*0.6);
    ctx.fillStyle='rgba(130,200,255,1)'; ctx.beginPath(); ctx.arc(orbX, orbY, 8,0,Math.PI*2); ctx.fill();
  }
  else if (viz.type === 'wave' || concept.toLowerCase().includes('wave') || concept.toLowerCase().includes('gravit')) {
    // sine wave / strain plot
    ctx.strokeStyle='rgba(160,220,255,0.95)'; ctx.lineWidth=2;
    ctx.beginPath();
    for (let x=0;x<w;x++){
      const y = h/2 + Math.sin((x/ w)*8 + Date.now()/2000)*40;
      if (x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();
    // axes
    ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(0,h/2); ctx.lineTo(w,h/2); ctx.stroke();
  }
  else if (viz.type === 'lifecycle' || concept.toLowerCase().includes('star') || concept.toLowerCase().includes('stellar')) {
    // three-stage simple horizontal stages: protostar, main seq, remnant
    const stages = ['Protostar','Main sequence','Red giant / remnant'];
    const sx = 40, sy = h*0.6;
    stages.forEach((s,i)=>{
      const x = sx + i*(w - 160)/2;
      ctx.fillStyle = i===1 ? 'rgba(255,220,120,0.95)' : 'rgba(200,160,240,0.85)';
      ctx.beginPath(); ctx.arc(x+40, sy-20, 36 - i*4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(220,230,255,0.9)'; ctx.font='14px Space Grotesk'; ctx.fillText(s, x, sy+20);
    });
  }
  else {
    // fallback: draw a stylized galaxy / swirl
    ctx.translate(w/2, h/2);
    for (let j=0;j<200;j++){
      const r = j*0.8;
      const a = j*0.25 + Date.now()/2000;
      ctx.fillStyle = `rgba(160,200,255,${0.012 * (200-j)})`;
      const x = Math.cos(a)*r, y = Math.sin(a)*r*0.4;
      ctx.beginPath(); ctx.arc(x,y,1.2,0,Math.PI*2); ctx.fill();
    }
  }

  ctx.restore();
}