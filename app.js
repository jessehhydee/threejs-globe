import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export default class Globe {

  vertex = `
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
  fragment = `
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

  constructor(options) {

    this.container  = options.domElementContainer;
    this.canvas     = options.domElementCanvas;

    this.sizes      = {
      width: this.container.offsetWidth,
      height: this.container.offsetHeight
    };

    this.camera             = new THREE.PerspectiveCamera(30, this.sizes.width / this.sizes.height, 1, 1000);
    this.camera.position.z  = 100;

    this.scene = new THREE.Scene();
    
    this.renderer = new THREE.WebGLRenderer({
      canvas:     this.canvas,
      antialias:  false
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const pointLight = new THREE.PointLight(0x081b26, 17, 200);
    pointLight.position.set(-50, 0, 60);
    this.scene.add(pointLight);
    this.scene.add(new THREE.HemisphereLight(0xffffbb, 0x080820, 1.5));

    this.controls                 = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.autoRotate      = true;
    this.controls.autoRotateSpeed = 2.0;
    this.controls.enableDamping   = true;
    this.controls.enableRotate    = false;
    this.controls.enablePan       = false;
    this.controls.enableZoom      = false;
    this.controls.minPolarAngle   = (Math.PI / 2) - 0.5;
    this.controls.maxPolarAngle   = (Math.PI / 2) + 0.5;

    this.raycaster      = new THREE.Raycaster();
    this.mouse          = new THREE.Vector2();
    this.cursor         = document.querySelector('.cursor');
    this.isIntersecting = false;

    this.twinkleTime  = 0.2;
    this.materials    = [];
    this.material     = new THREE.ShaderMaterial({
      side:     THREE.DoubleSide,
      uniforms: {
        u_time:         { value: 1.0 },
        u_maxExtrusion: { value: 1.0 }
      },
      vertexShader:   this.vertex,
      fragmentShader: this.fragment,
    });

    this.createGeometry();
    this.resize();
    this.listenTo();
    this.render();

  }

  createMaterial(timeValue) {

    const mat                 = this.material.clone();
    mat.uniforms.u_time.value = timeValue;
    this.materials.push(mat);
    return mat;

  }

  async createGeometry() {

    this.baseSphere   = new THREE.SphereGeometry(19.5, 28, 28);
    this.baseMaterial = new THREE.MeshStandardMaterial({color: 0x0b2636, transparent: true, opacity: 0.95});
    this.baseMesh     = new THREE.Mesh(this.baseSphere, this.baseMaterial);
    this.scene.add(this.baseMesh);
    
    this.image = new Image;
    this.image.onload = () => {

      this.image.needsUpdate  = true;

      this.imageCanvas        = document.createElement('canvas');
      this.imageCanvas.width  = this.image.width;
      this.imageCanvas.height = this.image.height;
        
      this.context = this.imageCanvas.getContext('2d');
      this.context.drawImage(this.image, 0, 0);
        
      this.imageData = this.context.getImageData(0, 0, this.imageCanvas.width, this.imageCanvas.height);

      this.dotSphereRadius  = 20;
      this.vector           = new THREE.Vector3();

      for(let i = 0, lon = -180, lat = 90; i < this.imageData.data.length; i += 4, lon += 2) {

        const red   = this.imageData.data[i];
        const green = this.imageData.data[i + 1];
        const blue  = this.imageData.data[i + 2];

        if(red > 100 && green > 100 && blue > 100) {

          this.vector = this.calcPosFromLatLonRad(lon, lat);

          this.dotGeometry = new THREE.CircleGeometry(0.1, 5);
          this.dotGeometry.lookAt(this.vector);
          this.dotGeometry.translate(this.vector.x, this.vector.y, this.vector.z);

          const m   = this.createMaterial(i / 4);
          this.mesh = new THREE.Mesh(this.dotGeometry, m);

          this.scene.add(this.mesh);
          
        }

        if(lon === 180) {
          lon  =  -180;
          lat -=  2;
        }

      }
      
    }

    this.image.src = 'img/world_alpha_mini.jpg';

  }

  calcPosFromLatLonRad(lon, lat) {
  
    var phi   = (90 - lat) * (Math.PI / 180);
    var theta = (lon + 180) * (Math.PI / 180);

    const x = -(this.dotSphereRadius * Math.sin(phi) * Math.cos(theta));
    const z = (this.dotSphereRadius * Math.sin(phi) * Math.sin(theta));
    const y = (this.dotSphereRadius * Math.cos(phi));
  
    return new THREE.Vector3(x, y, z);

  }

  resize() {

    this.sizes = {
      width:  this.container.offsetWidth,
      height: this.container.offsetHeight
    }
  
    this.camera.aspect = this.sizes.width / this.sizes.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.sizes.width, this.sizes.height);

  }

  mousemove(event) {

    this.isIntersecting         = false;
    this.controls.enableRotate  = false;

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    this.intersects = this.raycaster.intersectObject(this.baseMesh);
    if(this.intersects[0]) {
      this.isIntersecting         = true;
      this.controls.enableRotate  = true;
    }

  }

  mousedown() {

    if(!this.isIntersecting) return;

    this.materials.forEach(el => {
      gsap.to(el.uniforms.u_maxExtrusion, {value: 1.07});
    });

  }

  mouseup() {

    if(!this.isIntersecting) return;

    this.materials.forEach(el => {
      gsap.to(el.uniforms.u_maxExtrusion, {value: 1.0, duration: 1});
    });

  }

  listenTo() {

    window.addEventListener('resize',     this.resize.bind(this));
    window.addEventListener('mousemove',  this.mousemove.bind(this));
    window.addEventListener('mousedown',  this.mousedown.bind(this));
    window.addEventListener('mouseup',    this.mouseup.bind(this));

  }

  render() {

    this.materials.forEach(el => {
      el.uniforms.u_time.value += this.twinkleTime;
    });

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this))

  }

}

new Globe({
  domElementContainer:  document.querySelector('.container'),
  domElementCanvas:     document.querySelector('.canvas')
});