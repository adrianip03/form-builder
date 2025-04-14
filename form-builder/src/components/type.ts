export interface ItemType {
  id: string;
  question: string;
  type: "text" | "mcq" | "table" | "section";
}

export interface ContainerType {
  id: string;
  header: string;
  content: ItemType[];
}

export interface TextQuestionType extends ItemType {
  minLength?: number;
  maxLength?: number;
}

export interface BranchingChoice {
  text: string;
  nextQuestionId?: string;
}

export interface MCQQuestionType extends ItemType {
  choices: BranchingChoice[];
}

export interface TableColumnType {
  id: string;
  type: "text" | "mcq";
  header: string;
  choices?: string[];
}

export interface TableQuestionType extends ItemType {
  columns: TableColumnType[];
}
