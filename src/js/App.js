import {
  Renderer,
  Program,
  Mesh,
  Camera,
  Transform,
  Plane,
  TextureLoader,
  Texture,
} from "ogl";
import Stats from "stats-js";
import Tweakpane from "tweakpane";
import gsap from "gsap";

import vertex from "../shaders/plane/vertex.glsl";
import fragment from "../shaders/plane/fragment.glsl";

import textureSrc1 from "../img/fallen-leaves.jpg";
import textureSrc2 from "../img/streaming.jpg";
import textureSrc3 from "../img/call-back.jpg";
import textureSrc4 from "../img/squirrel-swimmer.jpg";
import textureSrc5 from "../img/coffee-break.jpg";
import textureSrc6 from "../img/red-head.jpg";

const PARAMS = {
  progress: 0,
  tearShapeNoiseAmp: 0.3,
  tearShapeNoiseFreq: 0.5,
  tearShapeNoiseOffset: 8.15,

  tearThickness: 0.1,
  tearThicknessNoiseAmp: 1,
  tearThicknessNoiseFreq: 1.5,

  tearThicknessHarmonics1NoiseAmp: 0.0035,
  tearThicknessHarmonics1NoiseFreq: 30,

  tearThicknessHarmonics2NoiseAmp: 0.001,
  tearThicknessHarmonics2NoiseFreq: 115,

  tearOutlineThickness: 0,

  frameThickness: 0.03,
  frameNoiseAmp: 0.01,
  frameNoiseFreq: 5,

  planeLerp: 0.1,
};

class App {
  constructor() {
    this.initScene();
    this.initAnimation();
    this.initEvents();
    this.initGui();
    this.initStats();

    window.setTimeout(() => {
      this.tween.restart().then(() => {
        this.gl.canvas.addEventListener("click", this.onClick);
      });
    }, 250);

    requestAnimationFrame(this.update);
  }

  initScene() {
    this.onResize = this.onResize.bind(this);
    this.update = this.update.bind(this);

    this.renderer = new Renderer({
      alpha: true,
      antialias: true,
    });

    this.gl = this.renderer.gl;
    document.body.appendChild(this.gl.canvas);

    this.camera = new Camera(this.gl, { fov: 35 });
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt([0, 0, 0]);

    window.addEventListener("resize", this.onResize, false);
    this.onResize();

    this.scene = new Transform();

    this.emptyTexture = new Texture(this.gl);
    this.textures = [
      TextureLoader.load(this.gl, { src: textureSrc1 }),
      TextureLoader.load(this.gl, { src: textureSrc2 }),
      TextureLoader.load(this.gl, { src: textureSrc3 }),
      TextureLoader.load(this.gl, { src: textureSrc4 }),
      TextureLoader.load(this.gl, { src: textureSrc5 }),
      TextureLoader.load(this.gl, { src: textureSrc6 }),
    ];

    this.program = new Program(this.gl, {
      vertex,
      fragment,
      transparent: true,
      uniforms: {
        uProgress: { value: PARAMS.progress },

        uTearThickness: { value: PARAMS.tearThickness },
        uTearThicknessNoiseAmp: {
          value: PARAMS.tearThicknessNoiseAmp,
        },
        uTearThicknessNoiseFreq: {
          value: PARAMS.tearThicknessNoiseFreq,
        },

        uTearThicknessHarmonics1NoiseAmp: {
          value: PARAMS.tearThicknessHarmonics1NoiseAmp,
        },
        uTearThicknessHarmonics1NoiseFreq: {
          value: PARAMS.tearThicknessHarmonics1NoiseFreq,
        },

        uTearThicknessHarmonics2NoiseAmp: {
          value: PARAMS.tearThicknessHarmonics2NoiseAmp,
        },
        uTearThicknessHarmonics2NoiseFreq: {
          value: PARAMS.tearThicknessHarmonics2NoiseFreq,
        },

        uTearShapeNoiseAmp: { value: PARAMS.tearShapeNoiseAmp },
        uTearShapeNoiseFreq: { value: PARAMS.tearShapeNoiseFreq },
        uTearShapeNoiseOffset: { value: PARAMS.tearShapeNoiseOffset },
        uTearOutlineThickness: { value: PARAMS.tearOutlineThickness },

        uTexture1: { value: this.emptyTexture },
        uTexture2: { value: this.textures[0] },

        uFrameThickness: { value: PARAMS.frameThickness },
        uFrameNoiseAmp: { value: PARAMS.frameNoiseAmp },
        uFrameNoiseFreq: { value: PARAMS.frameNoiseFreq },
      },
    });

    const aspect = window.innerWidth / window.innerHeight;
    const vFov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(vFov / 2) * this.camera.position.z;
    const width = height * aspect;
    const planeSize = Math.min(height / 1.5, width / 1.5);

    this.planeGeometry = new Plane(this.gl, {
      width: planeSize,
      height: planeSize,
    });
    this.plane = new Mesh(this.gl, {
      geometry: this.planeGeometry,
      program: this.program,
    });
    this.plane.position.set(0, 0, 0);
    this.plane.setParent(this.scene);
  }

