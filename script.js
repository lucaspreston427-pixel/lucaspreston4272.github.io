// ================ BASIC SCENE SETUP ======================
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#222");

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 5, 10);

const light = new THREE.PointLight(0xffffff, 2);
light.position.set(10, 10, 10);
scene.add(light);

// Orbit Controls (optional)
fetch("https://cdn.jsdelivr.net/npm/three@0.128/examples/js/controls/OrbitControls.js")
    .then(res => res.text())
    .then(text => eval(text))
    .then(() => new THREE.OrbitControls(camera, renderer.domElement));

// ================ CLEAR OLD MODELS ======================
function clearScene() {
    scene.children.forEach(obj => {
        if (obj.type !== "PointLight" && obj.type !== "PerspectiveCamera") {
            scene.remove(obj);
        }
    });
}

// ================ MODEL GENERATOR ======================
function createModel(keyword) {
    keyword = keyword.toLowerCase();
    clearScene();

    let group = new THREE.Group();

    // ------ TIGER ------
    if (keyword.includes("tiger")) {
        let body = new THREE.Mesh(
            new THREE.BoxGeometry(4, 2, 1.5),
            new THREE.MeshStandardMaterial({ color: "orange" })
        );
        group.add(body);

        let head = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1.5, 1.5),
            new THREE.MeshStandardMaterial({ color: "orange" })
        );
        head.position.set(2.8, 0.5, 0);
        group.add(head);
    }

    // ------ CASTLE ------
    else if (keyword.includes("castle")) {
        for (let i = 0; i < 4; i++) {
            let tower = new THREE.Mesh(
                new THREE.CylinderGeometry(1, 1, 5, 16),
                new THREE.MeshStandardMaterial({ color: "gray" })
            );
            tower.position.set(
                Math.cos(i * Math.PI / 2) * 4,
                2,
                Math.sin(i * Math.PI / 2) * 4
            );
            group.add(tower);
        }

        let center = new THREE.Mesh(
            new THREE.BoxGeometry(6, 3, 6),
            new THREE.MeshStandardMaterial({ color: "darkgray" })
        );
        center.position.y = 1.5;
        group.add(center);
    }

    // ------ ROBOT ------
    else if (keyword.includes("robot")) {
        let body = new THREE.Mesh(
            new THREE.BoxGeometry(3, 4, 1.5),
            new THREE.MeshStandardMaterial({ color: "silver" })
        );
        group.add(body);

        let head = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1.5, 1.5),
            new THREE.MeshStandardMaterial({ color: "lightgray" })
        );
        head.position.set(0, 3, 0);
        group.add(head);
    }

    // ------ DEFAULT SHAPE ------
    else {
        let sphere = new THREE.Mesh(
            new THREE.SphereGeometry(2),
            new THREE.MeshStandardMaterial({ color: "white" })
        );
        group.add(sphere);
    }

    scene.add(group);
}

// ================ EXPORT AS OBJ ======================
document.getElementById("export").onclick = function () {
    const exporter = new THREE.OBJExporter();

    const group = new THREE.Group();
    scene.children.forEach(obj => {
        if (obj.type !== "PointLight" && obj.type !== "PerspectiveCamera") {
            group.add(obj.clone());
        }
    });

    const obj = exporter.parse(group);
    const blob = new Blob([obj], { type: "text/plain" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "model.obj";
    link.click();
};

// ================ GENERATE BUTTON ======================
document.getElementById("generate").onclick = () => {
    const word = document.getElementById("userText").value;
    createModel(word);
};

// ================ ANIMATION LOOP ======================
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
