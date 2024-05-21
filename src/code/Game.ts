import { AWGLBScene, analytics, GUIOverlay } from "playable-dev";
import { Vector3 } from "three";
import { HUD } from "./HUD";
import { StaticObject } from "./StaticObjects";
import CannonDebugRenderer from "./utils/cannonDebugRenderer";
import { Guii } from "./Guii";
import * as CANNON from "cannon-es"
import { Gameplay } from "./Gameplay";
import { Environment } from "./Environment";

//-------------------------------------------------------------

export class Game {
	static game: Game;
	static sessionCounter = 0;
	scene: AWGLBScene;
	gameplay?: Gameplay;
	cannonWorld: CANNON.World;
	cannonDebugRenderer?: CannonDebugRenderer;
	debugMode: boolean = false;
	hud: HUD;
	z_order: number = 1;
	pointA: Vector3 = new Vector3(0, 0, 0);
	pointB: Vector3 = new Vector3(0, 0, 2);
	width: number = 2;
	geometryWidth: number = 1;
	geometryHeight: number = 10;
	gui!: Guii;

	constructor(scene: AWGLBScene){
		Game.sessionCounter++;
		Game.game = this;
		this.scene = scene;
		this.hud = new HUD();
		this.scene.turnOnShadows();
		GUIOverlay;

		this.cannonWorld = new CANNON.World();
		this.cannonWorld.gravity.set(0, -9.82, 0);

		new StaticObject();
		new Environment();
		this.gameplay = new Gameplay();

		if(Game.sessionCounter == 1){
			analytics.logEvent("start");
		}

		if (this.debugMode) {
			this.cannonDebugRenderer = new CannonDebugRenderer(this.scene, this.cannonWorld);
		}
		const myGui = new Guii();
	}


	//---------------------------------------------------------

	update(delta: number): void {
		this.gameplay?.update(delta);
		this.cannonWorld.step(delta / 6, delta, 10);
		if (this.debugMode && this.cannonDebugRenderer) {
			this.cannonDebugRenderer.update();
		}
	}

	//---------------------------------------------------------

	run(): void {}

	//---------------------------------------------------------

	pause(): void {}

	//---------------------------------------------------------

	close(): void {}
}
