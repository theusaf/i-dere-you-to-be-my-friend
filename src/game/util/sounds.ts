export enum Sound {
  "sfx/battlestart" = "sfx/battlestart",
  "music/battle1" = "music/battle1",
  "music/friendlyworld" = "music/friendlyworld",
  "music/intro" = "music/intro",
}

export function getSoundPath(sound: Sound): string {
  return `./assets/sounds/${Sound[sound]}.wav`;
}

const audioCache: Record<string, HTMLAudioElement> = {};

export function loadSounds(): Promise<void>[] {
  const sounds = Object.values(Sound);
  return sounds.map((sound) => {
    const path = getSoundPath(sound);
    return new Promise<void>((resolve) => {
      const audio = new Audio(path);
      audio.onload = () => {
        audioCache[path] = audio;
        resolve();
      };
    });
  });
}

export class SoundPlayer {
  sound: HTMLAudioElement;
  loop: boolean;
  constructor(sound: Sound, loop = false) {
    this.sound = audioCache[getSoundPath(sound)];
    this.loop = loop;
  }

  play() {
    this.sound.loop = this.loop;
    this.sound.play();
  }

  stop() {
    this.sound.pause();
    this.sound.currentTime = 0;
  }
}
