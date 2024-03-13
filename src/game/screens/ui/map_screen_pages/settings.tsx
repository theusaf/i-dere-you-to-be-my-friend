import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ClosableView } from "./util";
import { useEffect, useState } from "react";
import { SoundManager } from "../../../util/sounds";

export function SettingsPagePhone(): JSX.Element {
  return (
    <div className="flex items-center flex-col h-full">
      <FontAwesomeIcon icon={faArrowRight} className="w-20 h-20 my-auto" />
    </div>
  );
}

export function SettingsPageLarge(): JSX.Element {
  const [musicVolume, setMusicVolume] = useState(100);
  const [sfxVolume, setSfxVolume] = useState(100);
  useEffect(() => {
    const musicVolume = parseInt(localStorage.getItem("musicVolume") ?? "100");
    const sfxVolume = parseInt(localStorage.getItem("sfxVolume") ?? "100");
    setMusicVolume(musicVolume);
    setSfxVolume(sfxVolume);
  }, []);
  useEffect(() => {
    localStorage.setItem("musicVolume", musicVolume.toString());
    localStorage.setItem("sfxVolume", sfxVolume.toString());
    SoundManager.setMusicVolume(musicVolume);
    SoundManager.setSfxVolume(sfxVolume);
  }, [musicVolume, sfxVolume]);

  return (
    <ClosableView>
      <div className="w-full h-full text-white">
        <h2 className="text-2xl">Settings</h2>
        <h3 className="text-xl">Music</h3>
        <span className="flex flex-row items-center">
          <input
            className="w-48"
            type="range"
            min="0"
            max="100"
            value={musicVolume}
            onChange={(evt) => {
              setMusicVolume(parseInt(evt.target.value));
            }}
          />
          <span className="ml-2">{musicVolume}%</span>
        </span>
        <h3 className="text-xl">SFX</h3>
        <span className="flex flex-row items-center">
          <input
            className="w-48"
            type="range"
            min="0"
            max="100"
            value={sfxVolume}
            onChange={(evt) => {
              setSfxVolume(parseInt(evt.target.value));
            }}
          />
          <span className="ml-2">{sfxVolume}%</span>
        </span>
      </div>
    </ClosableView>
  );
}
