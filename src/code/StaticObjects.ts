import { Group, Object3D } from "three";
import { Game } from "./Game";
import { Target } from "./Target";
import * as CANNON from "cannon-es";

export class StaticObject {
    static bow: Object3D;
    static targets: Target[] = [];
    static targetObject: Object3D;
    static arrow: Object3D;
    static arrowCollider?: CANNON.Body;
    static shadow: Object3D;
    static targetCircle: Object3D;

    constructor() {
        StaticObject.bow = Game.game.scene.getObjectByName("Armature_bow")!;
        StaticObject.shadow = Game.game.scene.getObjectByName("Shadow")!;
        StaticObject.targetObject = Game.game.scene.getObjectByName("target")!;
        StaticObject.arrow = Game.game.scene.getObjectByName("model_arrow_modern_4")!;
        StaticObject.targetCircle = Game.game.scene.getObjectByName("target_yelow")!;

        //Cały Target -> Wszystkie jego części
        this.AddTargetByName("circle_white");
        this.AddTargetByName("circles_black");
        this.AddTargetByName("Cube");
        this.AddTargetByName("leg_1");
        this.AddTargetByName("leg_2");
        this.AddTargetByName("leg_3");
        this.AddTargetByName("target_black");
        this.AddTargetByName("target_blue");
        this.AddTargetByName("target_red");
        this.AddTargetByName("target_white");
        this.AddTargetByName("target_yelow");

    }

    AddTargetByName(name: string) {
        const targetObject = Game.game.scene.getObjectByName(name) as Object3D;
        if (!targetObject) {
            console.error(`Object with name ${name} not found in the scene.`);
            return;
        }
        const newTarget = new Target(targetObject);
        StaticObject.targets.push(newTarget);
    }
}