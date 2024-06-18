import { Object3D, Vector3, Box3 } from "three";
import * as CANNON from "cannon-es";

export class Target {
    targetView: Object3D;
    targetBody?: CANNON.Body;
    startPosition: Vector3;
    hitBox: Box3 | null = null;
    hitBoxName: string; // Nowa właściwość dla nazwy hitboxu

    constructor(view: Object3D, hitBoxName: string) {
        if (!(view instanceof Object3D)) {
            throw new Error("Target object view is not an instance of Object3D");
        }
        this.targetView = view;
        this.startPosition = this.targetView.position.clone();
        this.hitBoxName = hitBoxName; // Przypisanie nazwy hitboxu

        // Sprawdzanie czy istnieją HitBoxy
        if (this.targetView.type === "Mesh" && 'geometry' in this.targetView) {
            const geometry = (this.targetView as any).geometry;
            this.hitBox = new Box3().setFromObject(this.targetView);
        } else {
            console.warn("Target object view does not have geometry or is not a Mesh");
        }

        // Initialize CANNON.Body (if you are using Cannon.js physics)
        this.targetBody = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(this.startPosition.x, this.startPosition.y, this.startPosition.z),
            shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1)), // Example shape
        });
    }
}
