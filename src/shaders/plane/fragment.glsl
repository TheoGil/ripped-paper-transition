precision highp float;

#pragma glslify: snoise2 = require(glsl-noise/simplex/2d)
#pragma glslify: map = require(glsl-map)

uniform float uProgress;

uniform float uTearShapeNoiseAmp;
uniform float uTearShapeNoiseFreq;
uniform float uTearShapeNoiseOffset;

uniform float uTearThickness;
uniform float uTearThicknessNoiseAmp;
uniform float uTearThicknessNoiseFreq;

uniform float uTearThicknessHarmonics1NoiseAmp;
uniform float uTearThicknessHarmonics1NoiseFreq;
uniform float uTearThicknessHarmonics2NoiseAmp;
uniform float uTearThicknessHarmonics2NoiseFreq;

uniform float uTearOutlineThickness;

uniform sampler2D uTexture1;
uniform sampler2D uTexture2;

uniform float uFrameThickness;
uniform float uFrameNoiseAmp;
uniform float uFrameNoiseFreq;

// uniform float uAlpha;

varying vec2 vUv;

float stroke(float x, float s, float w) {
    float d = step(s, x + w * .5) - 
              step(s, x - w * .5);
    
    return clamp(d, 0., 1.);
}

float fill(float x, float size) {
    return 1. - step(size, x);
}

float rectSDF(vec2 st, vec2 s) {
    st = st * 2. - 1.;
    return max(
        abs(st.x / s.x),
        abs(st.y / s.y)
    );
}

void main() {
    // Those two could be uniforms
    vec3 tearColor = vec3(1., 1., 1.); //vec3(0.854, 0.847, 0.847); // #dad8d8
    vec3 tearOutlineColor = vec3(0.094, 0.094, 0.094); // #181818

    // Remap progress a little bit to take into account the total thickness of the rip 
    float progress = map(
        uProgress,
        1.,
        0.,
        0. - uTearShapeNoiseAmp - uTearThickness * 0.5 - uTearThicknessHarmonics1NoiseAmp,
        1. + uTearShapeNoiseAmp + uTearThickness * 0.5 + uTearThicknessHarmonics1NoiseAmp
    );
    
    // Compute the tear thickness, using noise to modulate the base uTearThickness value
    // we're adding two extra layers of noise on top of that, to add extra "noise harmonics" (finer grain).
    // Performances: might be worth checking out pseudo random using combination of sin/cos instead of actual perlin noise.
    float tearThicknessNoise = map(snoise2(vUv * uTearThicknessNoiseFreq), -1., 1., 0., 1.);
    float tearThickness = mix(uTearThickness, uTearThickness * tearThicknessNoise, uTearThicknessNoiseAmp);
    tearThickness += snoise2(vUv * uTearThicknessHarmonics1NoiseFreq) * uTearThicknessHarmonics1NoiseAmp;
    tearThickness += snoise2(vUv * uTearThicknessHarmonics2NoiseFreq) * uTearThicknessHarmonics2NoiseAmp;


    float noise = snoise2(
        vec2(
            vec2(
                vUv.x,
                vUv.y + uTearShapeNoiseOffset
            ) * uTearShapeNoiseFreq
        )
    )  * uTearShapeNoiseAmp;
    float y = vUv.y + noise;
    float tear = stroke(y, progress, tearThickness);

    float tearOutline = stroke(
        y, 
        progress - tearThickness * 0.5 - uTearOutlineThickness * 0.5,
        uTearOutlineThickness
    ) + stroke(
        y, 
        progress + tearThickness * 0.5 + uTearOutlineThickness * 0.5,
        uTearOutlineThickness
    );

    vec4 texture = mix(
        texture2D(uTexture2, vUv),
        texture2D(uTexture1, vUv),
        step(y, progress - tearThickness * .5)
    );
    vec3 color = mix(texture.rgb, tearColor, tear);
    color = mix(color, tearOutlineColor, tearOutline);

    float alpha = fill(
        rectSDF(vUv, vec2(1.)) + snoise2(vUv * uFrameNoiseFreq) * uFrameNoiseAmp,
        1. - (1. - pow(abs(map(uProgress, 0., 1., -1., 1.)), 1.)) * uFrameThickness
    ) * texture.a;

    gl_FragColor = vec4(color, alpha);
}