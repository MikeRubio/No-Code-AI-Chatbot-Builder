import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  BookOpen,
  ChevronRight,
  ExternalLink,
  Download,
  Star,
  Clock,
  Zap,
  Brain,
  Globe,
  BarChart3,
  Settings,
} from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { QuickStartGuideComponent } from "./QuickStartGuide";
import { appFAQ, searchFAQ, getAllCategories } from "../../data/appFAQ";
import { quickStartGuides, getGuideById } from "../../data/quickStartGuides";

const iconMap = {
  Zap,
  Brain,
  Globe,
  BarChart3,
  Settings,
};

export function DocumentationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = searchFAQ(query);
      setSearchResults(results);
      setSelectedCategory(null);
    } else {
      setSearchResults([]);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleGuideSelect = (guideId: string) => {
    setSelectedGuide(guideId);
    setShowGuide(true);
  };

  const getCategoryQuestions = (categoryName: string) => {
    return appFAQ.find((cat) => cat.category === categoryName)?.questions || [];
  };

  const currentGuide = selectedGuide ? getGuideById(selectedGuide) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              BotBuilder Pro Documentation
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Everything you need to know about creating, deploying, and
              managing your chatbots
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search documentation..."
                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </motion.div>
        </div>

        {/* Quick Start Guides */}
        {!searchQuery && !selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Quick Start Guides
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickStartGuides.map((guide) => {
                const IconComponent =
                  iconMap[guide.icon as keyof typeof iconMap] || BookOpen;

                return (
                  <Card
                    key={guide.id}
                    hover
                    className="p-6 cursor-pointer bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                    onClick={() => handleGuideSelect(guide.id)}
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              guide.difficulty === "beginner"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : guide.difficulty === "intermediate"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {guide.difficulty}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {guide.estimatedTime}
                          </span>
                        </div>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {guide.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                      {guide.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {guide.category}
                      </span>
                      <Button variant="outline" size="sm">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Start Guide
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Categories */}
          {!searchQuery && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-1"
            >
              <Card className="p-6 sticky top-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Categories
                </h3>
                <div className="space-y-2">
                  {getAllCategories().map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategorySelect(category)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                        selectedCategory === category
                          ? "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                      }`}
                    >
                      <span className="text-sm font-medium">{category}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Quick Links
                  </h4>
                  <div className="space-y-2">
                    <a
                      href="#"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center"
                    >
                      <ExternalLink className="w-3 h-3 mr-2" />
                      API Documentation
                    </a>
                    <a
                      href="#"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center"
                    >
                      <Download className="w-3 h-3 mr-2" />
                      Download PDF Guide
                    </a>
                    <a
                      href="#"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center"
                    >
                      <Star className="w-3 h-3 mr-2" />
                      Community Forum
                    </a>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={searchQuery ? "lg:col-span-4" : "lg:col-span-3"}
          >
            {/* Search Results */}
            {searchQuery && searchResults.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                  Search Results for "{searchQuery}"
                </h2>
                <div className="space-y-4">
                  {searchResults.map((result, index) => (
                    <Card
                      key={index}
                      className="p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {result.question}
                        </h3>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                          {result.category}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {result.answer}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {result.keywords
                          .slice(0, 5)
                          .map((keyword: string, i: number) => (
                            <span
                              key={i}
                              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Search No Results */}
            {searchQuery && searchResults.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Try different keywords or browse our categories below
                </p>
                <Button onClick={() => setSearchQuery("")}>
                  Browse All Categories
                </Button>
              </div>
            )}

            {/* Category Content */}
            {selectedCategory && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                  {selectedCategory}
                </h2>
                <div className="space-y-6">
                  {getCategoryQuestions(selectedCategory).map((faq, index) => (
                    <Card
                      key={index}
                      className="p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        {faq.question}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {faq.answer}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {faq.keywords.slice(0, 6).map((keyword, i) => (
                          <span
                            key={i}
                            className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Default Content */}
            {!searchQuery && !selectedCategory && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                  All Documentation
                </h2>
                <div className="space-y-8">
                  {appFAQ.map((category, categoryIndex) => (
                    <div key={categoryIndex}>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                        <BookOpen className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                        {category.category}
                      </h3>
                      <div className="grid gap-4">
                        {category.questions.slice(0, 3).map((faq, index) => (
                          <Card
                            key={index}
                            className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                          >
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                              {faq.question}
                            </h4>
                            <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                              {faq.answer}
                            </p>
                          </Card>
                        ))}
                        {category.questions.length > 3 && (
                          <button
                            onClick={() =>
                              handleCategorySelect(category.category)
                            }
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium flex items-center"
                          >
                            View all {category.questions.length} articles
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Start Guide Modal */}
        {currentGuide && (
          <QuickStartGuideComponent
            guide={currentGuide}
            isOpen={showGuide}
            onClose={() => {
              setShowGuide(false);
              setSelectedGuide(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
