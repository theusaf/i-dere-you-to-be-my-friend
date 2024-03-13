import {
  Assets,
  ExtensionFormatLoose,
  ExtensionType,
  LoaderParser,
  LoaderParserPriority,
  extensions,
  utils,
} from "pixi.js";

export class SoundManager {
  static sounds: Record<string, SoundPlayer> = {};

  static playSound(sound: string, loop = false) {
    if (!SoundManager.sounds[sound]) {
      SoundManager.sounds[sound] = new SoundPlayer(sound);
    }
    SoundManager.sounds[sound].play(loop);
  }

  static stopSound(sound: string) {
    SoundManager.sounds[sound].stop();
  }

  static stopAll() {
    for (const sound of Object.values(SoundManager.sounds)) {
      sound.stop();
    }
  }
}

export class SoundPlayer {
  sound: HTMLAudioElement;
  constructor(sound: string) {
    this.sound = Assets.get(sound);
  }

  play(loop = false) {
    this.sound.loop = loop;
    this.sound.play();
  }

  stop() {
    this.sound.pause();
    this.sound.currentTime = 0;
  }
}

export function registerWAVLoaderExtension(): void {
  const wavLoader: LoaderParser = {
    test(url): boolean {
      const { pathname } = new URL(url);
      return utils.path.extname(pathname) === ".wav";
    },
    async load<T>(url: string): Promise<T> {
      const data = await fetch(url).then((response) => response.blob());
      const blobUrl = URL.createObjectURL(data);
      return new Promise((resolve) => {
        const audio = new Audio(blobUrl);
        audio.oncanplaythrough = () => {
          resolve(audio as T);
        };
      });
    },
  };
  const wavLoaderExtension: ExtensionFormatLoose = {
    name: "wav-parser",
    type: ExtensionType.LoadParser,
    ref: wavLoader,
    priority: LoaderParserPriority.High,
  };

  extensions.add(wavLoaderExtension);
}