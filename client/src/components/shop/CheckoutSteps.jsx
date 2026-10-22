// Cart > Checkout > Done: shows the customer where they are in the buying flow
const STEPS = ["Bag", "Checkout", "Confirmation"];

export default function CheckoutSteps({ current = 1, tone = "dark" }) {
  return (
    <ol className={`mwp-steps${tone === "light" ? " mwp-steps-light" : ""}`} aria-label="Checkout progress">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "current" : "";
        return (
          <li key={label} className={state} aria-current={n === current ? "step" : undefined}>
            <span className="dot">{n < current ? "\u2713" : n}</span>
            <span className="label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
