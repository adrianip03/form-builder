import { TextField } from "@fluentui/react";
import { TextQuestionType } from "./type";

interface Props {
  question: TextQuestionType;
  isPreviewMode?: boolean;
  onQuestionChange: (id: string, question: string) => void;
}

const TextQuestion = ({
  question,
  isPreviewMode = false,
  onQuestionChange,
}: Props) => {
  return (
    <div className="w-full">
      {isPreviewMode ? (
        <div className="preview-text-question">
          <p className="question-text">
            {question.question || "Untitled Question"}
          </p>
          <TextField placeholder="Your answer here" underlined />
        </div>
      ) : (
        <TextField
          value={question.question || ""}
          onChange={(_, newValue) => {
            if (newValue !== undefined) {
              onQuestionChange(question.id, newValue);
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
