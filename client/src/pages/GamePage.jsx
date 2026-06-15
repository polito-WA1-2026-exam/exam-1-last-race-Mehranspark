// Orchestrates one game through its phases. The phase is local UI state; each
// phase is a separate component. The game is created (a POST) only when the player
// finishes Setup — never inside an effect — so StrictMode can't create duplicates.
//
// Phases: 'setup' -> 'planning' -> 'execution' -> 'result'.
// A valid route is replayed in 'execution'; an invalid one skips straight to
// 'result' (the player simply lost all coins).

import { useState } from "react";
import { Container, Alert } from "react-bootstrap";
import SetupPhase from "../components/SetupPhase.jsx";
import PlanningPhase from "../components/PlanningPhase.jsx";
import ExecutionPhase from "../components/ExecutionPhase.jsx";
import ResultView from "../components/ResultView.jsx";
import API from "../API.js";

function GamePage() {
  const [phase, setPhase] = useState("setup");
  const [game, setGame] = useState(null); // { id, start, dest, planningSeconds }
  const [result, setResult] = useState(null); // server's route outcome
  const [error, setError] = useState(null);

  // Called by SetupPhase when the player is ready: create the game, go to planning.
  const startPlanning = async () => {
    setError(null);
    const newGame = await API.createGame();
    setGame(newGame);
    setPhase("planning");
  };

  // Called by PlanningPhase after the route is submitted and scored.
  // A valid route is animated in the execution phase; an invalid one goes
  // straight to the result (no journey to replay).
  const handleSubmitted = (routeResult) => {
    setResult(routeResult);
    setPhase(routeResult.valid ? "execution" : "result");
  };

  // Start over.
  const newGame = () => {
    setGame(null);
    setResult(null);
    setPhase("setup");
  };

  return (
    <Container>
      {error && <Alert variant="danger">{error}</Alert>}

      {phase === "setup" && <SetupPhase onReady={startPlanning} />}
      {phase === "planning" && game && (
        <PlanningPhase game={game} onSubmitted={handleSubmitted} />
      )}
      {phase === "execution" && result && (
        <ExecutionPhase game={game} result={result} onFinish={() => setPhase("result")} />
      )}
      {phase === "result" && result && (
        <ResultView game={game} result={result} onNewGame={newGame} />
      )}
    </Container>
  );
}

export default GamePage;
