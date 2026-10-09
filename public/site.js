// Progressive enhancements. Every page works without this file:
// the site stays in the light theme and the contact form posts normally.

// Theme toggle. The saved theme is applied by the inline script in <head>
// before the first paint, so this only wires up the button.
(function () {
  const root = document.documentElement;
  const toggle = document.querySelector(".theme-toggle");
  if (!toggle) return;

  const isDark = () => root.dataset.theme === "dark";

  toggle.setAttribute("aria-pressed", String(isDark()));
  toggle.hidden = false;

  toggle.addEventListener("click", () => {
    const dark = !isDark();
    if (dark) {
      root.dataset.theme = "dark";
    } else {
      delete root.dataset.theme;
    }
    toggle.setAttribute("aria-pressed", String(dark));
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      // Storage can be unavailable (private mode, blocked cookies).
      // The toggle still works for the current page.
    }
  });
})();

// Contact form: accessible inline validation and submission without leaving
// the page. Without JavaScript the browser validates natively and the form
// service redirects to /message-sent/.
(function () {
  const form = document.getElementById("contact-form");
  if (!form || !window.fetch) return;

  const status = form.querySelector(".form-status");
  const submit = form.querySelector('button[type="submit"]');
  const fields = Array.from(form.querySelectorAll("[data-validate]"));

  const messages = {
    name: { missing: "Enter your name." },
    email: {
      missing: "Enter your email address.",
      invalid: "Enter a valid email address, like name@example.com.",
    },
    message: {
      missing: "Enter a message.",
      short: "Your message needs at least 10 characters.",
      long: "Your message can be up to 5,000 characters.",
    },
  };

  function errorFor(field) {
    const validity = field.validity;
    const text = messages[field.name];
    if (validity.valueMissing) return text.missing;
    if (validity.typeMismatch) return text.invalid;
    if (validity.tooShort) return text.short;
    if (validity.tooLong) return text.long;
    return "";
  }

  function showError(field, text) {
    const error = document.getElementById(field.id + "-error");
    error.textContent = text;
    error.hidden = !text;
    if (text) {
      field.setAttribute("aria-invalid", "true");
    } else {
      field.removeAttribute("aria-invalid");
    }
  }

  function setStatus(state, text) {
    status.dataset.state = state;
    status.textContent = text;
  }

  form.noValidate = true;

  for (const field of fields) {
    // Re-check a field as it is corrected, but don't nag while typing
    // into a field that hasn't been flagged yet.
    field.addEventListener("input", () => {
      if (field.hasAttribute("aria-invalid")) showError(field, errorFor(field));
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    let firstInvalid = null;
    for (const field of fields) {
      const error = errorFor(field);
      showError(field, error);
      if (error && !firstInvalid) firstInvalid = field;
    }
    if (firstInvalid) {
      setStatus("error", "Please correct the highlighted fields.");
      firstInvalid.focus();
      return;
    }

    submit.disabled = true;
    setStatus("", "Sending your message…");

    const data = new FormData(form);
    data.delete("redirect"); // only used by the no-JavaScript fallback

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.message);

      form.reset();
      setStatus("success", "Thanks! Your message was sent. I'll reply by email.");
    } catch {
      setStatus(
        "error",
        "Sorry, your message couldn't be sent. Please try again in a moment, or reach me on LinkedIn."
      );
    } finally {
      submit.disabled = false;
    }
  });
})();
