import { NumberSpan } from "../../../../engine/components/numer_span";

export function BagPagePhone({ gold }: { gold: number }): JSX.Element {
  return (
    <div className="flex items-center flex-col h-full">
      <h2 className="text-2xl underline mb-2">Inventory</h2>
      <div className="text-2xl text-white bg-yellow-600 p-2 rounded-lg shadow-md shadow-black">
        <NumberSpan>{gold}</NumberSpan>g
      </div>
    </div>
  );
}
