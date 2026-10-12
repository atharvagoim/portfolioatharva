// First-run content. Everything here is editable from the admin panel.
export const DEFAULT_SETTINGS = {
  name: 'Atharva Goim',
  role: 'Software Developer & AI Engineer',
  about:
    "Hey, I'm Atharva Goim, a Software Developer and AI Engineer passionate about building innovative web applications, AI-powered solutions, and intelligent automation. I work with modern technologies to develop scalable applications, integrate AI models, and create smart tools that solve real-world problems. I enjoy exploring new technologies, experimenting with ideas, and transforming complex concepts into meaningful digital experiences.",
  serviceLabel: 'my service website',
  serviceUrl: '',
  contactIcon: '',
  contacts: {
    github: '',
    linkedin: '',
    instagram: '',
    whatsapp: '',
    email: 'atharvagoim7@gmail.com',
    phone: '',
  },
  experience: [
    {
      title: 'Appealing Apparels',
      text:
        'I independently designed and developed Appealing Apparels, a full-stack e-commerce platform using the MERN stack (MongoDB, Express.js, React, and Node.js). I built a responsive storefront with product discovery, search and filters, shopping cart, wishlist, coupon codes, customer reviews, secure authentication, and order tracking. I also developed an admin dashboard for managing products, categories, customers, orders, and promotions, along with Razorpay payment integration, invoice generation, and customer support features. The project combines modern UI/UX with backend APIs, database management, and real-world e-commerce workflows.',
      linkLabel: 'www.appealingapparels.com',
      linkUrl: 'https://www.appealingapparels.com',
      image: '',
    },
  ],
};

export const DEFAULT_PROJECTS = [
  {
    title: 'Productivity Agent',
    description:
      'Productivity Agent is an AI-powered assistant that automates tasks, streamlines workflows, and boosts productivity through intelligent task management and LLM-driven automation.',
    tags: ['FastAPI', 'LangGraph', 'LLM'],
    accent: '#B9B4F0',
  },
  {
    title: 'GreenShield',
    description:
      'An AI-powered, authorized security testing platform with SAST, secrets and dependency scanners plus a safe dynamic web/API scanner behind a strict authorization gate.',
    tags: ['MERN', 'TypeScript'],
    accent: '#9BEA3B',
  },
  {
    title: 'Cred Sense',
    description:
      'An ML-backed credit scoring app: a FastAPI + scikit-learn backend that auto-selects the best classifier, with a React/Vite frontend.',
    tags: ['FastAPI', 'scikit-learn', 'React'],
    accent: '#7FB7FF',
  },
  {
    title: 'PawNest',
    description:
      'A pet supplies e-commerce site on Next.js with an admin portal, Vercel KV persistence and HMAC-signed PIN auth.',
    tags: ['Next.js', 'Vercel KV'],
    accent: '#FFC56B',
  },
  {
    title: 'Subreddit Vibe Check',
    description:
      'A Reddit sentiment dashboard: Vite/React frontend, Express proxy backend and client-side AFINN sentiment analysis.',
    tags: ['React', 'Express'],
    accent: '#FF8A65',
  },
].map((p) => ({ icon: '', logo: '', cover: '', liveUrl: '', repoUrl: '', category: '', year: '2026', featured: false, hidden: false, tagline: '', ...p }));
