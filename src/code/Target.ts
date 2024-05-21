import { Object3D, Vector3 } from "three";
import * as CANNON from "cannon-es";

export class Target {
    targetView: Object3D;
    targetBody?: CANNON.Body;
    startPosition: Vector3;

    constructor(view: Object3D) {
        if (!view) {
            throw new Error("Target object view is undefined");
        }
        this.targetView = view;
        this.startPosition = this.targetView.position.clone();
    }
}
