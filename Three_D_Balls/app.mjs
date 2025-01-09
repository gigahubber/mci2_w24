import * as THREE from "../99_Lib/three.module.min.js";
import { MathUtils, Vector3 } from "../99_Lib/three.module.min.js";
import { keyboard, mouse } from "./js/interaction2D.mjs";
import {
  add,
  createLine,
  loadGLTFcb,
  randomMaterial,
  shaderMaterial,
} from "./js/geometry.mjs";
import { createRay } from "./js/ray.mjs";

import { Water } from "../99_Lib/jsm/objects/Water.js";
import { Sky } from "../99_Lib/jsm/objects/Sky.js";

import { VRButton } from "../99_Lib/jsm/webxr/VRButton.js";
import { createVRcontrollers } from "./js/vr.mjs";

// OrbitControls
import { OrbitControls } from "../99_Lib/jsm/controls/OrbitControls.js";

// World Generation
let camera, scene, world, renderer;
// Movements
let controller1, controller2;
let controllerGrip1, controllerGrip2;
// Movements with Mouse and Keyboard
let controls;

let room, physics;
const velocity = new THREE.Vector3();

window.onload = async function () {
  // Camera erstellen
  //   camera = new THREE.PerspectiveCamera(
  //     50,
  //     window.innerWidth / window.innerHeight,
  //     0.1,
  //     1000
  //   );
  
  const camera = new THREE.PerspectiveCamera( // fov, aspect, near, far
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );

  // OrbitControls erstellen für Mouse-Events und Keyboard-Events
  // Steuerung der Kamera mit der Maus und Tastatur
  controls = new OrbitControls(camera, document.body);
  camera.position.set(0, 0, -5); // x,y,z
  controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
  controls.mouseButtons.LEFT = THREE.MOUSE.PAN;

  // Camera with Keyboard-Events
  controls.keys = {
    LEFT: "KeyA", //left arrow
    UP: "KeyW", // up arrow
    RIGHT: "KeyD", // right arrow
    BOTTOM: "KeyS", // down arrow
  };
  controls.listenToKeyEvents(window);
  controls.keyPanSpeed = 20;
  controls.update();

  // Scene und World erstellen
  scene = new THREE.Scene();
  world = new THREE.Group();
  world.matrixAutoUpdate = false;
  scene.add(world);

  // Room erstellen
  const roomMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    wireframe: false,
  });
  room = new THREE.LineSegments(
    new THREE.BoxGeometry(10, 10, 10, 10, 10, 10), // Breite, Höhe, Tiefe, Breite Segmente, Höhe Segmente, Tiefe Segmente
    // new THREE.LineBasicMaterial({ color: 0x808080 })
    roomMaterial
    // randomMaterial()
  );
  const width = room.geometry.parameters.width;
  const heigth = room.geometry.parameters.height;
  console.log(width);
  room.geometry.translate(0, 3, 0);
  scene.add(room);

  // Floor erstellen
  //   const textureLoaderFloor = new THREE.TextureLoader().load('assets/bricks.jpg');
  const boxFloor = new THREE.BoxGeometry(10, 0.1, 10, 1, 1, 1); // Breite, Höhe, Tiefe, Breite Segmente, Höhe Segmente, Tiefe Segmente
  const floorMaterial = new THREE.MeshBasicMaterial({
    color: 0x2a9336,
    side: THREE.DoubleSide,
    // wireframe: false,
    // vertexColors: true,
    // map: bricks,
    // map: textureLoaderFloor,
  });
  const floor = new THREE.Mesh(boxFloor, floorMaterial);
  floor.position.y = -1;
  floor.receiveShadow = true;
  floor.userData.physics = { mass: 0 };
  floor.name = "floor";
  scene.add(floor);

  // Skybox erstellen
  const sky = new Sky();
  sky.scale.setScalar(10000);
  const phi = MathUtils.degToRad(90);
  const theta = MathUtils.degToRad(180);
  const sunPosition = new Vector3().setFromSphericalCoords(1, phi, theta);
  sky.material.uniforms.sunPosition.value = sunPosition;
  scene.add(sky);

  // Renderer erstellen
  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  // Renderer-Parameter setzen
  renderer.xr.enabled = true;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));

  // Renderer-Setup
  function render() {
    // Functions later

    renderer.render(scene, camera);

    // controls update
    controls.update();
  }
  renderer.setAnimationLoop(render);
};
