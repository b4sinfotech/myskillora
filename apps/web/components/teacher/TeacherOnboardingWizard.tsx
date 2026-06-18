"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { OnboardingStep1 } from "./onboarding/OnboardingStep1";
import { OnboardingStep2 } from "./onboarding/OnboardingStep2";
import { OnboardingStep3 } from "./onboarding/OnboardingStep3";
import { OnboardingStep4 } from "./onboarding/OnboardingStep4";
import { OnboardingStep5 } from "./onboarding/OnboardingStep5";
import type {
  TeacherProfile, TeacherSubject, TeacherFee, SampleVideo,
  TeacherAvailability, Category
} from "@myskillora/types";

interface TeacherOnboardingWizardProps {
  teacherProfile: TeacherProfile | null;
  subjects: (TeacherSubject & { category: Category })[];
  fees: TeacherFee[];
  videos: SampleVideo[];
  availability: TeacherAvailability[];
  categories: Category[];
  userId: string;
}

const STEPS = [
  { number: 1, label: "Basic Info" },
  { number: 2, label: "Subjects & Fees" },
  { number: 3, label: "Sample Videos" },
  { number: 4, label: "Availability" },
  { number: 5, label: "Bank Details" },
];

export function TeacherOnboardingWizard({
  teacherProfile, subjects, fees, videos, availability, categories, userId
}: TeacherOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, 5));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, idx) => (
          <div key={step.number} className="flex items-center flex-1">
            <button
              onClick={() => setCurrentStep(step.number)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all",
                  currentStep === step.number
                    ? "border-primary bg-primary text-white"
                    : currentStep > step.number
                    ? "border-success bg-success text-white"
                    : "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {currentStep > step.number ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:block",
                  currentStep === step.number
                    ? "text-primary"
                    : currentStep > step.number
                    ? "text-success"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </button>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2 transition-colors",
                  currentStep > step.number ? "bg-success" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div>
        {currentStep === 1 && (
          <OnboardingStep1
            teacherProfile={teacherProfile}
            userId={userId}
            onNext={nextStep}
          />
        )}
        {currentStep === 2 && (
          <OnboardingStep2
            teacherProfile={teacherProfile}
            subjects={subjects}
            fees={fees}
            categories={categories}
            userId={userId}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}
        {currentStep === 3 && (
          <OnboardingStep3
            teacherProfile={teacherProfile}
            videos={videos}
            categories={categories}
            userId={userId}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}
        {currentStep === 4 && (
          <OnboardingStep4
            teacherProfile={teacherProfile}
            availability={availability}
            userId={userId}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}
        {currentStep === 5 && (
          <OnboardingStep5
            userId={userId}
            onBack={prevStep}
          />
        )}
      </div>
    </div>
  );
}
