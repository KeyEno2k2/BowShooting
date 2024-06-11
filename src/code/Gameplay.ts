import {
    Engine,
    Animator,
    LoopAnimator,
    MouseListener,
    removeFromUpdateables,
    tweenOut,
    tweenIn,
    tweenIn2,
    ScreenResizer,
    ShopClick,
    analytics,
    playSndLoop,
    playSndOnce,
    AWAudio,
    tweenInOut,
    tweenInOut2,
} from "playable-dev"
import { Game } from "./Game"
import {
    Object3D,
    Vector2,
    Vector3,
    Color as ColorTHREE,
    AnimationMixer,
    AnimationAction,
    LoopRepeat,
    LoopOnce,
    PerspectiveCamera
} from "three"
import { StaticObject } from "./StaticObjects"
import { DEG2RAD, RAD2DEG, randFloat, randInt } from "three/src/math/MathUtils"
import { SkeletonData, SkeletonMesh } from "playable-dev/spine-lib"
import { ArrowTrace } from "./ArrowTrace"
import { Setup } from "./Setup"
import { GreenLine } from "./GreenLine"
import { WhiteLine } from "./WhiteLine"
import { Target } from "./Target"
import { GLTF } from "playable-dev/assets-lib";

const SHOOTS: number = 3;
const RESTART_TIME_MILISECONDS: number = 2200;
const ANIMATION_CHANGE_TIME: number = 1;

export class Gameplay implements MouseListener {
    mousePosition: Vector2 = new Vector2();
    z_order: number = 1;
    arrow!: Object3D;
    sceneFile: GLTF | undefined;
    clickPosition: Vector2 = new Vector2();
    arrowInBow: boolean = false;
    arrowStartPosition: Vector3 = new Vector3();
    cameraStartPosition: Vector3 = new Vector3();
    lightStartPosition: Vector3 = new Vector3();
    mixer!: AnimationMixer;
    animation!: AnimationAction;
    bow!: Object3D;
    camera!: PerspectiveCamera;

    targetPosition: Vector3[] = [];
    arrowMaxZPosition: number = 2;
    allowAnimation: boolean = false;
    StretchAnimation?: LoopAnimator;
    animationStartPosition: Vector3 = new Vector3();
    shooted: boolean = false;
    shoots: number = 0;
    hitAnimation!: SkeletonMesh;
    bowAnimation!: SkeletonMesh;
    centerAnimation!: SkeletonMesh;
    failAnimation!: SkeletonMesh;
    greenLine?: GreenLine;
    whiteLine?: WhiteLine;
    targetGetHit: boolean = true;

    sr: ScreenResizer;
    hitAnimationPlayed: boolean = false;
    cameraActive: boolean = false;
    updateTargetColliderBlockade: boolean = false;
    arrowTrace?: ArrowTrace;
    cameraDistance: number = 3.4;
    music?: AWAudio;
    interacted: boolean = false;
    startCameraDistance: number = 0;
    layerChanged1: boolean = false;
    layerChanged2: boolean = false;
    layerchanged3: boolean = false;
    startAnimationScale: number = 0;

    firstAnimationTruning?: Animator;
    secondAnimationTurning?: Animator;
    thirdAnimationTurning?: Animator;

    fistAnimationStarted?: boolean;
    secondAnimationStarted?: boolean;
    thirdAnimationStarted?: boolean;

    firstAnimationCurrentScale: number = 0;
    secondAnimationCurrentScale: number = 0;
    thirdAnimationCurrentScale: number = 0;

    playMusicAgainBlockade: boolean = false;
    hits: number = 0;

    constructor(camera: PerspectiveCamera) {
        this.camera = camera;
        this.sr = ScreenResizer.resizer;
        Engine.controlEvents.addListener(this);
        if (!this.playMusicAgainBlockade) {
            //this.playMusicAgainBlockade = true;
            //this.music = playSndLoop("music", 0.2);
        }

        if (Game.sessionCounter > 1) {
            return;
        }

        this.sceneFile = Engine.assetsLib.lib["sceneGlb"] as GLTF;
        this.arrow = StaticObject.arrow;
        this.arrow.renderOrder = 1;
        this.bow = StaticObject.bow;
        

        this.arrowStartPosition = this.arrow.position.clone();

        Engine.camera.position.x = 15;
        Engine.camera.position.y = 0;
        Engine.camera.position.z = -3.75;
        Engine.camera.rotation.y = 1.5;
        
        this.lightStartPosition = Game.game.scene.directionalLight!.position.clone();

        this.arrowTrace = new ArrowTrace();

        this.cameraDistance = Engine.camera.position.z - this.arrow.position.z;
        this.startCameraDistance = this.cameraDistance;
        this.LoadAnimations();

    }

