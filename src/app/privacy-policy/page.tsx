
export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose dark:prose-invert max-w-none space-y-6">
        <p className="lead">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section>
          <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
          <p>
            Welcome to VectorFlow ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy.
            If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
          <p>
            We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website, or otherwise when you contact us.
          </p>
          <div className="mt-4 space-y-4">
             <div>
                <h3 className="text-lg font-medium mb-2">Personal Information Provided by You</h3>
                <p>
                    We collect names, email addresses, and other similar contact data that you voluntarily provide or that is provided by your authentication provider.
                </p>
             </div>
             <div>
                 <h3 className="text-lg font-medium mb-2">Information from Third-Party Auth Providers</h3>
                 <p>
                    We use Google Authentication for user sign-in. When you choose to link your Google account, we collect your email address and basic profile information (such as your name and profile picture) associated with that account. <strong>We do not collect or store your passwords.</strong> Authentication is handled securely by Google.
                 </p>
             </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p>
            We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">4. Sharing Your Information</h2>
          <p>
            We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">5. Contact Us</h2>
          <p>
            If you have questions or comments about this policy, you may email us at <a href="mailto:swr@outlook.com" className="text-primary hover:underline">swr@outlook.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
