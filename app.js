import * as THREE from 'three';
import { ImageLoader } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

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

    this.baseSphere   = new THREE.SphereGeometry(20, 50, 50);
    this.baseMaterial = new THREE.MeshBasicMaterial({color: 0x0b2636, transparent: true, opacity: 1});
    this.baseMesh     = new THREE.Mesh(this.baseSphere, this.baseMaterial);
    this.scene.add(this.baseMesh);

    this.image  = new THREE.ImageLoader().load('/img/world_alpha.png', (img) => {

      console.log('HE');

      this.imageCanvas = document.createElement('canvas');
      this.imageCanvas.width = img.width;
      this.imageCanvas.height = img.height;
      
      let context = this.imageCanvas.getContext('2d');
      context.drawImage(this.image, 0, 0);
      
      this.imageData = context.getImageData(0, 0, img.width, img.height);

      console.log(this.imageData);

    });


    this.dotAmount        = 50;
    this.dotSphereRadius  = 20;
    this.vector           = new THREE.Vector3();

    for(let i = 0; i < this.dotAmount; i++) {

      const phi = Math.acos(-1 + (2 * i) / this.dotAmount);
      const theta = Math.sqrt(this.dotAmount * Math.PI) * phi;

      this.vector.setFromSphericalCoords(this.dotSphereRadius, phi, theta);

      this.dotGeometry  = new THREE.CircleGeometry(0.2, 5);
      this.dotGeometry.lookAt(this.vector);
      this.dotGeometry.translate(this.vector.x, this.vector.y, this.vector.z);

      this.material     = new THREE.MeshBasicMaterial({color: 0x32a1e2, side: THREE.DoubleSide});
      this.mesh         = new THREE.Mesh(this.dotGeometry, this.material);

      this.scene.add(this.mesh);

    }

    this.renderer = new THREE.WebGLRenderer({
      canvas:     this.canvas,
      antialias:  true,
      alpha:      true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.time = 0;
    this.resize();
    this.listenToResize();
    this.render();

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