    AnimationsPrepare() {
        this.hitAnimation = new SkeletonMesh(<SkeletonData>Engine.assetsLib.lib["hit"]);
        this.hitAnimation.renderOrder = 1001;
        this.hitAnimation.scale.set(0.0005, 0.0005, 0);
        this.hitAnimation.rotateX(-Math.PI / 10);
        this.hitAnimation.visible = false;
        this.hitAnimation.position.z -= 0.065

        this.failAnimation = new SkeletonMesh(<SkeletonData>Engine.assetsLib.lib["fail"]);
        this.failAnimation.renderOrder = 10;
        this.failAnimation.scale.set(0.0005, 0.0005, 0);
        this.failAnimation.visible = false;

        this.centerAnimation = new SkeletonMesh(<SkeletonData>Engine.assetsLib.lib["strike"]);
        this.centerAnimation.renderOrder = 10;
        this.centerAnimation.scale.set(0.0005, 0.0005, 0);
        this.centerAnimation.visible = false;

        this.bowAnimation = new SkeletonMesh(
            <SkeletonData>Engine.assetsLib.lib["whitefire"],
            (materialParameters: THREE.ShaderMaterialParameters) => { }
        );
        this.bowAnimation.renderOrder = 10;
        this.bowAnimation.scale.set(0.1, 0.1, 0);
        this.startAnimationScale = this.bowAnimation.scale.x;
        this.bowAnimation.scale.set(0, 0, 0);

        Game.game.scene.add(this.hitAnimation);
        Game.game.scene.add(this.failAnimation);
        Game.game.scene.add(this.centerAnimation);


    }

    onPointerUp(event: MouseEvent): boolean {
        if (Setup.sipMode) {
            return true;
        }
        if (Game.sessionCounter > 1) {
            return true;
        }
        this.bowAnimation.visible = false;
        this.animation.enabled = false;

        if (this.shooted || !this.arrowInBow) {
            return true;
        }
        this.ResetPositions();
        Game.game.hud.hideMiniGame();
        if (!this.shooted) {
            Game.game.hud.showWhiteTutorial();
        }
        return true;
    }

