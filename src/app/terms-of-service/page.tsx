
export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      
      <div className="prose dark:prose-invert max-w-none space-y-6">
        <p className="lead">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section>
          <h2 className="text-xl font-semibold mb-4">1. Agreement to Terms</h2>
          <p>
            These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and VectorFlow ("we," "us," or "our"), concerning your access to and use of our application.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">2. Intellectual Property Rights</h2>
          <p>
            Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">3. User Representations</h2>
          <p>
            By using the Site, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary; (3) you have the legal capacity and you agree to comply with these Terms of Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">4. Prohibited Activities</h2>
          <p>
            You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
          </p>
        </section>

         <section>
          <h2 className="text-xl font-semibold mb-4">5. Modifications and Interruptions</h2>
          <p>
            We reserve the right to change, modify, or remove the contents of the Site at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our Site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">6. Contact Us</h2>
          <p>
            In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at <a href="mailto:swr@outlook.com" className="text-primary hover:underline">swr@outlook.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
