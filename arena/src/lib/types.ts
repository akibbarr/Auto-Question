export type QuestionType = "mcq" | "short" | "creative";

export type SubQuestion = {
  label: string;
  text: string;
  marks: number;
};

export type Question = {
  id: number;
  type: QuestionType;
  classId: number;
  subjectId: number;
  chapterId: number;
  text: string;
  options: string[] | null;
  correctAnswer: string | null;
  subQuestions: SubQuestion[] | null;
  marks: number;
  imageUrl: string | null;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
};

export type ClassItem = { id: number; name: string; sortOrder: number };
export type SubjectItem = {
  id: number;
  classId: number;
  name: string;
  code: string | null;
  sortOrder: number;
};
export type ChapterItem = {
  id: number;
  subjectId: number;
  name: string;
  sortOrder: number;
};

export type HeaderSettings = {
  id: number;
  schoolName: string;
  address: string;
  logoUrl: string | null;
  examName: string;
  instructions: string;
  footerText: string;
  watermarkText: string;
};

export type OptionStyle = "circle" | "paren" | "dot" | "bracket";
export type PaperSize = "A4" | "Letter" | "Legal" | "A5";
export type TextAlign = "left" | "center" | "right" | "justify";

export type FieldToggles = {
  logo: boolean;
  schoolName: boolean;
  examName: boolean;
  className: boolean;
  subjectName: boolean;
  chapterName: boolean;
  setCode: boolean;
  subjectCode: boolean;
  instructions: boolean;
  footer: boolean;
  watermark: boolean;
  address: boolean;
  obtainedMarksBox: boolean;
};

export type PaperCustomization = {
  editingMode: boolean;
  textAlign: TextAlign;
  paperSize: PaperSize;
  showPageNumber: boolean;
  pageNumberPosition: "top" | "bottom";
  optionStyle: OptionStyle;
  fontFamily: string;
  fontSize: number;
  columns: 1 | 2 | 3;
  columnDivider: boolean;
  questionGap: number;
  columnGap: number;
};

export type PaperHeaderData = {
  schoolName: string;
  address: string;
  logoUrl: string | null;
  examName: string;
  className: string;
  subjectName: string;
  chapterName: string;
  setCode: string;
  subjectCode: string;
  instructions: string;
  footerText: string;
  watermarkText: string;
  duration: string;
  fullMarks: string;
  fields: FieldToggles;
};

export type SectionSelection = {
  type: QuestionType;
  questionIds: number[];
  answerCount: number; // "যেকোনো N টি"
  marksEach: number | null; // override marks per question for short section (creative always 10 by default sum)
};

export type ExportPayload = {
  header: PaperHeaderData;
  customization: PaperCustomization;
  sections: SectionSelection[];
  questions: Question[];
};
