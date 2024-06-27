import { LoopAnimator } from "playable-dev";
import { Game } from "./Game";
import { Object3D, Quaternion, Vector3, Mesh } from "three";
import * as CANNON from "cannon-es";
import { StaticObject } from "./StaticObjects";
import * as THREE from "three";
import { Target } from "./Target";

export class Environment {
    target: Object3D;
    arrowCollider?: CANNON.Body;
    targetNumber: number = 0;
    // TargetBlack: Object3D;
    // TargetBlue: Object3D;
    // TargetRed: Object3D;
    // TargetWhite: Object3D;
    // TargetYelow: Object3D;

    constructor() {
        this.target = Game.game.scene.getObjectByName("target")!;

        this.CreateArrowCollider();
        this.LoadCollider(this.target);
    }

    LoadColliders() {
        if (!Game.game.scene) return;

        Game.game.scene.traverse((child) => {
            if (child.name.startsWith("Collider") || child.name.startsWith("collider")) {
                this.LoadCollider(child);
            }
        });
    }

    LoadCollider(object: THREE.Object3D) {
        object.updateWorldMatrix(true, true);
        object.visible = true;
        let scale = object.scale;
        object.scale.set(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z));

        const worldPos = new Vector3();
        const worldQuat = new Quaternion();
        const worldScale = new Vector3();

        object.getWorldPosition(worldPos);
        object.getWorldQuaternion(worldQuat);
        object.getWorldScale(worldScale);

        const shape = new CANNON.Box(
            new CANNON.Vec3(
                Math.abs(worldScale.x),
                Math.abs(worldScale.y),
                Math.abs(worldScale.z * 0.07)
            )
        );

        let colliderType = object.name.includes("target_")
            ? CANNON.BODY_TYPES.STATIC
            : CANNON.BODY_TYPES.STATIC;

        let body = new CANNON.Body({
            mass: 1000,
            type: colliderType,
            position: new CANNON.Vec3(worldPos.x, worldPos.y, worldPos.z),
            quaternion: new CANNON.Quaternion(worldQuat.x, worldQuat.y, worldQuat.z * 0.5, worldQuat.w)
        });
        object.name.includes("target_") ? (body.mass = 1000) : (body.mass = 1200);
        body.addShape(shape);

        // if (object.name.includes("target_")) {
        //     body.mass = 1000;
        //     StaticObject.targets[this.targetNumber].targetBody = body;
        //     this.targetNumber++;
        // }
        // body.addShape(shape);

        if (Game.game.cannonWorld) {
            Game.game.cannonWorld.addBody(body);
        }

        if (object.name.includes("target_")) {
            StaticObject.targets[this.targetNumber].targetBody = body;
            this.targetNumber++;
        }
    }

    CreateArrowCollider() {
        if (!StaticObject.arrow) {
            return;
        }

        StaticObject.arrowCollider = new CANNON.Body({
            mass: 1,
            type: CANNON.BODY_TYPES.KINEMATIC,
            angularDamping: 0.0,
            position: new CANNON.Vec3(
                StaticObject.arrow.position.x,
                StaticObject.arrow.position.y,
                StaticObject.arrow.position.z
            ),
            quaternion: new CANNON.Quaternion(
                StaticObject.arrow.quaternion.x,
                StaticObject.arrow.quaternion.y,
                StaticObject.arrow.quaternion.z,
                StaticObject.arrow.quaternion.w
            )

        });

        const arrowVector = new CANNON.Vec3(0.03, 0.03, 0.5 );
        let shape = new CANNON.Box(arrowVector);
        StaticObject.arrowCollider.addShape(shape);
        StaticObject.arrowCollider.addEventListener(CANNON.Body.COLLIDE_EVENT_NAME, (e: any) => { });

        Game.game.cannonWorld.addBody(StaticObject.arrowCollider);
    }

}
