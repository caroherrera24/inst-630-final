import * as THREE from 'three';
window.THREE = THREE;
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import ThreeGlobe from "three-globe";

// create the globe
const globe = new ThreeGlobe()
  .globeImageUrl('public/images/earth-map.jpg')
  .bumpImageUrl('public/images/earth-bump.jpg');

// add clouds to the globe
let CLOUDS_ALT = 0.004;
let cloudRadius = globe.getGlobeRadius() * (1 + CLOUDS_ALT);
const cloudGeometry = new THREE.SphereGeometry(cloudRadius, 75, 75);
const clouds =  new THREE.Mesh(cloudGeometry);
const cloudLoader = new THREE.TextureLoader();

cloudLoader.load("public/images/earth-clouds.png", cloudsTexture => {
  clouds.material = new THREE.MeshPhongMaterial({
    map: cloudsTexture,
    transparent: true,
    opacity: 0.8
  });
});
globe.add(clouds);

// setup lights
const ambientLight = new THREE.AmbientLight(0xe3e3e3, 5);
const directionalLight = new THREE.DirectionalLight(0xfdfcf0, 1);
directionalLight.position.set(20, 10, 20);

// setup renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

// add renderer to the DOM
const globeViz = document.querySelector('#globeViz');
globeViz.appendChild(renderer.domElement);

// setup scene
const scene = new THREE.Scene();
scene.add(globe);
scene.add(ambientLight);
scene.add(directionalLight);

// setup camera
const camera = new THREE.PerspectiveCamera();
camera.aspect = window.innerWidth/window.innerHeight;
camera.updateProjectionMatrix();
camera.position.set(250,250,10);

// add camera controls
const tbControls = new TrackballControls(camera, renderer.domElement);
tbControls.minDistance = 100;
tbControls.rotateSpeed = 5;
tbControls.zoomSpeed = 0.8;

// kick-off renderer
(function animate() {
  // rotate the globe and clouds
  globe.rotation.y += .0005;
  clouds.rotation.y -= 0.00025 * Math.PI / 180;

  tbControls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
})();