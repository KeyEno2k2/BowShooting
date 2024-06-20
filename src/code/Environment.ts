import { LoopAnimator } from "playable-dev";
import { Game } from "./Game";
import { Object3D, Quaternion, Vector3, Mesh } from "three";
import * as CANNON from "cannon-es";
import { StaticObject } from "./StaticObjects";
import * as THREE from "three";

export class Environment {
    target: Object3D;
    arrowCollider?: CANNON.Body;
    targetNumber: number = 0;

    constructor() {
        this.target = Game.game.scene.getObjectByName("Target")!;
        this.LoadColliders();
        this.CreateArrowCollider();
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
        object.visible = false;
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
                Math.abs(worldScale.z)
            )
        );

        let colliderType = object.name.includes("target_")
            ? CANNON.BODY_TYPES.STATIC
            : CANNON.BODY_TYPES.STATIC;

        let body = new CANNON.Body({
            mass: 1000,
            type: colliderType,
            position: new CANNON.Vec3(worldPos.x, worldPos.y, worldPos.z),
            quaternion: new CANNON.Quaternion(worldQuat.x, worldQuat.y, worldQuat.z, worldQuat.w)
        });
        // object.name.includes("target_") ? (body.mass = 1000) : (body.mass = 1);
        // body.addShape(shape);
        if (object.name.includes("target_")) {
            body.mass = 1000;
            StaticObject.targets[this.targetNumber].targetBody = body;
            this.targetNumber++;
        }

        body.addShape(shape);

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

        const arrowVector = new CANNON.Vec3(0.05, 0.05, 0.9);
        let shape = new CANNON.Box(arrowVector);
        StaticObject.arrowCollider.addShape(shape);
        StaticObject.arrowCollider.addEventListener(CANNON.Body.COLLIDE_EVENT_NAME, (e: any) => { });

        Game.game.cannonWorld.addBody(StaticObject.arrowCollider);
    }

    update(delta: number): void {

        const targetVector = new CANNON.Vec3(1,1,1);
        const targetquaternion = new CANNON.Quaternion(1,1,1,1)
        StaticObject.targets.forEach((target) => {
            target.targetBody?.position.copy(targetVector);
            target.targetBody?.quaternion.copy(targetquaternion);
        })

        if (StaticObject.arrow && StaticObject.shadow) {
            if (StaticObject.arrow.position.z < -19) {
                if (StaticObject.shadow.visible) {
                    StaticObject.shadow.visible = false;
                    StaticObject.arrow.layers.set(0);
                }
                StaticObject.arrow.position.y -= delta * 2.5;
            }
        }

        if (StaticObject.arrow) {
            if (StaticObject.arrowCollider) {
                StaticObject.arrowCollider.position.set(
                    StaticObject.arrow.position.x,
                    StaticObject.arrow.position.y,
                    StaticObject.arrow.position.z
                );
                StaticObject.arrowCollider.quaternion.set(
                    StaticObject.arrow.quaternion.x,
                    StaticObject.arrow.quaternion.y,
                    StaticObject.arrow.quaternion.z,
                    StaticObject.arrow.quaternion.w
                );

            }
        }
    }
}
