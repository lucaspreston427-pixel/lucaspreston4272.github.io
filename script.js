// high-detail procedural generator + OBJ export
// Paste this file exactly as-is

// Basic scene + renderer
const container = document.getElementById('container');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06070a);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 2000);
camera.position.set(6, 3.5, 8);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// lighting
const hemi = new THREE.HemisphereLight(0xbfe8ff, 0x202020, 0.9);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(6, 10, 4);
dir.castShadow = true;
scene.add(dir);

// helper ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200,200),
  new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 1, metalness: 0 })
);
ground.rotation.x = -Math.PI/2;
ground.position.y = -1.8;
scene.add(ground);

// utility functions
function rand(min, max) { return Math.random() * (max - min) + min; }
function colorFromString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h*31 + s.charCodeAt(i)) >>> 0;
  return new THREE.Color((h * 2654435761) >>> 0 & 0xffffff);
}

// procedural canvas texture for stripes / plates / panels
function createStripedTexture(baseColor, stripeColor, stripes = 6) {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = baseColor;
  ctx.fillRect(0,0,size,size);
  ctx.fillStyle = stripeColor;
  for (let i = 0; i < stripes; i++) {
    const h = Math.floor(size/stripes);
    ctx.fillRect(0, i*h + (h*0.12*Math.random()), size, Math.floor(h*0.3));
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  return tex;
}

// high-poly parts helpers
function makePanel(width, height, depth, material, bevel = 0) {
  // Box as panel; bevel effect via smaller box on top
  const g = new THREE.BoxGeometry(width, height, depth);
  const m = material;
  return new THREE.Mesh(g, m);
}

function addBoltsAround(mesh, count = 8, radius = 1.0) {
  const bolts = new THREE.Group();
  for (let i=0;i<count;i++){
    const a = (i/count) * Math.PI*2;
    const s = 0.06 + Math.random()*0.05;
    const b = new THREE.Mesh(new THREE.SphereGeometry(s, 8, 8), new THREE.MeshStandardMaterial({color:0x333333, metalness:0.9, roughness:0.3}));
    b.position.set(Math.cos(a)*radius, Math.sin(a)*radius, 0.02 + Math.random()*0.02);
    bolts.add(b);
  }
  bolts.position.copy(mesh.position);
  bolts.quaternion.copy(mesh.quaternion);
  scene.add(bolts);
  return bolts;
}

// Clear models (keep lights, ground)
function clearModels() {
  // remove everything except lights, ground
  const keep = new Set([ground, hemi, dir]);
  scene.children.slice().forEach(obj => {
    if (!keep.has(obj) && obj !== camera) scene.remove(obj);
  });
}

// GENERATORS
function generateRobot(detail = 1, prompt = 'robot') {
  const robot = new THREE.Group();

  const baseColor = colorFromString(prompt);
  const matMain = new THREE.MeshStandardMaterial({ color: baseColor, metalness: 0.8, roughness: 0.25 });
  const matPanel = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.5 });

  // torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(2.2*detail, 2.6*detail, 1.2*detail, 6,6,6), matMain);
  torso.position.y = 0.9;
  robot.add(torso);

  // layered panels
  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.6*detail, 2.0*detail, 0.15*detail), matPanel);
  panel.position.set(0, 0.95, 0.66);
  robot.add(panel);

  addBoltsAround(panel, 10, 0.7*detail);

  // head
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.1*detail, 1.0*detail, 0.9*detail), matMain);
  head.position.set(0, 2.05, 0.05);
  robot.add(head);

  // eye/emissive
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x33d9ff, emissive: 0x33d9ff, emissiveIntensity: 0.9 });
  const eye = new THREE.Mesh(new THREE.BoxGeometry(0.8*detail, 0.22*detail, 0.05), eyeMat);
  eye.position.set(0, 2.05, 0.5);
  robot.add(eye);

  // arms (complex)
  function makeArm(side = 1) {
    const arm = new THREE.Group();
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.2*detail,0.28*detail,1.0*detail,18), matMain);
    upper.rotation.z = side * Math.PI/2 * 0.28;
    upper.position.set(side*1.45*detail, 1.6, 0);
    arm.add(upper);

    const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.18*detail,0.22*detail,1.0*detail,16), matMain);
    fore.position.set(side*2.05*detail, 1.1, 0);
    fore.rotation.z = side * Math.PI/2 * 0.25;
    arm.add(fore);

    // hand with fingers -> many small boxes
    const hand = new THREE.Group();
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.3*detail,0.2*detail,0.6*detail), matPanel);
    palm.position.set(side*2.45*detail, 0.75, 0);
    hand.add(palm);
    for (let f=0; f<3; f++){
      const finger = new THREE.Mesh(new THREE.BoxGeometry(0.08*detail,0.08*detail,0.25*detail), matMain);
      finger.position.set(side*(2.45 + 0.12*(f-1))*detail,0.75,0.45);
      hand.add(finger);
    }
    arm.add(hand);

    return arm;
  }
  robot.add(makeArm(1));
  robot.add(makeArm(-1));

  // legs
  for (let i=-1;i<=1;i+=2){
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.6*detail,1.1*detail,0.7*detail), matMain);
    leg.position.set(i*0.6, -0.55, 0);
    robot.add(leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.8*detail,0.2*detail,1.2*detail), matPanel);
    foot.position.set(i*0.6, -1.2, 0.2);
    robot.add(foot);
  }

  // antenna / small parts
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.03*detail, 0.05*detail, 0.9*detail), matMain);
  antenna.position.set(0, 2.7, -0.1);
  robot.add(antenna);

  // small surface details - attach many tiny plates
  for (let i=0;i<12;i++){
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.18*detail,0.06*detail,0.12*detail), matPanel);
    p.position.set(rand(-0.9,0.9)*detail, rand(0.2,1.6), rand(-0.6,0.6));
    p.rotation.set(rand(-0.2,0.2), rand(-0.2,0.2), rand(-0.7,0.7));
    robot.add(p);
  }

  robot.scale.setScalar(0.9 + detail*0.4);
  robot.position.set(0, -1.4, 0);

  scene.add(robot);
  return robot;
}

