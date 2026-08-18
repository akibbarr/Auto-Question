import type { FieldToggles, PaperCustomization, PaperHeaderData } from "./types";

export const FONT_OPTIONS = [
  { value: "Kalpurush", label: "Kalpurush (ডিফল্ট)" },
  { value: "SolaimanLipi", label: "SolaimanLipi" },
  { value: "Nikosh", label: "Nikosh" },
  { value: "Siyam Rupali", label: "Siyam Rupali" },
  { value: "Arial", label: "Arial" },
];

export const PAPER_SIZES: { value: PaperCustomization["paperSize"]; label: string }[] = [
  { value: "A4", label: "A4" },
  { value: "Letter", label: "Letter" },
  { value: "Legal", label: "Legal" },
  { value: "A5", label: "A5" },
];

export const OPTION_STYLES: { value: PaperCustomization["optionStyle"]; label: string }[] = [
  { value: "circle", label: "⚪ বৃত্ত" },
  { value: "paren", label: "(ক)" },
  { value: "dot", label: "ক." },
  { value: "bracket", label: "ক)" },
];

export const DEFAULT_CUSTOMIZATION: PaperCustomization = {
  editingMode: false,
  textAlign: "justify",
  paperSize: "A4",
  showPageNumber: true,
  pageNumberPosition: "bottom",
  optionStyle: "dot",
  fontFamily: "Kalpurush",
  fontSize: 14,
  columns: 1,
  columnDivider: true,
  questionGap: 12,
  columnGap: 20,
};

export const DEFAULT_FIELD_TOGGLES: FieldToggles = {
  logo: true,
  schoolName: true,
  examName: true,
  className: true,
  subjectName: true,
  chapterName: false,
  setCode: true,
  subjectCode: true,
  instructions: true,
  footer: true,
  watermark: false,
  address: true,
  obtainedMarksBox: false,
};

export const DEFAULT_HEADER: PaperHeaderData = {
  schoolName: "আদর্শ উচ্চ বিদ্যালয়",
  address: "",
  logoUrl: null,
  examName: "বার্ষিক পরীক্ষা - ২০২৬",
  className: "",
  subjectName: "",
  chapterName: "",
  setCode: "ক",
  subjectCode: "",
  instructions: "সময়মতো উত্তর করার চেষ্টা করবে। প্রতিটি প্রশ্নের মান ডানপাশে উল্লেখ আছে।",
  footerText: "",
  watermarkText: "",
  duration: "৩ ঘণ্টা",
  fullMarks: "১০০",
  fields: DEFAULT_FIELD_TOGGLES,
};

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  mcq: "বহুনির্বাচনি প্রশ্ন",
  short: "সংক্ষিপ্ত প্রশ্ন",
  creative: "সৃজনশীল প্রশ্ন",
};

export const DEFAULT_MCQ_MARKS = 1;
export const DEFAULT_SHORT_MARKS = 2;
export const DEFAULT_SUB_QUESTION_MARKS = [1, 2, 3, 4];
