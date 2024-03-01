import { Application, Assets, Graphics, Rectangle } from "pixi.js";
import { GameManager, GameScreen, UIOutput } from "../../engine/screen";
import { ColorScheme } from "../util/style";
import { LoadingScreenContent } from "./ui/loading_screen_content";
import { assetList, getAllBundles } from "../util/assets";
import { GameAnimation } from "../util/animation";

export class LoadingScreen extends GameScreen {
  progress: number = 0;
  onDoneLoadingOpacity: number = 1;
  onDoneLoadingAnimation: GameAnimation = new GameAnimation(
    { opacity: 1 },
    { opacity: 0 },
    2000,
  );

  loadingBarForegroundShape?: Rectangle;
  loadingBarBackground?: Graphics;
  loadingBarForeground?: Graphics;

  async initialize(app: Application, gameManager: GameManager): Promise<void> {
    super.initialize(app, gameManager);

    const worldWidth = this.container!.worldWidth,
      worldHeight = this.container!.worldHeight;

    // background
    const graphics = new Graphics();
    graphics.beginFill(ColorScheme.background);
    graphics.drawRect(0, 0, worldWidth, worldHeight);
    graphics.endFill();
    this.container!.addChild(graphics);

    // loading bar
    const loadingBarBackgroundShape = new Rectangle(
      worldWidth * 0.1 - 1,
      worldHeight * 0.75,
      worldWidth * 0.8 + 2,
      40,
    );
    this.loadingBarBackground = new Graphics()
      .beginFill(ColorScheme.dark)
      .drawShape(loadingBarBackgroundShape)
      .endFill();
    this.container!.addChild(this.loadingBarBackground);

    this.loadingBarForegroundShape = new Rectangle(
      worldWidth * 0.1,
      worldHeight * 0.75 + 1,
      0,
      38,
    );
    this.loadingBarForeground = new Graphics()
      .beginFill(ColorScheme.light)
      .drawShape(this.loadingBarForegroundShape)
      .endFill();
    this.container!.addChild(this.loadingBarForeground);

    await Assets.init({ manifest: assetList });

    Assets.loadBundle(getAllBundles(), (progress) => {
      this.progress = progress;
    });
  }

  update(delta: number): void {
    this.loadingBarForegroundShape!.width =
      this.container!.worldWidth * 0.8 * this.progress;
    this.loadingBarForeground!.clear()
      .beginFill(ColorScheme.light)
      .drawShape(this.loadingBarForegroundShape!)
      .endFill();
    if (this.progress === 1) {
      this.onDoneLoadingOpacity =
        this.onDoneLoadingAnimation.update(delta).opacity;
      this.loadingBarBackground!.alpha = this.onDoneLoadingOpacity;
      this.loadingBarForeground!.alpha = this.onDoneLoadingOpacity;
    }
  }

  getUI(): UIOutput | null {
    return {
      main: <LoadingScreenContent data={this} />,
    };
  }
}
