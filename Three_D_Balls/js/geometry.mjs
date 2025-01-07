import * as THREE from '../../99_Lib/three.module.min.js';

import { GLTFLoader } from '../../99_Lib/jsm/loaders/GLTFLoader.js';

// import vertexShader from '../shaders/vertexShader.glsl'
// import fragmentShader from '../shaders/fragmentShader.glsl'
// import test from '../shaders/test'




function httpGetAsync(theUrl) {
    return new Promise((resolve, reject) => {
        const xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState === 4)
                if (xmlHttp.status === 200)
                    resolve(xmlHttp.responseText);
                else
                    reject(`Error: ${xmlHttp.status}`);
        }
        xmlHttp.open("GET", theUrl, true);
        xmlHttp.send(null);
    });

}

export async function shaderMaterial(vertexShaderFile, fragmentShaderFile) {
    const vertexShader = await httpGetAsync(vertexShaderFile);
    const fragmentShader = await httpGetAsync(fragmentShaderFile);
    // console.log(vertexShader, fragmentShader);

    const material = new THREE.ShaderMaterial({
        uniforms: { 'thickness': { value: 1 } },
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide,
        alphaToCoverage: true, // only works when WebGLRenderer's "antialias" is set to "true"
        vertexShader,
        fragmentShader
    });

    return material;
}

console.log("ThreeJs " + THREE.REVISION);


const loader = new GLTFLoader();

export function loadGLTF(filename, parent) {
    loader.load(filename, function (gltf) {
        gltf.scene.scale.set(0.2, 0.2, 0.2) // scale here
        gltf.scene.position.set(1, 0.5, 0);

        gltf.scene.traverse(child => {
            if (child.material) child.material.metalness = 0;
        });
        parent.add(gltf.scene);
    }, undefined, function (error) {
        console.error(error);
    });
}

export function loadGLTFcb(filename, cb) {
    loader.load(filename, cb, undefined, function (error) {
        console.error(error);
    });
}



const geometries = [
    new THREE.BoxGeometry(0.25, 0.25, 0.25),
    new THREE.ConeGeometry(0.1, 0.4, 64),
    new THREE.CylinderGeometry(0.2, 0.2, 0.2, 64),
    new THREE.IcosahedronGeometry(0.2, 3),
    new THREE.TorusKnotGeometry(.2, .03, 50, 16),
    new THREE.TorusGeometry(0.2, 0.04, 64, 32),

];

export function randomMaterial() {
    return new THREE.MeshStandardMaterial({
        color: Math.random() * 0xff3333,
        roughness: 0.2,
        metalness: 0.4
    });
}

export function add(i, parent, x = 0, y = 0, z = 0) {
    let object = new THREE.Mesh(geometries[i], randomMaterial());
    object.position.set(x, y, z);
    object.updateMatrix();
    object.castShadow = true;
    object.name = `o_${i}`;
    object.matrixAutoUpdate = false;
    parent.add(object);
    return object;
}


export function createLine(scene) {
    const material = new THREE.LineBasicMaterial({ color: 0xffffff });
    const points = [];
    points.push(new THREE.Vector3(0, 0, 0));
    points.push(new THREE.Vector3(0, 1, 0));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const line = new THREE.Line(geometry, material);
    scene.add(line);

    const position = line.geometry.attributes.position.array;

    return (idx, pos) => {
        idx *= 3;
        position[idx++] = pos.x;
        position[idx++] = pos.y;
        position[idx++] = pos.z;
        line.geometry.attributes.position.needsUpdate = true;
    }
}
