export function LoadingScreenContent(): JSX.Element {
  return (
    <div className="pointer-events-auto h-full flex flex-col items-center">
      <div className="m-auto flex-1 flex flex-row items-center">
        <span className="text-white text-center text-6xl">Loading...</span>
      </div>
    </div>
  );
}
