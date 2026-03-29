import * as THREE from "three";
const cursorScene = new THREE.Scene();
const cursorCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
const cursorRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
cursorRenderer.setSize(256, 256);

cursorRenderer.domElement.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 9999;
    width: 128px;
    height: 128px;
`;

document.body.appendChild(cursorRenderer.domElement);
const texture = new THREE.TextureLoader().load("../images/sneeuwvlokje.png");
const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
cursorScene.add(sprite);

let hoek = 0;
document.addEventListener("mousemove", (e) => {
    cursorRenderer.domElement.style.left = (e.clientX - 64) + "px";
    cursorRenderer.domElement.style.top = (e.clientY - 64) + "px";
});

function animateCursor() {
    requestAnimationFrame(animateCursor);
    hoek += 0.02;
    sprite.material.rotation = hoek;
    cursorRenderer.render(cursorScene, cursorCamera);
}
animateCursor();

document.body.style.cursor = "none";