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
    Color as ColorTHREE
} from "three"
import { StaticObject } from "./StaticObjects"
import { DEG2RAD, RAD2DEG, randFloat, randInt } from "three/src/math/MathUtils"
import { SkeletonData, SkeletonMesh } from "playable-dev/spine-lib"
import { ArrowTrace } from "./ArrowTrace"
import { Setup } from "./Setup"
import { GreenLine } from "./GreenLine"
import { WhiteLine } from "./WhiteLine"

const THROWS: number = 3;
const RESTART_TIME_MILISECONDS: number = 2200;
const ANIMATION_CHANGE_TIME: number = 1;

export class Gameplay implements MouseListener {
    mousePosition: Vector2 = new Vector2();
    z_order: number = 1;
    arrow?: Object3D;
    clickPosition: Vector2 = new Vector2();
    arrowInBow: boolean = false;
    arrowStartPosition: Vector3 = new Vector3();
    cameraStartPosition: Vector3 = new Vector3();
    lightStartPosition: Vector3 = new Vector3();

    targetPosition: Vector3 = new Vector3();
    arrowMaxZPosition: number = 2;
    allowAnimation: boolean = false;
    StretchAnimation?: LoopAnimator;
    animationStartPosition: Vector3 = new Vector3();
    shooted: boolean = false;
    shoots: number = 0;
    hitAnimation!: SkeletonMesh;
    bowAnimation1!: SkeletonMesh;
    bowAnimation2!: SkeletonMesh;
    bowAnimation3!: SkeletonMesh;
    centerAnimation!: SkeletonMesh;
    failAnimation!: SkeletonMesh;
    greenLine?: GreenLine;
    whiteLine?: WhiteLine;

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

    constructor() {
        this.sr = ScreenResizer.resizer;
        Engine.controlEvents.addListener(this);
        if (!this.playMusicAgainBlockade) {
            this.playMusicAgainBlockade = true;
            this.music = playSndLoop("music", 0.2);
        }

        if (Game.sessionCounter > 1) {
            return;
        }

        this.arrow = StaticObject.arrow;
        this.arrow.renderOrder = 1;

        this.arrowStartPosition = this.arrow.position.clone();

        this.cameraStartPosition = Engine.camera.position.clone();

        this.lightStartPosition = Game.game.scene.directionalLight!.position.clone();

        this.arrowTrace = new ArrowTrace();

        this.cameraDistance = Engine.camera.position.z - this.arrow.position.z;
        this.startCameraDistance = this.cameraDistance;

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

        this.bowAnimation1 = new SkeletonMesh(
            <SkeletonData>Engine.assetsLib.lib["whitefire"],
            (materialParameters: THREE.ShaderMaterialParameters) => { }
        );
        this.bowAnimation1.renderOrder = 10;
        this.bowAnimation1.scale.set(0.1, 0.1, 0);
        this.startAnimationScale = this.bowAnimation1.scale.x;
        this.bowAnimation1.scale.set(0, 0, 0);

        Game.game.scene.add(this.hitAnimation);
        Game.game.scene.add(this.failAnimation);
        Game.game.scene.add(this.centerAnimation);

        Game.game.scene.add(this.bowAnimation1);
        this.bowAnimation1.state.setAnimation(0, "white", true).timeScale = 1.3;
        this.bowAnimation1.rotateZ(RAD2DEG * 15);
        this.bowAnimation1.renderOrder - 0.1;
        this.bowAnimation1.visible = true;
        this.arrow?.layers.set(2);

        this.bowAnimation2 = new SkeletonMesh(
            <SkeletonData>Engine.assetsLib.lib["bluefire"],
            (materialParameters: THREE.ShaderMaterialParameters) => { }
        );
        this.bowAnimation2.renderOrder = 10;
        this.bowAnimation2.scale.set(0, 0, 0);

        Game.game.scene.add(this.bowAnimation2);
        this.bowAnimation2.state.setAnimation(0, "blue", true).timeScale = 1.3;
        this.bowAnimation2.rotateZ(RAD2DEG * 15);
        this.bowAnimation2.renderOrder = 0.1;
        this.bowAnimation2.visible = false;

        this.bowAnimation3 = new SkeletonMesh(
            <SkeletonData>Engine.assetsLib.lib["redfire"],
            (materialParameters: THREE.ShaderMaterialParameters) => { }
        );
        this.bowAnimation3.renderOrder = 10;
        this.bowAnimation3.scale.set(0, 0, 0);

        Game.game.scene.add(this.bowAnimation3);
        this.bowAnimation3.state.setAnimation(0, "red", true).timeScale = 1.3;
        this.bowAnimation3.rotateZ(RAD2DEG * 15);
        this.bowAnimation3.renderOrder = 0.1;
        this.bowAnimation3.visible = true;


    }

