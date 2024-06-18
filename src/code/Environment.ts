import { LoopAnimator } from "playable-dev";
import { Game } from "./Game";
import { Object3D, Quaternion, Vector3 } from "three";
import * as CANNON from "cannon-es"
import { StaticObject } from "./StaticObjects";

export class Environment {
    target: Object3D;
    arrowCollider?: CANNON.Body;
    targetNumber: number = 0;

    constructor() {
        this.target = Game.game.scene.getObjectByName("Target")!;
        //this.LoadColliders();
        this.CreateArrowCollider();
    }

    // LoadColliders(){
    //     if (!Game.game.scene) return;

    //     Game.game.scene.traverse((child) => {
    //         if (child.name.startsWith("Collider") || child.name.startsWith("collider")) {
    //             this.LoadCollider(child);
    //         }
    //     })
    // }

    LoadCollider(object: THREE.Object3D){
        object.updateWorldMatrix(true,true);
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
                Math.abs(worldScale.z)
            )
        );

        //Dodanie Tarczy z Kolizją
        let colliderType = object.name.includes("target_")
            ? CANNON.BODY_TYPES.STATIC
            : CANNON.BODY_TYPES.STATIC

        //Dodanie nowego ciła dla Tarczy
        let body = new CANNON.Body({
            mass: 1,
            type: colliderType,
            position: new CANNON.Vec3(worldPos.x, worldPos.y, worldPos.z),
            quaternion: new CANNON.Quaternion(worldQuat.x, worldQuat.y, worldQuat.z, worldQuat.w)
        });
        object.name.includes("target_") ? (body.mass = 1000) : (body.mass = 1);
        body.addShape(shape);

        if (Game.game.cannonWorld){
            Game.game.cannonWorld.addBody(body);
        }

        if (object.name.includes("target_")) {
            StaticObject.targets[this.targetNumber].targetBody = body;
            this.targetNumber++;
        }
    }


    CreateArrowCollider(){
        if (!StaticObject.arrow){
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
                StaticObject.arrow.position.z,
                StaticObject.arrow.quaternion.w
            )
        });

        let shape = new CANNON.Sphere(1); // TUtaj trzeba zmienić na BOXA
        StaticObject.arrowCollider.addShape(shape);
        StaticObject.arrowCollider.addEventListener(CANNON.Body.COLLIDE_EVENT_NAME, (e: any) => {});

        Game.game.cannonWorld.addBody(StaticObject.arrowCollider);
        console.log(StaticObject.arrowCollider);
    }

}