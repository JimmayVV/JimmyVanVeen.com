import { redirect } from "react-router";

import { isRecord } from "~/utils/is-record";
import { sendMail } from "~/utils/mail";

import type { Route } from "./+types/email";

export function loader() {
  throw redirect("/");
}

export async function action({ request }: Route.ActionArgs) {
  if (import.meta.env.JVV_ALLOW_EMAILS !== "true") {
    return {
      success: false,
      error: "Contact me not enabled at this time",
    };
  }

  const formData = await request.formData();

  const field = (key: string): string => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };

  const name = field("name");
  const email = field("email");
  const phone = field("phone");
  const message = field("message");
  const captcha = formData.get("captcha");

  // Ping the google recaptcha verify API to verify the captcha code you received
  const response = await fetch(
    `https://www.google.com/recaptcha/api/siteverify?secret=${String(process.env.RECAPTCHA_SECRET_KEY)}&response=${String(captcha ?? "")}`,

    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
      },
      method: "POST",
    },
  );

  const result: unknown = await response.json();
  const captchaVerified = isRecord(result) && result.success === true;

  /**
   * The structure of response from the veirfy API is
   * {
   *  "success": true|false,
   *  "challenge_ts": timestamp,  // timestamp of the challenge load (ISO format yyyy-MM-dd'T'HH:mm:ssZZ)
   *  "hostname": string,         // the hostname of the site where the reCAPTCHA was solved
   *  "error-codes": [...]        // optional
    }
   */

  const fields = { name, email, phone, message };

  const fieldErrors = {
    name: !name ? "Name is required" : null,
    email: !email ? "Email is required" : null,
    phone: !phone ? "Phone is required" : null,
    message: !message ? "Message is required" : null,
  };

  if (Object.values(fieldErrors).some(Boolean) || !captchaVerified) {
    return {
      success: false,
      fieldErrors,
      fields,
      error: !captchaVerified
        ? "Unproccesable request, Invalid captcha code"
        : undefined,
    };
  }

  await sendMail({
    name,
    email,
    phone,
    message,
  });

  return { success: true, fields };
}
