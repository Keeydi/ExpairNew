"use client";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Upload, ChevronDown } from "lucide-react";
import { useState, Fragment } from "react";
import { Listbox } from "@headlessui/react";
import { Icon } from "@iconify/react";

export function HelpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");  
  const [category, setCategory] = useState("");
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState(null);


  const options = [
    {
      label: "🔧 Technical Issues",
      items: [
        "I can’t log into my account",
        "I didn’t receive a verification email",
        "I’m having trouble uploading a certificate or ID",
        "I’m experiencing bugs or glitches on the platform",
        "I can’t connect my social media accounts",
      ],
    },
    {
      label: "👥 User or Trade Concerns",
      items: [
        "My trade partner isn’t responding",
        "My partner uploaded invalid or inappropriate proof",
        "I suspect my partner is a scammer",
        "I want to report a user",
        "I want to dispute a rating or feedback",
      ],
    },
    {
      label: "💬 Account & Settings",
      items: [
        "I want to change my password",
        "I want to delete or deactivate my account",
        "I want to edit my profile or skills list",
        "I can’t update my availability or location",
      ],
    },
    {
      label: "📄 Platform Use & Guidelines",
      items: [
        "I don’t understand how trades work",
        "I need help using the trade system",
        "I want to know how Expair’s fairness system works",
        "I have suggestions to improve Expair",
      ],
    },
    {
      label: "💸 Privacy & Security",
      items: [
        "I’m concerned about my data privacy",
        "I want to unlink a connected account",
        "I want to know how my data is used",
      ],
    },
  ];

  const maxChars = 500;

  const isFormValid =
    name.trim() !== "" &&
    email.trim() !== "" &&
    category.trim() !== "" &&
    text.trim() !== "";


  return (
    <div
      id="contact"
      className="max-w-3xl mx-auto pt-[50px] text-white px-4 sm:px-6"
    >
      <h2 className="text-[22px] sm:text-[25px] font-semibold mb-[30px] text-center">
        Create a ticket
      </h2>

      <form className="space-y-[30px] flex flex-col">
        {/* Name Input */}
        <div>
          <p className="text-white font-normal mb-[15px]">Your name *</p>
          <Input
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full max-w-[450px] h-[50px] rounded-[15px] border border-white/40 bg-[#120A2A] placeholder-[#413663] placeholder:text-[16px] text-white"
          />
        </div>

        {/* Email Input */}
        <div>
          <p className="text-white font-normal mb-[15px]">Your email *</p>
          <Input
            type="email"
            placeholder="youremail@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full max-w-[450px] h-[50px] rounded-[15px] border border-white/40 bg-[#120A2A] placeholder-[#413663] placeholder:text-[16px] text-white"
          />
        </div>

        {/* Select Dropdown */}
        <div>
          <p className="text-white font-normal mb-[15px]">
            What's your problem, concern, or suggestion? *
          </p>
          <div className="w-full max-w-[450px]">
            <Listbox value={category} onChange={setCategory}>
              <div className="relative">
                <Listbox.Button
                  className={`w-full h-[50px] rounded-[15px] border border-white/40 bg-[#120A2A] text-left pl-4 pr-10 flex items-center justify-between ${
                    category ? "text-white" : "text-[#413663]"
                  } text-[16px]`}
                >
                  {category || "Select category"}
                  <ChevronDown className="h-6 w-6 absolute right-4 text-white" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-[15px] bg-[#120A2A] text-white shadow-lg border border-white/20">
                  {options.map((group, idx) => (
                    <Fragment key={idx}>
                      <div className="px-4 pt-2 pb-1 text-xs text-white/60 font-semibold">
                        {group.label}
                      </div>
                      {group.items.map((item, itemIdx) => (
                        <Listbox.Option
                          key={itemIdx}
                          value={item}
                          className={({ active }) =>
                            `cursor-pointer select-none px-4 py-2 text-sm ${
                              active ? "bg-[#1c1238]" : ""
                            }`
                          }
                        >
                          {item}
                        </Listbox.Option>
                      ))}
                    </Fragment>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>
        </div>

        {/* Photo upload */}
        <label className="text-white font-normal mb-[15px]">
          Upload a photo for context
        </label>
        <div className="relative">
          <input
            type="file"
            id="photo-upload"
            className="hidden"
            onChange={(e) => setPhoto(e.target.files[0])}
          />
          <label
            htmlFor="photo-upload"
            className="w-full max-w-[450px] h-[50px] bg-[#120A2A] border border-white/40 rounded-[15px] px-[16px] py-[15px] flex justify-between items-center cursor-pointer"
          >
            <span className="text-[16px] text-[#413663]">
              {photo ? photo.name : "Upload photo"}
            </span>
            <Icon
              icon="material-symbols:upload"
              className="text-white w-[24px] h-[24px]"
            />
          </label>
        </div>

        {/* Textarea with Counter */}
        <div>
          <p className="text-white font-normal mb-[15px]">
            Describe the ticket in detail *
          </p>
          <div className="relative w-full max-w-[656px]">
            <Textarea
              placeholder="Example: I am submitting a report concerning a potential scam incident..."
              rows={6}
              maxLength={maxChars}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-[180px] bg-[#120A2A] border border-white/40 rounded-[15px] text-white placeholder-[#413663] placeholder:text-[16px] p-3"
            />
            <span className="absolute bottom-2 right-3 text-xs text-gray-400">
              {text.length}/{maxChars}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mb-[195px] w-full">
          <Button
            type="submit"
            disabled={!isFormValid}
            className="font-normal w-[240px] h-[50px] px-[38px] py-[13px] shadow-[0px_0px_15px_0px_#284CCC] bg-[#0038FF] text-white text-sm sm:text-[16px] hover:bg-[#1a4dff] transition rounded-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
}
