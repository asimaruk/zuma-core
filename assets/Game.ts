import { 
    _decorator, 
    Color, 
    Component, 
    Input, 
    input, 
    instantiate, 
    Node,
    NodePool,
    Prefab,
    random,
    v3,
    Vec3, 
} from 'cc';
import { SpiralPath } from './SpiralPath';
import { Ball } from './Ball';
const { 
    ccclass, 
    property, 
} = _decorator;

@ccclass('Game')
export class Game extends Component {

    static BALL_TIMEOUT = 0.5;

    @property(Node)
    balls: Node = null!;
    @property(SpiralPath)
    path: SpiralPath = null!;
    @property(Prefab)
    ballPrefab: Prefab = null!;

    private ballMoves: number[] = [];
    private ballPool = new NodePool(Ball.name);
    private ballTimeout = 0;
    private ballsDistance = v3();

    protected onLoad(): void {
        input.on(Input.EventType.TOUCH_END, this.onClick, this);
    }

    start() {
        this.ballMoves = new Array(this.balls.children.length).fill(0);
    }

    update(dt: number) {
        this.moveBalls(dt);
        this.launchBall(dt);
    }

    protected onDestroy(): void {
        input.off(Input.EventType.TOUCH_END, this.onClick, this);
    }

    private moveBalls(dt: number) {
        const ballsCount = this.balls.children.length;
        const reuseBalls: [number, Node][] = [];
        for (let i = 0; i < ballsCount; i++) {
            const ball = this.balls.children[i].getComponent(Ball);
            if (!ball) {
                continue;
            }

            let deltaMove = dt * ball.speed;
            const ballNextMove = this.ballMoves[i] + deltaMove;
            const ballNextPosition = this.path.getPathPoint(ballNextMove);
            const nextBall = this.balls.children[i - 1]?.getComponent(Ball);
            const nextBallPosition = this.ballMoves[i - 1] && this.path.getPathPoint(this.ballMoves[i - 1]);
            if (nextBall && nextBallPosition) {
                const dist = this.ballsDistance
                    .set(nextBallPosition)
                    .subtract(ballNextPosition)
                    .length();
                if (dist < ball.radius + nextBall.radius) {
                    const availableMove = this.findAvailableMove(
                        this.ballMoves[i],
                        deltaMove, 
                        ball.radius + nextBall.radius, 
                        nextBallPosition,
                    );
                    if (availableMove) {
                        deltaMove = availableMove;
                    } else {
                        continue;
                    }
                }
            }
            this.ballMoves[i] = this.ballMoves[i] + deltaMove;
            if (this.ballMoves[i] >= 1) {
                reuseBalls.push([i, ball.node]);
            } else {
                ball.node.setWorldPosition(this.path.getPathPoint(this.ballMoves[i]));
            }
        }
        for (const rb of reuseBalls) {
            this.ballPool.put(rb[1]);
            this.ballMoves.splice(rb[0], 1);
        }
    }

    private launchBall(dt: number) {
        this.ballTimeout += dt;
        if (this.ballTimeout > Game.BALL_TIMEOUT) {
            if (this.ballPool.size() === 0) {
                this.ballPool.put(instantiate(this.ballPrefab));
            }
            const radius = 10 + 10 * random() * 2;
            const randomR = Math.round(random() * 255);
            const randomG = Math.round(random() * 255);
            const randomB = Math.round(random() * 255);
            const randomSpeed = Math.random() * 2;
            const ballNode = this.ballPool.get(
                radius, 
                0.1 + 0.1 * randomSpeed, 
                new Color(randomR, randomG, randomB),
            );
            if (ballNode) {
                this.balls.addChild(ballNode);
                this.ballMoves.push(0);
            }
            this.ballTimeout = this.ballTimeout % Game.BALL_TIMEOUT;
        }
    }

    private onClick() {
        const ballsCount = this.balls.children.length;
        const randomBall = Math.floor(random() * ballsCount);
        this.ballPool.put(this.balls.children[randomBall]);
        this.ballMoves.splice(randomBall, 1);
    }

    private findAvailableMove(
        currentBallMove: number,
        faultyDeltaMove: number, 
        smallestDistance: number,
        nextBallPosition: Vec3,
    ): number | null {
        let sign = -1;
        let deltaMove = faultyDeltaMove;
        let half = deltaMove / 2;
        let succseccDelta: number | null = null;
        for (let i = 0; i < 10; i++) {
            const ballNextMove = currentBallMove + deltaMove + sign * half;
            const ballNextPosition = this.path.getPathPoint(ballNextMove);
            const dist = this.ballsDistance.set(nextBallPosition).subtract(ballNextPosition).length();
            if (dist < smallestDistance) {
                deltaMove = deltaMove + sign * half;
                sign = -1;
                half = half / 2;
            } else {
                deltaMove = deltaMove + sign * half;
                sign = 1;
                succseccDelta = deltaMove;
                half = half / 2;
            }
        }
        return succseccDelta;
    }
}

