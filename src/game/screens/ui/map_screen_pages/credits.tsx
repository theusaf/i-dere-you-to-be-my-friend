import {
  faArrowRight,
  faFontAwesomeFlag,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ClosableView } from "./util";

export function CreditsPagePhone(): JSX.Element {
  return (
    <div className="flex items-center flex-col h-full">
      <FontAwesomeIcon icon={faArrowRight} className="w-20 h-20 my-auto" />
    </div>
  );
}

export function CreditsPageLarge(): JSX.Element {
  return (
    <ClosableView>
      <div className="w-full h-full text-white overflow-y-auto">
        <h2 className="text-2xl">Credits / Resources</h2>
        <ul className="list-disc ml-4">
          <li>Programming Languages — TypeScript, HTML, JSX, YAML</li>
          <li>
            Rendering Engine — <a href="https://pixijs.com/">PIXI.js</a>
          </li>
          <li>
            UI — <a href="https://vitejs.dev/">Vite</a> with{" "}
            <a href="https://react.dev/">React</a>
          </li>
          <li>
            Cross-Platform Engine —{" "}
            <a href="https://github.com/gluon-framework/gluon">Gluon</a>
          </li>
          <li>
            Cross-Platform Engine — <a href="https://nodejs.org/">Node.js</a>
          </li>
          <li>
            Fonts —{" "}
            <a href="https://fonts.google.com">
              Pixelify Sans, <span className="font-numerals">DotGothic16</span>
            </a>
          </li>
          <li>
            Icons —{" "}
            <a href="https://fontawesome.com">
              Font Awesome
              <FontAwesomeIcon
                icon={faFontAwesomeFlag}
                color="#538DD7"
                className="ml-2 bg-black rounded p-1"
              />
            </a>
          </li>
          <li>
            Styling — <a href="https://tailwindcss.com">Tailwind CSS</a>
          </li>
          <li>
            Battle Type Inspiration —{" "}
            <a href="https://the-dere-types.fandom.com/wiki/Category:Dere">
              The Dere Types Wiki
            </a>
          </li>
          <li>
            Initial Motivation —{" "}
            <a href="https://www.youtube.com/@Acerola_t">Acerola</a>{" "}
            <a href="https://itch.io/jam/acerola-jam-0">Jam 0</a> via Oregon
            State University
          </li>
        </ul>
      </div>
    </ClosableView>
  );
}
