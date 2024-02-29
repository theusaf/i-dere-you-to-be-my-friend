function Game() {
  return (
    <>
      <div id="pixi-ui" className="absolute w-full h-full pointer-events-none">
        <div className="above-canvas"></div>
        <div className="full-screen absolute w-full h-full"></div>
      </div>
    </>
  );
}

export default Game;
