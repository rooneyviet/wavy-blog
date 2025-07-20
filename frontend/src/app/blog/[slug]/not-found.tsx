import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-4">
          <h1 className="text-6xl font-bold text-pink-500 mb-4">404</h1>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Post Not Found</h2>
          <p className="text-gray-600 mb-8">
            The blog post you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button asChild className="bg-pink-500 hover:bg-pink-600">
            <Link href="/" className="inline-flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}