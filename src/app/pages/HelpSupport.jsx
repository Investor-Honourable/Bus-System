import { useState } from "react";
import { 
  HelpCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageSquare, 
  AlertTriangle, 
  Package, 
  Star, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Send,
  Upload,
  CheckCircle
} from "lucide-react";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import { Label } from "../components/ui/label.jsx";
import { Textarea } from "../components/ui/textarea.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select.jsx";

// FAQ Categories Data
const faqCategories = [
  {
    title: "Booking & Reservation Questions",
    icon: "🎫",
    faqs: [
      {
        question: "How do I book a bus ticket?",
        answer: "You can book a bus ticket by visiting our website or mobile app. Simply search for your desired route, select your travel date and time, choose your seat, and complete the payment. You'll receive a confirmation email with your e-ticket."
      },
      {
        question: "Can I book tickets for someone else?",
        answer: "Yes, you can book tickets for others. During the booking process, enter the passenger's details instead of your own. Make sure to provide accurate contact information for the confirmation to be sent."
      },
      {
        question: "How far in advance can I book a ticket?",
        answer: "You can book tickets up to 30 days in advance. We recommend booking early to secure your preferred seats, especially during peak travel seasons and holidays."
      },
      {
        question: "Is there a limit on the number of tickets I can book?",
        answer: "You can book up to 6 tickets per transaction. If you need to book more, please contact our customer support."
      }
    ]
  },
  {
    title: "Payment & Refund Questions",
    icon: "💳",
    faqs: [
      {
        question: "What payment methods are accepted?",
        answer: "We accept various payment methods including credit/debit cards (Visa, MasterCard, American Express), mobile money, and bank transfers. All payments are processed securely."
      },
      {
        question: "How do I get a refund?",
        answer: "Refunds can be requested through your booking confirmation email or by contacting our customer support. Refunds are processed within 5-7 business days, depending on your payment method."
      },
      {
        question: "Will I be charged any cancellation fees?",
        answer: "Cancellation fees apply based on how close to the departure time you cancel. More than 24 hours before: no fee. 12-24 hours before: 10% fee. Less than 12 hours before: 25% fee. No refund for no-shows."
      },
      {
        question: "Why was my payment declined?",
        answer: "Payment declines can occur due to insufficient funds, incorrect card details, or bank security restrictions. Please check your payment details and try again, or use an alternative payment method."
      }
    ]
  },
  {
    title: "Trip & Route Information",
    icon: "🚌",
    faqs: [
      {
        question: "How do I find available routes?",
        answer: "You can search for available routes using our website or mobile app. Enter your departure city, destination, and travel date to see all available buses and their schedules."
      },
      {
        question: "Are there rest stops during the journey?",
        answer: "Yes, most of our routes include scheduled rest stops. The duration and location of rest stops vary by route. You can find this information in the trip details when booking."
      },
      {
        question: "Can I bring my pet on the bus?",
        answer: "Small pets in carriers may be allowed on select routes. Please contact our customer support in advance to confirm pet policies and any additional fees."
      },
      {
        question: "Is WiFi available on all buses?",
        answer: "WiFi availability depends on the bus type and route. Look for the WiFi icon when selecting your bus. Premium routes typically offer complimentary WiFi."
      }
    ]
  },
  {
    title: "Ticket Cancellation & Rescheduling",
    icon: "🔄",
    faqs: [
      {
        question: "How do I cancel my ticket?",
        answer: "You can cancel your ticket through your booking confirmation email or by logging into your account. Go to 'My Bookings', select the booking you wish to cancel, and follow the instructions."
      },
      {
        question: "Can I reschedule my booking instead of canceling?",
        answer: "Yes, you can reschedule your booking up to 12 hours before departure. A small rescheduling fee may apply depending on the availability of the new schedule."
      },
      {
        question: "What happens if my bus is canceled by the operator?",
        answer: "If your bus is canceled by the operator, you will receive a full refund automatically within 3-5 business days. You'll also be offered alternative routes if available."
      }
    ]
  },
  {
    title: "Account & Login Issues",
    icon: "🔐",
    faqs: [
      {
        question: "How do I reset my password?",
        answer: "Click on 'Forgot Password' on the login page, enter your email address, and we'll send you a password reset link. The link expires in 24 hours."
      },
      {
        question: "Why can't I log into my account?",
        answer: "Make sure you're using the correct email and password. If you've forgotten your password, use the 'Forgot Password' feature. If the issue persists, contact customer support."
      },
      {
        question: "How do I update my profile information?",
        answer: "Log into your account and go to 'Profile Settings' to update your personal information, phone number, or email address."
      }
    ]
  },
  {
    title: "Luggage Policy",
    icon: "🧳",
    faqs: [
      {
        question: "How much luggage can I bring?",
        answer: "Each passenger is allowed one checked bag (up to 23kg/50lbs) and one carry-on bag (up to 7kg/15lbs). Additional bags may incur extra fees."
      },
      {
        question: "What items are prohibited?",
        answer: "Prohibited items include flammable materials, weapons, illegal substances, and hazardous materials. For a complete list, please refer to our Terms & Conditions."
      },
      {
        question: "Can I track my luggage?",
        answer: "Yes, you'll receive a luggage tag with a tracking number. You can inquire about your luggage status by contacting our customer support."
      }
    ]
  },
  {
    title: "Boarding Requirements",
    icon: "🎫",
    faqs: [
      {
        question: "What do I need to board the bus?",
        answer: "You'll need a valid booking confirmation (printed or digital), and a government-issued ID. Please arrive at the boarding point at least 30 minutes before departure."
      },
      {
        question: "Can I board at a different stop than booked?",
        answer: "Yes, you can request to board at a different stop along the route, subject to availability. Please contact customer support at least 24 hours before departure."
      }
    ]
  },
  {
    title: "Missed Bus Policy",
    icon: "⚠️",
    faqs: [
      {
        question: "What happens if I miss my bus?",
        answer: "If you miss your bus due to personal reasons, your ticket is non-refundable. If you miss the bus due to a delay from our end, you'll be accommodated on the next available bus at no extra cost."
      },
      {
        question: "My bus was delayed and I missed my connection. What should I do?",
        answer: "Contact our customer support immediately. We'll help you rebook on the next available connection. If the delay was on our end, the rebooking is free of charge."
      }
    ]
  }
];

