import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();

// Full-suite runs contend for CPU and Apollo mock resolution is event-loop-bound,
// so the 1s default async-util timeout turns load into flaky findBy*/waitFor
// failures. More settle time changes no semantics — only how long queries wait.
// The RTL import MUST happen after GlobalRegistrator.register(): evaluation order
// of static imports hoists @testing-library/react (and @testing-library/dom's
// `screen`, which captures `document` at module load) before register() runs,
// leaving all component tests without a global document.
const { configure: configureRtl } = await import("@testing-library/react");
configureRtl({ asyncUtilTimeout: 5000 });