    onPointerDown(event: MouseEvent): boolean {
        if (!this.interacted && Game.sessionCounter == 1) {
            analytics.logEvent("interaction");
    
            if (ScreenResizer.resizer.isMissclick(event.clientY)) {
                analytics.logEvent("missclick_interraction");
            }
            this.interacted = true;
        }
    
        if (Game.sessionCounter > 1 || Setup.sipMode) {
            ShopClick.click(event);
            return true;
        }
    
        if (this.shooted) {
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
    
        this.greenLine?.Show();
        this.bowAnimation.visible = true;
        this.arrowInBow = true;
        this.clickPosition = new Vector2(event.clientX, event.clientY);
        return true;
    }
    
    onPointerMove(event: MouseEvent): boolean {
        if (Setup.sipMode) {
            return true;
        }

        if (this.shooted) {
            return true;
        }

        this.mousePosition = new Vector2(event.clientX, event.clientY);
        //this.StretchArrow();
        return true;
    }

    onPointerCancel(event: MouseEvent): boolean {
        if (Setup.sipMode) {
            return true;
        }

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

    // ------------------------------------------------------

    Start() { }

    ManageButtons() {
        if (!this.arrow || !this.arrowInBow) {
            return;
        }
    }

    ShowNextLevel() {
        Engine.restartGame();
    }

 
    // PlayHitAnimation() {
    //     if (!this.targetGetHit) {
    //         this.failAnimation.visible = true;
    //         this.failAnimation.state.setAnimation(0, "fail", false).timeScale = 0.5;
    //         this.hits = 0;
    //         if (this.shoots == 3) {
    //             setTimeout(() => {
    //                 analytics.logEvent("game_ended");
    //                 this.ShowNextLevel();
    //             }, 5000);  // 5000 ms = 5 seconds
    //         }
    //     } else if ((this.shoots == 1 || this.hits == 1) && this.targetGetHit) {
    //         this.hitAnimation.visible = true;
    //         this.hitAnimation.state.setAnimation(0, "hit", false).timeScale = 0.5;
    //         if (this.shoots == 3) {
    //             setTimeout(() => {
    //                 analytics.logEvent("game_ended");
    //                 this.ShowNextLevel();
    //             }, 5000);  // 5000 ms = 5 seconds
    //         }
    //     } else if ((this.shoots == 2 || this.hits == 2) && this.targetGetHit) {
    //         this.hitAnimation.visible = true;
    //         this.hitAnimation.state.setAnimation(0, "hit", false).timeScale = 0.5;
    //         if (this.shoots == 3) {
    //             setTimeout(() => {
    //                 analytics.logEvent("game_ended");
    //                 this.ShowNextLevel();
    //             }, 5000);  // 5000 ms = 5 seconds
    //         }
    //     }
    // }

    InitializeArrow(arrow: Object3D): void {
        this.arrow = arrow;
        console.log("Zainicjalizowano Strzałę", this.arrow);
    }


    update(delta: number): void {
        if (this.arrow && StaticObject.shadow) {
            if (this.arrow!.position.z < -19) {
                if (StaticObject.shadow.visible) {
                    StaticObject.shadow.visible = false;
                    this.arrow?.layers.set(0);
                }
                this.arrow!.position.y -= delta * 2.5;
            }
        }

        this.ManageButtons();
        if (!this.updateTargetColliderBlockade) {
            StaticObject.targets.forEach((target) => {
                if (target.targetView && target.targetBody) {
                    target.targetView.position.set(
                        target.targetBody!.position.x - StaticObject.targetObject.position.x,
                        target.targetBody!.position.y - StaticObject.targetObject.position.y,
                        target.targetBody!.position.z - StaticObject.targetObject.position.z
                    );
                    target.targetView.quaternion.set(
                        target.targetBody!.quaternion.x,
                        target.targetBody!.quaternion.y,
                        target.targetBody!.quaternion.z,
                        target.targetBody!.quaternion.w
                    );
                }
            });
        }

        this.mixer.update(delta);

        if (this.arrow && StaticObject.shadow && this.greenLine) {
            StaticObject.shadow.position.set(
                this.arrow.position.x - 0.1,
                StaticObject.shadow.position.y,
                this.arrow.position.z - 0.03
            );
        }

        if (this.shooted && this.arrow) {
            StaticObject.arrowCollider?.position.set(
                this.arrow.position.x,
                this.arrow.position.y,
                this.arrow.position.z
            );
        }

        if (this.failAnimation && this.arrow) {
            this.failAnimation.update(delta);
            this.failAnimation.position.set(
                Engine.camera.position.x,
                Engine.camera.position.y + 0.15,
                Engine.camera.position.z + 0.5
            );
        }

        if (this.hitAnimation && this.arrow) {
            this.hitAnimation.update(delta);
            this.hitAnimation.position.set(
                this.arrow.position.x,
                this.arrow.position.y + 0.15,
                this.arrow.position.z + 0.5
            );
        }

        if (this.whiteLine && this.arrow!.position.z < 0.1 && this.whiteLine.plane.visible) {
            this.whiteLine.Hide();
        } else if (
            this.whiteLine &&
            this.arrow!.position.z > 0.1 &&
            !this.whiteLine.plane.visible &&
            !this.shooted
        ) {
            this.whiteLine.Show();
        }

        if (this.whiteLine) {
            this.whiteLine.updateShape();
        }

        if (this.arrowTrace && this.arrow) {
            this.arrowTrace.position.set(
                this.arrow.position.x,
                this.arrow.position.y - 0.1,
                this.arrow.position.z
            );
        }

        if (this.bowAnimation && this.arrow) {
            this.bowAnimation.update(delta);
            this.bowAnimation.position.set(
                this.arrow.position.x,
                this.arrow.position.y,
                this.arrow.position.z
            );
            this.bowAnimation.lookAt(Engine.camera.position);
            if (this.bowAnimation.children[0] && !this.layerChanged1) {
                this.layerChanged1 = true;
                this.bowAnimation.children[0].layers.set(2);
            }
        }

        if (this.arrowTrace) {
            this.arrowTrace.update(delta);
        }
    }

    //Ładowanie Animacji z pliku GLB/GLTF
    LoadAnimations(){
        this.mixer = new AnimationMixer(this.bow!);
        this.sceneFile!.animations.forEach((animationClip) => {
            //console.log(animationClip.name);
            if (animationClip.name == "Anim_shoot"){
                this.animation = this.mixer.clipAction(animationClip);
                //this.animation.setLoop(LoopRepeat, Infinity);
                this.animation.setLoop(LoopOnce, Infinity);
                this.animation.play();
                this.animation.enabled = false;
                //console.log("działa");

                //Czas Trwania Animacji
                //console.log(this.animation.getClip().duration);
            }
        }
    )}


}

