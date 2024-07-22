import { 
    _decorator,
    CameraComponent,
    Color, 
    Component,
    director,
    geometry,
    Node,
    renderer,
    TransformBit,
    Vec3, 
} from 'cc';
import { EDITOR } from 'cc/env';
const { 
    ccclass, 
    property, 
    executeInEditMode, 
} = _decorator;

@ccclass('SpiralPath')
@executeInEditMode(true)
export class SpiralPath extends Component {

    @property(CameraComponent)
    cameraComp: CameraComponent = null!;

    private camera: renderer.scene.Camera | null | undefined = null;
    private spline: geometry.Spline = new geometry.Spline();

    protected onLoad(): void {
        this.initCamera();
        if (EDITOR) {
            this.initEditor();
        }
    }

    start() {
        this.initSpline();
    }

    protected update(dt: number): void {
        if (!this.camera) {
            this.initCamera();
        }
        let renderer = this.camera?.geometryRenderer;
        renderer?.addSpline(this.spline, Color.WHITE, 0xffffffff, 0, 128);
    }

    protected onDestroy(): void {
        if (EDITOR) {
            this.deinitEditor();
        }
    }

    private initCamera() {
        this.camera = EDITOR
                    ? director.root?.cameraList.find(cam => cam.name === 'Editor Camera')
                    : this.cameraComp.camera;

        this.camera?.initGeometryRenderer();
    }

    private initEditor() {
        this.node.children.forEach(n => {
            n.on(Node.EventType.TRANSFORM_CHANGED, this.onChildTransformChanged, this);
        });
        this.node.on(Node.EventType.CHILD_ADDED, this.onChildAdded, this);
        this.node.on(Node.EventType.CHILD_REMOVED, this.onChildRemoved, this);
        this.node.on(Node.EventType.CHILDREN_ORDER_CHANGED, this.initSpline, this);
    }

    private deinitEditor() {
        this.node.children.forEach(n => n.targetOff(this));
        this.node.targetOff(this);
    }

    private onChildAdded(node: Node) {
        node.on(Node.EventType.TRANSFORM_CHANGED, this.onChildTransformChanged, this);
        this.initSpline();
    }

    private onChildRemoved(node: Node) {
        node.targetOff(this);
        this.initSpline();
    }

    private onChildTransformChanged(type: number) {
        if (type && type & TransformBit.POSITION) {
            this.initSpline();
        }
    }

    private initSpline() {
        const knots = this.node.children.map(n => n.worldPosition);
        this.spline = geometry.Spline.create(geometry.SplineMode.CATMULL_ROM, knots);
    }

    getPathPoint(fraction: number): Vec3 {
        return this.spline.getPoint(fraction);
    }
}

