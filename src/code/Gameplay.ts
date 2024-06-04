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
    LoopOnce
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

    constructor() {
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

        // Game.game.scene.add(this.bowAnimation);
        // this.bowAnimation.state.setAnimation(0, "white", true).timeScale = 1.3;
        // this.bowAnimation.rotateZ(RAD2DEG * 15);
        // this.bowAnimation.renderOrder - 0.1;
        // this.bowAnimation.visible = true;
        // this.arrow?.layers.set(2);

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
        this.ShootArrow();
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

        new Animator ({time: duration * 0.6}, (o: number) =>{
            this.arrow.position.z = this.arrowStartPosition.z + startDistance * o;
            if (o >= 1){
                currentArrowPosition = this.arrow.position.clone();
                //this.shooted = true;
            }
        });
        new Animator ({time: arrowSpeed, delay: duration - 0.5}, (o: number) =>{
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
        this.StretchArrow();
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

    SetCameraNLightInProperPosition() {
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

    StretchArrow() {
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
        let randomVector = new Vector3(0, 0, 0);
        this.StretchAnimation = new LoopAnimator(
            { time: 0.1 },
            (o: number) => {
                if (!this.allowAnimation && this.arrowInBow) {
                    this.allowAnimation = true;
                    randomVector = new Vector3(randFloat(-1, 1), randFloat(0, 1), randFloat(-1, 1))
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

        new Animator({ time: timeOfRoad - timeOfRoad / 8, delay: timeOfRoad / 16 }, (o: number) => {
            Engine.camera.rotation.z = startRotation * 0.1 * tweenInOut(o);
            if (o >= 1) {
                currentRotation = Engine.camera.rotation.z;
            }
        });

        new Animator({ time: timeOfRoad / 2, delay: timeOfRoad / 16 }, (o: number) => {
            Engine.camera.position.y = 0.864 * (1 - tweenIn2(o)) + 0.32 * tweenIn2(o);
        });

        new Animator({ time: timeOfRoad / 2, delay: timeOfRoad / 2 + timeOfRoad / 16 }, (o: number) => {
            Engine.camera.position.y = 0.32 * (1 - tweenIn2(o)) + 0.564 * tweenIn2(o);
        });

        new Animator({ time: timeOfRoad - timeOfRoad / 8, delay: timeOfRoad / 16 }, (o: number) => {
            Engine.camera.position.x = startRotation * 0.5 * tweenInOut2(o);
        });

        new Animator({ time: timeOfRoad - timeOfRoad / 8, delay: timeOfRoad / 16 }, (o: number) => {
            Engine.camera.rotation.y = startRotation * DEG2RAD * 5 * tweenInOut2(o);
        });
    }

    ShootArrow() {
        if (!this.arrow) {
            return;
        }

        if (this.arrow.position.z < 0.1) {
            this.ResetObjectsPositions();
            this.ResetPositions();

            this.ResetMaxStretchAnimation();
            this.greenLine!.plane.visible = false;
            this.whiteLine?.Hide();
            return;
        }

        //PlaySound1
        //PlaySound2
        //const sound

        this.arrowTrace?.start(0.6);
        this.greenLine!.plane.visible = false;
        this.whiteLine?.Hide();
        this.shoots++;
        this.shooted = true;
        this.arrow.rotation.x = 0;
        this.arrow.rotation.y = 0.25 * Math.PI * (this.arrowStartPosition.x - this.arrow.position.x);
        const arrowCurving = -this.arrow.rotation.y;

        let startPosition = this.arrow.position.clone();
        let endPosition = StaticObject.targetObject.position.clone();
        endPosition.x -= Game.game.hud.arrowHUD.rotation.z / 2.8;

        const shieldPosition = StaticObject.targetObject.position;
        endPosition.x += shieldPosition.x;
        endPosition.y += shieldPosition.y;
        endPosition.z += shieldPosition.z;

        let startEndPointPositionZ = endPosition.z;

        const timeOfRoad = 2.5 - this.arrow.position.z / 2;

        new Animator({ time: timeOfRoad }, (o: number) => {
            endPosition.z = startEndPointPositionZ - 1.7 * o;
        });

        let speedRotation = 1000;
        this.CameraAnimators(timeOfRoad);

        new Animator({ time: timeOfRoad }, (o: number) => {
            if (!this.arrow) {
                return;
            }

            speedRotation = 1000 - (960 - timeOfRoad * 4) * Math.pow(o, 0.05);
            this.arrow.rotateX(
                (this.arrow.position.z - this.arrowStartPosition.z - 2) / speedRotation
            );

            this.arrow.position.set(
                startPosition.x * (1 - Math.pow(o, 3)) +
                endPosition.x * Math.pow(o, 3) -
                Math.sin(Math.PI * (1 - o)) * arrowCurving * 1.8,
                this.arrow.position.y,
                startPosition.z * (1 - o) + endPosition.z * o
            );

            if (
                this.arrow.position.z <= StaticObject.targetCircle.position.z + shieldPosition.z + 1.6
            ) {
                StaticObject.targets.forEach((target) => {
                    target.targetBody?.wakeUp();
                });
            }


            if (
                this.arrow.position.z <= StaticObject.targetObject.position.z + shieldPosition.z + 0.6 &&
                !this.hitAnimationPlayed
            ) {
                if (this.shoots == 1) {
                    //play sound once
                } else if (this.shoots == 2) {
                    //play sound once
                } else if (this.shoots == 3) {
                    //play sound once
                }
                this.HitTarget();
            }

            this.cameraDistance =
                this.startCameraDistance * (1 - Math.pow(o, 5)) + 0.4 * Math.pow(o, 5);
            if (o >= 1) {
                if (this.shoots < SHOOTS) {
                    this.NextArrow();
                }
            }
        });

    }

    ShowNextLevel() {
        Engine.restartGame();
    }

    HitTarget() {
        //Trafienie do celu
        this.hitAnimationPlayed = true;
        this.hitAnimation.visible = true;
        this.arrowTrace?.end();

        this.hitAnimation.state.setAnimation(0, "hit", false).timeScale = 1.2;
        new Animator({time: 1.7}, (o: number) => {
            if (o >= 1) {
                StaticObject.targets.forEach((target) => {
                    if (target.targetView.clone().translateY(0.2).position.y > 0.375) {
                        this.targetGetHit = false;
                    }
                });
                if (this.targetGetHit) {
                    this.hits++;
                }
                this.PlayHitAnimation();
                this.targetGetHit = true;
            }
        });
        this.MoveCameraAfterHit();
    }

    PlayHitAnimation() {
        if (!this.targetGetHit) {
            this.failAnimation.visible = true;
            this.failAnimation.state.setAnimation(0, "fail", false).timeScale = 0.5;
            this.hits = 0;
            if (this.shoots == 3) {
                new Animator({time: RESTART_TIME_MILISECONDS / 1000}, (o: number) => {
                    if (o >= 1) {
                        analytics.logEvent("game_ended");
                        this.ShowNextLevel();
                    }
                });
            }
        } else if ((this.shoots == 1 || this.hits == 1) && this.targetGetHit) {
            this.hitAnimation.visible = true;
            this.hitAnimation.state.setAnimation(0, "hit", false).timeScale = 0.5;
            if (this.shoots == 3) {
                new Animator({time: RESTART_TIME_MILISECONDS / 1000}, (o: number) => {
                    if (o >= 1){
                        analytics.logEvent("game_ended");
                        this.ShowNextLevel();
                    }
                });
            }
        } else if ((this.shoots == 2 || this.hits == 2) && this.targetGetHit) {
            this.hitAnimation.visible = true;
            this.hitAnimation.state.setAnimation(0, "hit", false).timeScale = 0.5;
            if (this.shoots == 3) {
                new Animator({time: RESTART_TIME_MILISECONDS / 1000}, (o: number) => {
                    if (o >= 1 ) {
                        analytics.logEvent("game_ended");
                        this.ShowNextLevel();
                    }
                });
            }
        }  else if ((this.shoots == 3 || this.hits == 3) && this.targetGetHit) {
            this.hitAnimation.visible = true;
            this.hitAnimation.state.setAnimation(0, "hit", false).timeScale = 0.5;
            if (this.shoots == 3) {
                new Animator({time: RESTART_TIME_MILISECONDS / 1000}, (o: number) => {
                    if (o >= 1){
                        analytics.logEvent("game_ended");
                        this.ShowNextLevel();
                    }
                });
            }
        }
    }

    MoveCameraAfterHit() {
        const startCameraPosition = Engine.camera.position.clone();
        const finishCameraPosition = new Vector3(0, 1, 1);

        new Animator({ time: RESTART_TIME_MILISECONDS / 1000 }, (o: number) => {
            Engine.camera.position.set(
                startCameraPosition.x * (1 - tweenIn(o)) + finishCameraPosition.x * tweenIn(o),
                startCameraPosition.y * (1 - tweenIn(o)) + finishCameraPosition.y * tweenIn(o),
                startCameraPosition.z * (1 - tweenIn(o)) + finishCameraPosition.z * tweenIn(o)
            );
        });
        this.ShakeCamera(); //Wywołanie funkcji trzęsienia kamery
    }

    ShakeCamera() {
        let startCameraRotation = Engine.camera.rotation.clone();
        new Animator({ time: 0.2 }, (o: number) => {
            Engine.camera.rotation.set(
                startCameraRotation.x + Math.sin(o * Math.PI * 4) / 200,
                startCameraRotation.y + Math.sin(o * Math.PI * 4) / 200,
                startCameraRotation.z + Math.sin(o * Math.PI * 4) / 200
            );
        });
    }

    NextArrow() {
        this.cameraActive = false;
        this.hitAnimationPlayed = false;

        this.cameraDistance = this.startCameraDistance;

        setTimeout(() => {
            const startCameraPosition = Engine.camera.position.clone();
            let startCameraRotation = Engine.camera.rotation.clone();

            new Animator({ time: RESTART_TIME_MILISECONDS / 1000 }, (o: number) => {
                Engine.camera.position.set(
                    startCameraPosition.x * (1 - tweenIn2(o)) +
                    this.cameraStartPosition.x * tweenIn2(o),
                    startCameraPosition.y * (1 - tweenIn2(o)) +
                    this.cameraStartPosition.y * tweenIn2(o),
                    startCameraPosition.z * (1 - tweenIn2(o)) +
                    this.cameraStartPosition.z * tweenIn2(o)
                );
                Engine.camera.rotation.y = startCameraRotation.y * (1 - o);
                Engine.camera.rotation.z = startCameraRotation.z * (1 - o);
                if (o >= 1) {
                    this.shooted = false;
                    this.cameraActive = true;

                    Game.game.hud.showWhiteTutorial();
                }
            });
            this.ResetPositions();

            this.ResetMaxStretchAnimation();
        }, RESTART_TIME_MILISECONDS);
    }

    ResetObjectsPositions(littleStretchBlockade: boolean = false) {
        if (!this.arrow) {
            return true;
        }

        this.arrow.position.set(
            this.arrowStartPosition.x,
            this.arrowStartPosition.y,
            this.arrowStartPosition.z
        );

        this.arrow?.layers.set(2);
        StaticObject.shadow.visible = true;
        if (!littleStretchBlockade) {
            this.arrow.rotation.set(0, 0, 0);
        }

        this.bowAnimation.scale.set(0, 0, 0);


        this.firstAnimationCurrentScale = 0;
        this.secondAnimationCurrentScale = 0;
        this.thirdAnimationCurrentScale = 0;

        this.secondAnimationStarted = false;
        this.fistAnimationStarted = false;
        this.thirdAnimationStarted = false;

        if (this.firstAnimationTruning) {
            removeFromUpdateables(this.firstAnimationTruning);
        }

        if (this.secondAnimationTurning) {
            removeFromUpdateables(this.secondAnimationTurning);
        }

        if (this.thirdAnimationTurning) {
            removeFromUpdateables(this.thirdAnimationTurning);
        }

        Game.game.scene.directionalLight!.position.set(
            this.lightStartPosition.x,
            this.lightStartPosition.y,
            this.lightStartPosition.z
        );
        this.animationStartPosition = this.arrow.position.clone();
        this.greenLine!.SetBendStrength(0);
    }


    // TurnOn1Animation() {
    //     if (!this.fistAnimationStarted) {
    //         this.fistAnimationStarted = true;

    //         if (this.secondAnimationTurning) {
    //             removeFromUpdateables(this.secondAnimationTurning);
    //         }
    //         if (this.thirdAnimationTurning) {
    //             removeFromUpdateables(this.thirdAnimationTurning);
    //         }

    //         this.firstAnimationTruning = new Animator(
    //             { time: ANIMATION_CHANGE_TIME },
    //             (o: number) => {
    //                 this.bowAnimation1.scale.set(
    //                     this.startAnimationScale * Math.pow(o, 0.1),
    //                     this.startAnimationScale * Math.pow(o, 0.1),
    //                     this.startAnimationScale * Math.pow(o, 0.1)
    //                 );
    //                 this.firstAnimationCurrentScale = this.bowAnimation1.scale.x;
    //             }
    //         );
    //         new Animator({ time: ANIMATION_CHANGE_TIME }, (o: number) => {
    //             this.bowAnimation2.scale.set(
    //                 this.secondAnimationCurrentScale * (1 - Math.pow(o, 5)),
    //                 this.secondAnimationCurrentScale * (1 - Math.pow(o, 5)),
    //                 this.secondAnimationCurrentScale * (1 - Math.pow(o, 5))
    //             );
    //             this.secondAnimationCurrentScale = this.bowAnimation2.scale.x;
    //         });

    //         new Animator({ time: ANIMATION_CHANGE_TIME }, (o: number) => {
    //             this.bowAnimation3.scale.set(
    //                 this.thirdAnimationCurrentScale * (1 - Math.pow(o, 5)),
    //                 this.thirdAnimationCurrentScale * (1 - Math.pow(o, 5)),
    //                 this.thirdAnimationCurrentScale * (1 - Math.pow(o, 5))
    //             );
    //             this.thirdAnimationCurrentScale = this.bowAnimation3.scale.x;
    //         });
    //     }
    //     this.secondAnimationStarted = false;
    //     this.thirdAnimationStarted = false;
    // }

    // TurnOn2Animation() {
    //     if (!this.secondAnimationStarted) {
    //         this.secondAnimationStarted = true;

    //         if (this.firstAnimationTruning) {
    //             removeFromUpdateables(this.firstAnimationTruning);
    //         }
    //         if (this.thirdAnimationTurning) {
    //             removeFromUpdateables(this.thirdAnimationTurning);
    //         }

    //         this.secondAnimationTurning = new Animator(
    //             { time: ANIMATION_CHANGE_TIME },
    //             (o: number) => {
    //                 this.bowAnimation2.scale.set(
    //                     this.startAnimationScale * Math.pow(o, 0.1),
    //                     this.startAnimationScale * Math.pow(o, 0.1),
    //                     this.startAnimationScale * Math.pow(o, 0.1)
    //                 );
    //                 this.secondAnimationCurrentScale = this.bowAnimation2.scale.x;
    //             }
    //         );

    //         new Animator({ time: ANIMATION_CHANGE_TIME }, (o: number) => {
    //             this.bowAnimation1.scale.set(
    //                 this.firstAnimationCurrentScale * (1 - Math.pow(o, 5)),
    //                 this.firstAnimationCurrentScale * (1 - Math.pow(o, 5)),
    //                 this.firstAnimationCurrentScale * (1 - Math.pow(0, 5))
    //             );
    //             this.firstAnimationCurrentScale = this.bowAnimation1.scale.x;
    //         });

    //         new Animator({ time: ANIMATION_CHANGE_TIME }, (o: number) => {
    //             this.bowAnimation3.scale.set(
    //                 this.thirdAnimationCurrentScale * (1 - Math.pow(o, 5)),
    //                 this.thirdAnimationCurrentScale * (1 - Math.pow(o, 5)),
    //                 this.thirdAnimationCurrentScale * (1 - Math.pow(o, 5))
    //             );
    //             this.thirdAnimationCurrentScale = this.bowAnimation3.scale.x;
    //         });
    //     }
    //     this.secondAnimationStarted = false;
    //     this.thirdAnimationStarted = false;
    // }

    // TurnOn3Animation() {
    //     if (!this.thirdAnimationStarted) {
    //         this.thirdAnimationStarted = true;

    //         if (this.firstAnimationTruning) {
    //             removeFromUpdateables(this.firstAnimationTruning);
    //         }

    //         if (this.secondAnimationTurning) {
    //             removeFromUpdateables(this.secondAnimationTurning);
    //         }

    //         this.thirdAnimationTurning = new Animator(
    //             { time: ANIMATION_CHANGE_TIME },
    //             (o: number) => {
    //                 this.bowAnimation3.scale.set(
    //                     this.startAnimationScale * Math.pow(o, 0.1),
    //                     this.startAnimationScale * Math.pow(o, 0.1),
    //                     this.startAnimationScale * Math.pow(o, 0.1)
    //                 );
    //                 this.thirdAnimationCurrentScale = this.bowAnimation3.scale.x;
    //             }
    //         );

    //         new Animator({ time: ANIMATION_CHANGE_TIME }, (o: number) => {
    //             this.bowAnimation1.scale.set(
    //                 this.firstAnimationCurrentScale * (1 - Math.pow(o, 5)),
    //                 this.firstAnimationCurrentScale * (1 - Math.pow(o, 5)),
    //                 this.firstAnimationCurrentScale * (1 - Math.pow(o, 5))
    //             );
    //             this.firstAnimationCurrentScale = this.bowAnimation1.scale.x;
    //         });

    //         new Animator({ time: ANIMATION_CHANGE_TIME }, (o: number) => {
    //             this.bowAnimation2.scale.set(
    //                 this.secondAnimationCurrentScale * (1 - Math.pow(o, 5)),
    //                 this.secondAnimationCurrentScale * (1 - Math.pow(o, 5)),
    //                 this.secondAnimationCurrentScale * (1 - Math.pow(o, 5))
    //             );
    //             this.secondAnimationCurrentScale = this.bowAnimation2.scale.x;
    //         });
    //     }
    //     this.fistAnimationStarted = false;
    //     this.secondAnimationStarted = false;
    // }



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

        if (this.cameraActive) {
            this.SetCameraNLightInProperPosition();
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

        // if (this.bowAnimation2 && this.arrow) {
        //     this.bowAnimation2.update(delta);
        //     this.bowAnimation2.position.set(
        //         this.arrow.position.x,
        //         this.arrow.position.y,
        //         this.arrow.position.z 
        //     );
        //     this.bowAnimation2.lookAt(Engine.camera.position);
        //     if (this.bowAnimation2.children[0] && !this.layerChanged2){
        //         this.layerChanged2 = true;
        //         this.bowAnimation2.children[0].layers.set(2);
        //     }
        // }

        // if (this.bowAnimation3 && this.arrow) {
        //     this.bowAnimation3.update(delta);
        //     this.bowAnimation3.position.set(
        //         this.arrow.position.x,
        //         this.arrow.position.y,
        //         this.arrow.position.z
        //     );
        //     this.bowAnimation3.lookAt(Engine.camera.position);
        //     if (this.bowAnimation3.children[0] && !this.layerchanged3) {
        //         this.layerchanged3 = true;
        //         this.bowAnimation3.children[0].layers.set(2);
        //     }
        // }

        // if (this.arrow && this.arrowInBow) {
        //     if (this.arrow.position.z < 0.25){
        //         this.TurnOn1Animation();
        //     } else if (this.arrow.position.z < 0.6) {
        //         this.TurnOn2Animation();
        //     } else if (this.arrow.position.z < 1) {
        //         this.TurnOn3Animation();
        //     }
        // }

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