  initAnimation() {
    this.tween = gsap.to(PARAMS, {
      paused: true,
      progress: 1,
      ease: "power2.out",
      duration: 1.5,
      onUpdate: () => {
        this.program.uniforms.uProgress.value = PARAMS.progress;
      },
      onStart: () => {
        this.program.uniforms.uTearShapeNoiseOffset.value = Math.random() * 10;
      },
    });
  }

  initEvents() {
    this.onClick = this.onClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);

    window.addEventListener("keydown", this.onKeyDown);

    this.previousTextureID = null;
    this.currentTextureID = 0;
  }

  initGui() {
    // PROGRESS
    this.gui = new Tweakpane();
    this.addGUIInput(this.gui, "progress", "Progress");

    const tearFolder = this.gui.addFolder({
      title: "Tear",
      expanded: false,
    });

    const tearShapeFolder = tearFolder.addFolder({
      title: "Shape",
    });
    this.addGUIInput(tearShapeFolder, "tearShapeNoiseAmp", "Amplitude", 0, 0.5);
    this.addGUIInput(tearShapeFolder, "tearShapeNoiseFreq", "Frequency", 0, 2);
    this.addGUIInput(tearShapeFolder, "tearShapeNoiseOffset", "Offset", 0, 10);

    const thicknessFolder = tearFolder.addFolder({
      title: "Thickness",
    });
    this.addGUIInput(
      thicknessFolder,
      "tearThickness",
      "Thickness",
      0,
      0.4,
      0.001
    );
    this.addGUIInput(thicknessFolder, "tearThicknessNoiseAmp", "Amplitude");
    this.addGUIInput(
      thicknessFolder,
      "tearThicknessNoiseFreq",
      "Frequency",
      0,
      10
    );

    const tearHarmonicsFolder = tearFolder.addFolder({
      title: "Noisy harmonics",
    });
    this.addGUIInput(
      tearHarmonicsFolder,
      "tearThicknessHarmonics1NoiseAmp",
      "Amplitude 1",
      0,
      0.01,
      0.0001
    );
    this.addGUIInput(
      tearHarmonicsFolder,
      "tearThicknessHarmonics1NoiseFreq",
      "Frequency 1",
      0,
      200
    );
    this.addGUIInput(
      tearHarmonicsFolder,
      "tearThicknessHarmonics2NoiseAmp",
      "Amplitude 2",
      0,
      0.01,
      0.0001
    );
    this.addGUIInput(
      tearHarmonicsFolder,
      "tearThicknessHarmonics2NoiseFreq",
      "Frequency 2",
      0,
      200
    );

    const tearOutlinesFolder = tearFolder.addFolder({
      title: "Outline",
    });
    this.addGUIInput(
      tearOutlinesFolder,
      "tearOutlineThickness",
      "Thickness",
      0,
      0.01,
      0.0001
    );

    // FRAME
    const frameFolder = this.gui.addFolder({
      title: "Frame",
      expanded: false,
    });
    this.addGUIInput(frameFolder, "frameNoiseAmp", "Amplitude", 0, 0.1);
    this.addGUIInput(frameFolder, "frameNoiseFreq", "Frequency", 0, 10);
    this.addGUIInput(frameFolder, "frameThickness", "Thickness");
  }

  initStats() {
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
  }

  addGUIInput(root, param, label, min = 0, max = 1, step = 0.01) {
    root
      .addInput(PARAMS, param, {
        label,
        min,
        max,
        step,
      })
      .on("change", (value) => {
        this.program.uniforms[
          `u${param.charAt(0).toUpperCase()}${param.slice(1)}`
        ].value = value;
      });
  }

  onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.perspective({
      aspect: this.gl.canvas.width / this.gl.canvas.height,
    });
  }

  onClick() {
    this.previousTextureID = this.currentTextureID;
    this.currentTextureID =
      this.currentTextureID >= this.textures.length - 1
        ? 0
        : this.currentTextureID + 1;

    this.program.uniforms.uProgress.value = 0;

    this.program.uniforms.uTexture1.value =
      this.previousTextureId !== null
        ? this.textures[this.previousTextureID]
        : this.emptyTexture;

    this.program.uniforms.uTexture2.value = this.textures[
      this.currentTextureID
    ];

    this.tween.restart();
  }

  onKeyDown(e) {
    if (e.keyCode === 68) {
      this.gui.hidden = !this.gui.hidden;
      document.querySelector(".js-info").classList.toggle("hidden");
      this.stats.dom.classList.toggle("hidden");
    }
  }

  update() {
    requestAnimationFrame(this.update);

    this.stats.begin();

    this.renderer.render({ scene: this.scene, camera: this.camera });

    this.stats.end();
  }
}

export default App;
