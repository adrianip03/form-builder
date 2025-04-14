import { TextField, PrimaryButton, DefaultButton } from "@fluentui/react";
import { ITextFieldStyles } from "@fluentui/react";
import { useFormContext } from "../context/FormContext";
import { useEffect } from "react";
import { isQuestionValid } from "../utils/validation";

interface Props {
  formHeader: string;
  setFormHeader: (value: string) => void;
  isPreviewMode: boolean;
  handlePreviewModeToggle: () => void;
  formHeaderError: () => string | null;
  currentQuestionIndex: number;
  answers: Record<
    string,
    { text?: string; choice?: string; tableAnswers?: Record<string, string> }
  >;
}

const formHeaderStyles: Partial<ITextFieldStyles> = {
  field: {
    fontSize: "2rem",
    fontWeight: 600,
    color: "#666",
  },
};

export default function TopBar({
  formHeader,
  setFormHeader,
  isPreviewMode,
  handlePreviewModeToggle,
  formHeaderError,
  currentQuestionIndex,
  answers,
}: Props) {
  const { items, nextQuestionId } = useFormContext();

  const isLastQuestion = () => {
    return currentQuestionIndex === items.length - 1 && !nextQuestionId;
  };

  const isCurrentQuestionValid = () => {
    const currentQuestion = items[currentQuestionIndex];
    const answer = answers[currentQuestion.id];
    return isQuestionValid(currentQuestion, answer);
  };

  useEffect(() => {
    console.log(nextQuestionId);
    console.log(isLastQuestion());
  }, [nextQuestionId]);

  return (
    <div className="flex justify-between items-center p-4 border-b">
      <TextField
        value={formHeader}
        onChange={(_, newValue) => setFormHeader(newValue || "")}
        placeholder="Enter form title"
        underlined
        styles={formHeaderStyles}
        disabled={isPreviewMode}
        errorMessage={formHeaderError()}
      />
      <div className="flex gap-2">
        <DefaultButton
          text={isPreviewMode ? "Edit" : "Preview"}
          onClick={handlePreviewModeToggle}
        />
        {isPreviewMode && (
          <PrimaryButton
            text="Submit"
            disabled={!isLastQuestion() || !isCurrentQuestionValid()}
          />
        )}
      </div>
    </div>
  );
}
