import * as THREE from "../99_Lib/three.module.min.js";

import { BoxLineGeometry } from "../99_Lib/jsm/geometries/BoxLineGeometry.js";
import { XRButton } from "../99_Lib/jsm/webxr/XRButton.js";
import { XRControllerModelFactory } from "../99_Lib/jsm/webxr/XRControllerModelFactory.js";
import { MathUtils, Vector3 } from "../99_Lib/three.module.min.js";
import { Sky } from "../99_Lib/jsm/objects/Sky.js";
import { RapierPhysics } from "../99_Lib/jsm/physics/RapierPhysics.js";
import { OrbitControls } from "../99_Lib/jsm/controls/OrbitControls.js";

let camera, scene, renderer;
let controller1, controller2;
let controllerGrip1, controllerGrip2;

let room, spheres, physics;
const velocity = new THREE.Vector3();

let count = 0;

init();
await initPhysics();

function init() {
  scene = new THREE.Scene();
  // scene.background = new THREE.Color(0x505050);

  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    50
  );
  camera.position.set(0, 1.6, 3);

  room = new THREE.LineSegments(
    new BoxLineGeometry(19, 10, 19, 10, 10, 10),
    new THREE.LineBasicMaterial({ color: "0x808080" })
  );
  room.geometry.translate(0, 5, 0);
  scene.add(room);

  scene.add(new THREE.HemisphereLight(0xbbbbbb, 0x888888, 3));

  // Skybox erstellen
  const sky = new Sky();
  sky.scale.setScalar(10000);
  const phi = MathUtils.degToRad(90);
  const theta = MathUtils.degToRad(180);
  const sunPosition = new Vector3().setFromSphericalCoords(1, phi, theta);
  sky.material.uniforms.sunPosition.value = sunPosition;
  scene.add(sky);

  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(1, 1, 1).normalize();
  scene.add(light);

  //

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  //

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.maxDistance = 10;
  controls.target.y = 1.6;
  controls.update();

  document.body.appendChild(
    XRButton.createButton(renderer, {
      optionalFeatures: ["depth-sensing"],
      depthSensing: {
        usagePreference: ["gpu-optimized"],
        dataFormatPreference: [],
      },
    })
  );

  // controllers
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
  scene.add(controller1);

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


  //

  window.addEventListener("resize", onWindowResize);
}

function updateCameraPosition() {
  const session = renderer.xr.getSession();
  if(session) {
    const inputSources = session.inputSources;
    for(const inputSource of inputSources) {
      if(inputSource.gamepad) {
        const axes = inputSource.gamepad.axes;
        const buttons = inputSource.gamepad.buttons;
        const moveX = axes[2];  // left-right
        const moveZ = axes[3]; // forward-backward

        camera.position.z += moveZ * 0.1;
        camera.position.x += moveX * 0.1;

        if (buttons[0].pressed) {
          console.log('Button A pressed');
        }

        // Check if button B (index 1) is pressed
        if (buttons[1].pressed) {
          console.log('Button B pressed');
        }
      }
    }
  }  
}

function buildController(data) {
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

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

async function initPhysics() {
  physics = await RapierPhysics();

  {
    // Floor

    // const geometry = new THREE.BoxGeometry(6, 2, 6); // width, depth, height
    const geometry = new THREE.BoxGeometry(20, 0.2, 20); // width, depth, height
    const material = new THREE.MeshNormalMaterial({ visible: true });

    const floor = new THREE.Mesh(new THREE.BoxGeometry(20, 0.2, 20), material);
    floor.position.y = -0.1;
    floor.userData.physics = { mass: 0 };
    scene.add(floor);

    // Walls

    const wallPX = new THREE.Mesh(geometry, material);
    // wallPX.position.set(4, 3, 0);
    wallPX.position.set(10, 3, 0);
    wallPX.rotation.z = Math.PI / 2;
    wallPX.userData.physics = { mass: 0 };
    scene.add(wallPX);

    const wallNX = new THREE.Mesh(geometry, material);
    // wallNX.position.set(-4, 3, 0);
    wallNX.position.set(-10, 3, 0);
    wallNX.rotation.z = Math.PI / 2;
    wallNX.userData.physics = { mass: 0 };
    scene.add(wallNX);

    const wallPZ = new THREE.Mesh(geometry, material);
    // wallPZ.position.set(0, 3, 4);
    wallPZ.position.set(0, 3, 10);
    wallPZ.rotation.x = Math.PI / 2;
    wallPZ.userData.physics = { mass: 0 };
    scene.add(wallPZ);

    const wallNZ = new THREE.Mesh(geometry, material);
    // wallNZ.position.set(0, 3, -4);
    wallNZ.position.set(0, 3, -10);
    wallNZ.rotation.x = Math.PI / 2;
    wallNZ.userData.physics = { mass: 0 };
    scene.add(wallNZ);
  }

  // Spheres

  const geometry = new THREE.IcosahedronGeometry(0.08, 3);
  const material = new THREE.MeshLambertMaterial();

  spheres = new THREE.InstancedMesh(geometry, material, 800);
  spheres.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // will be updated every frame
  spheres.userData.physics = { mass: 1, restitution: 1.1 };
  scene.add(spheres);

  const matrix = new THREE.Matrix4();
  const color = new THREE.Color();

  for (let i = 0; i < spheres.count; i++) {
    const x = Math.random() * 4 - 2;
    const y = Math.random() * 4;
    const z = Math.random() * 4 - 2;
    // const x = 2;
    // const y = 2;
    // const z = 2;

    matrix.setPosition(x, y, z);
    spheres.setMatrixAt(i, matrix);
    spheres.setColorAt(i, color.setHex(0xffffff * Math.random()));
  }

  physics.addScene(scene);
}

//

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

function animate() {
  handleController(controller1);
  handleController(controller2);

  updateCameraPosition();

  renderer.render(scene, camera);
}
