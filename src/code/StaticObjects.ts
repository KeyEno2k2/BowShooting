import { Object3D } from "three";
import { Game } from "./Game";
import { Target } from "./Target";
import * as CANNON from "cannon-es"

export class StaticObject {
    static bow: Object3D;
    static target: Target;
    static targetObject: Object3D;
    static arrow: Object3D;
    static arrowCollider?: CANNON.Body;
    static shadow: Object3D;

    constructor() {
        StaticObject.bow = Game.game.scene.getObjectByName("Bow")!;
        StaticObject.shadow = Game.game.scene.getObjectByName("Shadow")!;
        StaticObject.targetObject = Game.game.scene.getObjectByName("targetObject")!;
        StaticObject.arrow = Game.game.scene.getObjectByName("Arrow")!;

    }
}