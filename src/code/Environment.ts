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
    }



}