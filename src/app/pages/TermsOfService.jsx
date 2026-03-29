import { Link } from "react-router";
import { ArrowLeft, FileText, Shield, Clock, Users, Bus } from "lucide-react";
import { Button } from "../components/ui/button.jsx";
import { Card, CardContent } from "../components/ui/card.jsx";

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to="/">
            <Button variant="ghost" className="text-gray-600 hover:text-blue-600">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600">Last updated: March 2026</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-600 leading-relaxed">
                By accessing and using CamTransit's website and mobile application, you accept and agree to be bound by the terms and provision of this agreement. Additionally, when using CamTransit's services, you shall be subject to any posted guidelines or rules applicable to such services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Bus className="w-6 h-6 text-blue-600" />
                2. Description of Service
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                CamTransit provides users with access to a rich collection of resources, including various communications tools, forums, shopping services, personalized content, and branded programming through its network of properties. You also understand and agree that the service may include advertisements and that these advertisements are necessary for CamTransit to provide the service.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Online bus ticket booking</li>
                <li>Seat selection</li>
                <li>Electronic ticket delivery</li>
                <li>Real-time trip updates</li>
                <li>Customer support</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                3. User Responsibilities
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                You agree to provide true, accurate, current, and complete information about yourself as prompted by the Service's registration form. You also agree to maintain and promptly update the registration data to keep it true, accurate, current, and complete.
              </p>
              <p className="text-gray-600 leading-relaxed">
                You are responsible for maintaining the confidentiality of your account and password. You agree to notify us immediately of any unauthorized use of your account or any other breach of security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-600" />
                4. Booking and Cancellation Policy
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                All bookings are subject to availability. Tickets can be cancelled up to 24 hours before the scheduled departure time for a full refund. Cancellations made less than 24 hours before departure will incur a 20% cancellation fee.
              </p>
              <p className="text-gray-600 leading-relaxed">
                No refunds will be provided for no-shows or cancellations made after the departure time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                5. Privacy Policy
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Registration data and certain other information about you is subject to our Privacy Policy. You understand that through your use of the Service, you consent to the collection and use of this information, including the transfer of this information to other countries for storage, processing, and use.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Contact Information</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> investorhonourable01@gmail.com</p>
                <p className="text-gray-700"><strong>Phone:</strong> +237 680641043</p>
                <p className="text-gray-700"><strong>Address:</strong> Yaoundé-Bastos, Cameroon</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p>© 2026 CamTransit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
