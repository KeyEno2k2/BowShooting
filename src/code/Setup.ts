import { AnalyticsSetup, AWGLBScene, GameInterface, ScreenResizer, SetupInterface, UI } from "playable-dev";
import { Camera, Scene } from "three";
import { AssetDefs, AssetsLib } from "assets-lib";
import { assets } from "./assets";
import { Game } from "./Game";

//-------------------------------------------------------------

export class Setup implements SetupInterface {
    scene: AWGLBScene | undefined;
    useSRGBEncoding: boolean = true;
    static sipMode: boolean = false;

    //---------------------------------------------------------

    // Setup here data used by analytics
    analyticsSetup: AnalyticsSetup = {
        gameId: 'my-great-playable',
        versionId: 'v1.0.0',
	    network: 'test',
	    sendStats: true
    }

    //---------------------------------------------------------
    
    // Setup here all your assets used in game
    getAssets(): AssetDefs {
        return {
            textures: [
            ],
            sounds: [
            ],
            models: [
                ['sceneGlb', assets.glb],
            ],
            uis: [
                ['hudAtlas', assets.atlas]
            ]
        };
    }

    //---------------------------------------------------------

    processAssets(assetsLib: AssetsLib): void {
    }

    //---------------------------------------------------------

    getScene(): Scene { 
        this.scene = new AWGLBScene('sceneGlb');
        return this.scene;
    }

    //---------------------------------------------------------

    getGame(): GameInterface {
        return new Game(this.scene!);
    }
}