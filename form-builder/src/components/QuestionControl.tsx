import { DefaultButton } from "@fluentui/react";
import { useFormContext } from "../context/FormContext";
import { useState, useEffect } from "react";
import { isQuestionValid } from "../utils/validation";

interface Props {
  currentQuestionIndex: number;
  isPreview: boolean;
  setCurrentQuestionIndex: (index: number) => void;
  answers: Record<
    string,
    { text?: string; choice?: string; tableAnswers?: Record<string, string> }
  >;
}

const QuestionControl = ({
  currentQuestionIndex,
  isPreview,
  setCurrentQuestionIndex,
  answers,
}: Props) => {
  const [history, setHistory] = useState<number[]>([]);
  const { nextQuestionId, setNextQuestionId, items } = useFormContext();

  useEffect(() => {
    setHistory([]);
  }, [isPreview]);

  const isCurrentQuestionValid = () => {
    const currentQuestion = items[currentQuestionIndex];
    const answer = answers[currentQuestion.id];
    return isQuestionValid(currentQuestion, answer);
  };

  // Handle previous question in preview mode
  const handlePreviousQuestion = () => {
    if (history.length > 0) {
      setCurrentQuestionIndex(history[history.length - 1]);
      setHistory((prev) => prev.slice(0, -1));
    }
  };

  // Handle next question in preview mode
  const handleNextQuestion = () => {
    if (!isCurrentQuestionValid()) return;

    setHistory((prev) => [...prev, currentQuestionIndex]);
    if (nextQuestionId) {
      setCurrentQuestionIndex(
        items.findIndex((item) => item.id === nextQuestionId)
      );
      // Clear nextQuestionId after setting the new index
      // Timeout is used to avoid nextQuestionId being reset before the new index is set for mcq questions
      setTimeout(() => setNextQuestionId(""), 0);
    } else if (currentQuestionIndex < items.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const isLastQuestion = () => {
    return currentQuestionIndex === items.length - 1 && !nextQuestionId;
  };

  return (
    <div className="flex justify-between mt-4">
      <DefaultButton
        text="Previous"
        onClick={handlePreviousQuestion}
        disabled={history.length === 0}
      />
      <DefaultButton
        text="Next"
        onClick={handleNextQuestion}
        disabled={isLastQuestion() || !isCurrentQuestionValid()}
      />
    </div>
  );
};

export default QuestionControl;