// Contact Information
const contactInfo = {
  phone: "+237 6XX XXX XXX",
  email: "support@camtransit.com",
  location: "Douala, Cameroon",
  workingHours: "Mon-Sat: 7AM - 8PM, Sun: 9AM - 5PM",
  emergency: "+237 6XX XXX XXX"
};

// Ticket Categories
const ticketCategories = [
  { value: "booking", label: "Booking Issue" },
  { value: "payment", label: "Payment Problem" },
  { value: "complaint", label: "Complaint" },
  { value: "suggestion", label: "Suggestion" },
  { value: "technical", label: "Technical Issue" },
  { value: "refund", label: "Refund Request" },
  { value: "other", label: "Other" }
];

// Policy Documents
const policies = [
  {
    title: "Refund Policy",
    content: "Our refund policy allows for full refunds when cancellations are made more than 24 hours before departure. Cancellations within 24 hours are subject to a 10% processing fee. No refunds are available for no-shows or cancellations made less than 12 hours before departure."
  },
  {
    title: "Cancellation Policy",
    content: "Tickets can be canceled online through your booking confirmation or by contacting customer support. Cancellation fees vary based on timing: More than 24 hours: Free. 12-24 hours: 10% fee. Less than 12 hours: 25% fee. All refunds are processed within 5-7 business days."
  },
  {
    title: "Terms & Conditions",
    content: "By booking with CamTransit, you agree to our terms including: passengers must provide valid identification, luggage limits must be observed, behavior onboard must be respectful, and the company reserves the right to refuse service to anyone posing a safety risk."
  },
  {
    title: "Privacy Policy",
    content: "We are committed to protecting your privacy. Your personal information is collected solely for booking purposes and is never shared with third parties. We use industry-standard encryption to protect your payment information."
  }
];

