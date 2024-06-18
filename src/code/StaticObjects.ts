import { Object3D, Box3Helper, Box3, Color, Vector3 } from "three";
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
    static targetHitBoxHelpers: { [key: string]: Box3Helper } = {}; // Obiekt przechowujący Box3Helper dla każdego hitboxu

    constructor() {
        StaticObject.bow = Game.game.scene.getObjectByName("Mesh")!;
        StaticObject.shadow = Game.game.scene.getObjectByName("Shadow")!;
        StaticObject.targetObject = Game.game.scene.getObjectByName("target")!;
        StaticObject.arrow = Game.game.scene.getObjectByName("model_arrow_modern_4")!;
        StaticObject.targetCircle = Game.game.scene.getObjectByName("target_yelow")!;

        this.AddTargetByName("target_black", "HitBoxTarget_Black");
        this.AddTargetByName("target_blue", "HitBoxTarget_Blue");
        this.AddTargetByName("target_red", "HitBoxTarget_Red");
        this.AddTargetByName("target_white", "HitBoxTarget_White");
        this.AddTargetByName("target_yelow", "HitBoxTarget_Yellow");

        StaticObject.showTargetHitBoxes(); // Funkcja pokazująca hitboxy tarczy
    }

    AddTargetByName(name: string, hitBoxName: string) {
        const targetObject = Game.game.scene.getObjectByName(name) as Object3D;
        if (!targetObject) {
            console.error(`Object with name ${name} not found in the scene.`);
            return;
        }
        const newTarget = new Target(targetObject, hitBoxName);
        StaticObject.targets.push(newTarget);
    }

    static showTargetHitBoxes() {
        StaticObject.targets.forEach(target => {
            const targetBox = new Box3().setFromObject(target.targetView);
            const offset = new Vector3(0,-1,0);
            targetBox.min.add(offset);
            targetBox.max.add(offset);

            const helper = new Box3Helper(targetBox, new Color(0xff00ff));
            Game.game.scene.add(helper);
            StaticObject.targetHitBoxHelpers[target.hitBoxName] = helper;

            // Ustawienie hitboxa jako dziecko tarczy
            target.targetView.add(helper);
        });
    }
}
