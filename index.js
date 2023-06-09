import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const vertex = `
  #ifdef GL_ES
  precision mediump float;
  #endif

  uniform float u_time;
  uniform float u_maxExtrusion;

  void main() {

    vec3 newPosition = position;
    if(u_maxExtrusion > 1.0) newPosition.xyz = newPosition.xyz * u_maxExtrusion + sin(u_time);
    else newPosition.xyz = newPosition.xyz * u_maxExtrusion;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );

  }
`;
const fragment = `
  #ifdef GL_ES
  precision mediump float;
  #endif

  uniform float u_time;

  vec3 colorA = vec3(0.196, 0.631, 0.886);
  vec3 colorB = vec3(0.192, 0.384, 0.498);

  void main() {

    vec3  color = vec3(0.0);
    float pct   = abs(sin(u_time));
          color = mix(colorA, colorB, pct);

    gl_FragColor = vec4(color, 1.0);

  }
`;

const container = document.querySelector('.container');
const canvas    = document.querySelector('.canvas');

let
sizes,
scene,
camera,
renderer,
controls,
raycaster,
mouse,
isIntersecting,
twinkleTime,
materials,
material,
baseMesh;

const setScene = () => {

  sizes = {
    width:  container.offsetWidth,
    height: container.offsetHeight
  };

  scene = new THREE.Scene();

  camera             = new THREE.PerspectiveCamera(30, sizes.width / sizes.height, 1, 1000);
  camera.position.z  = 100;
  
  renderer = new THREE.WebGLRenderer({
    canvas:     canvas,
    antialias:  false,
    alpha:      true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const pointLight = new THREE.PointLight(0x081b26, 17, 200);
  pointLight.position.set(-50, 0, 60);
  scene.add(pointLight);
  scene.add(new THREE.HemisphereLight(0xffffbb, 0x080820, 1.5));

  raycaster      = new THREE.Raycaster();
  mouse          = new THREE.Vector2();
  isIntersecting = false;

  setControls();
  setBaseSphere();
  setShaderMaterial();
  setMap();
  resize();
  listenTo();
  render();

}

const setControls = () => {

  controls                 = new OrbitControls(camera, renderer.domElement);
  // controls.autoRotate      = true;
  controls.autoRotate      = false;
  controls.autoRotateSpeed = 2.0;
  controls.enableDamping   = true;
  controls.enableRotate    = true;
  controls.enablePan       = false;
  controls.enableZoom      = false;
  // controls.minPolarAngle   = (Math.PI / 2) - 0.5;
  // controls.maxPolarAngle   = (Math.PI / 2) + 0.5;

};

const setBaseSphere = () => {

  const baseSphere   = new THREE.SphereGeometry(19.5, 35, 35);
  const baseMaterial = new THREE.MeshStandardMaterial({
    color:        0x0b2636, 
    transparent:  true, 
    opacity:      0.95
  });
  baseMesh = new THREE.Mesh(baseSphere, baseMaterial);
  scene.add(baseMesh);

}

const setShaderMaterial = () => {

  twinkleTime  = 0.1;
  materials    = [];
  material     = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      u_time:         { value: 1.0 },
      u_maxExtrusion: { value: 1.0 }
    },
    vertexShader:   vertex,
    fragmentShader: fragment,
  });

}

