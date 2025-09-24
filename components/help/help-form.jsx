"use client";

import { useState } from "react";
import { CheckCircle, X } from "lucide-react";

/**
 * A dialog to inform the user that their help request has been submitted successfully.
 * @param {object} props
 * @param {boolean} props.isOpen - Controls the visibility of the dialog.
 * @param {function} props.onClose - Function to call when the dialog should be closed.
 */
function HelpSubmitDialog({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[60]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      ></div>

      {/* Dialog */}
      <div
        className="relative w-[618px] h-[274px] flex flex-col items-center justify-center p-[50px]
          bg-black/40 border-2 border-[#0038FF] shadow-[0px_4px_15px_#D78DE5] backdrop-blur-[40px] rounded-[15px] z-50 isolate"
      >
        {/* Close button */}
        <button
          className="absolute top-[26px] right-[26px] text-white cursor-pointer hover:text-gray-300"
          onClick={onClose}
          aria-label="Close dialog"
          type="button"
        >
          <X className="w-[15px] h-[15px]" />
        </button>

        <div className="flex flex-col items-center gap-[16px] w-[470px]">
          {/* Success Icon */}
          <CheckCircle className="w-[60px] h-[60px] text-[#00E5A1]" />

          {/* Title */}
          <h2 className="text-[25px] font-semibold text-white text-center">
            Ticket sent into the stars!
          </h2>
          <p className="text-white/80 text-center">
            Our team will get to you soon.
          </p>

          {/* Action button */}
          <button
            onClick={onClose}
            className="w-[258px] h-[40px] bg-[#0038FF] rounded-[15px] text-white text-[16px] shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * An integrated Help Form component that includes a success dialog.
 * This component manages the form's state, handles submission, and
 * displays a pop-up window upon success. It now sends the data to a backend.
 */
export function HelpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [error, setError] = useState("");

  // A placeholder for your actual form validation logic
  const isFormValid = name && email && subject && message;

  // Function to handle the form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Create a FormData object to handle the file upload and text fields
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("subject", subject);
    formData.append("message", message);
    if (photo) {
      formData.append("photo", photo);
    }

    try {
      // Send the data to the backend API endpoint
      const response = await fetch("/api/send-help-request", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        // After successful submission, show the success dialog
        setShowSuccessDialog(true);
        // Reset form fields
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
        setPhoto(null);
      } else {
        const errorText = await response.text();
        console.error("Server response was not JSON:", errorText);
        try {
          // Attempt to parse as JSON if it's not a complete HTML page
          const errorData = JSON.parse(errorText);
          setError(errorData.error || "Failed to submit help request.");
        } catch {
          // If it's not JSON, display a generic error and log the response
          setError("An unexpected server error occurred. Please check the console for details.");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again later.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setShowSuccessDialog(false);
  };

  return (
    <>
      <div className="flex justify-center w-full px-4 sm:px-0 mb-20">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[500px] flex flex-col items-center justify-center p-6 bg-[#070014] rounded-[15px] border border-white/20 shadow-lg"
        >
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <div className="w-full flex flex-col mb-[20px]">
            {/* Name Field */}
            <label htmlFor="name" className="text-white font-normal mb-2">
              Your name<span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              id="name"
              placeholder="e.g. John Doe"
              className="w-full h-[50px] bg-[#120A2A] border border-white/40 rounded-[15px] px-[16px] text-white/80 placeholder:text-white/40 focus:outline-none focus:border-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="w-full flex flex-col mb-[20px]">
            {/* Email Field */}
            <label htmlFor="email" className="text-white font-normal mb-2">
              Your email address<span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="email"
              id="email"
              placeholder="name@example.com"
              className="w-full h-[50px] bg-[#120A2A] border border-white/40 rounded-[15px] px-[16px] text-white/80 placeholder:text-white/40 focus:outline-none focus:border-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="w-full flex flex-col mb-[20px]">
            {/* Subject Field */}
            <label htmlFor="subject" className="text-white font-normal mb-2">
              Subject<span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              id="subject"
              placeholder="e.g. Can't log in"
              className="w-full h-[50px] bg-[#120A2A] border border-white/40 rounded-[15px] px-[16px] text-white/80 placeholder:text-white/40 focus:outline-none focus:border-white"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="w-full flex flex-col mb-[20px]">
            {/* Message Field */}
            <label htmlFor="message" className="text-white font-normal mb-2">
              Your message<span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              id="message"
              placeholder="Tell us what you're experiencing."
              rows="4"
              className="w-full bg-[#120A2A] border border-white/40 rounded-[15px] px-[16px] py-[15px] text-white/80 placeholder:text-white/40 focus:outline-none focus:border-white"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="w-full flex flex-col mb-[20px]">
            {/* Photo upload */}
            <label className="text-white font-normal mb-2">
              Upload a photo for more context
            </label>
            <div className="relative">
              <input
                type="file"
                id="photo-upload"
                className="hidden"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files[0])}
              />
              <label
                htmlFor="photo-upload"
                className="w-full max-w-[450px] h-[50px] bg-[#120A2A] border border-white/40 rounded-[15px] px-[16px] py-[15px] flex justify-between items-center cursor-pointer"
              >
                <span
                  className={`text-[16px] flex-1 min-w-0 truncate ${
                    photo ? "text-white" : "text-[#413663]"
                  }`}
                >
                  {photo ? photo.name : "Upload photo"}
                </span>
                {/* Replaced Icon with inline SVG */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-[24px] h-[24px] text-white"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" x2="12" y1="3" y2="15"></line>
                </svg>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center mb-10 w-full">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="font-normal w-[240px] h-[50px] px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] text-white text-sm sm:text-[16px] hover:bg-[#1a4dff] transition rounded-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>

      <HelpSubmitDialog isOpen={showSuccessDialog} onClose={handleCloseDialog} />
    </>
  );
}