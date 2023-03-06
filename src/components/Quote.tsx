import { useEffect } from "react";

export default function Quote({ textareaValue, chars, setChars }) {
  useEffect(() => {
    setChars((prevChars) =>
      prevChars.map((char, index) => {
        const character = textareaValue[index];
        console.log(character);
        if (!character) {
          return { ...char, style: "" };
        }
        if (character === char.content) {
          return { ...char, style: "correct" };
        }
        return { ...char, style: "incorrect" };
      })
    );
  }, [setChars, textareaValue]);
  return (
    <div className="quote-display" id="quoteDisplay">
      {chars.map((char) => (
        <span className={char.style}>{char.content}</span>
      ))}
    </div>
  );
}
