import { TextField } from "@fluentui/react";
import { ItemType } from "./type";

interface Props {
  question: ItemType;
  isPreviewMode?: boolean;
  onQuestionChange: (id: string, data: { question?: string }) => void;
  onAnswerChange?: (questionId: string, answer: { text: string }) => void;
  answer?: { text?: string };
}

const TextQuestion = ({
  question,
  isPreviewMode = false,
  onQuestionChange,
  onAnswerChange,
  answer,
}: Props) => {
  return (
    <div className="w-full">
      {isPreviewMode ? (
        <div className="preview-text-question">
          <p className="question-text">
            {question.question || "Untitled Question"}
          </p>
          <TextField
            placeholder="Your answer here"
            underlined
            value={answer?.text || ""}
            onChange={(_, newValue) => {
              if (newValue !== undefined && onAnswerChange) {
                onAnswerChange(question.id, { text: newValue });
              }
            }}
          />
        </div>
      ) : (
        <TextField
          value={question.question || ""}
          onChange={(_, newValue) => {
            if (newValue !== undefined) {
              onQuestionChange(question.id, { question: newValue });
            }
          }}
          placeholder="Enter your question here"
          underlined
        />
      )}
    </div>
  );
};

export default TextQuestion;
