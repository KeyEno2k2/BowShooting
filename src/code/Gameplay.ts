import {
    Engine,
    Animator,
    MouseListener,
    ScreenResizer,
    analytics,
    AWAudio,
} from "playable-dev";
import { Game } from "./Game";
import {
    Object3D,
    Vector2,
    Vector3,
    AnimationMixer,
    AnimationAction,
    LoopOnce,
    PerspectiveCamera,
    Box3,
    Mesh
} from "three";
import { StaticObject } from "./StaticObjects";
import { SkeletonData, SkeletonMesh } from "playable-dev/spine-lib";
import { ArrowTrace } from "./ArrowTrace";
import { GLTF } from "playable-dev/assets-lib";

const SHOOTS: number = 3;
const RESTART_TIME_MILLISECONDS: number = 2200;

export class Gameplay implements MouseListener {
    z_order: number = 0;
    mousePosition: Vector2 = new Vector2();
    arrow!: Object3D;
    sceneFile: GLTF | undefined;
    clickPosition: Vector2 = new Vector2();
    arrowInBow: boolean = false;
    arrowStartPosition: Vector3 = new Vector3();
    mixer!: AnimationMixer;
    animation!: AnimationAction;
    bow!: Object3D;
    camera!: PerspectiveCamera;
    shooted: boolean = false;
    shoots: number = 0;
    hitAnimation!: SkeletonMesh;
    failAnimation!: SkeletonMesh;
    sr: ScreenResizer;
    arrowTrace?: ArrowTrace;
    hits: number = 0;
    targetHitBoxes: Box3[] = [];
    targets: Mesh[] = [];
    targetGetHit: boolean = true;
    interacted: boolean = false;
    bowAnimation!: SkeletonMesh;
    

    constructor(camera: PerspectiveCamera) {
        this.camera = camera;
        this.sr = ScreenResizer.resizer;
        Engine.controlEvents.addListener(this); // Ensure this is properly defined in Engine

        this.sceneFile = Engine.assetsLib.lib["sceneGlb"] as GLTF;
        this.arrow = StaticObject.arrow;
        this.bow = StaticObject.bow;
        this.arrowStartPosition = this.arrow.position.clone();

        Engine.camera.position.set(15, 0, -3.75);
        Engine.camera.rotation.y = 1.5;

        this.arrowTrace = new ArrowTrace();
        this.LoadAnimations();
        this.initializeTargetHitBoxes();
        
    }

    initializeTargetHitBoxes() {
        this.targets.forEach(target => {
            const hitBox = new Box3().setFromObject(target);
            this.targetHitBoxes.push(hitBox);
        });
    }

    onPointerUp(event: MouseEvent): boolean {
        if (Game.sessionCounter > 1 || this.shooted || !this.arrowInBow) {
            return true;
        }
        Game.game.hud.hideMiniGame();
        if (!this.shooted) {
            Game.game.hud.showWhiteTutorial();
        }
        return true;
    }

    onPointerDown(event: MouseEvent): boolean {
        if (!this.interacted && Game.sessionCounter == 1) {
            analytics.logEvent("interaction");
            this.interacted = true;
        }
        if (Game.sessionCounter > 1 || this.shooted) {
            return true;
        }

        let currentArrowPosition = new Vector3;
        const startDistance = 0.3;
        const endDistance = 9.7;
        const arrowSpeed = 0.7;
        const duration = this.animation.getClip().duration;

        new Animator({ time: duration * 0.6 }, (o: number) => {
            this.arrow.position.z = this.arrowStartPosition.z + startDistance * o;
            if (o >= 1) {
                currentArrowPosition = this.arrow.position.clone();
            }
        });

        new Animator({ time: arrowSpeed, delay: duration - 0.5 }, (o: number) => {
            this.arrow.position.z = currentArrowPosition.z - endDistance * o;
            this.shooted = true;
        });

        this.animation.enabled = true;
        this.animation.reset();

        if (!this.shooted) {
            Game.game.hud.showMiniGame();
            if (!Game.game.hud.tutorialEnded) {
                Game.game.hud.hideWhiteTutorial();
            }
        }

        this.arrowInBow = true;
        this.clickPosition = new Vector2(event.clientX, event.clientY);
        return true;
    }

    onPointerMove(event: MouseEvent): boolean {
        if (this.shooted) {
            return true;
        }
        this.mousePosition = new Vector2(event.clientX, event.clientY);
        return true;
    }

    onPointerCancel(event: MouseEvent): boolean {
        if (this.shooted) {
            return true;
        }
        this.ResetPositions();
        return true;
    }

    ResetPositions() {
        this.arrowInBow = false;
        this.clickPosition = new Vector2();
        this.mousePosition = new Vector2();
    }

    playHitAnimation() {
        if (!this.targetGetHit) {
            this.failAnimation.visible = true;
            this.failAnimation.state.setAnimation(0, "fail", false).timeScale = 0.5;
            this.hits = 0;
            if (this.shoots == 3) {
                setTimeout(() => {
                    analytics.logEvent("game_ended");
                    this.ShowNextLevel();
                }, 5000);
            }
        } else if (this.targetGetHit) {
            this.hitAnimation.visible = true;
            this.hitAnimation.state.setAnimation(0, "hit", false).timeScale = 0.5;
            if (this.shoots == 3) {
                setTimeout(() => {
                    analytics.logEvent("game_ended");
                    this.ShowNextLevel();
                }, 5000);
            }
        }
    }

    ShowNextLevel() {
        Engine.restartGame();
    }

    checkCollisions() {
        const arrowPosition = new Vector3().setFromMatrixPosition(this.arrow.matrixWorld); 
        const arrowHitBox = new Box3().setFromCenterAndSize(arrowPosition, new Vector3(0.1, 0.1, 0.1));

        this.targetHitBoxes.forEach((hitbox, index) => {
            if (hitbox.intersectsBox(arrowHitBox)) {
                console.log(`trafiono w tarczę ${index}!`);
                this.playHitAnimation();
            }
        });
    }

    update(delta: number): void {
        if (this.arrow && StaticObject.shadow) {
            if (this.arrow.position.z < -19) {
                if (StaticObject.shadow.visible) {
                    StaticObject.shadow.visible = false;
                    this.arrow.layers.set(0);
                }
                this.arrow.position.y -= delta * 2.5;
            }
        }

        this.mixer.update(delta);
        this.checkCollisions();
    }

    LoadAnimations() {
        this.mixer = new AnimationMixer(this.bow);
        this.sceneFile!.animations.forEach((animationClip) => {
            if (animationClip.name == "Anim_shoot") {
                this.animation = this.mixer.clipAction(animationClip);
                this.animation.setLoop(LoopOnce, Infinity);
                this.animation.play();
                this.animation.enabled = false;
            }
        });
    }
    

    
}
