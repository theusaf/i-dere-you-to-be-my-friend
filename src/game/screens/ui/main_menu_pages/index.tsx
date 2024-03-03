import { TextActionButton } from "../../../../engine/components/action_button";

interface IndexPageProps {
  navigateToSaveList: () => void;
  onContinue: () => any;
}
export function IndexPage({ navigateToSaveList, onContinue }: IndexPageProps) {
  return (
    <>
      <div className="row-span-3 col-span-3 row-start-3 col-start-2 pointer-events-auto">
        <div
          className={`flex flex-col content-center h-full space-y-2 m-auto text-lg w-7/12`}
        >
          <TextActionButton onClick={navigateToSaveList}>
            Saves
          </TextActionButton>
          <TextActionButton onClick={onContinue}>Continue</TextActionButton>
        </div>
      </div>
    </>
  );
}
