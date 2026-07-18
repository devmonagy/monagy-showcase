export const SITE = {
  name: "Mohamed Nagy",
  tagline: "Engineering high-fidelity visual architectures.",
  resumeUrl: "/assets/Resume-MohamedNAGY.pdf",
  email: "contactmonagy@gmail.com",
};

export const BIO_PARAGRAPHS = [
  "I am an adaptable software developer with over 7 years of specialized expertise in engineering front-end user experiences while building robust full-stack software structures. My workspace is centered around crafting performant digital systems using React, Next.js, and TypeScript, bound to clean execution architectures.",
  "I bridge visual design precision with strict production optimization, ensuring software layouts stay fully compliant with modern cross-browser standards and complete accessibility rules.",
];

// Order is meaningful: frontend layer first (framework, language, animation,
// styling), backend layer second (runtime, database, API layer). The hero's
// desktop tag grid splits on this exact boundary — first 4 items on top,
// remaining 3 below — so reordering this array reorders that grid too.
export const TECH_STACK = [
  "React / Next.js",
  "TypeScript",
  "GSAP",
  "Tailwind CSS",
  "Node.js / Express",
  "MongoDB",
  "RESTful APIs",
];

// Order is meaningful: core framework/language first, styling/motion layer
// second. The footer's desktop tag grid splits on this exact boundary —
// first 3 items on top, remaining 2 below — so reordering this array
// reorders that grid too.
export const FOOTER_STACK = [
  "React",
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "GSAP",
];

export type Experience = {
  id: string;
  role: string;
  company: string;
  url: string;
  range: string;
  summary: string;
  skills: string[];
  details: string[];
};

export const EXPERIENCES: Experience[] = [
  {
    id: "adapt-software",
    role: "Software Developer",
    company: "ADAPT Community Network",
    url: "https://adaptcommunitynetwork.org/",
    range: "2025 — Present",
    summary:
      "Design and maintain internal organizational Power Apps and custom solutions using modular components, automated workflows, and secure integrations across Dataverse, SQL Server, and Azure services.",
    skills: [
      "Power Apps",
      "Power Automate",
      "Dataverse",
      "Architecture",
      "Azure",
      "Optimization",
      "Cloud Flows",
      "State Management",
    ],
    details: [
      "Develop internal organization Power Apps solutions, improving business process efficiency by ~25%.",
      "Build reusable component libraries and custom functions, accelerating internal app development by ~30%.",
      "Integrate Dataverse, REST APIs, and Azure services to enable secure internal data exchange by ~35%.",
      "Optimize low-code expressions, collections, and backend queries, reducing manual processing time by ~40%.",
      "Lead Agile sprints to deliver feature-rich application updates, improving team delivery predictability by ~20%.",
    ],
  },
  {
    id: "adapt-web",
    role: "Web Developer",
    company: "ADAPT Community Network",
    url: "https://adaptcommunitynetwork.org/",
    range: "2021 — 2025",
    summary:
      "Developed and maintained accessible, user-focused WordPress sites using HTML, CSS, JavaScript, and PHP to support organizational goals.",
    skills: [
      "HTML5",
      "CSS3",
      "JavaScript",
      "WordPress",
      "PHP",
      "REST APIs",
      "SEO",
      "WCAG Accessibility",
    ],
    details: [
      "Built responsive SEO-optimized web applications using JavaScript, PHP, WordPress, and REST APIs, improving page load speeds by ~20–30%.",
      "Developed reusable React components and internal dashboards, reducing manual workflows by ~25%.",
      "Implemented caching, asset optimization, and code refactoring, decreasing load times by ~30–40%.",
      "Ensured WCAG 2.2 accessibility and cross-browser compatibility, reducing UI issues by ~20%.",
    ],
  },
  {
    id: "webdefinitely",
    role: "Founder & Freelance Developer",
    company: "WeAreFlux Studio",
    url: "https://weareflux.studio",
    range: "2018 — Present",
    summary:
      "Partner with local clients to build custom websites and brand identities, managing everything from domain setup to SEO to deliver polished, user-friendly digital experiences.",
    skills: [
      "Full Stack",
      "React",
      "Node.js",
      "SEO",
      "Client Strategy",
      "Deployments",
      "Managed Web Hosting",
    ],
    details: [
      "Deliver full-stack solutions with JS/React/Node/PHP, improving delivery speed by ~25%.",
      "Build reusable UI components, cutting dev time by ~30%.",
      "Handle hosting, DNS, and deployments, reducing launch issues by ~40%.",
      "Lead projects end-to-end, increasing on-time delivery and client satisfaction by ~20%.",
    ],
  },
];

export type Project = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tech: string[];
  // Optional: projects with no live screenshot yet (pre-launch) render the
  // generated ComingSoonArt tile in ProjectsSection instead of an <Image>.
  image?: string;
  // "contain" for a square/padded brand mark (e.g. a logo on its own solid
  // background) — object-cover's default crop-to-fill would zoom past the
  // mark's edges on the deck's wide 16:10 frame. Omit (cover) for real
  // 16:10-ish site screenshots, which should still fill the frame edge to
  // edge.
  imageFit?: "cover" | "contain";
  liveUrl: string;
  status?: string;
};

