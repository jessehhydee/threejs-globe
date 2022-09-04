import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import earthTexture from './img/world_alpha.jpg';

export default class Globe {

  constructor(options) {

    this.container  = options.domElementContainer;
    this.canvas     = options.domElementCanvas;

    this.sizes      = {
      width: this.container.offsetWidth,
      height: this.container.offsetHeight
    }

    this.camera             = new THREE.PerspectiveCamera(30, this.sizes.width / this.sizes.height, 1, 1000);
    this.camera.position.z  = 100;

    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({
      canvas:     this.canvas,
      antialias:  true,
      alpha:      true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.time = 0;
    this.createGeometry();
    this.resize();
    this.listenToResize();
    this.render();

  }

  async createGeometry() {

    this.baseSphere   = new THREE.SphereGeometry(20, 50, 50);
    // this.baseMaterial = new THREE.MeshBasicMaterial({
    //   color: 0x0b2636,
    //   transparent: true,
    //   map: new THREE.TextureLoader().load(earthTexture)
    // });
    this.baseMaterial = new THREE.MeshBasicMaterial({color: 0x0b2636, transparent: true, opacity: 1});
    this.baseMesh     = new THREE.Mesh(this.baseSphere, this.baseMaterial);
    // this.scene.add(this.baseMesh);

    this.image              = document.querySelector('.world_map');
    this.image.needsUpdate  = true;

    this.imageCanvas        = document.createElement('canvas');
    this.imageCanvas.width  = this.image.width;
    this.imageCanvas.height = this.image.height;
      
    let context = this.imageCanvas.getContext('2d');
    context.drawImage(this.image, 0, 0);
      
    this.imageData = context.getImageData(0, 0, this.imageCanvas.width, this.imageCanvas.height); // Pixels then proceed from left to right, then downward, throughout the array.

    // console.log(this.imageData);

    this.dotAmount        = 9025;
    // this.dotAmount        = 1000;
    this.dotSphereRadius  = 20;
    this.vector           = new THREE.Vector3();

    for(let i = 0, lon = -180, lat = 90; i < this.imageData.data.length; i += 4, lon += 2) {

      // const phi   = Math.acos(-1 + (2 * (i / 4)) / (this.imageData.data.length / 4 ));
      // const theta = Math.sqrt((this.imageData.data.length / 4 ) * Math.PI) * phi;
      // this.vector.setFromSphericalCoords(this.dotSphereRadius, phi, theta);

      const red   = this.imageData.data[i];
      const green = this.imageData.data[i + 1];
      const blue  = this.imageData.data[i + 2];
      const alpha = this.imageData.data[i + 3];
      if(red > 200 && green > 200 && blue > 200) {

        this.vector = this.calcPosFromLatLonRad(lon, lat);

        this.dotGeometry  = new THREE.CircleGeometry(0.2, 5);
        this.dotGeometry.lookAt(this.vector);
        this.dotGeometry.translate(this.vector.x, this.vector.y, this.vector.z);

        this.material     = new THREE.MeshBasicMaterial({color: 0x32a1e2, side: THREE.DoubleSide});
        this.mesh         = new THREE.Mesh(this.dotGeometry, this.material);

        this.scene.add(this.mesh);
        
      }

      if(lon === 180) {
        lon = -180;
        lat -= 2;
      }

    }

    // for(let i = 0; i < this.dotAmount; i++) {

    //   const phi = Math.acos(-1 + (2 * i) / this.dotAmount);
    //   const theta = Math.sqrt(this.dotAmount * Math.PI) * phi;

    //   this.vector.setFromSphericalCoords(this.dotSphereRadius, phi, theta);

    //   this.dotGeometry  = new THREE.CircleGeometry(0.2, 5);
    //   this.dotGeometry.lookAt(this.vector);
    //   this.dotGeometry.translate(this.vector.x, this.vector.y, this.vector.z);

    //   this.material     = new THREE.MeshBasicMaterial({color: 0x32a1e2, side: THREE.DoubleSide});
    //   this.mesh         = new THREE.Mesh(this.dotGeometry, this.material);

    //   this.scene.add(this.mesh);

    // }

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
      width: this.container.offsetWidth,
      height: this.container.offsetHeight
    }
  
    this.camera.aspect  = this.sizes.width / this.sizes.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.sizes.width, this.sizes.height);

  }

  listenToResize() {

    window.addEventListener('resize', this.resize.bind(this));

  }

  render() {

    this.time += 0.05;

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this))

  }

}

new Globe({
  domElementContainer:  document.querySelector('.container'),
  domElementCanvas:     document.querySelector('.canvas')
});