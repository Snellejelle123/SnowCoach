import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f4f8);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 4);
// eerst render settings & aanpassen aan de shadowdom waar hij gaat in belanden 
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
const host = document.querySelector("oefening-kaart");
const container = host?.shadowRoot?.getElementById("animatie-container");

// als het in een container staat dat de grote aanpast aan de container 
if (container) {

    const breedte = container.clientWidth;
    const hoogte = container.clientHeight;

    renderer.setSize(breedte, hoogte);
    camera.aspect = breedte / hoogte;
    camera.updateProjectionMatrix();

    container.appendChild(renderer.domElement);
} else {
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
}
// het licht instellen 
scene.add(new THREE.AmbientLight(0xffffff, 1));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);
// De muisinteracties toevoegen 
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
controls.enableDamping = true;


// grenswaarden 

const grenzen = {
    "mixamorigLeftLeg": { min: [-1.8, -1.5, -1.5], max: [0.5, 1.5, 1.5] },
    "mixamorigRightLeg": { min: [-1.8, -1.5, -1.5], max: [0.5, 1.5, 1.5] },
    "mixamorigSpine": { min: [-0.5, -0.5, -0.4], max: [0.5, 0.5, 0.4] },
    "mixamorigHips": { min: [-0.5, -1.0, -0.5], max: [0.5, 1.0, 0.5] },
    "mixamorigLeftArm": { min: [-0.5, -0.5, -0.5], max: [0.6, 0.5, 0.5] },
    "mixamorigLeftForeArm": { min: [-0.5, -0.5, -0.5], max: [2.2, 0.5, 0.5] },
    "mixamorigRightArm": { min: [-0.5, -0.5, -0.5], max: [0.5, 0.5, 0.5] },
    "mixamorigRightForeArm": { min: [-0.5, -0.5, -0.5], max: [0.5, 0.5, 0.5] }
};
// grezen checken of ze juist zijn of er niets over schreid 
function checkGrens(boneName, x, y, z) {
    const g = grenzen[boneName];
    if (!g) return [x, y, z];

    const tensor = tf.tensor1d([x, y, z]);
    const minT = tf.tensor1d(g.min);
    const maxT = tf.tensor1d(g.max);
    const clipped = tf.maximum(minT, tf.minimum(maxT, tensor));
    const result = clipped.arraySync();

    tensor.dispose();
    minT.dispose();
    maxT.dispose();
    clipped.dispose();

    return result;
}

// model laden 
const params = new URLSearchParams(window.location.search);
const houdingNaam = window.houdingNaam ?? "basishouding";
const loader = new GLTFLoader();
loader.load(
    "../3Dmodel/snowboarder.glb",
    async (gltf) => {
        scene.add(gltf.scene);

        const bones = {};
        gltf.scene.traverse((object) => {
            if (object.isBone) bones[object.name] = object;
        });


        const response = await fetch(`../3Dmodel/${houdingNaam}.json`);
        const data = await response.json();
        const rawBones = data.bones ?? data;

        for (const [naam, rotatie] of Object.entries(rawBones)) {
            const boneName = naam.replace("mixamorig:", "mixamorig");
            const bone = bones[boneName];
            if (!bone) continue;


            const newX = bone.rotation.x + rotatie[0];
            const newY = bone.rotation.y + rotatie[1];
            const newZ = bone.rotation.z + rotatie[2];

            // TensorFlow checkt of nieuwe rotatie binnen grenzen valt
            const r = checkGrens(boneName, newX, newY, newZ);
            bone.rotation.set(r[0], r[1], r[2]);


        }

        // Board positioneren
        if (data.board) {
            const board = gltf.scene.getObjectByName("10535_Snowboard_v1_L3");
            if (board) {
                board.position.set(...data.board.positie);
                board.rotation.set(...data.board.rotatie);
            }
        }
    },
    undefined,
    (error) => console.error("Fout bij laden:", error)
);

// render loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});