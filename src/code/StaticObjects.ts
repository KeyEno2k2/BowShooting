import { Object3D, Box3Helper, Box3, Color } from "three";
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
    static targetHitBoxHelpers: Box3Helper[] = []; // Holds the BoxHelpers for targets

    constructor() {
        StaticObject.bow = Game.game.scene.getObjectByName("Mesh")!;
        StaticObject.shadow = Game.game.scene.getObjectByName("Shadow")!;
        StaticObject.targetObject = Game.game.scene.getObjectByName("target")!;
        StaticObject.arrow = Game.game.scene.getObjectByName("model_arrow_modern_4")!;
        StaticObject.targetCircle = Game.game.scene.getObjectByName("target_yelow")!;

        this.AddTargetByName("target_black");
        this.AddTargetByName("target_blue");
        this.AddTargetByName("target_red");
        this.AddTargetByName("target_white");
        this.AddTargetByName("target_yelow");

        
        //this.showTargetHitBoxes(); // -> Funckja pokazująca hitboxy tarczy
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

	//Funckja pokazująca HitBoxy tarczy
    showTargetHitBoxes() {
        StaticObject.targets.forEach(target => {
            const targetBox = new Box3().setFromObject(target.targetView);
            const helper = new Box3Helper(targetBox, new Color(0xffff00));
            Game.game.scene.add(helper);
            StaticObject.targetHitBoxHelpers.push(helper);
        });
    }
}
