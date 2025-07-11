import { ChevronDown, ChevronUp } from "lucide-react";
import { type ReactNode, useState } from "react";

interface AccordionSection {
  key: string;
  title: string;
  icon: ReactNode;
  content: ReactNode;
  defaultOpen?: boolean;
}

interface AccordionProps {
  sections: AccordionSection[];
  className?: string;
  sectionClassName?: string;
  buttonClassName?: string;
  contentClassName?: string;
}

export const Accordion = ({ sections, className = "space-y-4", sectionClassName = "border-b dark:border-gray-700 pb-4", buttonClassName = "flex items-center justify-between w-full text-lg font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors  cursor-pointer", contentClassName = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg" }: AccordionProps) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    sections.reduce(
      (acc, section) => ({
        ...acc,
        [section.key]: section.defaultOpen ?? true
      }),
      {}
    )
  );

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={className}>
      {sections.map(section => (
        <section key={section.key} className={sectionClassName}>
          <button onClick={() => toggleSection(section.key)} className={buttonClassName}>
            <div className="flex items-center space-x-2">
              {section.icon}
              <span>{section.title}</span>
            </div>
            {openSections[section.key] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {openSections[section.key] && <div className={contentClassName}>{section.content}</div>}
        </section>
      ))}
    </div>
  );
};
