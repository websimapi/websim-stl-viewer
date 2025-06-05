import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

let scene, camera, renderer, controls;
let currentMesh = null; // Variable to keep track of the currently loaded mesh
const fileInput = document.getElementById('stl-file-input');
const fileNameSpan = document.getElementById('file-name');


function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 10);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 1).normalize();
    scene.add(directionalLight);

    // Initial load of example STL file
    loadSTL('https://threejs.org/examples/models/stl/printers/cube_core.stl');


    // Animation loop
    function animate() {
        requestAnimationFrame(animate);

        controls.update(); // required if controls.enableDamping or controls.autoRotate are set to true

        renderer.render(scene, camera);
    }

    animate();

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Handle file input change
    fileInput.addEventListener('change', handleFileSelect);
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) {
        fileNameSpan.textContent = 'No file chosen';
        return;
    }

    fileNameSpan.textContent = file.name;
    loadSTL(file); // Pass the File object directly
}


function loadSTL(stlFileOrUrl) {
     // Remove previous mesh if exists
    if (currentMesh) {
        scene.remove(currentMesh);
        currentMesh.geometry.dispose();
        currentMesh.material.dispose();
        currentMesh = null;
    }

    const loader = new STLLoader();

    const onLoad = function (geometry) {
        const material = new THREE.MeshPhongMaterial({ color: 0xff5533, specular: 0x111111, shininess: 200 });
        const mesh = new THREE.Mesh(geometry, material);

        // Optional: Center the model
        geometry.computeBoundingBox();
        if (!geometry.boundingBox) {
             console.error("Could not compute bounding box for the geometry.");
             // Fallback: Just add the mesh without centering/fitting
             scene.add(mesh);
             currentMesh = mesh;
             return;
        }

        const center = new THREE.Vector3();
        geometry.boundingBox.getCenter(center);
        mesh.position.sub(center); // Center the mesh's position

        scene.add(mesh);
        currentMesh = mesh; // Store the new mesh

        // Optional: Fit camera to model
        const size = geometry.boundingBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
         cameraZ *= 1.5; // Add some padding

        const modelCenter = new THREE.Vector3(center.x, center.y, center.z);
        camera.position.set(modelCenter.x, modelCenter.y, modelCenter.z + cameraZ);
        controls.target.copy(modelCenter);
        controls.update();


    };

    const onProgress = function (xhr) {
        // Progress callback
        if (xhr.lengthComputable) {
           const percentComplete = (xhr.loaded / xhr.total) * 100;
           console.log(Math.round(percentComplete, 2) + '% downloaded');
        } else {
            console.log(xhr.loaded + ' bytes downloaded');
        }

    };

    const onError = function (error) {
        // Error callback
        console.error('An error happened', error);
        fileNameSpan.textContent = 'Error loading file';
    };


    // Check if input is a URL or a File object
    if (typeof stlFileOrUrl === 'string') {
        loader.load(stlFileOrUrl, onLoad, onProgress, onError);
        fileNameSpan.textContent = 'Loading example cube_core.stl...';
    } else if (stlFileOrUrl instanceof File) {
         // Use FileReader to read the File as ArrayBuffer, then parse with STLLoader
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                 const geometry = loader.parse(event.target.result);
                 onLoad(geometry); // Call the same load handler
            } catch (e) {
                 onError(e);
            }
        };
        reader.onerror = onError;
        reader.readAsArrayBuffer(stlFileOrUrl);

    } else {
        console.error("Invalid input for loadSTL");
         fileNameSpan.textContent = 'Invalid file input';
    }

}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize the scene
init();