async function generateAndLoad(prompt) {
  // 1) call your backend
  const r = await fetch('/generate', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({prompt})
  });
  const j = await r.json();
  const url = j.url; // e.g. /download/<id>.glb

  // 2) load model into scene
  if (url.endsWith('.glb') || url.endsWith('.gltf')) {
    const loader = new THREE.GLTFLoader();
    loader.load(url, gltf => {
      scene.add(gltf.scene);
    });
  } else if (url.endsWith('.obj')) {
    const loader = new THREE.OBJLoader();
    loader.load(url, obj => {
      scene.add(obj);
    });
  }
}