    onPointerUp(event: MouseEvent): boolean {
        if (Setup.sipMode) {
            return true;
        }
        if (Game.sessionCounter > 1) {
            return true;
        }
        this.bowAnimation1.visible = false;
        this.bowAnimation2.visible = false;
        this.bowAnimation3.visible = false;

        if (this.shooted || !this.arrowInBow) {
            return true;
        }
        this.ResetPositions();
        //this.ShootArrow();
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

        if (!this.shooted) {
            Game.game.hud.showMiniGame();
            if (!Game.game.hud.tutorialEnded) {
                Game.game.hud.hideWhiteTutorial();
            }
        }

        this.greenLine?.Show();
        this.bowAnimation1.visible = true;
        this.bowAnimation2.visible = true;
        this.bowAnimation3.visible = true;
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

    SetCameraNLightInProperPosition(){
        if (this.arrow) {
            if (
                Engine.camera.position.z - this.arrow.position.z > this.cameraDistance &&
                !this.hitAnimationPlayed
            ) {
                Engine.camera.position.z = this.arrow.position.z + this.cameraDistance;
            }
            if (Game.game.scene.directionalLight!.position.z - this.arrow.position.z > 0.48) {
                Game.game.scene.directionalLight!.position.z = this.arrow.position.z + 0.48;
            }
            if (Game.game.scene.directionalLight!.position.z - this.arrow.position.z < -0.2) {
                Game.game.scene.directionalLight!.position.z = this.arrow.position.z - 0.2;
            }
        }
    }

    StretchArrow(){
        if (this.arrowInBow && this.arrow) {
            this.MaxStretchAnimationCheckAndPlay();
            this.arrow.position.z - (this.clickPosition.y - this.mousePosition.y) / 150;
            if (this.arrow.position.z > this.arrowMaxZPosition) {
                this.arrow.position.z = this.arrowMaxZPosition;
            }

            if (this.arrow.position.z < this.arrowMaxZPosition) {
                this.arrow.position.z = this.arrowStartPosition.z;
            }

            this.arrow.position.x = 
                this.arrowStartPosition.x - (this.clickPosition.x - this.mousePosition.x) / 300;

            const arrowMaxXPosition = 0.35;
            if (this.arrow.position.x > arrowMaxXPosition) {
                this.arrow.position.x = arrowMaxXPosition;
            }

            if (this.arrow.position.x < arrowMaxXPosition) {
                this.arrow.position.x = -arrowMaxXPosition;
            }

            this.arrow.rotation.x = -2 * Math.PI * (this.arrowStartPosition.z - this.arrow.position.z);
            this.animationStartPosition = this.arrow.position.clone();
            this.greenLine!.SetBendStrength(-this.arrow.position.x * 5);
            this.greenLine!.SetWidht(this.arrow.position.z / 45);
        }
    }

    MaxStretchAnimationCheckAndPlay() {
        if ((this.clickPosition.y - this.mousePosition.y) / 150 > -0.8) {
            this.ResetMaxStretchAnimation();
        } else if (!this.StretchAnimation) {
            this.StartMaxStretchAnimation();
        }   
     }

     StartMaxStretchAnimation() {
        let randomVector = new Vector3(0,0,0);
        this.StretchAnimation = new LoopAnimator(
            {time: 0.1},
            (o: number) => {
                if (!this.allowAnimation && this.arrowInBow) {
                    this.allowAnimation = true;
                    randomVector = new Vector3 (randFloat(-1,1), randFloat (0,1), randFloat(-1,1))
                        .normalize()
                        .divideScalar(100);
                }

                if (this.allowAnimation && this.arrow) {
                    this.arrow.position.set(
                        this.animationStartPosition.x + randomVector.x * Math.sin(o * Math.PI),
                        this.animationStartPosition.y,
                        this.animationStartPosition.z + randomVector.z * Math.sin(o * Math.PI)
                    );
                }
            },
            () => {
                this.allowAnimation = false;
            }
        );
     }

     ResetMaxStretchAnimation() {
        removeFromUpdateables(this.StretchAnimation!);
        this.StretchAnimation = undefined;
     }

     CameraAnimators(timeOfRoad: number) {
        const startRotation = this.arrow!.rotation.y / 0.28;
        let currentRotation = Engine.camera.rotation.z;
     }


}