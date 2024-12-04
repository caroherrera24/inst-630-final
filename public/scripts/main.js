import promiseData from './meteorites.js';
import * as THREE from 'three';
window.THREE = THREE;
import { OrbitControls } from "https://threejs.org/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import ThreeGlobe from "three-globe";
gsap.registerPlugin(EasePack);
gsap.registerPlugin(TextPlugin);

let renderer;
let yearText = document.createElement("p");
let loadingScreen = document.querySelector( '#loading-screen' );
let tooltip = document.createElement("div");

// create scene
const scene = new THREE.Scene();

// create instanced mesh with box geometry
const MAX_POINTS = 1065;
const PARTICLE_SIZE = 1;
const cubeGeometry = new THREE.BoxGeometry(PARTICLE_SIZE, PARTICLE_SIZE, PARTICLE_SIZE);
const cubeMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.1,
});

const count = MAX_POINTS;
let radius = 100;
const instancedMesh = new THREE.InstancedMesh(cubeGeometry, cubeMaterial, count);
scene.add(instancedMesh);
instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

// setup userData array to add to later
instancedMesh.userData = [];

// position cubes on the sphere surface
const dummy = new THREE.Object3D();
const idleColor = new THREE.Color(0xffffff);
const hoverColor = new THREE.Color(0xff0000)
for (let i = 0; i < count; i++) {
  dummy.position.randomDirection().multiplyScalar(radius);
  dummy.scale.setScalar(3)
  dummy.updateMatrix();
  instancedMesh.setMatrixAt(i, dummy.matrix);
  instancedMesh.setColorAt(i, idleColor);
}

// keep track of a meteroite model's loading progress
const loadingManager = new THREE.LoadingManager( () => {
  // remove loading screen once the models finish loading
  loadingScreen.classList.add( 'fade-out' ); 
  loadingScreen.addEventListener( 'transitionend', onTransitionEnd );

  // add year text and tooltip when the models finish loading
  yearText.id = "year-text";
  tooltip.id = "tooltip";
  globeViz.appendChild(yearText);  
  globeViz.appendChild(tooltip);
} );

(async () => {
  const results = await promiseData("data/cleaned-data.json");
  // console.log(results);

  // creates timeline for animation
  const tl = gsap.timeline();

  // loop over each item of data
  let index = 0;
  for (const row of results) {
    // convert latitude and longitude to polar coordinates
    const site = globe.getCoords(row.lat, row.long);

    // add data to each particle
    instancedMesh.userData.push({
      city: row.name,
      class: row.class,
      mass: row.mass,
      year: row.year
    });

    dummy.position.set(site.x, site.y, site.z)
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(index, dummy.matrix);
    instancedMesh.instanceMatrix.needsUpdate = true; 
    instancedMesh.setColorAt(index, idleColor);

    const loader = new GLTFLoader( loadingManager);
    loader.load( 'public/asteroid.glb', ( gltf ) => {
      // initalize each meteorite model
      const model = gltf.scene;
      model.scale.set( 0.1, 0.1, 0.1 );
      if (row.long < -20) {
        model.position.set(-1500, 1750, 1000);
      } else {
        model.position.set(1000, 1750, -1500);
      }
      // model.position.set(site.x, site.y, site.z);

      // add animation for meteorite landings on the globe
      tl.to(yearText, { duration: 1.2, text: row.year, repeat: 1, repeatDelay: 2, yoyo: true });
      tl.to(model.position, { x: site.x, y: site.y, z: site.z, duration: 1.2, ease: "power1.out" }, "<");
      tl.to(model.scale, 1, { x: 0, y: 0, z: 0 }, "<+=0.5");
      
      // ring animation
      const animation = () => {
        globe.ringsData([row])
          .ringLat(row.lat)
          .ringLng(row.long)
          .ringColor(() => "#FF0000")
          .ringRepeatPeriod(3000);
      };
      tl.add(animation, ">");

      setTimeout(() => {      
        scene.add( model );

        // rotate the meteorite model
        (function rotateMeteorite() {
          model.rotation.x += 0.05;
          model.rotation.y += 0.05;
          model.rotation.z += 0.05;
          requestAnimationFrame(rotateMeteorite);
        })();
      }, 50);
    } );
    index++;
  }
})();

// create the globe
const globe = new ThreeGlobe()
  .globeImageUrl('public/images/earth-map.jpg')
  .bumpImageUrl('public/images/earth-bump.jpg');

// add clouds to the globe
let CLOUDS_ALT = 0.01;
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
const starGeometry = new THREE.SphereGeometry(1000, 200, 50);
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
renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animation);

// add renderer to the DOM
const globeViz = document.createElement("div");
globeViz.id = "globeViz";
// const globeViz = document.querySelector('#globeViz');
globeViz.appendChild(renderer.domElement);
document.body.insertBefore( globeViz, loadingScreen );

// add to scene
scene.add(globe);
scene.add(ambientLight);
scene.add(directionalLight);
scene.add(starField);

// setup camera
const camera = new THREE.PerspectiveCamera();
camera.aspect = window.innerWidth/window.innerHeight;
camera.position.set(220,220,10);
camera.updateProjectionMatrix();

// add camera controls
const controls = new OrbitControls( camera, renderer.domElement );
controls.minDistance = 101;
controls.maxDistance = 1000;
controls.rotateSpeed = 0.4;
controls.zoomSpeed = 0.8;

// add raycaster
const raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = PARTICLE_SIZE;
const pointer = new THREE.Vector2(9999,9999);

window.addEventListener( 'resize', onWindowResize );
window.addEventListener('pointermove', onPointerMove);
document.addEventListener('pointerout', () => pointer.set(99999, 99999));

// update content's size if the window's size changes
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
}

// keep track of where the cursor moves
function onPointerMove( event ) {
  pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

let oldIntersect = null;
let colorsNeedsUpdate = false;
function animation() {
  controls.update();

  // update raycaster
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObject(instancedMesh);
  if (oldIntersect) {
    instancedMesh.setColorAt(oldIntersect, idleColor);
    colorsNeedsUpdate = true;
    tooltip.textContent = '';
  }

  if (intersects.length) {
    // console.log(intersects[0])
    const instanceId = intersects[0].instanceId;
    // console.log(instanceId);

    oldIntersect = instanceId;
    instancedMesh.setColorAt(instanceId, hoverColor);
    colorsNeedsUpdate = true;

    tooltip.textContent = `City: ${instancedMesh.userData[instanceId].city}`;
  }

  if (colorsNeedsUpdate)
    instancedMesh.instanceColor.needsUpdate = true;

  renderer.render(scene, camera);
}

function onTransitionEnd( event ) {
	event.target.remove();
}