function generateTiger(detail = 1, prompt = 'tiger') {
  const g = new THREE.Group();
  const base = colorFromString(prompt);
  const orange = base.lerp(new THREE.Color(0xff7a18), 0.5);
  const black = new THREE.Color(0x111111);

  // body (high seg sphere stretched)
  const bodyGeo = new THREE.SphereGeometry(1.4*detail, 64, 48);
  bodyGeo.scale(1.6, 1.0, 0.9);
  const bodyMat = new THREE.MeshStandardMaterial({
    map: createStripedTexture('#ffa54a','#0b0b0b', 16),
    roughness: 0.9,
    metalness: 0
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.set(0, -0.3, 0);
  g.add(body);

  // head
  const headGeo = new THREE.SphereGeometry(0.7*detail, 48, 36);
  const headMat = new THREE.MeshStandardMaterial({ color: '#ffb36b', roughness: 0.8 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(1.5*detail, 0.2, 0);
  head.scale.set(1.0, 0.88, 0.9);
  g.add(head);

  // ears
  for (let side=-1; side<=1; side+=2){
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.18*detail, 0.28*detail, 12), new THREE.MeshStandardMaterial({ color:'#663300' }));
    ear.position.set(1.9*detail, 0.7, 0.25*side);
    ear.rotation.set(0, 0, side*0.2);
    g.add(ear);
  }

  // legs (detailed)
  for (let i=0;i<4;i++){
    const x = -0.6 + (i%2)*1.2;
    const z = (i<2) ? -0.5 : 0.5;
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.18*detail,0.26*detail,0.9*detail,18), new THREE.MeshStandardMaterial({color:'#c76f2a', roughness:0.95}));
    upper.position.set(x, -0.95, z);
    upper.rotation.x = 0.05;
    g.add(upper);

    const paw = new THREE.Mesh(new THREE.BoxGeometry(0.36*detail,0.14*detail,0.6*detail), new THREE.MeshStandardMaterial({color:'#3b2b1b'}));
    paw.position.set(x, -1.4, z);
    g.add(paw);
  }

  // tail (many segments)
  const tail = new THREE.Group();
  let segCount = 18 + Math.floor(6*detail);
  for (let i=0;i<segCount;i++){
    const s = 0.12 * (1 - i/segCount) * (0.9 + 0.6*detail);
    const seg = new THREE.Mesh(new THREE.SphereGeometry(s, 12, 8), new THREE.MeshStandardMaterial({color:'#c76f2a'}));
    seg.position.set( -1.6 - 0.18*i, -0.1 + 0.02*i, 0 );
    tail.add(seg);
  }
  g.add(tail);

  // nose and eyes
  const eyeMat = new THREE.MeshStandardMaterial({ color:0x000000, emissive:0x000000 });
  const lEye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeMat);
  const rEye = lEye.clone();
  lEye.position.set(1.7, 0.2, 0.18);
  rEye.position.set(1.7, 0.2, -0.18);
  g.add(lEye); g.add(rEye);

  // whiskers via thin cylinders
  for (let side=-1; side<=1; side+=2){
    for (let i=0;i<3;i++){
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.8, 6), new THREE.MeshStandardMaterial({color:0xeeeeee}));
      w.position.set(1.75, 0.05 - i*0.03, side*0.12 - i*0.04);
      w.rotation.z = side*0.25 + (i*0.04);
      g.add(w);
    }
  }

  g.scale.setScalar(0.9 + 0.25*detail);
  g.position.set(0, -1.5, 0);
  scene.add(g);
  return g;
}

