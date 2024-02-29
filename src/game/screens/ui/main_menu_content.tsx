import { PixelImage } from "../../../engine/components/pixel_image";
import { TextActionButton } from "../../../engine/components/action_button";
import { Unselectable } from "../../../engine/components/unselectable";

export function MainMenuContent() {
  return (
    <div className="grid-rows-5 grid-cols-5 h-full grid">
      <div className="col-span-3 row-start-1 col-start-2 row-span-2">
        <div className="grid grid-rows-5 h-full">
          <Unselectable className="h-full row-start-2 row-span-4">
            <PixelImage src="/assets/images/logo-banner.png" className="h-full m-auto" />
          </Unselectable>
        </div>
      </div>
      <div className="row-span-3 col-span-3 row-start-3 col-start-2 pointer-events-auto">
        <div className="flex flex-col content-center h-full space-y-2 w-7/12 m-auto">
          <TextActionButton className="">Saves</TextActionButton>
          <TextActionButton className="">Continue</TextActionButton>
        </div>
      </div>
    </div>
  );
}
