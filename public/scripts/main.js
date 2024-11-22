import promiseData from './meteorites.js';
import * as THREE from 'three';
window.THREE = THREE;
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { OrbitControls } from "https://threejs.org/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import ThreeGlobe from "three-globe";
gsap.registerPlugin(EasePack);
gsap.registerPlugin(TextPlugin);

let renderer;
let vertices = [];
let yearText = document.createElement("p");
let loadingScreen = document.querySelector( '#loading-screen' );

const loadingManager = new THREE.LoadingManager( () => {
	
  loadingScreen.classList.add( 'fade-out' ); 
  loadingScreen.addEventListener( 'transitionend', onTransitionEnd );

  yearText.id = "info";
  // yearText.innerHTML = "year placeholder";
  globeViz.appendChild(yearText);
    
} );

(async () => {
  const results = await promiseData("cleaned-data.json");
  // console.log(results);

  // creates timeline for animation
  const tl = gsap.timeline();

  // loop over each item of data
  for (const row of results) {
    const loader = new GLTFLoader( loadingManager);
    loader.load( 'public/asteroid.glb', ( gltf ) => {

      const model = gltf.scene;
      model.scale.set( 0.1, 0.1, 0.1 );
      if (row.long < -20) {
        model.position.set(-1500, 1750, 1000);
      } else {
        model.position.set(1000, 1750, -1500);
      }
      const site = calcPosition(row.lat, row.long);
      // model.position.set(site.x, site.y, site.z);

      // push site positions to verticies array
      vertices.push(site);

      // add animation for meteorite landings on the globe
      tl.to(yearText, { duration: 1.2, text: row.year, repeat: 1, repeatDelay: 2, yoyo: true });
      tl.to(model.position, { x: site.x, y: site.y, z: site.z, duration: 1.2, ease: "power1.out" }, "<");
      tl.to(model.scale, 1, { x: 0, y: 0, z: 0 }, "<+=0.5");

      const animation = () => {
        globe.ringsData([row])
          .ringLat(row.lat)
          .ringLng(row.long)
          .ringColor(() => "#FF0000")
          .ringRepeatPeriod(3000);
      };
      tl.add(animation, ">");
      // tl.set({}, {}, "+=1")

      setTimeout(() => {      
      scene.add( model );

      (function rotateMeteorite() {
        // rotate the meteorite model
        model.rotation.x += 0.05;
        model.rotation.y += 0.05;
        model.rotation.z += 0.05;
        requestAnimationFrame(rotateMeteorite);
      })();

      }, 50)
    } );
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

console.log(vertices);

// setup lights
const ambientLight = new THREE.AmbientLight(0xe3e3e3, 5);
const directionalLight = new THREE.DirectionalLight(0xfdfcf0, 1);
directionalLight.position.set(20, 10, 20);

// setup renderer
renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

// add renderer to the DOM
const globeViz = document.createElement("div");
globeViz.id = "globeViz";
// const globeViz = document.querySelector('#globeViz');
globeViz.appendChild(renderer.domElement);
document.body.insertBefore( globeViz, loadingScreen );

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
const controls = new OrbitControls( camera, renderer.domElement );
controls.minDistance = 101;
controls.maxDistance = 1000;
controls.rotateSpeed = 0.4;
controls.zoomSpeed = 0.8;

window.addEventListener( 'resize', onWindowResize );

// update content's size if the window's size changes
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
  clouds.rotation.y += 0.008 * Math.PI / 180;

  controls.update();
  render();
  requestAnimationFrame(animate);
})();

function render() {
  renderer.render( scene, camera );
}

// converts latitude and longitude to spherical coordinates on the globe
function calcPosition(lat,lon){
  const convertToRad = {
    lat: THREE.MathUtils.degToRad(90 - lat),
    lon: THREE.MathUtils.degToRad(lon)
  };
  // console.log(convertToRad);
  
  let radius = 100;
  
  const vector = new THREE.Vector3().setFromSphericalCoords(
    radius,
    convertToRad.lat,
    convertToRad.lon
  );

  return vector
}

function onTransitionEnd( event ) {

	event.target.remove();
	
}