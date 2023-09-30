import { ExtendedObject3D } from "enable3d";
// import Scene from "./scene";

class Background {
  self: Scene;

  constructor(self: Scene) {
    this.self = self;
    this.object()
  }

  async object() {
    await this.self.load.preload("background", "book.glb")
    const object = await this.self.load.gltf("background");
    const scene = object.scenes[0];

    const background = new ExtendedObject3D();
    background.name = "background";
    background.add(scene);
    this.self.add.existing(background)

    background.traverse((child) => {

      if (child.isMesh) {
        child.castShadow = child.receiveShadow = false;
        child.material.metalness = 0;
        child.material.roughness = 1;

        // if (/mesh/i.test(child.name)) {
          this.self.physics.add.existing(child, {
            shape: "concave",
            mass: 0,
            collisionFlags: 1,
            autoCenter: false,
          });
          child.body.setAngularFactor(0, 0, 0);
          child.body.setLinearFactor(0, 0, 0);
        // }
      }
    });
  }
}

export { Background }