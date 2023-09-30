// import { MainScene } from "./scene";
// import { channel } from "./channel";

import {
    THREE,
    ThirdPersonControls,
    PointerLock,
    PointerDrag,
    ExtendedObject3D,
} from "enable3d";


class GPlayer extends ExtendedObject3D {
    color: string;
    player;
    hasPhysics: any;
    post: any;
    controls: ThirdPersonControls;
    isTouchDevice: any;
    keys: {
        w: { isDown: boolean };
        a: { isDown: boolean };
        s: { isDown: boolean };
        d: { isDown: boolean };
        space: { isDown: boolean };
    };
    canJump: boolean;
    move: boolean;
    moveTop: number;
    moveRight: number;

    constructor(self, hasPhysics: boolean, playerInfo, color) {
        super();
        this.self = self;
        this.hasPhysics = hasPhysics;
        this.uuid = playerInfo.id;
        this.color = color
        this.post = { x: playerInfo.x, y: playerInfo.y, z: playerInfo.z };
        this.isTouchDevice = "ontouchstart" in window;
        this.canJump = true;
        this.move = false;
        this.moveTop = 0;
        this.moveRight = 0;

        this.init();
    }

    async init() {
        await this.createPlayer();
        await this.events();
    }

    async createPlayer() {
        // this.player = this.self.add.box(
        //     { y: 2 },
        //     { lambert: { color: this.color } }
        // );
        await this.self.load.preload("gordo", "gordo.glb")
        const object = await this.self.load.gltf("gordo")
        const player = object.scene.children[0];


        this.player = new ExtendedObject3D()
        this.player.uuid = this.uuid
        this.player.add(player)
        this.self.add.existing(this.player);
        this.player.position.set(this.post.x, this.post.y, this.post.z);
        
        this.player.traverse(child => {
            if (child.isMesh) {
                child.castShadow = child.receiveShadow = false
                // https://discourse.threejs.org/t/cant-export-material-from-blender-gltf/12258
                child.material.roughness = 1
                child.material.metalness = 0
            }
        })

        if (this.hasPhysics) {
            this.self.physics.add.existing(this.player, {
                shape: 'sphere',
                radius: 0.25,
                width: 0.5,
                offset: { y: 0.25 }
            });


            this.player.body.setFriction(0.8)
            this.player.body.setAngularFactor(0, 0, 0)

            // https://docs.panda3d.org/1.10/python/programming/physics/bullet/ccd
            this.player.body.setCcdMotionThreshold(1e-7)
            this.player.body.setCcdSweptSphereRadius(0.25)

            this.controls = new ThirdPersonControls(this.self.camera, this.player, {
                offset: new THREE.Vector3(0, 0, 0),
                targetRadius: 5,
            });

            this.controls.theta = 90;

            if (!this.isTouchDevice) {
                let pl = new PointerLock(this.self.canvas);
                let pd = new PointerDrag(this.self.canvas);
                pd.onMove((delta) => {
                    if (pl.isLocked()) {
                        this.controls.update(delta.x * 2, delta.y * 2);
                    }
                });
            }
        }
    }

    async events() {
        this.keys = {
            w: { isDown: false },
            a: { isDown: false },
            s: { isDown: false },
            d: { isDown: false },
            space: { isDown: false },
        };

        const press = (e, isDown) => {
            e.preventDefault();
            const { keyCode } = e;
            switch (keyCode) {
                case 87: // w
                    this.keys.w.isDown = isDown;
                    break;
                case 38: // arrow up
                    this.keys.w.isDown = isDown;
                    break;
                case 32: // space
                    this.keys.space.isDown = isDown;
                    break;
            }
        };

        document.addEventListener("keydown", (e) => press(e, true));
        document.addEventListener("keyup", (e) => press(e, false));
    }

    async jump() {
        if (!this.player || !this.canJump) return;
        this.canJump = false;
        // this.player.animation.play("jump_running", 500, false);
        setTimeout(() => {
            this.canJump = true;
            // this.player.animation.play("idle");
        }, 650);
        this.player.body.applyForceY(6);
    }

    async update() {
        if (this.player && this.player.body) {
            this.controls.update(this.moveRight * 2, -this.moveTop * 2);

            const speed = 10;
            const v3 = new THREE.Vector3();

            const rotation = this.self.camera.getWorldDirection(v3);
            const theta = Math.atan2(rotation.x, rotation.z);
            const rotationMan = this.player.getWorldDirection(v3);
            const thetaMan = Math.atan2(rotationMan.x, rotationMan.z);
            this.player.body.setAngularVelocityY(0);

            const l = Math.abs(theta - thetaMan);
            let rotationSpeed = this.isTouchDevice ? 2 : 4;
            let d = Math.PI / 24;

            if (l > d) {
                if (l > Math.PI - d) rotationSpeed *= -1;
                if (theta < thetaMan) rotationSpeed *= -1;
                this.player.body.setAngularVelocityY(rotationSpeed);
            }

            /**
             * Player Move
             */
            if (this.keys.w.isDown || this.move) {
                // if (this.player.animation.current === "idle" && this.canJump)
                //   this.player.animation.play("run");

                const x = Math.sin(theta) * speed,
                    y = this.player.body.velocity.y,
                    z = Math.cos(theta) * speed;

                this.player.body.setVelocity(x, y, z);
            } else {
                // if (this.player.animation.current === "run" && this.canJump)
                //   this.player.animation.play("idle");
            }

            if (this.keys.space.isDown && this.canJump) {
                this.jump();
            }

            //emit player movement
            let x = this.player.body.position.x
            let y = this.player.body.position.y
            let z = this.player.body.position.z
            let r = this.player.body.rotation

            if (this.player.oldPosition &&
                (
                    x !== this.player.oldPosition.x ||
                    y !== this.player.oldPosition.y ||
                    z !== this.player.oldPosition.z ||
                    r !== this.player.body.rotation
                )) {
                this.self.ws.emit('player-movement', {
                    x: this.player.body.position.x,
                    y: this.player.body.position.y,
                    z: this.player.body.position.z,
                    r: this.player.body.rotation
                });
            }

            // save old position data
            this.player.oldPosition = {
                x: this.player.body.position.x,
                y: this.player.body.position.y,
                z: this.player.body.position.z,
                r: this.player.body.rotation
            }

        }
    }
}

export { GPlayer };
