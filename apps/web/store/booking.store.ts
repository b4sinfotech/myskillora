import { create } from "zustand";
import type { TeacherFee, Category } from "@myskillora/types";

interface BookingDraft {
  teacherId: string;
  teacherName: string;
  categoryId: string;
  category: Category | null;
  fee: TeacherFee | null;
  sessionDate: string | null;
  sessionTime: string | null;
  notes: string;
}

interface BookingState {
  draft: BookingDraft | null;
  isOpen: boolean;
  step: 1 | 2 | 3;
  initDraft: (teacherId: string, teacherName: string) => void;
  setCategory: (category: Category) => void;
  setFee: (fee: TeacherFee) => void;
  setDateTime: (date: string, time: string) => void;
  setNotes: (notes: string) => void;
  setStep: (step: 1 | 2 | 3) => void;
  openModal: () => void;
  closeModal: () => void;
  reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  draft: null,
  isOpen: false,
  step: 1,
  initDraft: (teacherId, teacherName) =>
    set({
      draft: {
        teacherId,
        teacherName,
        categoryId: "",
        category: null,
        fee: null,
        sessionDate: null,
        sessionTime: null,
        notes: "",
      },
      isOpen: true,
      step: 1,
    }),
  setCategory: (category) =>
    set((state) => ({
      draft: state.draft ? { ...state.draft, categoryId: category.id, category } : null,
    })),
  setFee: (fee) =>
    set((state) => ({
      draft: state.draft ? { ...state.draft, fee } : null,
    })),
  setDateTime: (sessionDate, sessionTime) =>
    set((state) => ({
      draft: state.draft ? { ...state.draft, sessionDate, sessionTime } : null,
    })),
  setNotes: (notes) =>
    set((state) => ({
      draft: state.draft ? { ...state.draft, notes } : null,
    })),
  setStep: (step) => set({ step }),
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
  reset: () => set({ draft: null, isOpen: false, step: 1 }),
}));
