/*
 * portfolio-data.js
 * Single source of truth for every fact shown on the site.
 * Everything here is taken from the resume. Phone number and home address are
 * intentionally excluded. Fields that are not on the resume (e.g. GitHub URL,
 * project links) are omitted rather than invented.
 */
window.PORTFOLIO = {
  name: "Chandru R",
  firstName: "Chandru",
  role: "Aspiring Software Engineer",
  location: "Coimbatore, India",
  email: "chandru2382k5@gmail.com",

  socials: [
    {
      label: "LinkedIn",
      handle: "in/chandru2382k5",
      url: "https://www.linkedin.com/in/chandru2382k5",
      icon: "linkedin",
    },
  ],

  summary:
    "Aspiring Software Engineer with a strong foundation in C++, full-stack development, RESTful APIs and contemporary web technologies. Experienced in designing, developing and deploying scalable web applications.",

  heroSummary:
    "Designing, developing and deploying scalable web applications — grounded in C++, full-stack development and RESTful APIs.",

  // Only numbers that appear on (or are directly counted from) the resume.
  heroStats: [
    { value: "05", label: "Projects" },
    { value: "03", label: "Hackathon finals" },
    { value: "07", label: "Certifications" },
  ],

  work: {
    intro:
      "A look at my real-time projects.",
    stats: [
      { value: "05", label: "Projects" },
      { value: "01", label: "Internship · CloudMation" },
    ],
  },

  projects: [
    {
      name: "AI-Powered Museum Ticket Booking & Management System",
      category: "AI · Full stack",
      period: "Jun 2026 — Present",
      description:
        "An AI-assisted chatbot application that handles museum ticket booking, visitor management and customer support.",
      points: [
        "Developed an AI-assisted chatbot for ticket booking, visitor management and customer support.",
        "Built RESTful APIs for ticket reservations and administrative operations.",
        "Designed responsive, accessible user interfaces.",
        "Collaborated with cross-functional teams to integrate frontend and backend services.",
      ],
      tech: ["Spring Boot", "RESTful APIs"],
      links: [],
    },
    {
      name: "Responsive Jewelry E-Commerce Website",
      category: "Client project · E-commerce",
      period: "Mar 2025 — Apr 2025",
      description:
        "A responsive jewelry storefront with an administrative dashboard for running the catalogue in real time.",
      points: [
        "Admin dashboard to manage products, pricing, orders and inventory.",
        "Real-time data synchronisation with Firebase Firestore.",
        "Responsive React.js interface with intuitive navigation and dynamic content rendering across devices.",
      ],
      tech: ["React JS", "Firebase Firestore"],
      links: [],
    },
    {
      name: "Travels Booking Web Application",
      category: "Client project · Travel",
      description:
        "Developed a travel booking web application featuring travel packages, vehicle listings, booking management and an admin dashboard.",
      tech: ["React.js", "Supabase"],
      links: [],
    },
    {
      name: "Steel Company Website",
      category: "Client project · Business",
      description:
        "Developed a responsive steel company website featuring product showcases, company information, customer enquiries and an admin dashboard for managing website content.",
      tech: ["React.js", "Supabase"],
      links: [],
    },
    {
      name: "Matrimony Website",
      category: "Client project · Web app",
      description:
        "Developed a matrimony website for a real-world client featuring user registration, profile management, partner search and a responsive, user-friendly interface.",
      tech: ["React.js", "Firebase"],
      links: [],
    },
  ],

  stack: {
    intro:
      "Every language, framework and tool listed on my resume — from C++ fundamentals to generative AI.",
    groups: [
      { title: "Programming", items: ["C++", "Java"] },
      {
        title: "Frontend",
        items: ["HTML5", "CSS3", "JavaScript", "TypeScript", "React JS", "Bootstrap"],
      },
      { title: "Backend", items: ["Spring Boot", "RESTful APIs"] },
      { title: "Database & Cloud", items: ["MongoDB", "Firebase"] },
      {
        title: "Tools & Platforms",
        items: [
          "GitHub",
          "Git",
          "VS Code",
          "Figma",
          "Adobe XD",
          "Sketch",
          "Canva",
          "Mural",
          "Power BI",
          "Microsoft Excel",
        ],
      },
      {
        title: "AI & Machine Learning",
        items: [
          "LLMs",
          "OpenAI API",
          "NLP",
          "LangChain (Basics)",
          "Hugging Face",
          "Transformers",
          "Python for AI",
          "Pandas",
          "NumPy",
          "Model Evaluation",
          "Generative AI",
          "Prompt Engineering",
        ],
      },
    ],
  },

  experience: {
    intro: "A hands-on full stack web development internship focused on responsive, usable interfaces.",
    item: {
      date: "May 2026 — Jun 2026",
      title: "Full Stack Web Development Intern",
      org: "CloudMation",
      points: [
        "Completed a web development internship, gaining practical experience in web technologies and application development.",
        "Developed and enhanced responsive web interfaces, focusing on usability, functionality and clean design.",
      ],
    },
  },

  record: {
    intro: "Recognition, certifications and education.",
    items: [
      {
        date: null,
        kind: "Hackathon",
        title: "Finalist — Cyber Hackathon",
        org: "Conducted by the Government of Tamil Nadu",
        images: ["assets/hackathon-cyber-participation.png"],
      },
      {
        date: null,
        kind: "Hackathon",
        title: "Finalist — Rajasthan Police Hackathon 1.0",
        org: "Recognised for innovative problem-solving and technical implementation",
        images: [
          "assets/hackathon-rajasthan-certificate.png",
          "assets/hackathon-rajasthan-event.png",
          "assets/hackathon-rajasthan-participant.png",
        ],
      },
      {
        date: null,
        kind: "Hackathon",
        title: "Finalist - INNOHACK",
        org: "36-hour hackathon organized by New Prince Shri Bhavani College of Engineering and Technology, Chennai",
        images: ["assets/hackathon-innohack-certificate.png"],
      },
      {
        date: null,
        kind: "Certifications",
        title: "Professional certifications",
        list: [
          {
            name: "Google Cloud — Cloud Computing Foundations",
            image: "assets/certificate-google-cloud.png",
          },
          {
            name: "Tata — ESG Job Simulation",
            image: "assets/certificate-tata-esg.png",
          },
          {
            name: "Use Data Factory pipelines in Microsoft Fabric",
            image: "assets/certificate-microsoft-fabric.png",
          },
          {
            name: "IT Infrastructure Automation: Automation & Scalability",
            image: "assets/certificate-infosys-infrastructure-automation.png",
          },
          {
            name: "Database and SQL",
            image: "assets/certificate-infosys-database-and-sql.png",
          },
          {
            name: "SQL Tables",
            image: "assets/certificate-infosys-sql-tables.png",
          },
          {
            name: "JAVA SE 8 Features",
            image: "assets/certificate-infosys-java-se-8-features.png",
          },
        ],
      },
      {
        date: "2023 — 2027",
        kind: "Education",
        title: "B.E. Computer Science and Engineering",
        org: "Sri Krishna College of Engineering and Technology, Coimbatore",
        meta: "CGPA 7.19",
      },
      {
        date: "2022 — 2023",
        kind: "Education",
        title: "Grade 12",
        org: "Vivekam Matric. Hr. Sec. School, Coimbatore",
        meta: "78%",
      },
      {
        date: "2020 — 2021",
        kind: "Education",
        title: "Grade 10",
        org: "Vivekam Matric. Hr. Sec. School, Coimbatore",
        meta: "All Pass",
      },
    ],
  },

  about: {
    paragraphs: [
      "I'm Chandru, a Computer Science and Engineering undergraduate at Sri Krishna College of Engineering and Technology in Coimbatore. My foundation is in C++ and Java, and I build full-stack web applications with React JS, Spring Boot and RESTful APIs.",
      "I recently completed a full stack web development internship at CloudMation, building responsive interfaces with a focus on usability and clean design. Alongside the web, I'm exploring applied AI — LLMs, NLP, LangChain and Hugging Face Transformers.",
    ],
    interests: [
      "Full-stack web development",
      "RESTful API design",
      "Generative AI & LLMs",
      "Responsive, accessible interfaces",
    ],
    skills: [
      { name: "C++", group: "Programming" },
      { name: "Java", group: "Programming" },
      { name: "JavaScript", group: "Web" },
      { name: "TypeScript", group: "Web" },
      { name: "React JS", group: "Frontend" },
      { name: "Spring Boot", group: "Backend" },
      { name: "RESTful APIs", group: "Backend" },
      { name: "MongoDB", group: "Database" },
      { name: "Firebase", group: "Cloud" },
      { name: "LLMs & NLP", group: "AI / ML" },
      { name: "Prompt Engineering", group: "AI / ML" },
      { name: "Git", group: "Version control" },
    ],
    principles: [
      { title: "Build with purpose", text: "Start from the real problem, then choose the tools." },
      { title: "Keep learning", text: "Every project is a chance to pick up something new." },
      { title: "Focus on quality", text: "Clean code, clear interfaces, careful details." },
      { title: "Solve real problems", text: "Software is only useful when it works for people." },
    ],
  },

  contact: {
    heading: "Let's build something meaningful.",
    text: "Have a role, a project or an idea worth building? My inbox is open.",
  },
};