function generateCastle(detail = 1, prompt = 'castle') {
  const grp = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x8d8d8d, roughness: 1, metalness: 0.05 });
  const towerCount = 4 + Math.floor(2*detail);
  const radius = 3.0;
  for (let i=0;i<towerCount;i++){
    const ang = (i/towerCount) * Math.PI*2;
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.7*detail,0.9*detail,5*detail,32), stone);
    tower.position.set(Math.cos(ang)*radius, 2.5*detail - 0.2, Math.sin(ang)*radius);
    grp.add(tower);

    // crenellation
    for (let c=0;c<10;c++){
      const brick = new THREE.Mesh(new THREE.BoxGeometry(0.26*detail,0.14*detail,0.7*detail), new THREE.MeshStandardMaterial({color:0x7b7b7b}));
      brick.position.set(Math.cos(ang)*(radius + 0.02), 5*detail/2 + 0.15, Math.sin(ang)*(radius + (c-5)*0.02));
      grp.add(brick);
    }
  }

  const keep = new THREE.Mesh(new THREE.BoxGeometry(5*detail,3*detail,5*detail), stone);
  keep.position.y = 1.2*detail;
  grp.add(keep);

  grp.position.set(0, -1.4, 0);
  scene.add(grp);
  return grp;
}

function generateSpaceship(detail = 1, prompt = 'spaceship') {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: colorFromString(prompt), metalness: 0.8, roughness: 0.22 });
  // fuselage
  const fus = new THREE.Mesh(new THREE.ConeGeometry(1.6*detail, 5*detail, 48), mat);
  fus.rotation.x = Math.PI;
  fus.position.y = 0.2;
  g.add(fus);

  // wings
  for (let s=-1;s<=1;s+=2) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.6*detail,0.12*detail,0.8*detail), new THREE.MeshStandardMaterial({color:0x222222, metalness:0.6, roughness:0.4}));
    wing.position.set(s*1.2*detail, -0.2, 0.9*s);
    wing.rotation.z = s*0.1;
    g.add(wing);
    // engine pods
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.24*detail,0.28*detail,0.9*detail,18), new THREE.MeshStandardMaterial({color:0x555555}));
    pod.position.set(s*1.9*detail,-0.2,0.9*s);
    pod.rotation.z = Math.PI/2;
    g.add(pod);
  }

  g.position.y = -0.6;
  scene.add(g);
  return g;
}

// High-level control: map keyword -> generator
function createModelFromPrompt(prompt, detailSetting) {
  clearModels();
  const lower = (prompt || '').toLowerCase();

  if (lower.includes('robot') || lower.includes('mech')) {
    return generateRobot(detailSetting, prompt);
  }
  if (lower.includes('tiger') || lower.includes('cat') || lower.includes('lion')) {
    return generateTiger(detailSetting, prompt);
  }
  if (lower.includes('castle') || lower.includes('tower')) {
    return generateCastle(detailSetting, prompt);
  }
  if (lower.includes('ship') || lower.includes('spaceship') || lower.includes('rocket')) {
    return generateSpaceship(detailSetting, prompt);
  }

  // fallback: complex abstract model with many parts
  const fallback = new THREE.Group();
  const color = colorFromString(prompt || 'default');
  for (let i=0;i<28 + 18*detailSetting; i++){
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35*(1 + Math.random()*1.6)*detailSetting, 2 + Math.floor(detailSetting*2)),
      new THREE.MeshStandardMaterial({ color: color, roughness: 0.6, metalness: 0.2 }));
    m.position.set(rand(-2,2), rand(-0.5,1.5), rand(-2,2));
    m.rotation.set(rand(0,Math.PI), rand(0,Math.PI), rand(0,Math.PI));
    fallback.add(m);
  }
  fallback.position.y = -0.8;
  scene.add(fallback);
  return fallback;
}

// UI actions
const promptEl = document.getElementById('prompt');
const btnGen = document.getElementById('generate');
const btnExport = document.getElementById('export');
const detailSlider = document.getElementById('detail');

let currentModel = null;
btnGen.addEventListener('click', () => {
  const p = promptEl.value.trim();
  const detail = parseInt(detailSlider.value, 10) || 1;
  if (!p) { alert('Type a word first.'); return; }
  currentModel = createModelFromPrompt(p, detail);
});

// OBJ export
btnExport.addEventListener('click', () => {
  const exporter = new THREE.OBJExporter();
  const group = new THREE.Group();
  scene.children.forEach(obj => {
    // keep visible scene objects except helpers/ground/lights
    if (obj === ground || obj === hemi || obj === dir) return;
    group.add(obj.clone());
  });
  const text = exporter.parse(group);
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'generated_model.obj';
  a.click();
  URL.revokeObjectURL(url);
});

// initial model
createModelFromPrompt('robot', 1);

// handling resize
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
});

// animate
function animate(){
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
