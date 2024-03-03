import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Unselectable } from "../../../../engine/components/unselectable";
import { faWindowClose } from "@fortawesome/free-solid-svg-icons";

export function ClosableView({
  children,
}: {
  children?: JSX.Element | JSX.Element[];
}): JSX.Element {
  return (
    <div className="w-full h-full relative rounded-xl bg-slate-500">
      <span className="absolute top-0 right-0 mr-2 mt-2">
        <Unselectable>
          <FontAwesomeIcon
            icon={faWindowClose}
            className="w-8 h-8 pointer-events-auto cursor-pointer"
          />
        </Unselectable>
      </span>
      <div
        className="w-full h-full p-6 pr-10"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
