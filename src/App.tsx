import React from "react";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import data from "./data/flashcards.json";
import diacritics from "./data/diacritics.json";
import { continuousLearning, Flashcard } from "./algorithm/continuous";
import { getAudioReadableStream } from "./methods/aws";
// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";
import Letter from "./components/Letter";
import { VisuallyHiddenInput } from "./components/VisuallyHiddenInput";
import { Button, ListGroup } from "react-bootstrap";

type Char = {
  style: string;
  content: string;
  hidden: boolean;
};

const defaultDeck: Flashcard[] = data.map((item, index) => ({
  ...item,
  id: index,
  efactor: 2.5,
  interval: 0,
  repetition: 0
}));

const App = function App() {
  const [deck, setDeck] = React.useState<Array<Flashcard>>(defaultDeck);
  const [level, setLevel] = React.useState<number>(0);
  const [textareaValue, setTextareaValue] = React.useState<string>("");
  const [question, setQuestion] = React.useState<string>("");
  const [answerChars, setAnswerChars] = React.useState<Array<Char>>([]);
  const [audioEl, setAudioEl] = React.useState<string>("");
  const [pulsingHeartStyle, setPulsingHeartStyle] = React.useState<string>(
    "heart"
  );

  function practice(flashcard: Flashcard, grade: number) {
    const currentLevel = level;
    setDeck((prevDeck) =>
      prevDeck.map((oldFlashcard) => {
        if (oldFlashcard.id === flashcard.id) {
          const { interval, repetition, efactor } = continuousLearning(
            flashcard,
            grade,
            currentLevel
          );
          return { ...flashcard, interval, repetition, efactor };
        }
        return oldFlashcard;
      })
    );
    setLevel(currentLevel + 1);
  }

  const currentFlashcard = deck
    .filter((a) => a.interval <= level)
    .sort((a, b) => (a.interval < b.interval && a.interval !== 0 ? -1 : 1))[0];

  const focusedRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (focusedRef?.current) focusedRef.current.focus();
  }, [focusedRef]);

  React.useEffect(() => {
    if (level > 0) {
      setQuestion(currentFlashcard.question);

      setTextareaValue("");
      if (focusedRef?.current) focusedRef.current.focus();
      setAnswerChars(
        currentFlashcard.answer.split("").map((char: string) => ({
          style: "new",
          content: char,
          hidden:
            /\w/.test(char) &&
            currentFlashcard.repetition !== 0 &&
            Math.random() > currentFlashcard.efactor / 3
        }))
      );

      getAudioReadableStream(currentFlashcard.answer)
        .then((stream) => new Response(stream))
        .then((response) => response.blob())
        .then((blob) => URL.createObjectURL(blob))
        .then((url) => {
          setAudioEl(url);
          if (currentFlashcard.repetition === 0) {
            const startingAudioElement = new Audio(url);
            startingAudioElement.play();
          }
        })
        .catch((err) => console.error(err));
    }
  }, [level]);

  const handleTyping = (event: React.ChangeEvent<HTMLInputElement>) => {
    const allDiacritics: string = Object.keys(diacritics).join("");
    const regex = new RegExp(`[a-zA-Z${allDiacritics}]`);

    const newValue = event.target.value;
    const lastCharPosition = newValue.length - 1;

    // Prevent deleting
    if (newValue.length < textareaValue.length) {
      return;
    }

    // Prevent writing more than length of the sentence
    if (newValue.length > answerChars.length) {
      return;
    }

    // Reset if textarea is empty
    if (newValue.length === 0) {
      setTextareaValue("");
      setAnswerChars((prevAnswerChars) =>
        prevAnswerChars.map((char) => ({ ...char, style: "new" }))
      );
      return;
    }

    //
    const isLetter = regex.test(answerChars[lastCharPosition].content);
    const isCorrectAnswer =
      newValue[lastCharPosition].toLowerCase() ===
        answerChars[lastCharPosition].content.toLowerCase() ||
      diacritics[
        answerChars[
          lastCharPosition
        ].content.toLowerCase() as keyof typeof diacritics
      ] === newValue[lastCharPosition].toLowerCase();

    // Add the new character to the textarea value (to have the correct version of the character, not what the user typed)
    if (isCorrectAnswer || !isLetter) {
      setTextareaValue(
        newValue.slice(0, lastCharPosition) +
          answerChars[lastCharPosition].content
      );
    }

    // Update the styles of the letters
    setAnswerChars((prevAnswerChars) =>
      prevAnswerChars.map((char, index) => {
        if (index === lastCharPosition) {
          if (!isLetter) {
            return { ...char, style: "blank", hidden: false };
          }
          if (isCorrectAnswer) {
            return {
              ...char,
              style: char.style === "new" ? "correct" : char.style,
              hidden: false
            };
          }
          return { ...char, style: "incorrect", hidden: false };
        }
        return char;
      })
    );

    if (newValue.length === answerChars.length) {
      const endingAudioElement = new Audio(audioEl);
      endingAudioElement.addEventListener("ended", () => {
        setLevel((prevLevel) => prevLevel + 1);
        practice(
          currentFlashcard,
          answerChars.filter((char) => char.style === "incorrect").length
        );
        setPulsingHeartStyle("heart heart-pulsing-positive");
      });
      endingAudioElement.play();
    }
  };

  return (
    <div>
      <Container>
        {level === 0 ? (
          <Row className="vh-100   justify-content-center align-items-center">
            <Col className="text-center">
              <Button variant="primary" onClick={() => setLevel(1)}>
                Start
              </Button>
            </Col>
          </Row>
        ) : (
          <Row className="vh-100  justify-content-center align-items-center">
            <Col className="text-center" sm={8}>
              <p>{question}</p>
              <p className="lead">
                {answerChars.map((char, index) => (
                  <Letter
                    className={char.style}
                    key={index}
                    blinking={index === textareaValue.length}
                  >
                    {char.hidden ? "_" : char.content}
                  </Letter>
                ))}
              </p>
              <VisuallyHiddenInput
                ref={focusedRef}
                onBlur={() => focusedRef?.current && focusedRef.current.focus()}
                value={textareaValue}
                onChange={handleTyping}
              />
            </Col>

            <Col className="text-center vh-100 overflow-auto py-4" sm={4}>
              {!!deck.filter((item) => item.interval !== 0).length && (
                <div>
                  <h3>
                    <span
                      className={pulsingHeartStyle}
                      onAnimationEnd={() => setPulsingHeartStyle("heart")}
                    >
                      STEP
                    </span>{" "}
                    {level}
                  </h3>
                  <ListGroup>
                    {deck
                      .filter((item) => item.interval !== 0)
                      .sort((a, b) =>
                        a.interval < b.interval && a.interval !== 0 ? -1 : 1
                      )
                      .map((flashcard, index) => (
                        <ListGroup.Item
                          key={flashcard.id}
                          style={{ fontSize: 10 }}
                          active={index === 0 && flashcard.interval <= level}
                        >
                          {`${flashcard.interval}... ${flashcard.question}`}
                        </ListGroup.Item>
                      ))}
                  </ListGroup>
                </div>
              )}
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
};

export default App;