const setMap = () => {

  const calcPosFromLatLonRad = (lon, lat, radius = 20) => {
  
    var phi   = (90 - lat)  * (Math.PI / 180);
    var theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
  
    return new THREE.Vector3(x, y, z);

  }

  const createMaterial = (timeValue) => {

    const mat                 = material.clone();
    mat.uniforms.u_time.value = timeValue;
    materials.push(mat);
    return mat;

  }
  
  const image   = new Image;
  image.onload  = () => {

    image.needsUpdate  = true;

    const imageCanvas  =  document.createElement('canvas');
    imageCanvas.width  =  image.width;
    imageCanvas.height =  image.height;
      
    const context = imageCanvas.getContext('2d');
    context.drawImage(image, 0, 0);
      
    const imageData = context.getImageData(0, 0, imageCanvas.width, imageCanvas.height);

    let vector = new THREE.Vector3();

    let dotsPerLat = 0;
    const lats = [];
    const dotCount = 42000;
    
    for (let i = 0; i < dotCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / dotCount);
      const theta = Math.sqrt(dotCount * Math.PI) * phi;

      vector.setFromSphericalCoords(20, phi, theta);
      let dotGeometry;
      if(vector.x > -0.172 && vector.x < 0.172 && vector.z > 0) {
        lats.push(dotsPerLat);
        dotsPerLat = 0;
        // dotGeometry = new THREE.CircleGeometry(0.2, 5);
      }
      // else dotGeometry = new THREE.CircleGeometry(0.1, 5);
      // dotGeometry.lookAt(vector);
      // dotGeometry.translate(vector.x, vector.y, vector.z);

      // const m     = createMaterial(i / 4);
      // const mesh  = new THREE.Mesh(dotGeometry, m);

      // scene.add(mesh);
      dotsPerLat++;
    }

    console.log('lats:', lats);

    const imageLats = [];

    for(let i = 0, lon = -180, lat = 90, imageLatsIndex = 0; i < imageData.data.length; i += 4, lon += 2) {

      if(!imageLats[imageLatsIndex]) imageLats[imageLatsIndex] = [];

      const red   = imageData.data[i];
      const green = imageData.data[i + 1];
      const blue  = imageData.data[i + 2];

      if(red > 100 && green > 100 && blue > 100) {

        // vector = calcPosFromLatLonRad(lon, lat);
        // const phi = Math.acos(-1 + (2 * e) / (imageData.data.length / 4));
        // const theta = Math.sqrt((imageData.data.length / 4) * Math.PI) * phi;
        // vector.setFromSphericalCoords(20, phi, theta);
        
        // const dotGeometry = new THREE.CircleGeometry(0.1, 5);
        // dotGeometry.lookAt(vector);
        // dotGeometry.translate(vector.x, vector.y, vector.z);

        // const m     = createMaterial(i / 4);
        // const mesh  = new THREE.Mesh(dotGeometry, m);

        // scene.add(mesh);
        // dotsPerLat++;

        imageLats[imageLatsIndex].push(1);
        imageLats[imageLatsIndex].push(1);
        imageLats[imageLatsIndex].push(1);
        
      }
      else {
        imageLats[imageLatsIndex].push(0);
        imageLats[imageLatsIndex].push(0);
        imageLats[imageLatsIndex].push(0);
      }

      // if(lat === 90) console.log('e');
      if(lon === 180) {
        lon  =  -180;
        lat -=  2;
        imageLatsIndex++;
        imageLats[imageLatsIndex] = imageLats[imageLatsIndex - 1];
        imageLatsIndex++;
      }

    }

    console.log('imageLats:', imageLats);

    let dot = dotCount;
    for(let i = 0; i < lats.length; i++) {

      const imageLat = imageLats[i] ? imageLats[i] : imageLats[0];
      const chunk = Math.floor(imageLat.length / lats[i]);
      console.log(chunk);
      let start = 0;

      for(let e = 0; e < lats[i]; e++) {
        dot--;
        let numOfPositive = 0;
        let numOfNegative = 0;

        for(let o = 0; o < chunk; o++) {
          if(imageLat[start + o] === 1) numOfPositive++;
          else numOfNegative++;
        }

        start += chunk;
        if(numOfPositive >= numOfNegative) {
          const phi = Math.acos(-1 + (2 * dot) / dotCount);
          const theta = Math.sqrt(dotCount * Math.PI) * phi;

          vector.setFromSphericalCoords(20, phi, theta);
          
          const dotGeometry = new THREE.CircleGeometry(0.1, 5);
          dotGeometry.lookAt(vector);
          dotGeometry.translate(vector.x, vector.y, vector.z);

          const m     = createMaterial(dot / 4);
          const mesh  = new THREE.Mesh(dotGeometry, m);

          scene.add(mesh);
        }
      }

    }
    // for(let i = 0; i < lats.length; i++) {

    //   const temp = [];
    //   const imageLat = imageLats[i] ? imageLats[i] : imageLats[0];
    //   const chunks = Math.floor(imageLat.length / lats[i]);
    //   console.log(chunks);
    //   let previousChuckEnd = 0;

    //   for(let e = 0; e < chunks; e++) {
    //     const currentChunkEnd = previousChuckEnd + chunks;
    //     temp.push(imageLat.slice(previousChuckEnd, currentChunkEnd));
    //     previousChuckEnd = currentChunkEnd;
    //   }

    //   console.log(temp);
    //   for(let o = 0; o < temp.length; o++) {
    //     dot++;
    //     let numOfPositive = 0;
    //     let numOfNegative = 0;
    //     for(let u = 0; u < temp[o].length; u++) {
    //       if(temp[o][u] === 1) numOfPositive++;
    //       else numOfNegative++;
    //     }

    //     if(numOfPositive >= numOfNegative) {
    //       const phi = Math.acos(-1 + (2 * dot) / dotCount);
    //       const theta = Math.sqrt(dotCount * Math.PI) * phi;

    //       vector.setFromSphericalCoords(20, phi, theta);
          
    //       const dotGeometry = new THREE.CircleGeometry(0.1, 5);
    //       dotGeometry.lookAt(vector);
    //       dotGeometry.translate(vector.x, vector.y, vector.z);

    //       const m     = createMaterial(dot / 4);
    //       const mesh  = new THREE.Mesh(dotGeometry, m);

    //       scene.add(mesh);
    //     }
    //   }

    // }

    // for(let i = 0; i < dotCount; i++) {
    //   const phi = Math.acos(-1 + (2 * i) / dotCount);
    //   const theta = Math.sqrt(dotCount * Math.PI) * phi;

    //   vector.setFromSphericalCoords(20, phi, theta);
      
    //   const dotGeometry = new THREE.CircleGeometry(0.1, 5);
    //   dotGeometry.lookAt(vector);
    //   dotGeometry.translate(vector.x, vector.y, vector.z);

    //   const m     = createMaterial(i / 4);
    //   const mesh  = new THREE.Mesh(dotGeometry, m);

    //   scene.add(mesh);
    // }

    
  }

  image.src = 'img/world_alpha_mini.jpg';

}

const resize = () => {

  sizes = {
    width:  container.offsetWidth,
    height: container.offsetHeight
  };

  if(window.innerWidth > 700) camera.position.z = 100;
  else camera.position.z = 140;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);

}

const mousemove = (event) => {

  isIntersecting = false;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObject(baseMesh);
  if(intersects[0]) {
    isIntersecting = true;
    document.body.style.cursor = 'pointer';
  }
  else document.body.style.cursor = 'default';

}

const mousedown = () => {

  if(!isIntersecting) return;

  materials.forEach(el => {
    gsap.to(el.uniforms.u_maxExtrusion, {value: 1.07});
  });

}

const mouseup = () => {

  materials.forEach(el => {
    gsap.to(el.uniforms.u_maxExtrusion, {value: 1.0, duration: 0.3});
  });

}

const listenTo = () => {

  window.addEventListener('resize',     resize.bind(this));
  window.addEventListener('mousemove',  mousemove.bind(this));
  window.addEventListener('mousedown',  mousedown.bind(this));
  window.addEventListener('mouseup',    mouseup.bind(this));

}

const render = () => {

  materials.forEach(el => {
    el.uniforms.u_time.value += twinkleTime;
  });

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(render.bind(this))

}

setScene();