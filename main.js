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
const cloudLoader = new THREE.TextureLoader().load("public/images/earth-clouds.png");
const cloudMaterial = new THREE.MeshPhongMaterial({
    map: cloudLoader,
    transparent: true,
    opacity: 0.8
  });
const clouds =  new THREE.Mesh(cloudGeometry, cloudMaterial);
globe.add(clouds);


// add stars
const starLoader = new THREE.TextureLoader().load("public/images/starfield.png");
const starGeometry = new THREE.SphereGeometry(1000, 50, 50);
const starMaterial = new THREE.MeshPhongMaterial({
  map: starLoader,
  side: THREE.DoubleSide,
  shininess: 0
});
const starField = new THREE.Mesh(starGeometry, starMaterial);

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
scene.add(starField);

// setup camera
const camera = new THREE.PerspectiveCamera();
camera.aspect = window.innerWidth/window.innerHeight;
camera.updateProjectionMatrix();
camera.position.set(250,250,10);

// add camera controls
const tbControls = new TrackballControls(camera, renderer.domElement);
tbControls.minDistance = 100;
tbControls.maxDistance = 1000;
tbControls.rotateSpeed = 5;
tbControls.zoomSpeed = 0.8;

// kick-off renderer
(function animate() {
  // rotate the globe and clouds
  globe.rotation.y += .0005;
  clouds.rotation.y += 0.004 * Math.PI / 180;

  tbControls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
})();