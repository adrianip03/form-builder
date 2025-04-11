import { createContext, useContext, ReactNode, useState } from "react";
import { ItemType } from "../components/type";

interface FormContextType {
  items: ItemType[];
  nextQuestionId: string;
  setNextQuestionId: (id: string) => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

interface Props {
  children: ReactNode;
  items: ItemType[];
}

export const FormProvider = ({ children, items }: Props) => {
  const [nextQuestionId, setNextQuestionId] = useState<string>("");

  return (
    <FormContext.Provider value={{ items, nextQuestionId, setNextQuestionId }}>
      {children}
    </FormContext.Provider>
  );
};

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error("useFormContext must be used within a FormProvider");
  }
  return context;
};
