import { Link } from "react-router";
import { ArrowLeft, RefreshCw, Clock, CheckCircle, AlertCircle, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "../components/ui/button.jsx";
import { Card, CardContent } from "../components/ui/card.jsx";

export function RefundPolicy() {
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
            <RefreshCw className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Refund Policy</h1>
          <p className="text-gray-600">Last updated: March 2026</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-600" />
                1. Cancellation Timeframes
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Our refund policy is designed to be fair and transparent. The refund amount depends on when you cancel your booking relative to the scheduled departure time:
              </p>
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">Full Refund</span>
                  </div>
                  <p className="text-gray-600 text-sm">Cancellations made more than 24 hours before departure - 100% refund</p>
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-800">Partial Refund</span>
                  </div>
                  <p className="text-gray-600 text-sm">Cancellations made 12-24 hours before departure - 80% refund</p>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-800">No Refund</span>
                  </div>
                  <p className="text-gray-600 text-sm">Cancellations made less than 12 hours before departure - No refund</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <RefreshCw className="w-6 h-6 text-blue-600" />
                2. How to Request a Refund
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                To request a refund, please follow these steps:
              </p>
              <ol className="list-decimal list-inside text-gray-600 space-y-3 ml-4">
                <li>Log in to your CamTransit account</li>
                <li>Go to "My Bookings" or "History"</li>
                <li>Select the booking you wish to cancel</li>
                <li>Click "Cancel Booking" and confirm</li>
                <li>Your refund will be processed automatically</li>
              </ol>
              <p className="text-gray-600 leading-relaxed mt-4">
                Alternatively, you can contact our customer support team for assistance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-600" />
                3. Refund Processing Time
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Once your cancellation is processed:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Credit/Debit Cards:</strong> 5-10 business days</li>
                <li><strong>Mobile Money:</strong> 3-5 business days</li>
                <li><strong>Bank Transfer:</strong> 7-14 business days</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                You will receive an email confirmation once your refund has been processed.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Exceptions</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Please note the following exceptions to our refund policy:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>No-shows:</strong> Passengers who fail to show up for their trip are not eligible for a refund</li>
                <li><strong>Missed departures:</strong> Refunds are not available for missed departures due to passenger error</li>
                <li><strong>Force majeure:</strong> In case of service discontinuation, pro-rated refunds may be provided</li>
                <li><strong>Promotional tickets:</strong> Some promotional bookings may have different refund terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Disputes and Appeals</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you believe your refund was processed incorrectly or you have a special circumstance, you can file an appeal by contacting our customer support team. Please include your booking reference number and a detailed explanation of your situation.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Our team will review your appeal within 48 hours and provide a final decision.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="w-6 h-6 text-blue-600" />
                6. Contact Us
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have any questions about this Refund Policy, please contact us:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> investorhonourable01@gmail.com</p>
                <p className="text-gray-700"><strong>Phone:</strong> +237 680641043</p>
                <p className="text-gray-700"><strong>WhatsApp:</strong> +237 683508162</p>
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
