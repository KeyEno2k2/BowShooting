import { Engine, AWUIScreen, AWUI } from "playable-dev";

//-------------------------------------------------------------

export class HUD extends AWUIScreen {

    //---------------------------------------------------------

    constructor() {
        super();

        Engine.ui.add(this);

        const hello = AWUI.Sprite('hudAtlas', 'Atlas 0', 'HELLO').setSize(1.2, 1.2).setPos(0, 250);
        this.add(hello);
    }


}