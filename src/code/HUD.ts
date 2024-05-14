import { 
    Engine,
    AWUIScreen,
    AWUI,
    AWUIElement,
    LoopAnimator,
    Animator,
    tweenInOut,
    removeFromUpdateables,
    BBox2,
    ScreenResizer
 } from "playable-dev";
 import { DEG2RAD } from "three/src/math/MathUtils";
 import { Game } from "./Game";

//-------------------------------------------------------------

export class HUD extends AWUIScreen {

    scalee: AWUIElement;
    arrowHUD: AWUIElement;
    targetHUD: AWUIElement;
    showAnimator?: Animator;
    
    showButton1Animator?: Animator;
    hideButton1Animator?: Animator;

    showButton2Animator?: Animator;
    hideButton2Animator?: Animator;

    showButton3Animator?: Animator;
    hideButton3Animator?: Animator;

    startButtonScale: number = 0;
    hole: AWUIElement;
    top: AWUIElement;
    bottom: AWUIElement;
    left: AWUIElement;
    right: AWUIElement;
    hand: AWUIElement;
    text: AWUIElement;
    whiteCircle: AWUIElement;
    bb!: BBox2;
    tutorialEnded: boolean = false;
    arrowShape: AWUIElement;

    constructor() {
        super();

        Engine.ui.add(this);
        this.loadConfig("ShootingUI");
        this.scalee = this.getElement("scale");
        this.arrowHUD = this.getElement("arrow");
        this.targetHUD = this.getElement("target");
        
        this.hole = this.getElement("hole");
        this.top = this.getElement("top");
        this.bottom = this.getElement("bottom");
        this.left = this.getElement("left");
        this.right = this.getElement("right");
        this.hand = this.getElement("hand");
        this.text = this.getElement("text");
        this.whiteCircle = this.getElement("whiteCircle");
        this.arrowShape = this.getElement("ballShape");

        this.targetHUD.setAlpha(0);
        this.arrowHUD.setAlpha(0);
        this.scalee.setAlpha(0);
        this.animateMiniGames();
        this.tutorialWithoutBlendaAnimate();

        this.arrowShape.visible = false;
        this.arrowShape.setAlpha(0);

        this.hand.layers.set(2);
        this.whiteCircle.layers.set(2);
    }

    showMiniGame(){
        this.showAnimator = new Animator({time: 0.3}, (o: number) => {
            this.targetHUD.setAlpha(o);
            this.arrowHUD.setAlpha(o);
            this.scalee.setAlpha(o);
        });
    }

    hideWhiteTutorial(){
        let t = 0;
        this.tutorialEnded = true;

        new Animator({time: 0.1}, (o: number) => {
            t = 1 - o;
            this.hand.setAlpha(t);
            this.whiteCircle.setAlpha(t);
            this.text.setAlpha(t);
            if (o >= 1){
                this.hand.visible = false;
                this.whiteCircle.visible = false;
            }

        });
    }

    showWhiteTutorial(){
        this.tutorialEnded = false;
        this.hand.visible = false;
        this.whiteCircle.visible = false;

        new Animator ({time: 0.1}, (o: number) => {
            this.hand.setAlpha(o);
            this.whiteCircle.setAlpha(o);
            this.text.setAlpha(o);
        })
    }

    tutorialWithoutBlendaAnimate(){
        const sr = ScreenResizer.resizer;
        let handAnimationBlocked = false;
        let t = 0;
        
        new LoopAnimator({time: 2.5}, (o: number) => {
            t = tweenInOut(o);
            this.text.rotation.z = -t* DEG2RAD * 10;
            if(sr.isPortrait){
                this.text.setSize(0.5 + t * 0.1, 0.5 + t * 0.1);
            } else {
                this.text.setSize(0.45 + t * 0.1, 0.45 + t * 0.1);
            }
        });
        let t2 = 0;
        let t3 = 0;
        let t4 = 0;

        new LoopAnimator(
            {time: 2.5},
            (o: number) => {
                t = 0.5 * (1 - o) + 0.4 * o;
                t2 = 0.3 * (1 - o) + 0.2 * o;
                t3 = 0.4 * (1 - o) + 0.5 * o;
                t4 = 0.2 * (1 - o) + 0.3 * o;
                if (!handAnimationBlocked){
                    handAnimationBlocked = true;
                    const startZHandAnimation = this.hand.rotation.z;

                    new Animator({time: 0.1}, (o: number) => {
                        this.hand.setRotation(startZHandAnimation * (1 - 0));
                        if (sr.isPortrait){
                            this.hand.setSize(t, t, t);
                        } else {
                            this.hand.setSize(t2, t2, t2);
                        }
                    });

                    new Animator({time: 0.1, delay: 2}, (o: number) => {
                        this.hand.setRotation(startZHandAnimation * o);
                        if (sr.isPortrait){
                            this.hand.setSize(t3, t3, t3);
                        } else {
                            this.hand.setSize(t4, t4, t4);
                        }
                    });
                }

                if (sr.isPortrait) {
                    this.whiteCircle.setY(-90 - 350 * tweenInOut(o));
                } else {
                    this.whiteCircle.setY(-45 - 200 * tweenInOut(o));
                }

                this.hand.setY(this.whiteCircle.position.y);
            },
            () => {
                handAnimationBlocked = false;
            }
        );
    }

    resize(): void {
        super.resize();
        const sr = ScreenResizer.resizer;
        if (sr.isPortrait){
            this.hand.setSize(0.4, 0.4, 0.4);
            if (Game.sessionCounter > 1) {
                this.text.setY(225);
            }
        } else {
            this.hand.setSize(0.2, 0.2, 0.2);
            if (Game.sessionCounter > 1){
                this.text.setY(121);
            }
        }
    }

    hideMiniGame(){
        if (this.showAnimator){
            removeFromUpdateables(this.showAnimator);
        }
        let t = 0;
        new Animator ({time: 1.5}, (o: number) =>{
            t = 1 - o;
            this.targetHUD.setAlpha(t);
            this.arrowHUD.setAlpha(t);
            this.scalee.setAlpha(t);
        });
    }

    animateMiniGames(){
        let t = 0;
        new LoopAnimator({time: 3}, (o: number) =>{
            this.arrowHUD.setRotation(Math.sin(Math.PI * 2 * o) * DEG2RAD * 70);
        });
        new LoopAnimator({time: 0.2, delay: 1.5, loopInterval: 1.3}, (o: number) =>{
            t = 0.25 + tweenInOut(o) * 0.1;
            this.targetHUD.setSize(t, t, t);
        });
    }
}