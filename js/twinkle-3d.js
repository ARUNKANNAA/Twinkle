/**
 * TWINKLE 3D Interactive Model Viewer
 * Powered by Three.js & STLLoader
 * Displays the authentic Twinkle.stl model on a stylish desk studio stage
 * with dynamic material shaders, casing color selector, rotation controls, and zoom.
 */

class Twinkle3DViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.mesh = null;
    this.controls = null;
    this.autoRotate = true;
    this.isWireframe = false;
    
    // Available in Pure White Edition alone
    this.colors = {
      white: 0xf5f7fb
    };
    this.currentColor = this.colors.white;

    this.init();
  }

  init() {
    if (typeof THREE === 'undefined') {
      this.renderFallback();
      return;
    }

    try {
      const width = this.container.clientWidth || 600;
      const height = this.container.clientHeight || 420;

      // 1. Scene
      this.scene = new THREE.Scene();
      this.scene.background = null; // transparent to inherit backdrop styling

      // 2. Camera
      this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
      this.camera.position.set(0, 25, 95);

      // 3. Renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.container.appendChild(this.renderer.domElement);

      // 4. Lighting setup (Apple Studio Product Lighting)
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
      this.scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xfffaf5, 1.3);
      keyLight.position.set(40, 60, 50);
      keyLight.castShadow = true;
      this.scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xf0f5fc, 1.0);
      fillLight.position.set(-40, 30, -30);
      this.scene.add(fillLight);

      // Back studio light to illuminate rear slider switch & Type-C port
      const backLight = new THREE.DirectionalLight(0xffffff, 0.85);
      backLight.position.set(15, 20, -55);
      this.scene.add(backLight);

      const rimLight = new THREE.PointLight(0xffffff, 0.6, 120);
      rimLight.position.set(0, -30, 40);
      this.scene.add(rimLight);

      // Soft circular shadow plane below model (Clean Apple contact shadow)
      const planeGeo = new THREE.PlaneGeometry(120, 120);
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 128;
      shadowCanvas.height = 128;
      const sCtx = shadowCanvas.getContext('2d');
      const grad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 60);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.18)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 128, 128);
      const shadowTex = new THREE.CanvasTexture(shadowCanvas);
      const planeMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.45 });
      const shadowMesh = new THREE.Mesh(planeGeo, planeMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.y = -22;
      this.scene.add(shadowMesh);

      // 5. Controls
      if (typeof THREE.OrbitControls !== 'undefined') {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxDistance = 180;
        this.controls.minDistance = 35;
        this.controls.maxPolarAngle = Math.PI / 2 + 0.15; // don't go below floor
      }

      // 6. Load STL Model
      this.loadModel();

      // 7. Window resize listener
      window.addEventListener('resize', () => this.onResize());

      // 8. Render loop
      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);

    } catch (e) {
      console.warn('3D WebGL viewer encountered an issue, falling back:', e);
      this.renderFallback();
    }
  }

  loadModel() {
    if (typeof THREE.STLLoader === 'undefined') {
      this.createProceduralTwinkleMesh();
      return;
    }

    const loader = new THREE.STLLoader();
    loader.load(
      'assets/Twinkle.stl',
      (geometry) => {
        geometry.computeVertexNormals();
        geometry.center();

        // Rotate 180 degrees around Y:
        // In Twinkle.stl, the front face with the 24x13.6mm screen cutout window is at Z = 0 (which centered to -19.5).
        // The solid back wall with the port hole is at Z = 39 (which centered to +19.5).
        // By rotating 180 degrees around Y, the front screen window cutout faces directly forward towards the camera (+Z).
        geometry.rotateY(Math.PI);
        geometry.computeVertexNormals();

        // Calculate size and scale to ideal scene proportions
        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox;
        const maxDim = Math.max(bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y, bbox.max.z - bbox.min.z);
        const scale = 36 / (maxDim || 1);
        geometry.scale(scale, scale, scale);

        const material = new THREE.MeshStandardMaterial({
          color: 0xf5f7fb, // Pure Matte White
          metalness: 0.08,
          roughness: 0.38,
          wireframe: this.isWireframe
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Orientation adjustment: Face straight forward towards camera, upright
        this.mesh.rotation.set(0, 0, 0);
        this.mesh.position.y = -2;

        // Fit realistic OLED Screen Module directly INSIDE the front window cutout
        try {
          const screenGroup = new THREE.Group();

          // 1. OLED Glass Backplate / Substrate fitted inside the window cutout
          const glassGeo = new THREE.PlaneGeometry(21.2, 12.2);
          const glassMat = new THREE.MeshStandardMaterial({
            color: 0x050811,
            metalness: 0.85,
            roughness: 0.15
          });
          const glassMesh = new THREE.Mesh(glassGeo, glassMat);
          glassMesh.position.set(0, 0, 16.5);
          screenGroup.add(glassMesh);

          // 2. High-Definition 512x256 OLED Display Canvas Texture
          const faceCanvas = document.createElement('canvas');
          faceCanvas.width = 512;
          faceCanvas.height = 256;
          this.cadFaceCanvas = faceCanvas;
          this.cadFaceCtx = faceCanvas.getContext('2d');

          this.updateCadFace('NORMAL');

          this.cadFaceTexture = new THREE.CanvasTexture(faceCanvas);
          this.cadFaceTexture.minFilter = THREE.LinearFilter;
          this.cadFaceTexture.magFilter = THREE.LinearFilter;
          this.displayMat = new THREE.MeshBasicMaterial({
            map: this.cadFaceTexture,
            transparent: true
          });
          const displayMesh = new THREE.Mesh(new THREE.PlaneGeometry(20.8, 11.8), this.displayMat);
          displayMesh.position.set(0, 0, 16.65);
          screenGroup.add(displayMesh);

          // 3. Ultra-clear Glossy Glass Cover with subtle specular reflections
          const glassCoverGeo = new THREE.PlaneGeometry(20.8, 11.8);
          const glassCoverMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.1,
            roughness: 0.12,
            transparent: true,
            opacity: 0.12
          });
          const glassCover = new THREE.Mesh(glassCoverGeo, glassCoverMat);
          glassCover.position.set(0, 0, 16.8);
          screenGroup.add(glassCover);

          this.mesh.add(screenGroup);
        } catch (err) {
          console.warn('Could not attach OLED screen to CAD mesh:', err);
        }

        // Fit Power Slider Switch into the back rectangular opening
        try {
          const sliderSwitch = this.createSliderSwitch();
          this.mesh.add(sliderSwitch);
        } catch (err) {
          console.warn('Could not attach slider switch to CAD mesh:', err);
        }

        // Fit USB Type-C Port into the back port cutout
        try {
          const typeCPort = this.createTypeCPort();
          this.mesh.add(typeCPort);
        } catch (err) {
          console.warn('Could not attach Type-C port to CAD mesh:', err);
        }

        this.scene.add(this.mesh);
        this.hideLoading();
      },
      (xhr) => {
        // progress
      },
      (error) => {
        console.warn('Could not load Twinkle.stl directly, creating procedural fallback model:', error);
        this.createProceduralTwinkleMesh();
      }
    );
  }

  updateCadFace(expression = 'NORMAL') {
    if (!this.cadFaceCtx || !this.cadFaceCanvas) return;
    const ctx = this.cadFaceCtx;
    const w = this.cadFaceCanvas.width;
    const h = this.cadFaceCanvas.height;

    // Pitch black OLED screen
    ctx.fillStyle = '#020408';
    ctx.fillRect(0, 0, w, h);

    const cyanGlow = '#00f0ff';
    const deepBlack = '#020408';
    const gx = this.cadGazeX || 0;

    if (expression === 'BLINK' || this.isCadBlinking) {
      // Eyelid slit blink arcs
      const drawBlinkEye = (cx, cy) => {
        ctx.save();
        ctx.shadowColor = cyanGlow;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = cyanGlow;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 42, cy);
        ctx.quadraticCurveTo(cx, cy + 12, cx + 42, cy);
        ctx.stroke();
        ctx.restore();
      };
      drawBlinkEye(164 + gx, 120);
      drawBlinkEye(348 + gx, 120);
    } else if (expression === 'HAPPY') {
      // Happy inverted V arches
      const drawHappyEye = (cx, cy) => {
        ctx.save();
        ctx.shadowColor = cyanGlow;
        ctx.shadowBlur = 12;
        ctx.strokeStyle = cyanGlow;
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 44, cy + 16);
        ctx.quadraticCurveTo(cx, cy - 36, cx + 44, cy + 16);
        ctx.stroke();
        ctx.restore();
      };
      drawHappyEye(164 + gx, 120);
      drawHappyEye(348 + gx, 120);
    } else if (expression === 'SLEEP') {
      // Sleep closed arcs + floating z Z
      const drawSleepEye = (cx, cy) => {
        ctx.save();
        ctx.shadowColor = cyanGlow;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = cyanGlow;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 36, cy);
        ctx.quadraticCurveTo(cx, cy + 8, cx + 36, cy);
        ctx.stroke();
        ctx.restore();
      };
      drawSleepEye(164, 128);
      drawSleepEye(348, 128);

      // Cute zZ sleep indicators
      ctx.save();
      ctx.font = 'bold 22px monospace';
      ctx.fillStyle = cyanGlow;
      ctx.shadowColor = cyanGlow;
      ctx.shadowBlur = 8;
      ctx.fillText('z', 390, 80);
      ctx.font = 'bold 30px monospace';
      ctx.fillText('Z', 420, 52);
      ctx.restore();
    } else {
      // NORMAL EXPRESSION: Signature firmware squircle eyes
      const drawEye = (cx, cy) => {
        const ew = 104;
        const eh = 128;
        const r = 28;
        const x = cx - ew / 2;
        const y = cy - eh / 2;

        ctx.save();

        // 1. Outer rounded squircle with neon cyan bloom
        ctx.shadowColor = cyanGlow;
        ctx.shadowBlur = 14;
        ctx.strokeStyle = cyanGlow;
        ctx.lineWidth = 7;

        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + ew - r, y);
        ctx.arcTo(x + ew, y, x + ew, y + r, r);
        ctx.lineTo(x + ew, y + eh - r);
        ctx.arcTo(x + ew, y + eh, x + ew - r, y + eh, r);
        ctx.lineTo(x + r, y + eh);
        ctx.arcTo(x, y + eh, x, y + eh - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
        ctx.stroke();

        // 2. Black interior fill
        ctx.fillStyle = deepBlack;
        ctx.shadowBlur = 0;
        ctx.fill();

        // 3. Glowing cyan iris disc
        ctx.shadowColor = cyanGlow;
        ctx.shadowBlur = 10;
        ctx.fillStyle = cyanGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, 42, 0, Math.PI * 2);
        ctx.fill();

        // 4. Inner black pupil hole
        ctx.shadowBlur = 0;
        ctx.fillStyle = deepBlack;
        ctx.beginPath();
        ctx.arc(cx, cy, 32, 0, Math.PI * 2);
        ctx.fill();

        // 5. Specular highlight sparkle glints
        ctx.shadowColor = cyanGlow;
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#ffffff'; // brilliant white sparkle core
        ctx.beginPath();
        ctx.arc(cx - 15, cy - 18, 7.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx + 9, cy - 3, 4.0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx - 7, cy + 13, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      };

      drawEye(164 + gx, 116);
      drawEye(348 + gx, 116);
    }

    // Signature subtle smile
    if (expression !== 'SLEEP') {
      ctx.save();
      ctx.shadowColor = cyanGlow;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = cyanGlow;
      ctx.lineWidth = 5.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(236, 214);
      ctx.quadraticCurveTo(256, 226, 276, 214);
      ctx.stroke();
      ctx.restore();
    }

    if (this.cadFaceTexture) {
      this.cadFaceTexture.needsUpdate = true;
    }
  }

  createSliderSwitch() {
    const group = new THREE.Group();
    // Centered in CAD rectangular opening at X: 0.09, Y: 4.04, Z: -16.2
    group.position.set(0.09, 4.04, -16.2);

    // 1. Metal mounting faceplate
    const plateGeo = new THREE.BoxGeometry(7.6, 3.1, 0.9);
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0xc8cdd5,
      metalness: 0.85,
      roughness: 0.25
    });
    const plate = new THREE.Mesh(plateGeo, metalMat);
    group.add(plate);

    // 2. Dark recessed slide groove / track
    const slotGeo = new THREE.BoxGeometry(5.2, 1.4, 1.0);
    const slotMat = new THREE.MeshStandardMaterial({
      color: 0x0a0c10,
      metalness: 0.2,
      roughness: 0.8
    });
    const slot = new THREE.Mesh(slotGeo, slotMat);
    slot.position.z = -0.05;
    group.add(slot);

    // 3. Protruding tactile slider knob (positioned in the ON position)
    const knobGroup = new THREE.Group();
    knobGroup.position.set(1.15, 0, -0.65);

    const knobBodyGeo = new THREE.BoxGeometry(1.8, 2.4, 1.5);
    const knobMat = new THREE.MeshStandardMaterial({
      color: 0x1f242d,
      metalness: 0.65,
      roughness: 0.35
    });
    const knobBody = new THREE.Mesh(knobBodyGeo, knobMat);
    knobGroup.add(knobBody);

    // Tactile grip ribs across the slider handle
    const ridgeMat = new THREE.MeshStandardMaterial({
      color: 0x333b47,
      metalness: 0.5,
      roughness: 0.4
    });
    for (let i = -1; i <= 1; i++) {
      const ridgeGeo = new THREE.BoxGeometry(1.4, 0.3, 0.2);
      const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
      ridge.position.set(0, i * 0.65, -0.8);
      knobGroup.add(ridge);
    }

    group.add(knobGroup);
    return group;
  }

  createTypeCPort() {
    const group = new THREE.Group();
    // Centered in CAD port cutout at X: -0.09, Y: -3.56, Z: -16.2
    group.position.set(-0.09, -3.56, -16.2);

    // 1. Outer metallic shield collar / housing
    const outerGeo = new THREE.BoxGeometry(8.2, 3.2, 2.0);
    const shellMat = new THREE.MeshStandardMaterial({
      color: 0xd4d8df,
      metalness: 0.9,
      roughness: 0.2
    });
    const outerShell = new THREE.Mesh(outerGeo, shellMat);
    group.add(outerShell);

    // 2. Inner dark socket cavity
    const cavityGeo = new THREE.BoxGeometry(7.0, 2.0, 2.2);
    const cavityMat = new THREE.MeshStandardMaterial({
      color: 0x05070a,
      metalness: 0.1,
      roughness: 0.9
    });
    const cavity = new THREE.Mesh(cavityGeo, cavityMat);
    cavity.position.z = -0.1;
    group.add(cavity);

    // 3. Center contact tongue (pin plate)
    const tongueGeo = new THREE.BoxGeometry(5.4, 0.55, 2.0);
    const tongueMat = new THREE.MeshStandardMaterial({
      color: 0x111318,
      metalness: 0.4,
      roughness: 0.6
    });
    const tongue = new THREE.Mesh(tongueGeo, tongueMat);
    tongue.position.z = -0.15;
    group.add(tongue);

    // 4. Gold contact pins on tongue
    const pinGeo = new THREE.BoxGeometry(4.4, 0.1, 1.4);
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.95,
      roughness: 0.2
    });
    const pinTop = new THREE.Mesh(pinGeo, pinMat);
    pinTop.position.set(0, 0.32, -0.35);
    group.add(pinTop);

    const pinBot = new THREE.Mesh(pinGeo, pinMat);
    pinBot.position.set(0, -0.32, -0.35);
    group.add(pinBot);

    return group;
  }

  createProceduralTwinkleMesh() {
    // Stylized procedural Twinkle enclosure with face recess
    const group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(32, 28, 22);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: this.currentColor,
      metalness: 0.2,
      roughness: 0.4
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Front Screen glass
    const screenGeo = new THREE.PlaneGeometry(22, 14);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x020408 });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.z = 11.1;
    group.add(screen);

    // Glowing Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const eyeL = new THREE.Mesh(new THREE.PlaneGeometry(4, 5), eyeMat);
    eyeL.position.set(-5, 0, 11.2);
    const eyeR = new THREE.Mesh(new THREE.PlaneGeometry(4, 5), eyeMat);
    eyeR.position.set(5, 0, 11.2);
    group.add(eyeL);
    group.add(eyeR);

    // Desk Feet
    const footGeo = new THREE.CylinderGeometry(2, 2.5, 3, 16);
    const footMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
    const footL = new THREE.Mesh(footGeo, footMat);
    footL.position.set(-10, -15, 0);
    const footR = new THREE.Mesh(footGeo, footMat);
    footR.position.set(10, -15, 0);
    group.add(footL);
    group.add(footR);

    this.mesh = group;
    this.scene.add(this.mesh);
    this.hideLoading();
  }

  setColor(colorHex) {
    this.currentColor = colorHex;
    if (this.mesh) {
      if (this.mesh.material) {
        this.mesh.material.color.setHex(colorHex);
      } else {
        this.mesh.traverse((child) => {
          if (child.isMesh && child.material && child.material.isMeshStandardMaterial) {
            child.material.color.setHex(colorHex);
          }
        });
      }
    }
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    return this.autoRotate;
  }

  toggleWireframe() {
    this.isWireframe = !this.isWireframe;
    if (this.mesh) {
      if (this.mesh.material) {
        this.mesh.material.wireframe = this.isWireframe;
      } else {
        this.mesh.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.wireframe = this.isWireframe;
          }
        });
      }
    }
    return this.isWireframe;
  }

  resetView() {
    this.camera.position.set(0, 25, 95);
    if (this.controls) this.controls.reset();
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(this.animate);

    if (this.mesh && this.autoRotate) {
      this.mesh.rotation.y += 0.007; // STL turntable rotation
    }

    // 1. Live synchronization with Twinkle screen simulator when active
    if (window.twinkleSimulator && window.twinkleSimulator.canvas) {
      if (this.displayMat && this.displayMat.map !== this.simTexture) {
        this.simTexture = new THREE.CanvasTexture(window.twinkleSimulator.canvas);
        this.simTexture.minFilter = THREE.LinearFilter;
        this.simTexture.magFilter = THREE.LinearFilter;
        this.displayMat.map = this.simTexture;
      }
      if (this.simTexture) {
        this.simTexture.needsUpdate = true;
      }
    } else {
      // 2. High-Definition Standalone Face Animation Loop
      this.animTick = (this.animTick || 0) + 1;

      // Natural eyelid blinking cycle
      if (!this.isCadBlinking && this.animTick % 220 === 0) {
        this.isCadBlinking = true;
        this.blinkFrames = 0;
      }

      if (this.isCadBlinking) {
        this.blinkFrames++;
        if (this.blinkFrames < 12) {
          this.updateCadFace('BLINK');
        } else {
          this.isCadBlinking = false;
          this.updateCadFace('NORMAL');
        }
      }

      // Smooth organic gaze shift
      if (this.animTick % 260 === 0) {
        const gazeTargets = [-18, 0, 18, 0];
        this.targetGazeX = gazeTargets[Math.floor(Math.random() * gazeTargets.length)];
      }

      if (this.targetGazeX !== undefined) {
        const diff = this.targetGazeX - (this.cadGazeX || 0);
        if (Math.abs(diff) > 0.4) {
          this.cadGazeX = (this.cadGazeX || 0) + diff * 0.12;
          if (!this.isCadBlinking) this.updateCadFace('NORMAL');
        }
      }
    }

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  hideLoading() {
    const loaderElem = this.container.querySelector('.viewer-3d-loader');
    if (loaderElem) loaderElem.style.display = 'none';
  }

  renderFallback() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="viewer-fallback-card">
        <img src="assets/twinkle_handheld.jpg" alt="Twinkle 3D Preview" class="fallback-img" />
        <div class="fallback-caption">
          <strong>Twinkle Desktop Companion 3D Studio</strong>
          <span>Custom rounded casing with front display window and top touch area</span>
        </div>
      </div>
    `;
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('threeViewerBox');
  if (container) {
    window.twinkle3D = new Twinkle3DViewer('threeViewerBox');
  }
});
