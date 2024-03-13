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
  static muted = false;

  static playSound(sound: string, loop = false) {
    if (!SoundManager.sounds[sound]) {
      SoundManager.sounds[sound] = new SoundPlayer(sound);
    }
    SoundManager.sounds[sound].play(loop, SoundManager.muted);
  }

  static stopSound(sound: string) {
    SoundManager.sounds[sound].stop();
  }

  static stopAll() {
    for (const sound of Object.values(SoundManager.sounds)) {
      sound.stop();
    }
  }

  static muteAll() {
    SoundManager.muted = true;
    for (const sound of Object.values(SoundManager.sounds)) {
      sound.mute();
    }
  }

  static unmuteAll() {
    SoundManager.muted = false;
    for (const sound of Object.values(SoundManager.sounds)) {
      sound.unmute();
    }
  }
}

export class SoundPlayer {
  sound: HTMLAudioElement;
  constructor(sound: string) {
    this.sound = Assets.get(sound);
  }

  play(loop = false, muted = false) {
    this.sound.loop = loop;
    this.sound.muted = muted;
    this.sound.play();
  }

  stop() {
    this.sound.pause();
    this.sound.currentTime = 0;
  }

  mute() {
    this.sound.muted = true;
  }

  unmute() {
    this.sound.muted = false;
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
