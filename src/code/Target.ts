import {Group, Object3D, Vector2, Vector3, Vector4} from "three";
import * as CANNON from "cannon-es";

export class Target {
    targetView: Object3D;
    targetBody?: CANNON.Body;
    startPosition: Vector3;
    constructor (view: Object3D){
        this.targetView = view;
        this.startPosition = this.targetView.position.clone();
    }
}