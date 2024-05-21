import { Object3D } from "three";
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
    static targetCircle : Object3D;

    constructor() {
        StaticObject.bow = Game.game.scene.getObjectByName("Mesh")!;
        StaticObject.shadow = Game.game.scene.getObjectByName("Shadow")!;
        StaticObject.targetObject = Game.game.scene.getObjectByName("target")!;
        StaticObject.arrow = Game.game.scene.getObjectByName("model_arrow_modern_4")!;
        StaticObject.targetCircle = Game.game.scene.getObjectByName("target_yellow")!;

        this.AddTargetByName("target_black");
        this.AddTargetByName("target_blue");
        this.AddTargetByName("target_red");
        this.AddTargetByName("target_white");
        this.AddTargetByName("target_yellow");
    }

    AddTargetByName(name: string){
        const newTarget = new Target(Game.game.scene.getObjectByName(name) as Object3D);
        StaticObject.targets.push(newTarget);
    }
}