// Order is meaningful: it's the exact left-to-right order the Projects
// deck scrolls through, and each slide's ghost index number (01, 02, ...)
// is derived from array position — reordering this array reorders the
// deck and renumbers every slide.
export const PROJECTS: Project[] = [
  {
    id: "blog-engine",
    title: "Blog Engine",
    subtitle: "MERN + TypeScript",
    description:
      "A full-stack blog engine inspired by platforms like Medium, built with the MERN stack, TypeScript, Tailwind CSS, and modern tooling. Includes robust secure authentication, post management, and a highly optimized, responsive UI.",
    tech: ["MongoDB", "Express", "React", "Node.js", "TypeScript", "Tailwind CSS", "JWT"],
    image: "/assets/blogwebapp-screen.webp",
    liveUrl: "https://blogwebapp.monagy.com",
    status: "In Development",
  },
  {
    id: "namman-flooring",
    title: "Namman Flooring",
    subtitle: "Professional Tile Installer",
    description:
      "An upcoming brand site for a professional tile installer specializing in bathroom and kitchen renovations. Built on React, Next.js, TypeScript, and GSAP, styled with Tailwind CSS, and shipping on Cloudflare Pages.",
    tech: ["React", "Next.js", "TypeScript", "GSAP", "Tailwind CSS", "Cloudflare Pages"],
    image: "/assets/NammanLogo.webp",
    imageFit: "contain",
    liveUrl: "https://www.nammanflooring.com/",
    status: "In Development",
  },
  {
    id: "apa-tax",
    title: "APA Tax Accounting Inc",
    subtitle: "Website Development & Edits",
    description:
      "A high-fidelity multi-page business website for a certified public accounting firm. Clean, semantic markup, optimized PHP templating, and custom Bootstrap layouts, featuring integrated analytics and secure client portal gateways.",
    tech: ["PHP", "Bootstrap", "JavaScript", "jQuery", "HTML5", "CSS3"],
    image: "/assets/APATax.webp",
    liveUrl: "https://apatax.com/",
  },
  {
    id: "shp-lawyers",
    title: "SHP Lawyers",
    subtitle: "WordPress Development",
    description:
      "A polished WordPress site for Stonberg, Hickman & Pavloff LLP, a defense litigation and insurance firm serving New York and New Jersey courts. Elementor-built pages deliver a clean, credible client-facing presence.",
    tech: ["WordPress", "PHP", "JavaScript", "HTML5", "CSS3", "Elementor"],
    image: "/assets/Shplawyers.webp",
    liveUrl: "https://shplawyers.com",
  },
  {
    id: "fusion-rx",
    title: "Fusion Apothecary Dubai",
    subtitle: "WordPress Development",
    description:
      "A tailored architectural WordPress theme for a premium medical compounding pharmacy and luxury wellness lab in Dubai. A clean, high-contrast interface showcasing specialized lab facilities and clinical IV drip therapies.",
    tech: ["WordPress", "PHP", "JavaScript", "HTML5", "CSS3", "Elementor"],
    image: "/assets/FusionRXDubai.webp",
    liveUrl: "https://fusionrxdubai.com/",
  },
];

export type SiteVersion = {
  id: string;
  version: string;
  name: string;
  tag: string;
  host: string;
  url: string;
  image: string;
  width: number;
  height: number;
  accent: "volt" | "cyan";
};

// Timeback Machine archive — newest era first, walking backwards from the
// present. width/height are the real intrinsic px of each webp so
// next/image reserves the correct aspect box inside the tilted cards.
export const SITE_VERSIONS: SiteVersion[] = [
  {
    id: "v2",
    version: "V2",
    name: "Afterglow",
    tag: "Second Transmission",
    host: "v2.monagy.com",
    url: "https://v2.monagy.com",
    image: "/assets/MoNAGYv2.webp",
    width: 2559,
    height: 1302,
    accent: "cyan",
  },
  {
    id: "v1",
    version: "V1",
    name: "First Light",
    tag: "First Transmission",
    host: "v1.monagy.com",
    url: "https://v1.monagy.com",
    image: "/assets/MoLightv1.webp",
    width: 1902,
    height: 940,
    accent: "volt",
  },
];

export const SOCIALS = [
  { label: "GitHub", url: "https://github.com/devmonagy" },
  { label: "LinkedIn", url: "https://www.linkedin.com/in/devmonagy" },
  { label: "CodePen", url: "https://codepen.io/devmonagy" },
];

export const NAV_LINKS = [
  { href: "#about", label: "About" },
  { href: "#experience", label: "Experience" },
  { href: "#projects", label: "Projects" },
  { href: "#contact", label: "Contact" },
];
