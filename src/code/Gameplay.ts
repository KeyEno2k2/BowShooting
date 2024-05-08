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

    targetPosition: Vector3 =  new Vector3();
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

    constructor(){
        this.sr = ScreenResizer.resizer;
        Engine.controlEvents.addListener(this);
        if (!this.playMusicAgainBlockade){
            this.playMusicAgainBlockade = true;
            this.music = playSndLoop("music", 0.2);
        }

        if (Game.sessionCounter > 1){
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

    onPointerUp(event: MouseEvent) : boolean {
        if (Setup.sipMode){
            return true;
        }

        if (Game.sessionCounter > 1){
            return true;
        }
        this.bowAnimation1.visible = true;
        this.bowAnimation2.visible = true;
        this.bowAnimation3.visible = true;
        if (this.shooted || !this.arrowInBow){
            return true;
        }
        //this.ResetPositions();
        //this.ShootArrow();
        Game.game.hud.hideMiniGame();
        if (!this.shooted){
            Game.game.hud.showWhiteTutorial();
        }
        return true;
    }

    onPointerDown(event: MouseEvent) : boolean {

        return true;
    }
    
 }