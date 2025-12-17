// 3D Scene Setup with THREE.js

let cube; // Make cube globally accessible
let targetScale = 1;

const scene = new THREE.Scene();
const camera3D = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshStandardMaterial({
  color: 0x00ffff,
  metalness: 0.6,
  roughness: 0.2
});
cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const light = new THREE.PointLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

camera3D.position.z = 5;

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Smooth rotation transition
  cube.rotation.x += (targetX - cube.rotation.x) * 0.2;
  cube.rotation.y += (targetY - cube.rotation.y) * 0.2;
  // Smooth scale transition
  const currentScale = cube.scale.x;
  const newScale = currentScale + (targetScale - currentScale) * 0.2;
  cube.scale.set(newScale, newScale, newScale);
  
  renderer.render(scene, camera3D);
}
animate();