export function HelpSupport() {
  const [openFaqs, setOpenFaqs] = useState({});
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "",
    description: "",
    attachment: null
  });
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState("faq");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const toggleFaq = (categoryIndex, faqIndex) => {
    const key = `${categoryIndex}-${faqIndex}`;
    setOpenFaqs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    console.log("Ticket submitted:", ticketForm);
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubmitted(false);
      setTicketForm({ subject: "", category: "", description: "", attachment: null });
    }, 3000);
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    console.log("Feedback submitted:", { rating: feedbackRating, text: feedbackText });
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setFeedbackSubmitted(false);
      setFeedbackRating(0);
      setFeedbackText("");
    }, 3000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTicketForm(prev => ({ ...prev, attachment: file.name }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="w-10 h-10" />
            <h1 className="text-4xl font-bold">Help & Support</h1>
          </div>
          <p className="text-xl text-blue-100">We're here to help you with any questions or concerns</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex overflow-x-auto gap-2 py-3">
            <button
              onClick={() => setActiveTab("faq")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                activeTab === "faq" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              Help Center (FAQs)
            </button>
            <button
              onClick={() => setActiveTab("contact")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                activeTab === "contact" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Phone className="w-4 h-4" />
              Contact Support
            </button>
            <button
              onClick={() => setActiveTab("ticket")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                activeTab === "ticket" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Send className="w-4 h-4" />
              Submit Ticket
            </button>
            <button
              onClick={() => setActiveTab("emergency")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                activeTab === "emergency" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Emergency
            </button>
            <button
              onClick={() => setActiveTab("feedback")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                activeTab === "feedback" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Star className="w-4 h-4" />
              Feedback
            </button>
            <button
              onClick={() => setActiveTab("policies")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                activeTab === "policies" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FileText className="w-4 h-4" />
              Policies
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* FAQs Section */}
        {activeTab === "faq" && (
          <div className="space-y-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Frequently Asked Questions</h2>
              <p className="text-gray-600">Find answers to common questions about our bus services</p>
            </div>

            {faqCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{category.icon}</span>
                    <h3 className="text-xl font-semibold">{category.title}</h3>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {category.faqs.map((faq, faqIndex) => {
                    const isOpen = openFaqs[`${categoryIndex}-${faqIndex}`];
                    return (
                      <div key={faqIndex}>
                        <button
                          onClick={() => toggleFaq(categoryIndex, faqIndex)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-blue-50 transition-colors"
                        >
                          <span className="font-medium text-gray-800 pr-4">{faq.question}</span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 text-gray-600 bg-blue-50/50">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact Support Section */}
        {activeTab === "contact" && (
          <div className="space-y-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Contact Support</h2>
              <p className="text-gray-600">Reach out to us through any of these channels</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Customer Care</h3>
                <p className="text-gray-600">{contactInfo.phone}</p>
                <p className="text-sm text-gray-400 mt-2">Toll-free within Cameroon</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Email Support</h3>
                <p className="text-gray-600">{contactInfo.email}</p>
                <p className="text-sm text-gray-400 mt-2">Response within 24 hours</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Office Location</h3>
                <p className="text-gray-600">{contactInfo.location}</p>
                <p className="text-sm text-gray-400 mt-2">Visit during working hours</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Working Hours</h3>
                <p className="text-gray-600">{contactInfo.workingHours}</p>
                <p className="text-sm text-gray-400 mt-2">Including public holidays</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold mb-6">Send us a Quick Message</h3>
              <form className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact-name">Your Name</Label>
                    <Input id="contact-name" placeholder="Enter your name" />
                  </div>
                  <div>
                    <Label htmlFor="contact-email">Email Address</Label>
                    <Input id="contact-email" type="email" placeholder="Enter your email" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="contact-message">Message</Label>
                  <Textarea id="contact-message" placeholder="How can we help you?" rows={4} />
                </div>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Submit Ticket Section */}
        {activeTab === "ticket" && (
          <div className="space-y-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Submit a Support Ticket</h2>
              <p className="text-gray-600">We'll get back to you as soon as possible</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <form onSubmit={handleTicketSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="ticket-subject">Subject</Label>
                  <Input 
                    id="ticket-subject" 
                    placeholder="Brief description of your issue"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="ticket-category">Category</Label>
                  <Select 
                    value={ticketForm.category}
                    onValueChange={(value) => setTicketForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ticketCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ticket-description">Description</Label>
                  <Textarea 
                    id="ticket-description" 
                    placeholder="Please provide details about your issue..."
                    rows={6}
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="ticket-attachment">Attachment (Optional)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                    <input 
                      type="file" 
                      id="ticket-attachment" 
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <label htmlFor="ticket-attachment" className="cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        {ticketForm.attachment || "Click to upload a file"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOC (Max 5MB)</p>
                    </label>
                  </div>
                </div>

                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
                  <Send className="w-4 h-4 mr-2" />
                  Submit Ticket
                </Button>
              </form>

              {ticketSubmitted && (
                <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Ticket submitted successfully! We'll respond within 24 hours.
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold mb-6">Ticket Status Tracking</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-yellow-700" />
                  </div>
                  <h4 className="font-semibold text-yellow-800">Pending</h4>
                  <p className="text-sm text-yellow-600 mt-1">Awaiting review by support team</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6 text-blue-700" />
                  </div>
                  <h4 className="font-semibold text-blue-800">In Progress</h4>
                  <p className="text-sm text-blue-600 mt-1">Our team is working on your issue</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-green-700" />
                  </div>
                  <h4 className="font-semibold text-green-800">Resolved</h4>
                  <p className="text-sm text-green-600 mt-1">Your issue has been addressed</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Section */}
        {activeTab === "emergency" && (
          <div className="space-y-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Emergency Assistance</h2>
              <p className="text-gray-600">We're available 24/7 for urgent matters</p>
            </div>

            <div className="bg-gradient-to-r from-red-500 to-red-700 rounded-xl shadow-lg p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <AlertTriangle className="w-12 h-12" />
                <div>
                  <h3 className="text-2xl font-bold">24/7 Emergency Hotline</h3>
                  <p className="text-red-100">For immediate assistance during emergencies</p>
                </div>
              </div>
              <p className="text-4xl font-bold">{contactInfo.emergency}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Bus Delayed?</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  If your bus is delayed, we'll notify you via SMS. You can also track your bus in real-time through our app or contact our support team for updates.
                </p>
                <Button variant="outline" className="w-full">
                  Track My Bus
                </Button>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Lost & Found</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Lost something on the bus? Report it immediately. We'll try to locate and return your belongings. Include details about your bus, seat, and the lost item.
                </p>
                <Button variant="outline" className="w-full" onClick={() => setActiveTab("ticket")}>
                  Report Lost Item
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Section */}
        {activeTab === "feedback" && (
          <div className="space-y-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Feedback & Suggestions</h2>
              <p className="text-gray-600">Help us improve our service</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                <div>
                  <Label className="text-lg mb-3 block">Rate Your Experience</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        className="focus:outline-none"
                      >
                        <Star 
                          className={`w-10 h-10 transition-colors ${
                            star <= feedbackRating 
                              ? "fill-yellow-400 text-yellow-400" 
                              : "text-gray-300"
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {feedbackRating === 0 && "Click to rate"}
                    {feedbackRating === 1 && "Poor"}
                    {feedbackRating === 2 && "Fair"}
                    {feedbackRating === 3 && "Good"}
                    {feedbackRating === 4 && "Very Good"}
                    {feedbackRating === 5 && "Excellent!"}
                  </p>
                </div>

                <div>
                  <Label htmlFor="feedback-text">Your Feedback</Label>
                  <Textarea 
                    id="feedback-text" 
                    placeholder="Tell us about your experience or suggest improvements..."
                    rows={5}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={feedbackRating === 0 || !feedbackText}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Feedback
                </Button>
              </form>

              {feedbackSubmitted && (
                <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Thank you for your feedback!
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold mb-6">Write a Review</h3>
              <p className="text-gray-600 mb-6">
                Share your experience on other platforms to help other travelers
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-current" />
                  Google Reviews
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Trustpilot
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-current" />
                  Facebook Reviews
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Policies Section */}
        {activeTab === "policies" && (
          <div className="space-y-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Policies & Information</h2>
              <p className="text-gray-600">Important information about our services</p>
            </div>

            <div className="grid gap-6">
              {policies.map((policy, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6" />
                      <h3 className="text-xl font-semibold">{policy.title}</h3>
                    </div>
                  </div>
                  <div className="p-6 text-gray-600">
                    {policy.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
