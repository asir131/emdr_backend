import mongoose, { Schema, Document, Types } from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS & TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type DayOfWeek =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY INTERFACE & SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export interface ITestCategory extends Document {
  userId      : Types.ObjectId;
  categoryName: string;
  description?: string;
  isActive    : boolean;
  itemCount   : number;
  createdAt   : Date;
  updatedAt   : Date;
}

const testCategorySchema = new Schema<ITestCategory>(
  {
    userId: {
      type    : Schema.Types.ObjectId,
      ref     : 'User',
      required: true,
      index   : true,
    },
    categoryName: {
      type     : String,
      required : true,
      trim     : true,
      minlength: 1,
      maxlength: 100,
    },
    description: {
      type     : String,
      trim     : true,
      maxlength: 500,
      default  : null,
    },
    isActive: {
      type   : Boolean,
      default: true,
      index  : true,
    },
    itemCount: {
      type   : Number,
      default: 0,
      min    : 0,
    },
  },
  { timestamps: true }
);

testCategorySchema.index({ userId: 1, createdAt: -1 });
testCategorySchema.index({ userId: 1, isActive: 1 });
testCategorySchema.index({ userId: 1, categoryName: 1 }, { unique: true });

// ─────────────────────────────────────────────────────────────────────────────
// ITEM INTERFACE & SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export interface ITestItem extends Document {
  userId     : Types.ObjectId;
  categoryId : Types.ObjectId;
  itemName   : string;
  day        : DayOfWeek;
  description: string | null;
  isActive   : boolean;
  createdAt  : Date;
  updatedAt  : Date;
}

const testItemSchema = new Schema<ITestItem>(
  {
    userId: {
      type    : Schema.Types.ObjectId,
      ref     : 'User',
      required: true,
      index   : true,
    },
    categoryId: {
      type    : Schema.Types.ObjectId,
      ref     : 'TestCategory',
      required: true,
      index   : true,
    },
    itemName: {
      type     : String,
      required : true,
      trim     : true,
      minlength: 1,
      maxlength: 200,
    },
    day: {
      type    : String,
      enum    : DAYS_OF_WEEK,
      required: true,
      index   : true,
    },
    description: {
      type     : String,
      trim     : true,
      maxlength: 1000,
      default  : null,
    },
    isActive: {
      type   : Boolean,
      default: true,
      index  : true,
    },
  },
  { timestamps: true }
);

testItemSchema.index({ categoryId: 1, createdAt: -1 });
testItemSchema.index({ userId: 1, createdAt: -1 });
testItemSchema.index({ categoryId: 1, day: 1 });
testItemSchema.index({ categoryId: 1, isActive: 1 });

// ─────────────────────────────────────────────────────────────────────────────
// MODELS — must be declared before middleware that references them
// ─────────────────────────────────────────────────────────────────────────────

export const TestCategory = mongoose.model<ITestCategory>('TestCategory', testCategorySchema);
export const TestItem     = mongoose.model<ITestItem>('TestItem', testItemSchema);
