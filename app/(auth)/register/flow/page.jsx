"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
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
  const { data: session, status } = useSession();

  const completeRegistration = async () => {
  try {
    setIsRegistering(false);
    sessionStorage.removeItem('registrationComplete');
    sessionStorage.removeItem('userEmail');
    
    // User is already signed in from step 6, just redirect
    router.push("/home");
  } catch (error) {
    console.error("Navigation error:", error);
    router.push("/signin?message=session_error");
  }
};

  const [isRegistering, setIsRegistering] = useState(false);

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
    selectedCategories: [],
  });
  const [step5Data, setStep5Data] = useState([]);
  const [step6Data, setStep6Data] = useState({});

  const handleStep1Submit = (data) => setStep1Data(data);
  const handleStep2Submit = (data) => setStep2Data(data);
  const handleStep3Submit = (data) => setStep3Data(data);
  const handleStep4Submit = (data) => setStep4Data(data);
  const handleStep5Submit = (data) => {
    setStep5Data(data);
    setStep6Data(data);
  };
  const handleStep6Submit = (data) => setStep6Data(data);

  const nextStep = () => {
    if (step === 6) {
      setIsRegistering(true);
      setStep(7);
    } else {
      setStep((prev) => prev + 1);
    }
  };

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
        if (stepData) setStep5Data(stepData);
        break;
      case 6:
        if (stepData) setStep6Data(stepData);
        break;
      case 7:
        setIsRegistering(false);
        break;
      default:
        break;
    }
    setStep((prev) => prev - 1);
  };

  // FIXED: Handle session changes - prevent redirect for new Google users
  useEffect(() => {
    console.log("=== REGISTER FLOW SESSION CHECK ===");
    console.log("Status:", status);
    console.log("Is new user:", session?.user?.isNewUser);
    console.log("Current step:", step);
    console.log("Is registering:", isRegistering);

    // Don't redirect during registration or post-registration onboarding
    const inPostRegFlow = sessionStorage.getItem('postRegistrationFlow') === 'true';

    if (isRegistering || step >= 7 || inPostRegFlow) {
      console.log("Skipping redirect - in registration/onboarding flow");
      return;
    }

    // Don't redirect new Google users who need to complete registration
    if (session?.user?.isNewUser) {
      console.log("New Google user detected - allowing registration flow");
      return;
    }

    // Only redirect existing authenticated users
    if (status === "authenticated" && session && !session.user?.isNewUser) {
      console.log("Existing user already authenticated, redirecting to home");
      router.push("/home");
    }
  }, [session, status, isRegistering, step, router]);

  return (
    <div>
      {step === 1 && (
        <Step1
          step1Data={step1Data}
          onDataSubmit={handleStep1Submit}
          onNext={nextStep}
        />
      )}
      {step === 2 && (
        <Step2
          step2Data={step2Data}
          onDataSubmit={handleStep2Submit}
          onNext={nextStep}
          onPrev={prevStep}
        />
      )}
      {step === 3 && (
        <Step3
          step3Data={step3Data}
          onDataSubmit={handleStep3Submit}
          onNext={nextStep}
          onPrev={prevStep}
        />
      )}
      {step === 4 && (
        <Step4
          step4Data={step4Data}
          onDataSubmit={handleStep4Submit}
          onNext={nextStep}
          onPrev={prevStep}
        />
      )}
      {step === 5 && (
        <Step5
          step5Data={step5Data}
          onDataSubmit={handleStep5Submit}
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
          onConfirm={async (step6FinalData) => {
            // Save step 6 data
            handleStep6Submit(step6FinalData);

            // Set loading state
            setIsRegistering(true);

            try {
              // CREATE THE ACCOUNT HERE - Call the complete-registration API
              const formData = new FormData();

              // Add basic user info from step1
              formData.append("first_name", step1Data.firstName);
              formData.append("last_name", step1Data.lastName);
              formData.append("username", step1Data.username);
              formData.append("email", step1Data.email);
              formData.append("password", step1Data.password);

              // Add location from step2
              if (step2Data.searchQuery) {
                formData.append("location", step2Data.searchQuery);
              }

              // Add profile data from step3
              if (step3Data.profilePicFile) {
                formData.append("profilePic", step3Data.profilePicFile);
              } else if (session?.user?.googleData?.image) {
                // If no file uploaded but Google image exists, pass the URL
                formData.append("google_image_url", session.user.googleData.image);
              }
              if (step3Data.introduction) {
                formData.append("bio", step3Data.introduction);
              }
              if (step3Data.links && step3Data.links.length > 0) {
                formData.append("links", JSON.stringify(step3Data.links));
              }
              if (step3Data.userIDFile) {
                formData.append("userVerifyId", step3Data.userIDFile);
              }

              // Add interests from step5 (general skills)
              const genSkillsIds = step5Data.map(item =>
                item.category_id || item.genskills_id || item
              );
              formData.append("genSkills_ids", JSON.stringify(genSkillsIds));

              // Add skills from step6 (specific skills)
              // Convert checkedOptions format to what backend expects
              const specSkills = {};
              Object.entries(step6FinalData.checkedOptions).forEach(([genId, specIds]) => {
                specSkills[genId] = specIds;
              });
              formData.append("specSkills", JSON.stringify(specSkills));

              console.log("Calling complete-registration API...");

              // Call the backend registration endpoint
              const response = await fetch("/api/dj/complete-registration/", {
                method: "POST",
                body: formData,
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || "Registration failed");
              }

              console.log("Registration successful!", data);

              console.log("Signing in user...");
              const signInResult = await signIn('credentials', {
                identifier: step1Data.username || step1Data.email,
                password: step1Data.password,
                redirect: false,
              });

              if (!signInResult?.ok) {
                throw new Error("Auto sign-in failed after registration");
              }

              console.log("Sign-in successful, session created");

              // NOW move to onboarding with active session
              nextStep();

            } catch (error) {
              console.error("Registration error:", error);
              setIsRegistering(false);
              alert(`Registration failed: ${error.message}. Please try again.`);
            }
          }}
          isSubmitting={isRegistering}
        />
      )}

      {step === 7 && <Onboarding1 onNext={() => setStep(8)} onPrev={() => setStep(6)} />}
      {step === 8 && <Onboarding2 onNext={completeRegistration} onPrev={() => setStep(7)} />}
    </div>
  );
}