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
import { XRControllerModelFactory } from "../99_Lib/jsm/webxr/XRControllerModelFactory.js";
import { XRButton } from "../99_Lib/jsm/webxr/XRButton.js";

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

  controls.listenToKeyEvents(window);
  controls.keyPanSpeed = 20;
  controls.update();

  document.addEventListener("keydown", (event) => {
    switch (event.code) {
      case "KeyW":
        camera.position.z += 0.1;
        // camera.translateZ(-0.1);
        break;
      case "KeyS":
        camera.position.z -= 0.1;
        // camera.translateZ(0.1);
        break;
      case "KeyA":
        camera.position.x -= 0.1;
        // camera.translateX(-0.1);
        break;
      case "KeyD":
        camera.position.x += 0.1;
        // camera.translateX(0.1);
        break;
      case "Space":
        // camera.translateY(0.1);
        camera.position.y += 0.1;
        console.log(camera.position.y);
        break;
      case "ControlLeft":
        // camera.translateY(-0.1);
        // camera.position.z -= 0.1;
        break;
    }
  });

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
    new THREE.BoxGeometry(40, 20, 40, 10, 10, 10), // Breite, Höhe, Tiefe, Breite Segmente, Höhe Segmente, Tiefe Segmente
    // new THREE.LineBasicMaterial({ color: 0x808080 })
    roomMaterial
    // randomMaterial()
  );
  const width = room.geometry.parameters.width;
  const heigth = room.geometry.parameters.height;
  console.log(width);
  room.geometry.translate(0, 8, 0); // x,y,z
  scene.add(room);

  // Floor erstellen
  //   const textureLoaderFloor = new THREE.TextureLoader().load('assets/bricks.jpg');
  const boxFloor = new THREE.BoxGeometry(40, 0.1, 40, 1, 1, 1); // Breite, Höhe, Tiefe, Breite Segmente, Höhe Segmente, Tiefe Segmente
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

  // document.body.appendChild( XRButton.createButton( renderer, {
  //   'optionalFeatures': [ 'depth-sensing' ],
  //   'depthSensing': { 'usagePreference': [ 'gpu-optimized' ], 'dataFormatPreference': [] }
  // } ) );

  // Contrllers erstellen
  function onSelectStart() {
    this.userData.isSelecting = true;
  }
  function onSelectEnd() {
    this.userData.isSelecting = false;
  }
  controller1 = renderer.xr.getController(0);
  controller1.addEventListener("selectstart", onSelectStart);
  controller1.addEventListener("selectend", onSelectEnd);
  controller1.addEventListener("connected", function (event) {
    this.add(buildController(event.data));
  });
  controller1.addEventListener("disconnected", function () {
    this.remove(this.children[0]);
  });
  controller2 = renderer.xr.getController(1);
  controller2.addEventListener("selectstart", onSelectStart);
  controller2.addEventListener("selectend", onSelectEnd);
  controller2.addEventListener("connected", function (event) {
    this.add(buildController(event.data));
  });
  controller2.addEventListener("disconnected", function () {
    this.remove(this.children[0]);
  });
  scene.add(controller2);
  scene.add(controller1);

  // Show controllers
  const controllerModelFactory = new XRControllerModelFactory();

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(
    controllerModelFactory.createControllerModel(controllerGrip1)
  );
  scene.add(controllerGrip1);
  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(
    controllerModelFactory.createControllerModel(controllerGrip2)
  );
  scene.add(controllerGrip2);

  function buildController(data) {
    console.log("test: ", data);
    let geometry, material;

    switch (data.targetRayMode) {
      case "tracked-pointer":
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -1], 3)
        );
        geometry.setAttribute(
          "color",
          new THREE.Float32BufferAttribute([0.5, 0.5, 0.5, 0, 0, 0], 3)
        );

        material = new THREE.LineBasicMaterial({
          vertexColors: true,
          blending: THREE.AdditiveBlending,
        });

        return new THREE.Line(geometry, material);

      case "gaze":
        geometry = new THREE.RingGeometry(0.02, 0.04, 32).translate(0, 0, -1);
        material = new THREE.MeshBasicMaterial({
          opacity: 0.5,
          transparent: true,
        });
        return new THREE.Mesh(geometry, material);
    }
  }

  // Controller Hanlder
  function handleController(controller) {
    if (controller.userData.isSelecting) {
      physics.setMeshPosition(spheres, controller.position, count);

      velocity.x = (Math.random() - 0.5) * 2;
      velocity.y = (Math.random() - 0.5) * 2;
      velocity.z = Math.random() - 9;
      velocity.applyQuaternion(controller.quaternion);

      physics.setMeshVelocity(spheres, velocity, count);

      if (++count === spheres.count) count = 0;
    }
  }

  // Renderer-Setup
  function render() {
    // Functions later
    // handleController(controller1);
    // handleController(controller2);

    renderer.render(scene, camera);

    // controls update
    controls.update();
  }
  renderer.setAnimationLoop(render);
};
