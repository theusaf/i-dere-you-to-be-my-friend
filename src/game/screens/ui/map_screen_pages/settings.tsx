import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ClosableView } from "./util";

export function SettingsPagePhone(): JSX.Element {
  return (
    <div className="flex items-center flex-col h-full">
      <FontAwesomeIcon icon={faArrowRight} className="w-20 h-20 my-auto" />
    </div>
  );
}

export function SettingsPageLarge(): JSX.Element {
  return (
    <ClosableView>
      <div className="w-full h-full"></div>
    </ClosableView>
  );
}
