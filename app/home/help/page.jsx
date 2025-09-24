"use client";

import React from "react";
import { HelpCategoryCard } from "../../../components/help/category-card";
import { HelpForm } from "../../../components/help/help-form";
import HelpLayout from "../../../components/help/helplayout";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function HelpLanding() {
  const [status, setStatus] = useState("idle"); // 'idle', 'loading', 'success', 'error'
  const [message, setMessage] = useState("");

  const isHomeUser = usePathname().startsWith("/home");

  const handleSubmit = async (formData) => {
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, isHomeUser }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to submit ticket");
      }
      setStatus("success");
      setMessage(result.message);
    } catch (error) {
      setStatus("error");
      setMessage(error.message);
    }
  };

  return (
    <HelpLayout>
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-20 mx-auto justify-center">
        <div id="technical">
          <HelpCategoryCard
            title="Technical Support"
            desc="Get assistance with login issues, app operations and connectivity problems."
            iconSrc="/assets/icons/techsupport.png"
            href="/home/help/help_technical"
            className="w-[300px] h-[255px]"
          />
        </div>

        <div id="reporting">
          <HelpCategoryCard
            title="Reporting and Safety"
            desc="Learn how to report and block users, and keep the community safe."
            iconSrc="/assets/icons/reporting.png"
            href="/home/help/help_reporting"
            className="w-[300px] h-[255px]"
          />
        </div>

        <div id="product">
          <HelpCategoryCard
            title="Product Usage"
            desc="Steps on how to help you make the most of Expair's features."
            iconSrc="/assets/icons/product.png"
            href="/home/help/help_product"
            className="w-[300px] h-[255px]"
          />
        </div>

        <div id="account">
          <HelpCategoryCard
            title="Account Management"
            desc="Manage your settings, update your profile, and secure your account."
            iconSrc="/assets/icons/account.png"
            href="/home/help/help_account"
            className="w-[300px] h-[255px]"
          />
        </div>

        <div id="tutorials">
          <HelpCategoryCard
            title="Getting Started"
            desc="Guides and tutorials to help new users quickly get up and running with Expair."
            iconSrc="/assets/icons/start.png"
            href="/home/help/help_tutorials"
            className="w-[300px] h-[255px]"
          />
        </div>

        <div id="policies">
          <HelpCategoryCard
            title="Policies and Legal"
            desc="Access information about privacy, security, and our terms of service."
            iconSrc="/assets/icons/policies.png"
            href="/home/help/help_policies"
            className="w-[300px] h-[255px]"
          />
        </div>
      </div>

      {/* Help Form */}
      <div id="contact-form" className="w-full max-w-[500px] mx-auto">
        <h2 className="text-2xl font-bold mb-4">Contact Support</h2>
        <p className="text-white/70 mb-8">
          We're here to help! Fill out the form below and we'll get back to you
          as soon as possible.
        </p>
        <HelpForm onSubmit={handleSubmit} status={status} message={message} />
      </div>
    </HelpLayout>
  );
}
