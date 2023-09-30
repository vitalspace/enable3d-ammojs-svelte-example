<script lang="ts">
  import { Laru } from "./lib/laru";
  import { Background } from "./lib/background";
  import { GPlayer } from "./lib/gordo";
  // ws.close();

  import { Player } from "./lib/player";
  import { Project, Scene3D, PhysicsLoader, THREE } from "enable3d";

  class MainScene extends Scene3D {
    box: any;
    playersObject: any[];
    player: Player;
    player2: Player;
    constructor() {
      //@ts-ignore
      super("MainScene");
    }

    init() {
      console.log("Init");
      this.renderer.setPixelRatio(1);
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    preload() {
      console.log("Preload");
    }

    async create() {
      console.log("create");

      // Resize window.
      const resize = () => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;

        this.renderer.setSize(newWidth, newHeight);
        //@ts-ignore
        this.camera.aspect = newWidth / newHeight;
        this.camera.updateProjectionMatrix();
      };

      window.onresize = resize;
      resize();

      // set up scene (light, ground, grid, sky, orbitControls)
      const { lights } = await this.warpSpeed("-ground", "-orbitControls");

      const { hemisphereLight, ambientLight, directionalLight } = lights;
      const intensity = 0.65;
      hemisphereLight.intensity = intensity;
      ambientLight.intensity = intensity;
      directionalLight.intensity = intensity;
      // enable physics debug
      // this.physics.debug?.enable();

      // position camera
      this.camera.position.set(10, 10, 20);

      //////////////////
      this.background = new Background(this);

      this.playersObject = [];
      const ws = new Laru("ws://189.171.145.189:3000");

      //@ts-ignore
      this.ws = ws;

      ws.connect(() => {
        ws.on("playerId", (data) => {
          ws.id = data.id;
          // console.log("Player Id:", ws.id);
        });

        ws.on("current-players", async (players) => {
          for (let id of Object.keys(players)) {
            if (players[id].id === ws.id) {
              this.player = new GPlayer(this, true, players[id], "deepskyblue");
            } else {
              this.player2 = new GPlayer(this, false, players[id], "red");
              this.playersObject.push(this.player2);
            }
          }
        });

        ws.on("new-player", (data) => {
          const { player } = data;
          this.player2 = new GPlayer(this, false, player, "red");
          this.playersObject.push(this.player2);
          console.log("New User:", data);
        });

        ws.on("player-moved", (playerInfo) => {


          this.playersObject.forEach((players) => {
            // console.log(playerInfo.id === players.uuid)
         
            if (playerInfo.id === players.uuid) {
              players.player.position.x = playerInfo.x;
              players.player.position.y = playerInfo.y;
              players.player.position.z = playerInfo.z;
              players.player.rotation.x = playerInfo.r.x;
              players.player.rotation.y = playerInfo.r.y;
              players.player.rotation.z = playerInfo.r.z;
            }
          });
        });

        ws.on("player-left", (data) => {
          console.log("Player Left:", data);
          this.playersObject.forEach((player) => {
            if (data.id === player.uuid) {
              player.visible = false;
              this.scene.remove(player.player);
              const actPlayer = this.playersObject.filter(
                (item) => item.uuid !== data
              );
              this.playersObject = actPlayer;
            }
          });
        });
      });
    }

    update() {
      if (this.player) {
        this.player.update();
      }
    }
  }

  PhysicsLoader(
    "lib/ammo/kripken",
    () => new Project({ scenes: [MainScene], antialias: true })
  );
</script>

<div id="info-text">
  Enable3d Ammojs Svelte + Bun Websockets Example.<br />
</div>
