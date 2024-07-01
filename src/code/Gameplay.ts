import {
    Engine,
    Animator,
    MouseListener,
    ScreenResizer,
    analytics,
    AWAudio,
    LoopAnimator,
    removeFromUpdateables,
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
    Mesh,
    Group,
    Quaternion
} from "three";
import { StaticObject } from "./StaticObjects";
import { SkeletonData, SkeletonMesh } from "playable-dev/spine-lib";
//import { ArrowTrace } from "./ArrowTrace";
import { GLTF } from "playable-dev/assets-lib";
import { Target } from "./Target";
import { randFloat } from "three/src/math/MathUtils";

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
    updateTargetCollidersBlockade: boolean = false;
    hits: number = 0;
    targets: Mesh[] = [];
    targetGetHit: boolean = true;
    interacted: boolean = false;
    bowAnimation!: SkeletonMesh;
    rotateAnimation?: LoopAnimator;
    allowAnimation: boolean = false;
    bowGroup: Object3D;
    

    constructor(camera: PerspectiveCamera) {
        this.camera = camera;
        this.sr = ScreenResizer.resizer;
        Engine.controlEvents.addListener(this);

        this.sceneFile = Engine.assetsLib.lib["sceneGlb"] as GLTF;
        this.arrow = StaticObject.arrow;

        this.bow = StaticObject.bow;
        this.arrowStartPosition = this.arrow.position.clone();

        Engine.camera.position.set(15, 0, -3.75);
        Engine.camera.rotation.y = 1.5;

        //this.arrowTrace = new ArrowTrace();
        this.LoadAnimations();
        console.log("Model Łuku", this.bow);
        
        this.bowGroup = new Object3D();
        this.bowGroup.add(this.bow);
        this.bowGroup.add(this.arrow);
        Game.game.scene.add(this.bowGroup);
        // this.bowGroup.rotation.x = (0.7 * Math.PI);
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
        this.arrowInBow = true;
        if (!this.interacted && Game.sessionCounter == 1) {
            analytics.logEvent("interaction");
            this.interacted = true;
        }
        if (Game.sessionCounter > 1 || this.shooted) {
            return true;
        }

        this.interacted = true;
        this.ShootArrow();
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
        this.RotateBow();
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

    StartMaxBowRotation() {
        let randomVector = new Vector3 (0,0,0);
        this.rotateAnimation = new LoopAnimator(
            {time: 1.3},
            (o: number) => {
                if (!this.allowAnimation && this.arrowInBow) {
                    this.allowAnimation = true;
                    randomVector  = new Vector3 (randFloat(-1,1), randFloat(-1,1), randFloat(-1,1))
                    .normalize()
                    .divideScalar(100);
                }

                //console.log("Ustawienie Wartości dla this.allowAnimation:",this.allowAnimation,"Ustawienie wartości dla this.arrowInBow:", this.arrowInBow); // Sprawdzenie ustawionych własności
                //Rotacja dla łuku i strzały
                if (this.allowAnimation && this.arrowInBow) {
                    this.bowGroup.rotation.set(
                        this.bowGroup.rotation.x = 0,
                        this.bowGroup.rotation.y = 0,
                        this.bowGroup.rotation.z = 0
                    );
                }

            }, () => {
                this.allowAnimation = false;
            }
        );
    }

    ResetMaxRotationAnimation() {
        removeFromUpdateables(this.rotateAnimation!);
        this.rotateAnimation = undefined;
    }

    MaxRotateAnimationCheckAndPlay() {
        if ((this.clickPosition.y - this.mousePosition.y) / 150 > -0.8) {
            this.ResetMaxRotationAnimation();
        } else if (!this.rotateAnimation) {
            this.StartMaxBowRotation();
        }
    }

    RotateBow() {
        if (this.arrowInBow && this.arrow) {
            this.MaxRotateAnimationCheckAndPlay();
        }
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

    ShootArrow(){
        console.log("Ustawienie wartości arrowInBow na:",this.arrowInBow);
        let currentArrowPosition = new Vector3;
        const startDistance = 0.3;
        const endDistance = 9.7;
        const arrowSpeed = 0.7;
        const duration = this.animation.getClip().duration;

        //console.log(this.animation.getClip().duration);     //Pobranie długości animacji łuku

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

        //Schowanie miniGry po odegraniu animacji
        new Animator({time: arrowSpeed, delay: duration - 2.1}, (o: number) => {
            Game.game.hud.hideMiniGame();
        })

        this.animation.enabled = true;
        this.animation.reset();
        this.animation.play();
    }

    SetTargetInTheSamePlace(){
        StaticObject.targets.forEach((target) => {
            const position = target.targetView.position.clone();
            this.updateTargetCollidersBlockade = true;

            new Animator ({time: RESTART_TIME_MILLISECONDS}, (o: number) => {
                target.targetView.position.set(
                    position.x,
                    position.y,
                    position.z
                );

                if (o >= 1) {
                    target.targetBody?.quaternion.set(0,0,0,1);
                    target.targetBody?.position.set(
                        target.targetView.position.x + StaticObject.targetObject.position.x,
                        target.targetView.position.y + StaticObject.targetObject.position.y,
                        target.targetView.position.z + StaticObject.targetObject.position.z
                    );
                    target.targetBody?.sleep();
                    this.updateTargetCollidersBlockade = false;
                }
            })
        });
    }

    update(delta: number): void {
        if (StaticObject.arrowCollider && this.arrow){
            StaticObject.arrowCollider.position.set(
                this.arrow.position.x,
                this.arrow.position.y,
                this.arrow.position.z
            );
        }

        if (this.arrow && StaticObject.shadow) {
            if (this.arrow.position.z < -19) {
                if (StaticObject.shadow.visible) {
                    StaticObject.shadow.visible = false;
                    this.arrow.layers.set(0);
                }
                this.arrow.position.y -= delta * 2.5;
            }
        }

        if (this.arrow){
            StaticObject.arrowCollider?.position.set(
                this.arrow.position.x,
                this.arrow.position.y,
                this.arrow.position.z
            )
        }

        if (StaticObject.arrow && StaticObject.shadow) {
            if (StaticObject.arrow.position.z < -19) {
                if (StaticObject.shadow.visible) {
                    StaticObject.shadow.visible = false;
                    StaticObject.arrow.layers.set(0);
                }
                StaticObject.arrow.position.y -= delta * 2.5;
            }
        }

        if (StaticObject.arrow) {
            if (StaticObject.arrowCollider) {
                StaticObject.arrowCollider.position.set(
                    StaticObject.arrow.position.x,
                    StaticObject.arrow.position.y,
                    StaticObject.arrow.position.z - 0.5
                );
                StaticObject.arrowCollider.quaternion.set(
                    StaticObject.arrow.quaternion.x,
                    StaticObject.arrow.quaternion.y,
                    StaticObject.arrow.quaternion.z,
                    StaticObject.arrow.quaternion.w
                );

            }
        }
        
        this.mixer.update(delta);
    }

    LoadAnimations() {
        this.mixer = new AnimationMixer(this.bow);
        this.sceneFile!.animations.forEach((animationClip) => {
            if (animationClip.name == "Anim_shoot") {
                this.animation = this.mixer.clipAction(animationClip);
                this.animation.setLoop(LoopOnce, Infinity);
                this.animation.play();
                this.animation.enabled = false;
    
                // Dodanie obserwatora na zdarzenie zakończenia odtwarzania animacji
                this.mixer.addEventListener('finished', (event) => {
                    if (event.action === this.animation) {
                        this.shooted = true; // Ustawienie shooted na true po zakończeniu animacji
                        console.log("Ustawienie Wartości Shooted na:", this.shooted);
                    }

                    if (this.shoots < SHOOTS){
                        setTimeout(() => {
                            this.ResetScene();
                            this.PrepareNextShot();
                        }, RESTART_TIME_MILLISECONDS);
                    } else {
                        setTimeout(()=>{
                            this.ShowNextLevel();
                        }, RESTART_TIME_MILLISECONDS);
                    }
                });
            }
        });
    }
    
    ResetScene(){
        this.animation.stop(); // Zatrzymaj animację strzału
        this.arrow.position.copy(this.arrowStartPosition); // Przywróć początkową pozycję strzały
    }
    
    PrepareNextShot(){
        this.shoots++; // Inkrementuj liczbę wykonanych strzałów
        this.shooted = false; // Zresetuj flagę strzału
        this.arrow.position.copy(this.arrowStartPosition); // Przywróć początkową pozycję strzały
        this.animation.reset(); // Zresetuj animację strzału
        this.animation.enabled = true; // Włącz animację strzału
        setTimeout(()=>{
            this.SetTargetInTheSamePlace();
        })
    }
}