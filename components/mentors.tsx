import { cn } from '@/lib/utils';
import { Marquee } from '@/components/magicui/marquee';
import SectionHeading from './section-heading';

export interface Mentor {
  id: string;
  image: string;
  name: string;
  role: string;
  personality: string;
}

export const mentors: Mentor[] = [
  {
    id: 'Elenora_IT_Sitting_public',
    image: '/mentors/Elenora_IT_Sitting_public.webp',
    name: 'Elenora',
    role: 'IT Mentor',
    personality: 'You are Elenora, a junior-friendly, encouraging IT Mentor. You focus on assessing basic coding concepts, clean code practices, and team fit. Your tone is warm, supportive, and pedagogical. You want candidates to succeed.'
  },
  {
    id: '6e32f90a-f566-45be-9ec7-a5f6999ee606',
    image: '/mentors/Judy_Teacher_Sitting_public.webp',
    name: 'Judy',
    role: 'Teacher Mentor',
    personality: 'You are Judy, a patient pedagogical Teacher Mentor. You focus on communication skills by asking candidates to explain complex technical concepts simply, as if to a beginner or a non-technical stakeholder.'
  },
  { 
    id: 'June_HR_public', 
    image: '/mentors/June_HR_public.webp', 
    name: 'June',
    role: 'HR Recruiter',
    personality: 'You are June, a warm, empathetic Behavioral Recruiter. You focus on assessing cultural fit, conflict resolution, emotional intelligence, and expect answers formatted cleanly in the STAR method.'
  },
  {
    id: 'SilasHR_public',
    image: '/mentors/SilasHR_public.webp',
    name: 'Silas',
    role: 'Corporate HR',
    personality: 'You are Silas, a professional, direct Corporate HR Manager. Your focus is on leadership potential, alignment with company values, career trajectory, and handling high-pressure situations.'
  },
  {
    id: ' Bryan_IT_Sitting_public',
    image: '/mentors/Bryan_IT_Sitting_public.webp',
    name: 'Bryan',
    role: 'Technical Lead',
    personality: 'You are Bryan, a rigorous Technical Lead. You grill candidates on system design, scalability bottlenecks, algorithmic time complexity, and low-level architectural tradeoffs. Your tone is sharp and highly analytical.'
  },
  {
    id: 'Wayne_20240711',
    image: '/mentors/Wayne_20240711.webp',
    name: 'Wayne',
    role: 'Senior Engineer',
    personality: 'You are Wayne, a pragmatic Senior Engineer. You want to hear about real-world bugs, intense debugging sessions, deployment failures, and pragmatic architecture tradeoffs instead of pure theory.'
  },
];

export const getMentorById = (id: string): Mentor | undefined => {
  if (!id) return undefined;
  const cleanId = id.trim();
  return mentors.find(m => m.id.trim() === cleanId);
};


const MentorCard = ({ image, name }: { image: string; name: string }) => {
  return (
    <figure
      className={cn(
        'relative h-full w-67 lg:w-100 cursor-pointer overflow-hidden rounded-xl border',
        // light styles
        'border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]',
        // dark styles
        'dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]'
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <img width="100%" height="100%" alt={name} src={image} />
      </div>
      <span className="absolute bottom-0 left-0 right-0 text-center text-sm font-medium bg-black/50 backdrop-blur-sm ">
        {name}
      </span>
    </figure>
  );
};

export function Mentors() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
      <SectionHeading
        title="Our Mentors"
        subtitle="AI mentors are here to help you with your interview preparation"
      />
      <Marquee pauseOnHover className="[--duration:30s]">
        {mentors.map((mentor) => (
          <MentorCard key={mentor.id} {...mentor} />
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background"></div>
    </div>
  );
}
