import { useState } from "react";
import { PixelImage } from "../../../engine/components/pixel_image";
import { Unselectable } from "../../../engine/components/unselectable";

export function MapScreenContent(): JSX.Element {
  const [phoneVisible, setPhoneVisible] = useState(false);
  return (
    <div
      className={`grid grid-rows-8 relative h-full ${phoneVisible ? "pointer-events-auto" : ""}`}
      onClick={phoneVisible ? () => setPhoneVisible(false) : undefined}
    >
      {phoneVisible && <PhoneLargeDisplay />}
      <div className="row-span-2 row-start-1 col-start-1"></div>
      <div className="row-span-3 row-start-6 grid grid-cols-12 col-start-1">
        <div className="col-span-2 px-4 relative h-full">
          {!phoneVisible && (
            <PhoneWidget onClick={() => setPhoneVisible(true)} />
          )}
        </div>
      </div>
    </div>
  );
}

interface PhoneWidgetProps {
  onClick: () => void;
}

function PhoneWidget({ onClick }: PhoneWidgetProps) {
  const [isHovering, setIsHovering] = useState(false);
  return (
    <div
      className={`pointer-events-auto h-full items-end relative transition-all ${isHovering ? "top-2/3" : "top-3/4"}`}
      onClick={() => onClick()}
      onMouseOver={() => setIsHovering(true)}
      onMouseOut={() => setIsHovering(false)}
    >
      <Unselectable className="flex flex-col h-full items-end">
        <PixelImage
          src="/assets/images/ui/phone.png"
          className="flex-1 m-auto"
        />
      </Unselectable>
    </div>
  );
}

function PhoneLargeDisplay() {
  return (
    <div className="row-span-8 row-start-1 col-start-1 flex items-start flex-row p-4 z-10">
      <div
        className="h-full flex-auto relative pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <PixelImage src="/assets/images/ui/phone.png" className="h-full" />
        <div className="absolute h-full w-full top-0 left-0 p-6 grid grid-rows-12 text-white">
          <span className="text-sm flex items-center pb-2">XX:XX</span>
          <div className="row-span-10 row-start-2 grid grid-rows-5 grid-cols-4">
            <span>PHONE</span>
          </div>
        </div>
      </div>
      <div
        className="ml-4"
        style={{
          flex: 4,
        }}
      ></div>
    </div>
  );
}
