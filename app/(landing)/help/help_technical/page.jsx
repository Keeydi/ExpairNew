"use client";

import React from "react";
import HelpLayout from "../../../../components/help/helplayout";

export default function HelpSupportPage() {
  return (
    <HelpLayout>
      <div className="space-y-10 pb-[116px]">
        {/* Title */}
        <h1 className="text-[31px] font-[700] mb-[20px] flex items-center gap-2">
          <img src="/assets/icons/techsupport.png" alt="Icon" className="w-[32px] h-[32px]" />
           Technical Support</h1>

        {/* Section: Login Issues */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Login Issues</h2>
          <p className="mb-4">
            Users who are unable to log in are advised to double-check their credentials and ensure the correct username and password are entered. If a password has been forgotten, users may click the "Forgot Password" link to reset it. Clearing browser cache, updating the browser, or trying another browser may also resolve login issues.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> I forgot my password. What should I do?<br />
              <strong>A:</strong> Click the "Forgot Password" link on the login page to reset it.
            </li>
            <li>
              <strong>Q:</strong> I’m sure my credentials are correct, but I still can’t log in.<br />
              <strong>A:</strong> Try clearing your browser cache or using a different browser.
            </li>
          </ul>
        </div>

        {/* Section: App Crashes */}
        <div>
          <h2 className="text-xl font-semibold mb-2">App Crashes and Freezes</h2>
          <p className="mb-4">
            When the app crashes or becomes unresponsive, users should try restarting the app and their device. Ensuring the app is updated to its latest version often resolves these issues. If problems persist, users are encouraged to send a screenshot and specify the device and operating system details.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> Why does the app crash when I open it?<br />
              <strong>A:</strong> It may be outdated—try updating or restarting your device.
            </li>
            <li>
              <strong>Q:</strong> What info do I send when reporting a crash?<br />
              <strong>A:</strong> Send a screenshot and specify your device and OS.
            </li>
          </ul>
        </div>

        {/* Section: Slow Loading or Lag */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Slow Loading or Lag</h2>
          <p className="mb-4">
            If the application is loading slowly or appears to lag, it may be due to poor internet connectivity. Try switching networks or restarting the router. Additionally, closing unused tabs and background applications may help improve performance.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> The app feels slow. What should I do?<br />
              <strong>A:</strong> Check your internet speed and close other apps.
            </li>
            <li>
              <strong>Q:</strong> Does using multiple tabs slow Expair down?<br />
              <strong>A:</strong> Yes, too many open tabs can affect performance.
            </li>
          </ul>
        </div>

        {/* Section: Connectivity Problems */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Connectivity Problems</h2>
          <p className="mb-4">
            In the event of connectivity issues, users should check their internet connection and firewall settings. Restarting the router may help. If Expair is undergoing maintenance, updates will be posted on our System Status page.
          </p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Q:</strong> How can I check if Expair is down?<br />
              <strong>A:</strong> Visit our System Status page for real-time updates.
            </li>
            <li>
              <strong>Q:</strong> I keep getting disconnected. Why?<br />
              <strong>A:</strong> Check firewall settings or restart your router.
            </li>
          </ul>
        </div>
      </div>
    </HelpLayout>
  );
}
