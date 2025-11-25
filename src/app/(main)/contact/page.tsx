
import { PageSection } from "@/components/page-section";

const pageId = "contact";

export default function ContactPage() {
  return (
    <div className="py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <PageSection pageId={pageId} sectionId="contact-form" order={0} />
      </div>
    </div>
  );
}

    