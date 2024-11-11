import * as THREE from 'three';
window.THREE = THREE;
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { OrbitControls } from "https://threejs.org/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import ThreeGlobe from "three-globe";

let model;

// create the globe
const globe = new ThreeGlobe()
  .globeImageUrl('public/images/earth-map.jpg')
  .bumpImageUrl('public/images/earth-bump.jpg');

// add clouds to the globe
let CLOUDS_ALT = 0.01;
let cloudRadius = globe.getGlobeRadius() * (1 + CLOUDS_ALT);
console.log(globe.getGlobeRadius())
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
const starGeometry = new THREE.SphereGeometry(1000, 200, 50);
const starMaterial = new THREE.MeshPhongMaterial({
  map: starLoader,
  side: THREE.DoubleSide,
  shininess: 0
});
const starField = new THREE.Mesh(starGeometry, starMaterial);

const loader = new GLTFLoader();
						loader.load( 'public/asteroid.glb', async function ( gltf ) {

							model = gltf.scene;
              model.scale.set( 0.05, 0.05, 0.05 );
              // model.position.set(100, 175, -150);
              const site = calcPosition(9.53333, 39.71667);
              model.position.set(site.x, site.y, site.z);

							// wait until the model can be added to the scene without blocking due to shader compilation
							await renderer.compileAsync( model, camera, scene );

							scene.add( model );

							render();
			
						} );

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
// const controls = new TrackballControls(camera, renderer.domElement);
// controls.minDistance = 100;
// controls.maxDistance = 1000;
// controls.rotateSpeed = 5;
// controls.zoomSpeed = 0.8;

const controls = new OrbitControls( camera, renderer.domElement );
controls.minDistance = 100;
controls.maxDistance = 1000;
controls.rotateSpeed = 0.4;
controls.zoomSpeed = 0.8;

window.addEventListener( 'resize', onWindowResize );

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

  render();

}

// kick-off renderer
(function animate() {
  // rotate the globe and clouds
  // globe.rotation.y += .0005;
  clouds.rotation.y += 0.004 * Math.PI / 180;

  if (model) {
    model.rotation.x += 0.01;
    model.rotation.y += 0.01;
  }

  controls.update();
  render();
  requestAnimationFrame(animate);
})();

function render() {

  renderer.render( scene, camera );

}

function calcPosition(lat,lon){
  const parisSpherical = {
    lat: THREE.MathUtils.degToRad(90 - lat),
    lon: THREE.MathUtils.degToRad(lon)
  };
  // console.log(parisSpherical);
  
  let radius = 100;
  
  const parisVector = new THREE.Vector3().setFromSphericalCoords(
    radius,
    parisSpherical.lat,
    parisSpherical.lon
  );

  return parisVector

}

