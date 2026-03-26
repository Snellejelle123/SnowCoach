import * as THREE from "three";

let active = false;
let scene, camera, renderer, cursorMesh;
let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();

const button = document.getElementById("decoBtn");

button.addEventListener("click", () => {
    if (!active) {
        startCursor();
        button.textContent = "Deactiveer cursor";
    } else {
        stopCursor();
        button.textContent = "Activeer cursor";
    }
    active = !active;
});

/* ======================
START CURSOR
====================== */
function startCursor() {
    document.body.classList.add("cursor-active");

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        100
    );
    camera.position.z = 2;

    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.classList.add("three-cursor");

    document.body.appendChild(renderer.domElement);

    // texture laden
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load("../images/cursor.png"); // <-- pas pad aan

    const geometry = new THREE.PlaneGeometry(0.15, 0.15);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true
    });

    cursorMesh = new THREE.Mesh(geometry, material);
    scene.add(cursorMesh);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);

    animate();
}

/* ======================
STOP CURSOR
====================== */
function stopCursor() {
    document.body.classList.remove("cursor-active");

    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("resize", onResize);

    if (renderer) {
        document.body.removeChild(renderer.domElement);
        renderer.dispose();
    }
}

/* ======================
EVENTS
====================== */
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/* ======================
LOOP
====================== */
function animate() {
    if (!active) return;

    requestAnimationFrame(animate);

    raycaster.setFromCamera(mouse, camera);

    const distance = 1;
    const pos = new THREE.Vector3();
    pos.copy(camera.position).add(
        raycaster.ray.direction.multiplyScalar(distance)
    );

    cursorMesh.position.copy(pos);

    renderer.render(scene, camera);
}