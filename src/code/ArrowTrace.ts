// import { Animator, libTex } from "playable-dev";
// import {
//      Color,
//      AdditiveBlending,
//      DoubleSide,
//      Mesh,
//      Object3D,
//      PlaneGeometry,
//      ShaderMaterial,
//      Texture,
//      UniformsUtils
//     } from "three";
//     import { Game } from "./Game";
//     import { HUD } from "./HUD";


//     export class ArrowTrace extends Object3D {
//         trail: Mesh;
//         trailMaterial: ShaderMaterial;
//         //trailMap: Texture;
//         targetScale: number = 0.1;
    
//         //---------------------------------------------------------
    
//         constructor() {
//             super();
//             // const geometry = new SphereGeometry(1, 32, 32);
//             // const material = new MeshBasicMaterial({ color: 0xffff00 });
//             Game.game.scene.add(this);
    
//             const length = 20.0;
//             const width = 5;
//             const trailGeometry = new PlaneGeometry(width, length, 1, 100);
//            // this.trailMap = libTex("trailTxt");
//            // this.trailMap.generateMipmaps = false;
    
//             // Create a ShaderMaterial
//             const uniforms = UniformsUtils.merge([
//                 {
//                     time: { value: 1.0 },
//                     //map: { value: this.trailMap },
//                     color: { value: new Color(0xfcee8d) },
//                 },
//             ]);
    
//             this.trailMaterial = new ShaderMaterial({
//                 uniforms: uniforms,
//                 vertexShader:  `
//                     uniform float time;
//                     varying vec2 vUv;
                    
//                     void main() {
//                         vUv = uv;
//                         vec3 pos = position;
//                         pos.z += sin((vUv.y - 0.5) * 1.0 + time * 1.5) * 0.45 * (1.0 - vUv.y);
//                         pos.x += sin((vUv.x - 0.5) * 0.5 + time * 2.0) * 0.45 * (1.0 - vUv.y);
//                         // pos.z += sin(pos.y + time * 2.5) * 0.35 * (1.0 - vUv.y);
//                         // pos.x += sin(pos.x * 0.1 + time * 2.0) * 0.5 * (1.0 - vUv.y);
//                         gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
//                     }
//             `,
//                 fragmentShader:`
//                     uniform float time;
//                     uniform sampler2D map;
//                     varying vec2 vUv;
//                     uniform vec3 color;
    
//                     void main() {
//                         float wave = sin(2.0 * 3.1416 * (vUv.y - 0.5 * time * 2.0)) * (1.0 - vUv.y);
//                         vec2 uvTimeShift = clamp(vUv + vec2(-0.01 * wave, 0), 0.0, 1.0);
//                         vec4 textureValue = texture2D(map, uvTimeShift);
//                         gl_FragColor = vec4(color, 0.9) * textureValue;
//                     }
//             `,
//                 side: DoubleSide,
//                 blending: AdditiveBlending,
//                 depthTest: false,
//                 transparent: true,
//             });
    
//             this.trail = new Mesh(trailGeometry, this.trailMaterial);
//             this.trail.rotateX(-Math.PI * 0.5);
//             this.trail.position.z = 0.5 * length;
//             this.scale.set(this.targetScale, this.targetScale, this.targetScale);
//             this.add(this.trail);
//             this.visible = false;
//             //this.start(0.5);
//         }
    
//         start(time: number) {
//             new Animator({ time: 0.4 }, (o: number) => {
//                 if (!this.visible) {
//                     this.visible = true;
//                 }
//                 const t = o;
//                 const sc = t * this.targetScale;
//                 this.scale.set(sc, sc, sc);
//             });
//         }
    
//         end() {
//             this.visible = false;
//         }
    
//         update(delta: number): void {
//             const animationSpeed = 2;
//             this.trailMaterial.uniforms.time.value += delta * animationSpeed;
//         }
//     }
    