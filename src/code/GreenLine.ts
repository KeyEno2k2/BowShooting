import {
	LoopAnimator,
	libTex,
} from "playable-dev";
import { Game } from "./Game";
import {
	Color,
	DoubleSide,
	Mesh,
	PlaneGeometry,
	RepeatWrapping,
	ShaderMaterial,
	UniformsLib,
	UniformsUtils,
	Vector2,
} from "three";
import { StaticObject } from "./StaticObjects";
import { DEG2RAD, randFloat, randInt } from "three/src/math/MathUtils";

export class GreenLine {
	plane: Mesh;
	material: ShaderMaterial;
	constructor() {
		const geometry = new PlaneGeometry(1, 10, 1, 10);
		const map = libTex("GREEN_STRIPE_PASEK_3");
		map.repeat.set(1, 1);
		map.wrapS = map.wrapT = RepeatWrapping;

		this.material = new ShaderMaterial({
			uniforms: UniformsUtils.merge([
				UniformsLib["common"],
				UniformsLib["fog"],
				UniformsLib["lights"],
				{
					color: { type: "c", value: new Color(0xffffff) },
					opacity: { type: "f", value: 1.0 },
					offset: { type: "v2", value: new Vector2(0, 0) },
					bendStrength: { type: "f", value: 0.0 }, // Add this line
				},
			]),
			vertexShader: `
        varying vec2 vUv;
		uniform float bendStrength; // Uniform to control the bending strength

        void main() {
            vUv = uv;

            vec3 newPosition = position;

			float bendFactor = 1.0 - 4.0 * pow(uv.y - 0.8, 2.0);  // Quadratic function for an arc shape
			newPosition.x = position.x + bendStrength * bendFactor;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
    `,
			fragmentShader: `
        uniform sampler2D map;
        uniform vec2 offset;
        varying vec2 vUv;
        void main() {
            vec4 texColor = texture2D(map, vUv + offset);
            float alpha = texColor.a*clamp(10.0*(-(vUv.y*vUv.y)+vUv.y), 0.0, 1.0);
         //  float alpha = 1.0;
            if(alpha < 0.5){
             //   discard;
            }
            gl_FragColor = vec4(texColor.rgb, alpha); // vec4(1.0,1.0,1.0,0.5);
           // gl_FragColor = vec4(1.0,1.0,1.0,alpha);
        }
    `,
			transparent: true,
			lights: true,
			fog: true,
			side: DoubleSide,
			depthTest: false,
		});

		this.material.uniforms.map.value = map;

		this.plane = new Mesh(geometry, this.material);
		this.plane.castShadow = false;
		this.plane.receiveShadow = false;
		this.plane.rotateX(-DEG2RAD * 90);

		Game.game.scene.add(this.plane);

		// Arrow animation
		new LoopAnimator({ time: 2 }, (o: number) => {
			this.material.uniforms.offset.value.set(0, -o);
		});

		this.plane.visible = false;
		this.plane.scale.set(0.03, 0.5, 0.2);
		this.SetWidht(StaticObject.arrow.position.z / 45);
	}

	Show() {
		this.plane.visible = true;
	}

	SetBendStrength(value: number) {
		this.material.uniforms.bendStrength.value = value;
	}

	SetWidht(value: number) {
		this.plane.scale.set(0.055 + value, 0.5, 0);
	}
}
