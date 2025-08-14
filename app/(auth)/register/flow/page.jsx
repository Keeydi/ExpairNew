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

  const completeRegistration = () => router.push("/home");

  // Hold step data
  const [step1Data, setStep1Data] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
  });
  const [step2Data, setStep2Data] = useState({
    searchQuery: "",
    marker: null,
  });

  const [step3Data, setStep3Data] = useState({
    profilePicFile: null,
    introduction: "",
    links: [],
    userIDFile: null,
    userIDFileName: "",
  });

  const [step4Data, setStep4Data] = useState({
    selectedCategories: [], // Store selected categories here
  });

  const [step5Data, setStep5Data] = useState([]);

  const [step6Data, setStep6Data] = useState({});

  const handleStep1Submit = (data) => setStep1Data(data);
  const handleStep2Submit = (data) => setStep2Data(data);
  const handleStep3Submit = (data) => setStep3Data(data);
  const handleStep4Submit = (data) => setStep4Data(data);
  const handleStep5Submit = (data) => {
    setStep5Data(data);
    // Also set the data that Step 6 needs (the selected categories)
    setStep6Data(data);
  };
  const handleStep6Submit = (data) => setStep6Data(data);

  const nextStep = () => setStep((prev) => prev + 1);

  // Check which step we are at and update the corresponding step data
  const prevStep = (stepData) => {
    switch (step) {
      case 2:
        if (stepData) setStep2Data(stepData);
        break;
      case 3:
        if (stepData) setStep3Data(stepData);
        break;
      case 4:
        if (stepData) setStep4Data(stepData);
        break;
      case 5:
        if (stepData) setStep5Data(stepData); // Pass data back to Step 5
        break;
      case 6:
        if (stepData) setStep6Data(stepData); // Pass data back to Step 6
        break;
      default:
        break;
    }
    setStep((prev) => prev - 1);
  };


  return (
    <div>
      {step === 1 && (
        <Step1
          step1Data={step1Data}  // Pass Step 1 data to Step 1
          onDataSubmit={handleStep1Submit}
          onNext={nextStep}
        />
      )}
      {step === 2 && (
        <Step2
          step2Data={step2Data}  // Pass Step 2 data to Step 2
          onDataSubmit={handleStep2Submit}
          onNext={nextStep}
          onPrev={prevStep}  // Pass prevStep to Step 2
        />
      )}
      {step === 3 && (
        <Step3
          step3Data={step3Data}  // Pass Step 3 data to Step 3
          onDataSubmit={handleStep3Submit}
          onNext={nextStep}
          onPrev={prevStep}  // Pass prevStep to Step 3
        />
      )}
      {step === 4 && (
        <Step4
          step4Data={step4Data} // Pass Step 4 data to Step 4
          onDataSubmit={handleStep4Submit}
          onNext={nextStep}
          onPrev={prevStep}
        />
      )}
      {step === 5 && (
        <Step5
          step5Data={step5Data}  // Pass `step5Data` as prop
          onDataSubmit={handleStep5Submit} // Submit ranked categories to the parent
          onNext={nextStep}
          onPrev={prevStep}
        />
      )}
      {step === 6 && (
      <Step6
        step1Data={step1Data}
        step2Data={step2Data}
        step3Data={step3Data}
        step4Data={step4Data}
        step5Data={step5Data}
        step6Data={step6Data}
        onDataSubmit={handleStep6Submit}
        onNext={nextStep}
        onPrev={prevStep}
        />
      )}
      
      {step === 7 && <Onboarding1 onNext={() => setStep(8)} onPrev={() => setStep(6)} />}
      {step === 8 && <Onboarding2 onNext={completeRegistration} onPrev={() => setStep(7)} />}
    </div>
  );
}