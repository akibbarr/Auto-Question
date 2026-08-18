import {
  pgTable,
  serial,
  text,
  integer,
  jsonb,
  timestamp,
  real,
} from "drizzle-orm/pg-core";

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  classId: integer("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  code: text("code"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SubQuestionJson = {
  label: string;
  text: string;
  marks: number;
};

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "mcq" | "short" | "creative"
  classId: integer("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  chapterId: integer("chapter_id")
    .notNull()
    .references(() => chapters.id, { onDelete: "cascade" }),
  text: text("text").notNull().default(""),
  options: jsonb("options").$type<string[] | null>(),
  correctAnswer: text("correct_answer"),
  subQuestions: jsonb("sub_questions").$type<SubQuestionJson[] | null>(),
  marks: real("marks").notNull().default(1),
  imageUrl: text("image_url"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const examHeaderSettings = pgTable("exam_header_settings", {
  id: serial("id").primaryKey(),
  schoolName: text("school_name").notNull().default(""),
  address: text("address").notNull().default(""),
  logoUrl: text("logo_url"),
  examName: text("exam_name").notNull().default(""),
  instructions: text("instructions").notNull().default(""),
  footerText: text("footer_text").notNull().default(""),
  watermarkText: text("watermark_text").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
