import { motion } from "framer-motion";
import {
  MessageCircle,
  Zap,
  Shield,
  BarChart3,
  Globe,
  Check,
  Star,
  BookOpen,
  ArrowRight,
  Play,
  Sparkles,
  Bot,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Link } from "react-router-dom";
import boltlogo from "../../../public/bolt/boltlogo.png";

export function LandingPage() {
  const features = [
    {
      icon: Bot,
      title: "Drag & Drop Builder",
      description:
        "Create sophisticated chatbot flows visually with our intuitive no-code interface",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: MessageCircle,
      title: "AI-Powered Responses",
      description:
        "Leverage OpenAI's GPT models for natural, context-aware conversations",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Globe,
      title: "Multi-Platform Deploy",
      description:
        "Deploy seamlessly to websites, WhatsApp, Facebook Messenger, and more",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description:
        "Deep insights into user behavior, conversation flows, and performance metrics",
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description:
        "Bank-level encryption, GDPR compliance, and SOC 2 Type II certification",
      gradient: "from-indigo-500 to-purple-500",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Sub-second response times with global CDN and optimized infrastructure",
      gradient: "from-yellow-500 to-orange-500",
    },
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for trying out our platform",
      features: [
        "1 chatbot",
        "100 messages/month",
        "Basic analytics",
        "Website integration",
        "Community support",
      ],
      popular: false,
      cta: "Get Started Free",
    },
    {
      name: "Pro",
      price: "$29",
      period: "per month",
      description: "Best for growing businesses",
      features: [
        "5 chatbots",
        "5,000 messages/month",
        "Advanced analytics",
        "WhatsApp integration",
        "OpenAI integration",
        "Priority support",
        "Custom branding",
      ],
      popular: true,
      cta: "Start Free Trial",
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "per month",
      description: "For large organizations",
      features: [
        "Unlimited chatbots",
        "Unlimited messages",
        "Advanced integrations",
        "Custom AI training",
        "White-label solution",
        "Dedicated support",
        "SLA guarantee",
      ],
      popular: false,
      cta: "Contact Sales",
    },
  ];

  const benefits = [
    {
      title: "No Coding Required",
      description:
        "Build sophisticated chatbots with our visual drag-and-drop interface",
    },
    {
      title: "Deploy Anywhere",
      description:
        "Website, WhatsApp, Facebook Messenger, and more platforms supported",
    },
    {
      title: "AI-Powered",
      description: "Leverage OpenAI's latest models for natural conversations",
    },
    {
      title: "Enterprise Ready",
      description:
        "Built for scale with enterprise-grade security and compliance",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="glass-dark border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                BotForge
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex items-center space-x-6">
                <a
                  href="#features"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Pricing
                </a>
                <Link
                  to="/docs"
                  className="text-gray-300 hover:text-white transition-colors flex items-center"
                >
                  <BookOpen className="w-4 h-4 mr-1" />
                  Docs
                </Link>
              </nav>
              <div className="flex items-center space-x-4">
                <Link
                  to="/auth"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link to="/auth">
                  <Button className="bg-gray-900 border border-gray-800 hover:bg-gray-800 shadow-none">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center px-4 py-2 bg-gray-900/20 rounded-full border border-gray-700/30 mb-8">
                <Sparkles className="w-4 h-4 text-blue-400 mr-2" />
                <span className="text-blue-300 text-sm font-medium">
                  The future of customer automation is here
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Build AI Chatbots
                <span className="block text-blue-400">
                  Visually, Effortlessly
                </span>
              </h1>

              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Create, train, and deploy intelligent chatbots for your business
                in minutes. No technical skills required. Start automating
                customer support today with BotForge.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link to="/auth">
                  <Button
                    size="lg"
                    className="text-lg px-8 py-4 bg-gray-900 border border-gray-800 hover:bg-gray-800 shadow-none"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Building Free
                  </Button>
                </Link>
                <Link to="/docs">
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-lg px-8 py-4 border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    View Documentation
                  </Button>
                </Link>
              </div>
              {/* Benefits Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                    className="text-center p-4 bg-gray-800/30 rounded-lg border border-gray-700/50"
                  >
                    <h3 className="text-white font-semibold mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {benefit.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                Everything you need to succeed
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Powerful features designed to help businesses of all sizes
                automate customer interactions and drive growth
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card
                  hover
                  className="p-6 h-full bg-gray-800/50 border-gray-700 backdrop-blur-sm"
                >
                  <div
                    className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-r from-gray-800/50 to-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                How it works
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Get your chatbot up and running in three simple steps
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Design Your Flow",
                description:
                  "Use our drag-and-drop builder to create conversation flows without any coding",
                icon: Bot,
              },
              {
                step: "2",
                title: "Train with AI",
                description:
                  "Connect to OpenAI and upload your FAQ documents for intelligent responses",
                icon: MessageCircle,
              },
              {
                step: "3",
                title: "Deploy Everywhere",
                description:
                  "Launch on your website, WhatsApp, or any platform with one click",
                icon: Globe,
              },
            ].map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Choose the plan that's right for your business. Upgrade or
                downgrade at any time.
              </p>
            </motion.div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      Most Popular
                    </div>
                  </div>
                )}
                <Card
                  className={`p-8 h-full bg-gray-800/50 border-gray-700 backdrop-blur-sm ${
                    plan.popular ? "ring-2 ring-blue-500/50" : ""
                  }`}
                >
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-400 mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">
                      {plan.price}
                    </span>
                    <span className="text-gray-400 ml-2">/{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth" className="block">
                    <Button
                      variant={plan.popular ? "primary" : "outline"}
                      className={`w-full ${
                        plan.popular
                          ? "bg-blue-600"
                          : "border-gray-600 text-gray-300 hover:bg-gray-800"
                      }`}
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600/20 to-purple-600/20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to automate your customer support?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Start building intelligent chatbots today. No credit card required
              for the free plan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button
                  size="lg"
                  className="text-lg px-8 py-4 bg-gray-900 border border-gray-800 hover:bg-gray-800 shadow-none"
                >
                  Start Building Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/docs">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-4 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  View Documentation
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">BotForge</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                The modern no-code platform for building intelligent chatbots.
                Empower your business with AI-driven customer automation.
              </p>
              <div>
                <motion.a
                  href="https://bolt.new/"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{
                    scale: 1.08,
                    rotate: -2,
                    filter: "drop-shadow(0 4px 24px #38bdf8cc)",
                  }}
                  whileTap={{ scale: 0.97, rotate: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  aria-label="Powered by BotForge"
                  className="inline-block"
                >
                  <img
                    src={boltlogo}
                    alt="Powered by BotForge"
                    className="h-20 w-auto transition-all duration-300"
                    style={{
                      filter: "grayscale(0.2) brightness(0.95)",
                    }}
                  />
                </motion.a>
              </div>
            </div>
            {/* Product */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#features"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <Link
                    to="/docs"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
            {/* Company */}
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/about"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    About Us
                  </a>
                </li>
              </ul>
            </div>
            {/* Support */}
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/docs"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Contact Us
                  </a>
                </li>
                {/* <li>
                  <a
                    href="/community"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Community
                  </a>
                </li> */}
                <li>
                  <a
                    href="/status"
                    className="text-gray-400 hover:text-white transition-colors flex items-center"
                  >
                    System Status
                    <div className="w-2 h-2 bg-green-400 rounded-full ml-2"></div>
                  </a>
                </li>
                {/* <li>
                  <a
                    href="/security"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Security
                  </a>
                </li>
                <li>
                  <a
                    href="/compliance"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Compliance
                  </a>
                </li> */}
              </ul>
            </div>
          </div>
          {/* Contact Info */}
          {/* <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center text-gray-400">
                <Mail className="w-5 h-5 mr-3" />
                <span>support@botforge.site</span>
              </div>
              <div className="flex items-center text-gray-400">
                <Phone className="w-5 h-5 mr-3" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center text-gray-400">
                <MapPin className="w-5 h-5 mr-3" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div> */}
          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-wrap items-center space-x-6 mb-4 md:mb-0">
              <p className="text-gray-400 text-sm">
                © 2025 BotForge. All rights reserved.
              </p>
              <a
                href="/privacy"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="https://www.termsfeed.com/live/122aaa3f-df83-4ce7-8540-7dde414e7c51"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
