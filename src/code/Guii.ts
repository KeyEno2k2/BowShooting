import { Vector2 } from "three";

type GUILabel = {
    div: HTMLDivElement;
    label: string;
};

export class Guii{
    div: HTMLDivElement;
    static instance: Guii | null = null;
    lines: Record <string, GUILabel> = {};

    constructor(){
        this.div = document.createElement("div");
		this.div.style.cssText = /* css */ `
            position: fixed;
            top: 38px;
            left: 0;
            margin: 3px;
            zIndex: 1001;
            font-family: sans-serif;
            font-size: 0.9em;
            color: #fff;
            text-shadow: 0px 0px 3px #000;
            user-select: none;
            `;
            document.body.appendChild(this.div);

            Guii.instance = this;
    }


    addLine(n: string): void {
        const l = n + ": ";
        this.lines[n] = { div: document.createElement("div"), label: l};
        this.lines[n].div.innerHTML = l;
        this.div.appendChild(this.lines[n].div);
    }

    removeLine(n: string): void {}
    
    setLine(n: string, v: any) : void {
        if (Object.keys(this.lines).includes(n)){
            const l = this.lines[n];
            l.div.innerHTML = l.label + this.formatLabel(v)
        }
    }

	formatLabel(v: any): string {
		if (v && v.isVector2) {
			const v2 = <Vector2>v;
			return `[${v2.x.toFixed(3)}, ${v2.y.toFixed(3)}]`;
		}

		return JSON.stringify(v);
	}
}

export function createGui(): void {
    new Guii();
}

export function addGui(n: string): void {
    Guii.instance?.addLine(n);
} 

export function removeGui(n: string): void {}

export function setGui(n: string, v: any): void {
    Guii.instance?.setLine(n,v);
}
