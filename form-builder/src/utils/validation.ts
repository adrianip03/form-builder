import { ItemType, TextQuestionType } from "../components/types";

export const validateTextQuestion = (
  question: TextQuestionType,
  answer?: { text?: string }
): boolean => {
  if (!answer?.text) return false;
  
  if (question.minLength && answer.text.length < question.minLength) {
    return false;
  }
  if (question.maxLength && answer.text.length > question.maxLength) {
    return false;
  }
  return true;
};

export const isQuestionValid = (
  question: ItemType,
  answer?: { text?: string; choice?: string; tableAnswers?: Record<string, string> }
): boolean => {
  if (question.type === "text") {
    return validateTextQuestion(question as TextQuestionType, answer);
  }
  return true;
};
