"use client";

import { useState } from "react";
import Step1 from "./steps/step1";
import Step2 from "./steps/step2";
import Step3 from "./steps/step3";
import Step4 from "./steps/step4";
import Step5 from "./steps/step5";
import Step6 from "./steps/step6";
import Onboarding1 from "./steps/onboarding1";
import Onboarding2 from "./steps/onboarding2";
import { useRouter } from "next/navigation";

export default function RegisterFlow() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  // hold step data
  const [step1Data, setStep1Data] = useState({
    firstName: "", lastName: "", email: "", username: "", password: "",
  });
  const [step2Data, setStep2Data] = useState({
    searchQuery: "", marker: null,
  });

  const [step5Data, setStep5Data] = useState([]);

  const handleStep1Submit = (data) => setStep1Data(data);
  const handleStep2Submit = (data) => setStep2Data(data);

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);
  const completeRegistration = () => router.push("/home");
  const goToOnboarding = () => setStep(7);

  return (
    <div>
      {step === 1 && <Step1 onDataSubmit={handleStep1Submit} onNext={nextStep} />}
      {step === 2 && <Step2 onDataSubmit={handleStep2Submit} onNext={nextStep} onPrev={prevStep} />}
      {step === 3 && <Step3 step1Data={step1Data} step2Data={step2Data} onNext={nextStep} onPrev={prevStep} />}
      {step === 4 && <Step4 onNext={nextStep} onPrev={prevStep} />}
      {step === 5 && (
        <Step5
          onPrev={prevStep}
          onNext={(ranked) => {        
            setStep5Data(ranked);
            nextStep();
          }}
        />
      )}
      {step === 6 && (
        <Step6
          selectedSkills={step5Data}
          onNext={goToOnboarding}
          onPrev={prevStep}
        />
      )}

      {step === 7 && <Onboarding1 onNext={() => setStep(8)} onPrev={() => setStep(6)} />}
      {step === 8 && <Onboarding2 onNext={completeRegistration} onPrev={() => setStep(7)} />}
    </div>
  );
}
