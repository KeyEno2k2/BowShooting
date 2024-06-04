import {
	Animator,
	LoopAnimator,
	libTex,
	removeFromUpdateables,
} from "playable-dev";
import {
	BufferGeometry,
	Color,
	DoubleSide,
	Euler,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	PlaneGeometry,
	Quaternion,
	RepeatWrapping,
	ShaderMaterial,
	UniformsLib,
	UniformsUtils,
	Vector2,
	Vector3,
} from "three";
import { Game } from "./Game";
import { StaticObject } from "./StaticObjects";

export class WhiteLine {
	plane: Mesh;
	shape: BufferGeometry;
	width: number = 2;
	geometryWidth: number = 1;
	geometryHeight: number = 10;
	pointA: Vector3 = new Vector3(0, 0, 0);
	pointB: Vector3 = new Vector3(0, 0, 2);
	startA = new Vector3(-1.5, 0, -3);
	endA = new Vector3(1.5, 0, -5);
	showAnimator?: Animator;
	hidenimator?: Animator;

	constructor(ballStartPosition: Vector3) {
		this.shape = new PlaneGeometry(this.width, 1, this.geometryWidth, this.geometryHeight);
		this.pointB = ballStartPosition.clone();
		

		const map = libTex("WHITE_STRIPE_PASEK_3");
		map.repeat.set(1, 1);
		map.wrapS = map.wrapT = RepeatWrapping;

		const material = new ShaderMaterial({
			uniforms: UniformsUtils.merge([
				UniformsLib["common"],
				UniformsLib["fog"],
				UniformsLib["lights"],
				{
					color: { type: "c", value: new Color(0xffffff) },
					opacity: { type: "f", value: 1.0 },
					offset: { type: "v2", value: new Vector2(0, 0) },
				},
			]),
			vertexShader: `
    varying vec2 vUv;

    void main() {
        vUv = uv;

        vec3 newPosition = position;

        float bendStrength = 0.4;
        float bendFactor = sin(uv.y * 3.14);

        if (uv.x < 0.5) {
            newPosition.x = position.x + bendFactor * bendStrength;
        } else {
            newPosition.x = position.x - bendFactor * bendStrength;
        }

        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
`,
			fragmentShader: `
    uniform sampler2D map;
    uniform vec2 offset;
    varying vec2 vUv;
    void main() {
        vec4 texColor = texture2D(map, vUv + offset);
        float alpha = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
        gl_FragColor = vec4(texColor.rgb, texColor.a * alpha);
    }
`,
			transparent: true,
			lights: true,
			fog: true,
			side: DoubleSide,
		});

		material.uniforms.map.value = map;

		this.plane = new Mesh(this.shape, material);
		this.plane.visible = false;
		Game.game.scene.add(this.plane);
		this.plane.scale.set(0.1, 0.5, 0.5);
		(this.plane.material as MeshBasicMaterial).transparent = true;

		this.updateShape();

		// Arrow animation
		new LoopAnimator({ time: 2 }, (o: number) => {
			material.uniforms.offset.value.set(0, -o); // Modify this line
		});
	}

	updateShape() {
		this.pointA = StaticObject.arrow.position.clone();
		const direction = new Vector3().subVectors(this.pointB, this.pointA);
		const height = direction.length();
		direction.normalize();

		// Scale the plane in the y-direction to achieve the desired height
		this.plane.scale.y = height;

		const quaternion = new Quaternion();
		quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction);

		this.plane.quaternion.identity();
		this.plane.applyQuaternion(quaternion);

		this.plane.position.copy(this.pointA).addScaledVector(direction, height / 2);

		// Create a local coordinate system
		const xAxis = new Vector3(1, 0, 0);
		const yAxis = direction.clone().normalize(); // The direction vector is the Y axis
		const zAxis = new Vector3().crossVectors(xAxis, yAxis).normalize();
		xAxis.crossVectors(yAxis, zAxis); // Make the X axis perpendicular to the Y and Z axes

		// Transform the plane's quaternion into the local coordinate system
		const localQuaternion = this.plane.getWorldQuaternion(new Quaternion());
		localQuaternion.premultiply(
			new Quaternion().setFromRotationMatrix(
				new Matrix4().makeBasis(xAxis, yAxis, zAxis).transpose()
			)
		);

		// Get the Euler angles from the local quaternion
		const euler = new Euler().setFromQuaternion(localQuaternion, "YXZ");

		const rotationAroundDirection = new Quaternion().setFromAxisAngle(direction, -euler.y);
		this.plane.applyQuaternion(rotationAroundDirection);
	}
	Show() {
		if (this.hidenimator) {
			removeFromUpdateables(this.hidenimator);
		}
		const startOpacity = Game.game.hud.arrowShape.alpha;
		this.plane.visible = true;
		Game.game.hud.arrowShape.setVisible(true);
		this.showAnimator = new Animator({ time: 0.3 }, (o: number) => {
			Game.game.hud.arrowShape.setAlpha(startOpacity * (1 - o) + o);
			if (o >= 1) {
				this.showAnimator = undefined;
			}
		});
	}
	Hide() {
		if (this.showAnimator) {
			removeFromUpdateables(this.showAnimator);
		}
		this.plane.visible = false;
		const startOpacity = Game.game.hud.arrowShape.alpha;
		this.hidenimator = new Animator({ time: 0.1 }, (o: number) => {
			Game.game.hud.arrowShape.setAlpha(startOpacity * (1 - o));
			if (o >= 1) {
				this.hidenimator = undefined;
			}
		});
	}
}
