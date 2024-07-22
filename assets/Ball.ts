import { 
    _decorator, 
    Color, 
    Component, 
    Graphics, 
    Node,
    Vec3, 
} from 'cc';
const { 
    ccclass, 
    property, 
    executeInEditMode, 
    requireComponent, 
} = _decorator;

@ccclass('Ball')
@requireComponent(Graphics)
export class Ball extends Component {

    private g: Graphics | null = null;
    private _radius: number = 10;
    private _speed: number = 0.1;
    private _color: Color = Color.WHITE.clone();

    get radius() {
        return this._radius;
    }

    get speed() {
        return this._speed;
    }

    protected onLoad(): void {
        this.g = this.getComponent(Graphics);
    }

    onEnable() {
        this.render();
    }

    setup(
        radius: number,
        speed: number,
        color: Color,
    ) {
        this._radius = radius;
        this._speed = speed;
        this._color = color;
        this.render();
    }

    private render() {
        if (!this.g) {
            return;
        }

        this.g.clear();
        this.g.circle(0, 0, this._radius);
        this.g.fillColor = this._color;
        this.g.fill();
    }

    unuse() {
        this.node.setPosition(Vec3.ZERO);
    }

    reuse() {
        const [radius, speed, color] = arguments[0];
        this.setup(radius, speed, color);
    }
}

