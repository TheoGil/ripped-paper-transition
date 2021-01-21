import {
  Renderer,
  Program,
  Mesh,
  Camera,
  Transform,
  Plane,
  TextureLoader,
} from "ogl";
import Tweakpane from "tweakpane";
import vertex from "../shaders/plane/vertex.glsl";
import fragment from "../shaders/plane/fragment.glsl";
import textureSrc1 from "../img/julianapillustration01.jpg";
import textureSrc2 from "../img/julianapillustration02.jpg";
import TWEEN from "@tweenjs/tween.js";

const PARAMS = {
  progress: 0,
  tearShapeNoiseAmp: 0.3,
  tearShapeNoiseFreq: 0.5,
  tearShapeNoiseOffset: 8.15,

  tearThickness: 0.05,
  tearThicknessNoiseAmp: 1,
  tearThicknessNoiseFreq: 1.5,

  tearThicknessHarmonics1NoiseAmp: 0.0035,
  tearThicknessHarmonics1NoiseFreq: 30,

  tearThicknessHarmonics2NoiseAmp: 0.001,
  tearThicknessHarmonics2NoiseFreq: 115,

  tearOutlineThickness: 0.0006,

  frameThickness: 0.03,
  frameNoiseAmp: 0.01,
  frameNoiseFreq: 5,
};

class App {
  constructor() {
    this.initScene();
    this.initAnimation();
    this.initGui();

    requestAnimationFrame(this.update);
  }

  initScene() {
    this.onResize = this.onResize.bind(this);
    this.update = this.update.bind(this);

    this.renderer = new Renderer({ dpr: 2 });

    this.gl = this.renderer.gl;
    this.gl.clearColor(0.094, 0.094, 0.094, 1); // #181818
    document.body.appendChild(this.gl.canvas);

    this.camera = new Camera(this.gl, { fov: 35 });
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt([0, 0, 0]);

    window.addEventListener("resize", this.onResize, false);
    this.onResize();

    this.scene = new Transform();

    this.texture1 = TextureLoader.load(this.gl, { src: textureSrc1 });
    this.texture2 = TextureLoader.load(this.gl, { src: textureSrc2 });

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

        uTexture1: { value: this.texture1 },
        uTexture2: { value: this.texture2 },

        uFrameThickness: { value: PARAMS.frameThickness },
        uFrameNoiseAmp: { value: PARAMS.frameNoiseAmp },
        uFrameNoiseFreq: { value: PARAMS.frameNoiseFreq },
      },
    });

    this.planeGeometry = new Plane(this.gl, {
      width: 4,
      height: 4,
    });
    this.plane = new Mesh(this.gl, {
      geometry: this.planeGeometry,
      program: this.program,
    });
    this.plane.position.set(0, 0, 0);
    this.plane.setParent(this.scene);
  }

  initAnimation() {
    this.tween = new TWEEN.Tween(PARAMS)
      .to({ progress: 1 }, 1500)
      .easing(TWEEN.Easing.Quadratic.Out) // Use an easing function to make the animation smooth.
      .onUpdate(() => {
        this.program.uniforms.uProgress.value = PARAMS.progress;
      });
  }

  initGui() {
    // PROGRESS
    this.gui = new Tweakpane();
    this.addGUIInput(this.gui, "progress", "Progress");

    // GLOBAL SHAPE
    const tearShapeFolder = this.gui.addFolder({
      title: "Shape",
    });
    this.addGUIInput(tearShapeFolder, "tearShapeNoiseAmp", "Amplitude", 0, 0.5);
    this.addGUIInput(tearShapeFolder, "tearShapeNoiseFreq", "Frequency", 0, 2);
    this.addGUIInput(tearShapeFolder, "tearShapeNoiseOffset", "Offset", 0, 10);

    // TEAR THICKNESS
    const tearFolder = this.gui.addFolder({
      title: "Tear thickness",
    });
    this.addGUIInput(tearFolder, "tearThickness", "Thickness", 0, 0.1, 0.001);
    this.addGUIInput(tearFolder, "tearThicknessNoiseAmp", "Amplitude");
    this.addGUIInput(tearFolder, "tearThicknessNoiseFreq", "Frequency", 0, 10);

    // TEAR THICKNESS HARMONICS
    const tearHarmonicsFolder = this.gui.addFolder({
      title: "Thickness harmonics",
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

    // TEAR OUTLINE
    const tearOutlinesFolder = this.gui.addFolder({
      title: "Thickness",
    });
    this.addGUIInput(
      tearOutlinesFolder,
      "tearOutlineThickness",
      "Thickness",
      0,
      0.001,
      0.0001
    );

    // FRAME
    const frameFolder = this.gui.addFolder({
      title: "Frame",
    });
    this.addGUIInput(frameFolder, "frameNoiseAmp", "Amplitude", 0, 0.1);
    this.addGUIInput(frameFolder, "frameNoiseFreq", "Frequency", 0, 10);
    this.addGUIInput(frameFolder, "frameThickness", "Thickness");

    this.gui
      .addButton({
        title: "Rip",
      })
      .on("click", () => {
        console.log("Animate");
        this.tween.start();
      });
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

  update(t) {
    requestAnimationFrame(this.update);
    TWEEN.update(t);
    this.renderer.render({ scene: this.scene, camera: this.camera });
  }
}

export default App;
