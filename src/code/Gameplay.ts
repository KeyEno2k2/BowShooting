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
    
 }